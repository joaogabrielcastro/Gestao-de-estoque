import { createProductSchema } from "@gestao/shared";
import { z } from "zod";
import { conflict, notFound } from "../../lib/http-error";
import { paginated } from "../../lib/pagination";
import * as repo from "./products.repository";

const listProductsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sort: z.enum(["name", "recent"]).optional().default("name"),
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
    sort: f.sort,
  });

  return paginated(items, f.page, f.pageSize, total);
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
  if (!row) throw notFound("Produto não encontrado");
  if (row._count.inboundLines > 0 || row._count.outboundLines > 0) {
    throw conflict(
      "Não é possível excluir: o produto aparece em entradas ou saídas.",
      "HAS_DEPENDENCIES"
    );
  }
  await repo.deleteProductById(id);
}
