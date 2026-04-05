import { MovementType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getCurrentStockSnapshot } from "./movements.service";

function csvEscape(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: string[][]) {
  const lines = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\r\n");
}

export async function reportStockCurrentCsv() {
  const rows = await getCurrentStockSnapshot();
  return toCsv(
    ["cliente", "produto", "setor", "unidade", "quantidade"],
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
  const movements = await prisma.stockMovement.findMany({
    orderBy: { occurredAt: "desc" },
    take: 10_000,
  });
  const clients = await prisma.client.findMany();
  const products = await prisma.product.findMany();
  const cm = new Map(clients.map((c) => [c.id, c.name]));
  const pm = new Map(products.map((p) => [p.id, p.name]));

  return toCsv(
    ["data", "tipo", "cliente", "produto", "quantidade", "unidade", "setor", "ref"],
    movements.map((m) => [
      m.occurredAt.toISOString(),
      m.type === MovementType.ENTRADA ? "entrada" : "saida",
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
  const snapshot = await getCurrentStockSnapshot();
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

  return toCsv(["cliente", "produto", "setor", "unidade", "quantidade"], csvRows);
}
