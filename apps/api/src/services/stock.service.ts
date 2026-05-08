import { MovementType, PackUnit, Prisma, Sector } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { conflict } from "../lib/http-error";
import { paginated } from "../lib/pagination";

type Tx = Prisma.TransactionClient;

export type StockBalanceKey = {
  clientId: string;
  productId: string;
  sector: Sector;
  unit: PackUnit;
};

export type StockBalanceDelta = StockBalanceKey & {
  quantity: Prisma.Decimal;
};

export type StockBalanceRow = StockBalanceKey & {
  quantity: Prisma.Decimal;
};

function keyOf(k: StockBalanceKey) {
  return `${k.clientId}|${k.productId}|${k.sector}|${k.unit}`;
}

/** Deduplica uma lista de chaves (mesmo cliente/produto/setor/unidade). */
export function uniqueKeys<T extends StockBalanceKey>(keys: T[]): T[] {
  const seen = new Map<string, T>();
  for (const k of keys) {
    const id = keyOf(k);
    if (!seen.has(id)) seen.set(id, k);
  }
  return Array.from(seen.values());
}

/** Agrupa linhas iguais (mesma chave) somando quantidades. */
export function aggregateDeltas(deltas: StockBalanceDelta[]) {
  const map = new Map<string, StockBalanceDelta>();
  for (const d of deltas) {
    const k = keyOf(d);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...d });
      continue;
    }
    prev.quantity = prev.quantity.add(d.quantity);
  }
  return Array.from(map.values());
}

/**
 * Saldo atual derivado de StockMovement: SUM(ENTRADA) − SUM(SAIDA) por chave.
 * Esta é a única função de consulta de saldo do sistema — não há tabela de
 * cache. Aceita uma transação opcional para enxergar movimentos recém-criados
 * ou removidos dentro do mesmo fluxo.
 */
async function aggregateNetQuantities(
  filter: Prisma.StockMovementWhereInput,
  tx?: Tx
): Promise<StockBalanceRow[]> {
  const db = tx ?? prisma;
  const groups = await db.stockMovement.groupBy({
    by: ["clientId", "productId", "sector", "unit", "type"],
    where: filter,
    _sum: { quantity: true },
  });

  const totals = new Map<string, StockBalanceRow>();
  for (const g of groups) {
    const k = keyOf({
      clientId: g.clientId,
      productId: g.productId,
      sector: g.sector,
      unit: g.unit,
    });
    const sum = g._sum.quantity ?? new Prisma.Decimal(0);
    const signed =
      g.type === MovementType.SAIDA ? sum.negated() : new Prisma.Decimal(sum);
    const prev = totals.get(k);
    if (!prev) {
      totals.set(k, {
        clientId: g.clientId,
        productId: g.productId,
        sector: g.sector,
        unit: g.unit,
        quantity: signed,
      });
    } else {
      prev.quantity = prev.quantity.add(signed);
    }
  }
  return Array.from(totals.values());
}

/** Mapa { chave → saldo líquido (pode ser negativo) } para um conjunto de chaves. */
export async function getBalancesForKeys(
  tx: Tx,
  keys: StockBalanceKey[]
): Promise<Map<string, Prisma.Decimal>> {
  if (keys.length === 0) return new Map();
  const where: Prisma.StockMovementWhereInput = {
    OR: keys.map((k) => ({
      clientId: k.clientId,
      productId: k.productId,
      sector: k.sector,
      unit: k.unit,
    })),
  };
  const rows = await aggregateNetQuantities(where, tx);
  const map = new Map<string, Prisma.Decimal>();
  for (const k of keys) map.set(keyOf(k), new Prisma.Decimal(0));
  for (const r of rows) map.set(keyOf(r), r.quantity);
  return map;
}

/**
 * Pré-checa que o saldo atual cobre cada delta solicitado. Se faltar, joga
 * `INSUFFICIENT_STOCK` com a mensagem amigável (substitui o updateMany guarded
 * que existia quando havia tabela StockBalance).
 *
 * Concorrência: a checagem é READ COMMITTED. Para barracões com 1–3 operadores
 * simultâneos é suficiente; em caso de race rara, a próxima leitura vai mostrar
 * o saldo real (eventualmente negativo) e o time corrige manualmente.
 */
export async function assertEnoughStock(tx: Tx, deltas: StockBalanceDelta[]) {
  if (deltas.length === 0) return;
  const balances = await getBalancesForKeys(tx, deltas);
  const missing = deltas.filter((d) =>
    (balances.get(keyOf(d)) ?? new Prisma.Decimal(0)).lessThan(d.quantity)
  );
  if (missing.length === 0) return;

  const productIds = [...new Set(missing.map((m) => m.productId))];
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(products.map((p) => [p.id, p.name]));

  const first = missing[0];
  const available = balances.get(keyOf(first)) ?? new Prisma.Decimal(0);
  const produto = nameOf.get(first.productId) ?? "este produto";
  throw conflict(
    `Saldo insuficiente: ${produto} no setor ${first.sector} (${first.unit}). Disponível: ${available.toString()}. Solicitado: ${first.quantity.toString()}.`,
    "INSUFFICIENT_STOCK"
  );
}

/**
 * Garante que cada chave informada tenha saldo >= 0 *após* as mudanças já
 * aplicadas na transação. Usada na edição de entradas: se reduzir uma quantia
 * da entrada deixar a posição negativa (porque já saiu no Outbound), aborta
 * a transação inteira com `INSUFFICIENT_STOCK`.
 */
export async function assertNoNegativeBalances(
  tx: Tx,
  keys: StockBalanceKey[]
) {
  if (keys.length === 0) return;
  const balances = await getBalancesForKeys(tx, keys);
  const negatives = keys.filter((k) =>
    (balances.get(keyOf(k)) ?? new Prisma.Decimal(0)).lessThan(0)
  );
  if (negatives.length === 0) return;

  const productIds = [...new Set(negatives.map((n) => n.productId))];
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(products.map((p) => [p.id, p.name]));

  const first = negatives[0];
  const available = balances.get(keyOf(first)) ?? new Prisma.Decimal(0);
  const produto = nameOf.get(first.productId) ?? "este produto";
  throw conflict(
    `Saldo insuficiente: ${produto} no setor ${first.sector} (${first.unit}). Disponível após edição: ${available.toString()}. Reduza saídas ou aumente a entrada.`,
    "INSUFFICIENT_STOCK"
  );
}

/**
 * Retorna apenas posições com saldo > 0, aplicando filtros do snapshot público.
 * Usada pelo GET /stock e pelo dashboard.
 */
export async function getPositiveStockBalances(filter: {
  clientId?: string;
  productId?: string;
  sector?: Sector;
  unit?: PackUnit;
}): Promise<StockBalanceRow[]> {
  const where: Prisma.StockMovementWhereInput = {
    ...(filter.clientId ? { clientId: filter.clientId } : {}),
    ...(filter.productId ? { productId: filter.productId } : {}),
    ...(filter.sector ? { sector: filter.sector } : {}),
    ...(filter.unit ? { unit: filter.unit } : {}),
  };
  const rows = await aggregateNetQuantities(where);
  return rows.filter((r) => r.quantity.greaterThan(0));
}

const stockFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  sector: z.nativeEnum(Sector).optional(),
  unit: z.nativeEnum(PackUnit).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(10_000).default(20),
});

/**
 * Snapshot paginado do estoque atual. Filtra por nome (q) cruzando IDs de
 * cliente/produto, ordena por nome do cliente / produto e fatia em memória —
 * o número de combinações ativas (cliente × produto × setor × unidade) é
 * pequeno comparado ao histórico de movimentos.
 */
export async function getStockSnapshot(query: unknown) {
  const f = stockFilterSchema.parse(query ?? {});

  const nameFilter = f.q?.trim();

  let clientIdSet: Set<string> | null = null;
  let productIdSet: Set<string> | null = null;
  if (nameFilter) {
    const [clients, products] = await Promise.all([
      prisma.client.findMany({
        where: { name: { contains: nameFilter, mode: "insensitive" } },
        select: { id: true },
      }),
      prisma.product.findMany({
        where: { name: { contains: nameFilter, mode: "insensitive" } },
        select: { id: true },
      }),
    ]);
    clientIdSet = new Set(clients.map((c) => c.id));
    productIdSet = new Set(products.map((p) => p.id));
    if (clientIdSet.size === 0 && productIdSet.size === 0) {
      return paginated([], f.page, f.pageSize, 0);
    }
  }

  const all = await getPositiveStockBalances({
    clientId: f.clientId,
    productId: f.productId,
    sector: f.sector,
    unit: f.unit,
  });

  const filtered = nameFilter
    ? all.filter(
        (r) =>
          (clientIdSet && clientIdSet.has(r.clientId)) ||
          (productIdSet && productIdSet.has(r.productId))
      )
    : all;

  const ids = {
    clients: [...new Set(filtered.map((r) => r.clientId))],
    products: [...new Set(filtered.map((r) => r.productId))],
  };
  const [clients, products] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: ids.clients } },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { id: { in: ids.products } },
      select: { id: true, name: true },
    }),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const productName = new Map(products.map((p) => [p.id, p.name]));

  filtered.sort((a, b) => {
    const ca = clientName.get(a.clientId) ?? a.clientId;
    const cb = clientName.get(b.clientId) ?? b.clientId;
    if (ca !== cb) return ca.localeCompare(cb, "pt-BR");
    const pa = productName.get(a.productId) ?? a.productId;
    const pb = productName.get(b.productId) ?? b.productId;
    if (pa !== pb) return pa.localeCompare(pb, "pt-BR");
    if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
    return a.unit.localeCompare(b.unit);
  });

  const total = filtered.length;
  const start = (f.page - 1) * f.pageSize;
  const slice = filtered.slice(start, start + f.pageSize);

  return paginated(
    slice.map((r) => ({
      clientId: r.clientId,
      clientName: clientName.get(r.clientId) ?? r.clientId,
      productId: r.productId,
      productName: productName.get(r.productId) ?? r.productId,
      sector: r.sector,
      unit: r.unit,
      quantity: r.quantity.toString(),
    })),
    f.page,
    f.pageSize,
    total
  );
}
