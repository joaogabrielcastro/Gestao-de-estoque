import { MovementType, PackUnit } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { computeBalances } from "./dashboard.service";

const filterSchema = z.object({
  clientId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function listMovements(query: unknown) {
  const f = filterSchema.parse(query);
  const dateFilter =
    f.from || f.to
      ? { occurredAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } }
      : {};
  const rows = await prisma.stockMovement.findMany({
    where: {
      clientId: f.clientId,
      productId: f.productId,
      type: f.type,
      ...dateFilter,
    },
    orderBy: { occurredAt: "desc" },
    take: 500,
  });
  const clientIds = [...new Set(rows.map((r) => r.clientId))];
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const [clients, products] = await Promise.all([
    prisma.client.findMany({ where: { id: { in: clientIds } } }),
    prisma.product.findMany({ where: { id: { in: productIds } } }),
  ]);
  const cm = new Map(clients.map((c) => [c.id, c.name]));
  const pm = new Map(products.map((p) => [p.id, p.name]));
  return rows.map((r) => ({
    ...r,
    clientName: cm.get(r.clientId) ?? r.clientId,
    productName: pm.get(r.productId) ?? r.productId,
  }));
}

/** Estoque atual: saldos > 0 com nomes */
export async function getCurrentStockSnapshot() {
  const { balances } = await computeBalances();
  const clients = await prisma.client.findMany();
  const products = await prisma.product.findMany();
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const rows: Array<{
    clientId: string;
    clientName: string;
    productId: string;
    productName: string;
    sector: string;
    unit: PackUnit;
    quantity: string;
  }> = [];

  for (const [key, qty] of balances) {
    if (qty.lte(0)) continue;
    const [clientId, productId, sector, unit] = key.split("|") as [
      string,
      string,
      string,
      PackUnit
    ];
    rows.push({
      clientId,
      clientName: clientMap.get(clientId) ?? clientId,
      productId,
      productName: productMap.get(productId) ?? productId,
      sector,
      unit,
      quantity: qty.toString(),
    });
  }

  rows.sort((a, b) => a.clientName.localeCompare(b.clientName));
  return rows;
}
