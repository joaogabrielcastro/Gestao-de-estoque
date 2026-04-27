import { createClientSchema } from "@gestao/shared";
import { z } from "zod";
import * as repo from "./clients.repository";

const listClientsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function listClients(query?: unknown) {
  const f = listClientsSchema.parse(query ?? {});
  const where = f.q
    ? { name: { contains: f.q, mode: "insensitive" as const } }
    : undefined;

  const { items, total } = await repo.findClientsPage({
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

export async function createClient(body: unknown) {
  const data = createClientSchema.parse(body);
  return repo.createClient(data);
}

export async function getClient(id: string) {
  return repo.findClientById(id);
}

export async function updateClient(id: string, body: unknown) {
  const data = updateClientSchema.parse(body);
  return repo.updateClientById(id, data);
}

export async function deleteClient(id: string) {
  const row = await repo.findClientDeleteDependencies(id);
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
  await repo.deleteClientById(id);
}
