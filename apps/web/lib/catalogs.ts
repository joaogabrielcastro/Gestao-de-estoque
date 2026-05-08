import { api } from "@/lib/api";
import type { Paginated } from "@/lib/types";

export type CatalogItem = { id: string; name: string };

export async function loadCatalogs() {
  const [clientsPayload, productsPayload] = await Promise.all([
    api<Paginated<CatalogItem>>("/clients?page=1&pageSize=200"),
    api<Paginated<CatalogItem>>("/products?page=1&pageSize=200"),
  ]);
  return {
    clients: clientsPayload.items,
    products: productsPayload.items,
  };
}
