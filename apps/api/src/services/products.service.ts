import { z } from "zod";
import { createProductSchema } from "../schemas";
import { prisma } from "../lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function listProducts(query?: unknown) {
  const f = z
    .object({
      q: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(200).default(20),
    })
    .parse(query ?? {});
  const where = f.q
    ? { name: { contains: f.q, mode: "insensitive" as const } }
    : undefined;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return {
    items,
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}

export async function createProduct(body: unknown) {
  const data = createProductSchema.parse(body);
  return prisma.product.create({ data });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function updateProduct(id: string, body: unknown) {
  const data = updateSchema.parse(body);
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  const row = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: { select: { inboundLines: true, outboundLines: true } },
    },
  });
  if (!row) {
    const err = new Error("Produto não encontrado");
    (err as { status?: number }).status = 404;
    throw err;
  }
  if (row._count.inboundLines > 0 || row._count.outboundLines > 0) {
    const err = new Error(
      "Não é possível excluir: o produto aparece em entradas ou saídas."
    );
    (err as { status?: number }).status = 409;
    throw err;
  }
  await prisma.product.delete({ where: { id } });
}
