import { MovementType, PackUnit, Sector } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const filterSchema = z.object({
  clientId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
  sector: z.nativeEnum(Sector).optional(),
  unit: z.nativeEnum(PackUnit).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

/** Limite maior que movimentações: export CSV e relatórios paginam em lotes (ex.: 1000). */
const stockFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  sector: z.nativeEnum(Sector).optional(),
  unit: z.nativeEnum(PackUnit).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(10_000).default(20),
});

export async function listMovements(query: unknown) {
  const f = filterSchema.parse(query);
  const dateFilter =
    f.from || f.to
      ? { occurredAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } }
      : {};
  const where = {
    clientId: f.clientId,
    productId: f.productId,
    type: f.type,
    sector: f.sector,
    unit: f.unit,
    ...dateFilter,
  };
  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  const clientIds = [...new Set(rows.map((r) => r.clientId))];
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const [clients, products] = await Promise.all([
    prisma.client.findMany({ where: { id: { in: clientIds } } }),
    prisma.product.findMany({ where: { id: { in: productIds } } }),
  ]);
  const cm = new Map(clients.map((c) => [c.id, c.name]));
  const pm = new Map(products.map((p) => [p.id, p.name]));
  const items = rows.map((r) => ({
    ...r,
    clientName: cm.get(r.clientId) ?? r.clientId,
    productName: pm.get(r.productId) ?? r.productId,
  }));
  return {
    items,
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}

/** Estoque atual: saldos > 0 com nomes */
export async function getCurrentStockSnapshot(query?: unknown) {
  const f = stockFilterSchema.parse(query ?? {});
  const nameFilter = f.q?.trim();
  const [clients, products] = await Promise.all([
    prisma.client.findMany({
      where: nameFilter
        ? { name: { contains: nameFilter, mode: "insensitive" } }
        : undefined,
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: nameFilter
        ? { name: { contains: nameFilter, mode: "insensitive" } }
        : undefined,
      select: { id: true, name: true },
    }),
  ]);
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const where = {
    quantity: { gt: 0 },
    ...(f.clientId ? { clientId: f.clientId } : {}),
    ...(f.productId ? { productId: f.productId } : {}),
    ...(f.sector ? { sector: f.sector } : {}),
    ...(f.unit ? { unit: f.unit } : {}),
    ...(nameFilter
      ? {
          AND: [
            { clientId: { in: clients.map((c) => c.id) } },
            { productId: { in: products.map((p) => p.id) } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.stockBalance.findMany({
      where,
      orderBy: [{ clientId: "asc" }, { productId: "asc" }],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.stockBalance.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      clientId: row.clientId,
      clientName: clientMap.get(row.clientId) ?? row.clientId,
      productId: row.productId,
      productName: productMap.get(row.productId) ?? row.productId,
      sector: row.sector,
      unit: row.unit as PackUnit,
      quantity: row.quantity.toString(),
    })),
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}
