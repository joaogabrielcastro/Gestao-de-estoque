import { createClientSchema } from "@gestao/shared";
import { z } from "zod";
import { conflict, notFound } from "../../lib/http-error";
import { paginated } from "../../lib/pagination";
import * as repo from "./clients.repository";

const listClientsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sort: z.enum(["name", "recent"]).optional().default("name"),
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
    sort: f.sort,
  });

  return paginated(items, f.page, f.pageSize, total);
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
  if (!row) throw notFound("Cliente não encontrado");
  if (row._count.inbounds > 0 || row._count.outbounds > 0) {
    throw conflict(
      "Não é possível excluir: existem entradas ou saídas vinculadas a este cliente.",
      "HAS_DEPENDENCIES"
    );
  }
  await repo.deleteClientById(id);
}
