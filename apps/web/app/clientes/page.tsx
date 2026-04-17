import Link from "next/link";
import { CatalogRowActions } from "@/components/CatalogRowActions";
import { ClienteForm } from "@/components/ClienteForm";
import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Client = { id: string; name: string };
type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  let payload: Paginated<Client> = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  };
  let err: string | null = null;
  try {
    payload = await fetchJson<Paginated<Client>>(
      `/clients?page=${Math.max(1, page)}&pageSize=20`
    );
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Clientes</h1>
      {err && (
        <p className="text-sm text-amber-700">{err}</p>
      )}
      <ClienteForm />
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {payload.items.length === 0 && (
          <li className="px-4 py-6 text-sm text-zinc-500">
            Nenhum cliente cadastrado. Use o formulário acima para adicionar o
            primeiro.
          </li>
        )}
        {payload.items.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="min-w-0 break-words">{c.name}</span>
            <CatalogRowActions kind="client" id={c.id} name={c.name} />
          </li>
        ))}
      </ul>
      {!err && payload.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/clientes?page=${Math.max(1, payload.page - 1)}`}
            className={`rounded border px-3 py-1 ${payload.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Anterior
          </Link>
          <span>
            Página {payload.page} de {payload.totalPages} ({payload.total} itens)
          </span>
          <Link
            href={`/clientes?page=${Math.min(payload.totalPages, payload.page + 1)}`}
            className={`rounded border px-3 py-1 ${payload.page >= payload.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            Próxima
          </Link>
        </div>
      )}
    </div>
  );
}
