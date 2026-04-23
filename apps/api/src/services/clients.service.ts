import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createClientSchema } from "../schemas";
import { prisma } from "../lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function listClients() {
  return prisma.client.findMany({ orderBy: { name: "asc" } });
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
  try {
    return await prisma.client.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      const conflict = new Error(
        "Não é possível excluir cliente com entradas/saídas vinculadas",
      );
      (conflict as { status?: number }).status = 409;
      throw conflict;
    }
    throw err;
  }
}
