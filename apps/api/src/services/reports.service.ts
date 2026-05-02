import { MovementType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getCurrentStockSnapshot } from "./movements.service";

function csvEscape(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** BOM UTF-8 para Excel abrir acentuação corretamente. */
const CSV_UTF8_BOM = "\uFEFF";

function toCsv(headers: string[], rows: string[][]) {
  const lines = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return CSV_UTF8_BOM + lines.join("\r\n");
}

export async function reportStockCurrentCsv() {
  const rows: Awaited<ReturnType<typeof getCurrentStockSnapshot>>["items"] = [];
  let page = 1;
  const pageSize = 1000;
  while (true) {
    const payload = await getCurrentStockSnapshot({ page, pageSize });
    rows.push(...payload.items);
    if (page >= payload.totalPages) break;
    page += 1;
  }
  return toCsv(
    [
      "Cliente",
      "Produto",
      "Setor no barracão",
      "Unidade (UN/CX/PAL)",
      "Quantidade em estoque",
    ],
    rows.map((r) => [
      r.clientName,
      r.productName,
      r.sector,
      r.unit,
      r.quantity,
    ])
  );
}

export async function reportMovementsCsv() {
  const movements: Awaited<
    ReturnType<typeof prisma.stockMovement.findMany>
  > = [];
  let page = 0;
  const pageSize = 2000;
  while (true) {
    const chunk = await prisma.stockMovement.findMany({
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      skip: page * pageSize,
      take: pageSize,
    });
    if (chunk.length === 0) break;
    movements.push(...chunk);
    page += 1;
  }
  const clients = await prisma.client.findMany();
  const products = await prisma.product.findMany();
  const cm = new Map(clients.map((c) => [c.id, c.name]));
  const pm = new Map(products.map((p) => [p.id, p.name]));

  return toCsv(
    [
      "Data e hora (ISO)",
      "Tipo",
      "Cliente",
      "Produto",
      "Quantidade",
      "Unidade",
      "Setor",
      "Referência interna",
    ],
    movements.map((m) => [
      m.occurredAt.toISOString(),
      m.type === MovementType.ENTRADA ? "Entrada" : "Saída",
      cm.get(m.clientId) ?? m.clientId,
      pm.get(m.productId) ?? m.productId,
      m.quantity.toString(),
      m.unit,
      m.sector,
      `${m.referenceType}:${m.referenceId}`,
    ])
  );
}

export async function reportStockByClientCsv() {
  const snapshot: Awaited<ReturnType<typeof getCurrentStockSnapshot>>["items"] = [];
  let page = 1;
  const pageSize = 1000;
  while (true) {
    const payload = await getCurrentStockSnapshot({ page, pageSize });
    snapshot.push(...payload.items);
    if (page >= payload.totalPages) break;
    page += 1;
  }
  const grouped = new Map<
    string,
    { clientName: string; lines: typeof snapshot }
  >();
  for (const row of snapshot) {
    if (!grouped.has(row.clientId)) {
      grouped.set(row.clientId, { clientName: row.clientName, lines: [] });
    }
    grouped.get(row.clientId)!.lines.push(row);
  }

  const csvRows: string[][] = [];
  for (const g of grouped.values()) {
    for (const r of g.lines) {
      csvRows.push([g.clientName, r.productName, r.sector, r.unit, r.quantity]);
    }
  }

  return toCsv(
    [
      "Cliente",
      "Produto",
      "Setor no barracão",
      "Unidade (UN/CX/PAL)",
      "Quantidade em estoque",
    ],
    csvRows
  );
}
