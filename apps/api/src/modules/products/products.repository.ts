import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type ProductSearchWhere = {
  name?: { contains: string; mode: "insensitive" };
};

export async function findProductsPage(params: {
  where?: ProductSearchWhere;
  page: number;
  pageSize: number;
  sort?: "name" | "recent";
}) {
  const { where, page, pageSize, sort = "name" } = params;
  const orderBy =
    sort === "recent" ? { createdAt: "desc" as const } : { name: "asc" as const };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total };
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export async function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function updateProductById(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export async function findProductDeleteDependencies(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      _count: { select: { inboundLines: true, outboundLines: true } },
    },
  });
}

export async function deleteProductById(id: string) {
  await prisma.product.delete({ where: { id } });
}
