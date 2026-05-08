import { CatalogRowActions } from "@/components/CatalogRowActions";
import { Pagination } from "@/components/Pagination";
import { ProdutoForm } from "@/components/ProdutoForm";
import { api } from "@/lib/api";
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
    payload = await api<Paginated<Product>>(
      `/products?page=${Math.max(1, page)}&pageSize=20`
    );
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Produtos</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          O que entra e sai do estoque (nome único no sistema). Use o mesmo nome que o time
          usa no barracão e nas NFs.
        </p>
      </div>
      {err && (
        <p className="text-sm text-amber-700">{err}</p>
      )}
      <ProdutoForm />
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {payload.items.length === 0 && (
          <li className="px-4 py-6 text-sm text-zinc-500">
            Nenhum produto ainda. Cadastre acima para poder lançar quantidades nas entradas e
            retiradas.
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
      {!err && (
        <Pagination
          basePath="/produtos"
          query={new URLSearchParams()}
          page={payload.page}
          totalPages={payload.totalPages}
          total={payload.total}
        />
      )}
    </div>
  );
}
