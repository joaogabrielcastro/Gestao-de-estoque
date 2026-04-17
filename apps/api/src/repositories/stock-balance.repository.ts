import { PackUnit, Prisma, Sector } from "@prisma/client";
type TxLike = Prisma.TransactionClient;

export type StockBalanceKey = {
  clientId: string;
  productId: string;
  sector: Sector;
  unit: PackUnit;
};

export type StockBalanceDelta = StockBalanceKey & {
  quantity: Prisma.Decimal;
};

function toKey(d: StockBalanceKey) {
  return `${d.clientId}|${d.productId}|${d.sector}|${d.unit}`;
}

export function aggregateDeltas(deltas: StockBalanceDelta[]) {
  const map = new Map<string, StockBalanceDelta>();
  for (const delta of deltas) {
    const k = toKey(delta);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...delta });
      continue;
    }
    prev.quantity = prev.quantity.add(delta.quantity);
  }
  return Array.from(map.values());
}

export async function incrementBalances(tx: TxLike, deltas: StockBalanceDelta[]) {
  for (const delta of deltas) {
    await tx.stockBalance.upsert({
      where: {
        clientId_productId_sector_unit: {
          clientId: delta.clientId,
          productId: delta.productId,
          sector: delta.sector,
          unit: delta.unit,
        },
      },
      create: {
        clientId: delta.clientId,
        productId: delta.productId,
        sector: delta.sector,
        unit: delta.unit,
        quantity: delta.quantity,
      },
      update: {
        quantity: { increment: delta.quantity },
      },
    });
  }
}

export async function decrementBalancesWithGuard(
  tx: TxLike,
  deltas: StockBalanceDelta[]
) {
  for (const delta of deltas) {
    const result = await tx.stockBalance.updateMany({
      where: {
        clientId: delta.clientId,
        productId: delta.productId,
        sector: delta.sector,
        unit: delta.unit,
        quantity: { gte: delta.quantity },
      },
      data: {
        quantity: { decrement: delta.quantity },
      },
    });

    if (result.count === 0) {
      const current = await tx.stockBalance.findFirst({
        where: {
          clientId: delta.clientId,
          productId: delta.productId,
          sector: delta.sector,
          unit: delta.unit,
        },
        select: { quantity: true },
      });
      const available = current?.quantity ?? new Prisma.Decimal(0);
      const err = new Error(
        `Estoque insuficiente para produto ${delta.productId} no setor ${delta.sector} (${delta.unit}). Disponível ${available.toString()} | Solicitado ${delta.quantity.toString()}`
      );
      (err as { status?: number; code?: string }).status = 409;
      (err as { status?: number; code?: string }).code = "INSUFFICIENT_STOCK";
      throw err;
    }
  }
}
