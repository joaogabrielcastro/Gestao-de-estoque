import {
  ClearFiltersLink,
  HydrateListFilters,
  SaveFiltersForm,
} from "@/components/ListFilters";
import { Pagination } from "@/components/Pagination";
import { api } from "@/lib/api";
import { FILTER_STORAGE } from "@/lib/filter-storage-keys";
import { formatDateTimePtBr } from "@/lib/format";
import type { Paginated } from "@/lib/types";

export const dynamic = "force-dynamic";

type Movement = {
  id: string;
  occurredAt: string;
  type: "ENTRADA" | "SAIDA";
  quantity: string;
  unit: string;
  sector: string;
  clientName: string;
  productName: string;
};
type Client = { id: string; name: string };
type Product = { id: string; name: string };

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    productId?: string;
    type?: "ENTRADA" | "SAIDA";
    sector?: "A" | "B" | "C" | "D";
    unit?: "UN" | "CX" | "PAL";
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.clientId) qs.set("clientId", sp.clientId);
  if (sp.productId) qs.set("productId", sp.productId);
  if (sp.type) qs.set("type", sp.type);
  if (sp.sector) qs.set("sector", sp.sector);
  if (sp.unit) qs.set("unit", sp.unit);
  if (sp.from) qs.set("from", sp.from);
  if (sp.to) qs.set("to", sp.to);
  qs.set("page", sp.page ?? "1");
  qs.set("pageSize", "20");
  const q = qs.toString();

  const hasUrlFilters = Boolean(
    sp.clientId ||
      sp.productId ||
      sp.type ||
      sp.sector ||
      sp.unit ||
      sp.from ||
      sp.to
  );

  let payload: Paginated<Movement> = {
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
    const [movementsPayload, clientsPayload, productsPayload] = await Promise.all([
      api<Paginated<Movement>>(`/movements${q ? `?${q}` : ""}`),
      api<Paginated<Client>>("/clients?page=1&pageSize=200"),
      api<Paginated<Product>>("/products?page=1&pageSize=200"),
    ]);
    payload = movementsPayload;
    clients = clientsPayload.items;
    products = productsPayload.items;
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <HydrateListFilters
        storageKey={FILTER_STORAGE.movimentacoes}
        applyWhenEmpty={!hasUrlFilters}
      />
      <h1 className="page-title">Movimentações de estoque</h1>
      <p className="text-sm text-zinc-600">
        Histórico com data e hora para conferência de NF e saldo.{" "}
        <strong>Entrada</strong> aumenta estoque; <strong>saída</strong> retira.
      </p>
      <SaveFiltersForm
        action="/movimentacoes"
        storageKey={FILTER_STORAGE.movimentacoes}
      >
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-8">
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
          Tipo (entrada / saída)
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="ENTRADA">Entrada de carga</option>
            <option value="SAIDA">Saída (retirada)</option>
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
            storageKey={FILTER_STORAGE.movimentacoes}
            href="/movimentacoes"
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
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-3 py-2 font-medium">Data e hora</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium">Quantidade</th>
              <th className="px-3 py-2 font-medium">Setor</th>
            </tr>
          </thead>
          <tbody>
            {payload.items.length === 0 && !err && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-zinc-500">
                  Nenhuma movimentação.
                </td>
              </tr>
            )}
            {payload.items.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-100"
              >
                <td className="px-3 py-2 whitespace-nowrap text-zinc-600">
                  {formatDateTimePtBr(r.occurredAt)}
                </td>
                <td className="px-3 py-2">
                  {r.type === "ENTRADA" ? (
                    <span className="text-emerald-700">
                      Entrada
                    </span>
                  ) : (
                    <span className="text-rose-700">
                      Saída
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{r.clientName}</td>
                <td className="px-3 py-2">{r.productName}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.quantity} {r.unit}
                </td>
                <td className="px-3 py-2 font-mono">{r.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {payload.items.length === 0 && !err && (
          <li className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            Nenhuma movimentação.
          </li>
        )}
        {payload.items.map((r) => (
          <li
            key={`m-${r.id}`}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm"
          >
            <div className="text-xs text-zinc-500">
              {formatDateTimePtBr(r.occurredAt)}
            </div>
            <div className="mt-1 font-medium text-zinc-900">{r.clientName}</div>
            <div className="mt-1 text-zinc-700">{r.productName}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span
                className={
                  r.type === "ENTRADA"
                    ? "rounded bg-emerald-50 px-2 py-0.5 text-emerald-800"
                    : "rounded bg-rose-50 px-2 py-0.5 text-rose-800"
                }
              >
                {r.type === "ENTRADA" ? "Entrada" : "Saída"}
              </span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono">
                Setor {r.sector}
              </span>
              <span className="tabular-nums font-medium">
                {r.quantity} {r.unit}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {!err && (
        <Pagination
          basePath="/movimentacoes"
          query={qs}
          page={payload.page}
          totalPages={payload.totalPages}
          total={payload.total}
        />
      )}
    </div>
  );
}
