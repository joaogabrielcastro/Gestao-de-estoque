import Link from "next/link";
import { OutboundRowActions } from "@/components/OutboundRowActions";
import {
  ClearFiltersLink,
  HydrateListFilters,
  SaveFiltersForm,
} from "@/components/ListFilters";
import { QuickActions } from "@/components/QuickActions";
import { fetchJson } from "@/lib/api";
import { FILTER_STORAGE } from "@/lib/filter-storage-keys";
import { formatDateTimePtBr } from "@/lib/format";
import { APP_MESSAGES } from "@/lib/messages";
import type { Paginated } from "@/lib/types";

export const dynamic = "force-dynamic";

type Outbound = {
  id: string;
  withdrawalDate: string;
  exitInvoiceNumber: string;
  pickedUpBy: string;
  destination: string;
  notes?: string | null;
  client: { name: string };
  lines: Array<{
    quantity: string;
    unit: string;
    sector: string;
    product: { name: string };
  }>;
};

type Client = { id: string; name: string };
type Product = { id: string; name: string };

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    nf?: string;
    productId?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.clientId) qs.set("clientId", sp.clientId);
  if (sp.nf) qs.set("nf", sp.nf);
  if (sp.productId) qs.set("productId", sp.productId);
  if (sp.q) qs.set("q", sp.q);
  if (sp.from) qs.set("from", sp.from);
  if (sp.to) qs.set("to", sp.to);
  qs.set("page", sp.page ?? "1");
  qs.set("pageSize", "8");
  const q = qs.toString();

  const hasUrlFilters = Boolean(
    sp.clientId || sp.nf || sp.productId || sp.q || sp.from || sp.to
  );

  let payload: Paginated<Outbound> = {
    items: [],
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
  };
  let clients: Client[] = [];
  let products: Product[] = [];
  let err: string | null = null;
  try {
    const [outboundsPayload, clientsPayload, productsPayload] = await Promise.all([
      fetchJson<Paginated<Outbound>>(`/outbounds${q ? `?${q}` : ""}`),
      fetchJson<Paginated<Client>>("/clients?page=1&pageSize=200"),
      fetchJson<Paginated<Product>>("/products?page=1&pageSize=200"),
    ]);
    payload = outboundsPayload;
    clients = clientsPayload.items;
    products = productsPayload.items;
  } catch {
    err = APP_MESSAGES.API_UNAVAILABLE;
  }

  return (
    <div className="space-y-6">
      <HydrateListFilters
        storageKey={FILTER_STORAGE.saidas}
        applyWhenEmpty={!hasUrlFilters}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">Retiradas (saídas)</h1>
        <Link
          href="/saidas/nova"
          className="inline-flex min-h-10 items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Nova retirada
        </Link>
      </div>
      <QuickActions />
      <SaveFiltersForm action="/saidas" storageKey={FILTER_STORAGE.saidas}>
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-6">
        <label className="text-xs text-zinc-600">
          Cliente
          <select
            name="clientId"
            defaultValue={sp.clientId ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-600">
          NF de saída
          <input
            name="nf"
            defaultValue={sp.nf ?? ""}
            placeholder="Número da NF"
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-zinc-600">
          Produto
          <select
            name="productId"
            defaultValue={sp.productId ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-600">
          Busca (NF, destino, motorista…)
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-zinc-600">
          Data início
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-zinc-600">
          Data fim
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Filtrar
          </button>
          <ClearFiltersLink
            storageKey={FILTER_STORAGE.saidas}
            href="/saidas"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            Limpar
          </ClearFiltersLink>
        </div>
      </div>
      </SaveFiltersForm>
      {err && (
        <p className="text-sm text-amber-700">{err}</p>
      )}
      <ul className="space-y-3">
        {payload.items.length === 0 && !err && (
          <li className="text-sm text-zinc-500">Nenhuma saída registrada.</li>
        )}
        {payload.items.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm"
          >
            <div className="font-medium">{r.client.name}</div>
            <div className="text-zinc-600">
              NF saída {r.exitInvoiceNumber} · retirada por {r.pickedUpBy} →{" "}
              {r.destination}
            </div>
            <div className="text-xs text-zinc-500">
              Data da retirada: {formatDateTimePtBr(r.withdrawalDate)}
            </div>
            <ul className="mt-2 list-inside list-disc text-xs text-zinc-600">
              {r.lines.map((l) => (
                <li key={`${l.product.name}-${l.sector}-${l.unit}`}>
                  {l.product.name}: {l.quantity} {l.unit} (setor {l.sector})
                </li>
              ))}
            </ul>
            {r.notes ? <div className="mt-2 text-xs text-zinc-700">Obs.: {r.notes}</div> : null}
            <OutboundRowActions id={r.id} />
          </li>
        ))}
      </ul>
      {!err && payload.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/saidas?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(Math.max(1, payload.page - 1)) }).toString()}`}
            className={`rounded border px-3 py-1 ${payload.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Anterior
          </Link>
          <span>
            Página {payload.page} de {payload.totalPages} ({payload.total} itens)
          </span>
          <Link
            href={`/saidas?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(Math.min(payload.totalPages, payload.page + 1)) }).toString()}`}
            className={`rounded border px-3 py-1 ${payload.page >= payload.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            Próxima
          </Link>
        </div>
      )}
    </div>
  );
}
