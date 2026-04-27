import Link from "next/link";
import { CatalogRowActions } from "@/components/CatalogRowActions";
import { ProdutoForm } from "@/components/ProdutoForm";
import { fetchJson } from "@/lib/api";
import { APP_MESSAGES } from "@/lib/messages";
import type { Paginated } from "@/lib/types";

export const dynamic = "force-dynamic";

type Product = { id: string; name: string };

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  let payload: Paginated<Product> = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  };
  let err: string | null = null;
  try {
    payload = await fetchJson<Paginated<Product>>(
      `/products?page=${Math.max(1, page)}&pageSize=20`
    );
  } catch {
    err = APP_MESSAGES.API_UNAVAILABLE;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Produtos</h1>
      {err && (
        <p className="text-sm text-amber-700">{err}</p>
      )}
      <ProdutoForm />
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {payload.items.length === 0 && (
          <li className="px-4 py-6 text-sm text-zinc-500">
            Nenhum produto cadastrado. Use o formulário acima para adicionar o
            primeiro.
          </li>
        )}
        {payload.items.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="min-w-0 break-words">{p.name}</span>
            <CatalogRowActions kind="product" id={p.id} name={p.name} />
          </li>
        ))}
      </ul>
      {!err && payload.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/produtos?page=${Math.max(1, payload.page - 1)}`}
            className={`rounded border px-3 py-1 ${payload.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Anterior
          </Link>
          <span>
            Página {payload.page} de {payload.totalPages} ({payload.total} itens)
          </span>
          <Link
            href={`/produtos?page=${Math.min(payload.totalPages, payload.page + 1)}`}
            className={`rounded border px-3 py-1 ${payload.page >= payload.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            Próxima
          </Link>
        </div>
      )}
    </div>
  );
}
