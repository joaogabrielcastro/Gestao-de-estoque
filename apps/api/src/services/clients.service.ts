import { z } from "zod";
import { createClientSchema } from "../schemas";
import { prisma } from "../lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function listClients(query?: unknown) {
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
    prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.client.count({ where }),
  ]);
  return {
    items,
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}

export async function createClient(body: unknown) {
  const data = createClientSchema.parse(body);
  return prisma.client.create({ data });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({ where: { id } });
}

export async function updateClient(id: string, body: unknown) {
  const data = updateSchema.parse(body);
  return prisma.client.update({ where: { id }, data });
}

export async function deleteClient(id: string) {
  const row = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { inbounds: true, outbounds: true } },
    },
  });
  if (!row) {
    const err = new Error("Cliente não encontrado");
    (err as { status?: number }).status = 404;
    throw err;
  }
  if (row._count.inbounds > 0 || row._count.outbounds > 0) {
    const err = new Error(
      "Não é possível excluir: existem entradas ou saídas vinculadas a este cliente."
    );
    (err as { status?: number }).status = 409;
    throw err;
  }
  await prisma.client.delete({ where: { id } });
}
