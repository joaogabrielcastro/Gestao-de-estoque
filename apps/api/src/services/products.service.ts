import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createProductSchema } from "../schemas";
import { prisma } from "../lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function listProducts() {
  return prisma.product.findMany({ orderBy: { name: "asc" } });
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
  try {
    return await prisma.product.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      const conflict = new Error(
        "Não é possível excluir produto com entradas/saídas vinculadas",
      );
      (conflict as { status?: number }).status = 409;
      throw conflict;
    }
    throw err;
  }
}
