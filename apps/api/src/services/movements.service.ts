import { MovementType, PackUnit, Sector } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { paginated } from "../lib/pagination";

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
  return paginated(items, f.page, f.pageSize, total);
}
