import {
  ClearFiltersLink,
  HydrateListFilters,
  SaveFiltersForm,
} from "@/components/ListFilters";
import { Pagination } from "@/components/Pagination";
import { api } from "@/lib/api";
import { FILTER_STORAGE } from "@/lib/filter-storage-keys";
import type { Paginated } from "@/lib/types";

export const dynamic = "force-dynamic";

type StockRow = {
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  sector: "A" | "B" | "C" | "D";
  unit: "UN" | "CX" | "PAL";
  quantity: string;
};

type Client = { id: string; name: string };
type Product = { id: string; name: string };

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    productId?: string;
    sector?: "A" | "B" | "C" | "D";
    unit?: "UN" | "CX" | "PAL";
    q?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.clientId) qs.set("clientId", sp.clientId);
  if (sp.productId) qs.set("productId", sp.productId);
  if (sp.sector) qs.set("sector", sp.sector);
  if (sp.unit) qs.set("unit", sp.unit);
  if (sp.q) qs.set("q", sp.q);
  qs.set("page", sp.page ?? "1");
  qs.set("pageSize", "20");
  const q = qs.toString();

  const hasUrlFilters = Boolean(
    sp.clientId || sp.productId || sp.sector || sp.unit || sp.q
  );

  let payload: Paginated<StockRow> = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  };
  let clients: Client[] = [];
  let products: Product[] = [];
  let err: string | null = null;
  try {
    const [stockPayload, clientsPayload, productsPayload] = await Promise.all([
      api<Paginated<StockRow>>(`/stock${q ? `?${q}` : ""}`),
      api<Paginated<Client>>("/clients?page=1&pageSize=200"),
      api<Paginated<Product>>("/products?page=1&pageSize=200"),
    ]);
    payload = stockPayload;
    clients = clientsPayload.items;
    products = productsPayload.items;
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <HydrateListFilters
        storageKey={FILTER_STORAGE.estoque}
        applyWhenEmpty={!hasUrlFilters}
      />
      <div>
        <h1 className="page-title">Estoque no barracão</h1>
        <p className="text-sm text-zinc-600">
          Saldo por cliente, produto, setor e unidade (UN/CX/PAL). É calculado direto
          do histórico de movimentações — sem cache, sem divergência. Os filtros podem
          ser lembrados neste aparelho após você clicar em Filtrar.
        </p>
      </div>
      <SaveFiltersForm action="/estoque" storageKey={FILTER_STORAGE.estoque}>
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
          Setor
          <select
            name="sector"
            defaultValue={sp.sector ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {(["A", "B", "C", "D"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-600">
          Unidade
          <select
            name="unit"
            defaultValue={sp.unit ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {(["UN", "CX", "PAL"] as const).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-600">
          Busca (nome cliente ou produto)
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="parte do nome"
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
            storageKey={FILTER_STORAGE.estoque}
            href="/estoque"
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

      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium">Setor</th>
              <th className="px-3 py-2 font-medium">Unidade</th>
              <th className="px-3 py-2 font-medium">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {payload.items.length === 0 && !err && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-zinc-500">
                  Nenhum saldo disponível.
                </td>
              </tr>
            )}
            {payload.items.map((r) => (
              <tr
                key={`${r.clientId}-${r.productId}-${r.sector}-${r.unit}`}
                className="border-b border-zinc-100"
              >
                <td className="px-3 py-2">{r.clientName}</td>
                <td className="px-3 py-2">{r.productName}</td>
                <td className="px-3 py-2 font-mono">{r.sector}</td>
                <td className="px-3 py-2">{r.unit}</td>
                <td className="px-3 py-2 tabular-nums">{r.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {payload.items.length === 0 && !err && (
          <li className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            Nenhum saldo disponível.
          </li>
        )}
        {payload.items.map((r) => (
          <li
            key={`c-${r.clientId}-${r.productId}-${r.sector}-${r.unit}`}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm"
          >
            <div className="font-medium text-zinc-900">{r.clientName}</div>
            <div className="mt-1 text-zinc-800">{r.productName}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
              <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono">
                Setor {r.sector}
              </span>
              <span>{r.unit}</span>
              <span className="tabular-nums font-semibold text-zinc-900">
                {r.quantity}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {!err && (
        <Pagination
          basePath="/estoque"
          query={qs}
          page={payload.page}
          totalPages={payload.totalPages}
          total={payload.total}
        />
      )}
    </div>
  );
}
