import { createProductSchema } from "@gestao/shared";
import { z } from "zod";
import * as repo from "./products.repository";

const listProductsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function listProducts(query?: unknown) {
  const f = listProductsSchema.parse(query ?? {});
  const where = f.q
    ? { name: { contains: f.q, mode: "insensitive" as const } }
    : undefined;

  const { items, total } = await repo.findProductsPage({
    where,
    page: f.page,
    pageSize: f.pageSize,
  });

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
  return repo.createProduct(data);
}

export async function getProduct(id: string) {
  return repo.findProductById(id);
}

export async function updateProduct(id: string, body: unknown) {
  const data = updateProductSchema.parse(body);
  return repo.updateProductById(id, data);
}

export async function deleteProduct(id: string) {
  const row = await repo.findProductDeleteDependencies(id);
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
  await repo.deleteProductById(id);
}
