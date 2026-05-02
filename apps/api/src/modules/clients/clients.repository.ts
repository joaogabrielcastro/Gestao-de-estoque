import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type ClientSearchWhere = {
  name?: { contains: string; mode: "insensitive" };
};

export async function findClientsPage(params: {
  where?: ClientSearchWhere;
  page: number;
  pageSize: number;
  sort?: "name" | "recent";
}) {
  const { where, page, pageSize, sort = "name" } = params;
  const orderBy =
    sort === "recent" ? { createdAt: "desc" as const } : { name: "asc" as const };
  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ]);
  return { items, total };
}

export async function createClient(data: Prisma.ClientCreateInput) {
  return prisma.client.create({ data });
}

export async function findClientById(id: string) {
  return prisma.client.findUnique({ where: { id } });
}

export async function updateClientById(id: string, data: Prisma.ClientUpdateInput) {
  return prisma.client.update({ where: { id }, data });
}

export async function findClientDeleteDependencies(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { inbounds: true, outbounds: true } },
    },
  });
}

export async function deleteClientById(id: string) {
  await prisma.client.delete({ where: { id } });
}
