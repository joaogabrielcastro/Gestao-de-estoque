import Link from "next/link";
import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Inbound = {
  id: string;
  createdAt: string;
  destinationCity: string;
  sector: string;
  supplierOrBrand: string | null;
  client: { name: string };
  invoices: Array<{ number: string }>;
  lines: Array<{
    quantity: string;
    unit: string;
    product: { name: string };
  }>;
};

export default async function EntradasPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; nf?: string; productId?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.clientId) qs.set("clientId", sp.clientId);
  if (sp.nf) qs.set("nf", sp.nf);
  if (sp.productId) qs.set("productId", sp.productId);
  const q = qs.toString();

  let rows: Inbound[] = [];
  let err: string | null = null;
  try {
    rows = await fetchJson<Inbound[]>(`/inbounds${q ? `?${q}` : ""}`);
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Entradas de carga
        </h1>
        <Link
          href="/entradas/nova"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nova entrada
        </Link>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Filtros via URL:{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          ?clientId=&nf=&productId=
        </code>
      </p>
      {err && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{err}</p>
      )}
      <ul className="space-y-3">
        {rows.length === 0 && !err && (
          <li className="text-sm text-zinc-500">Nenhuma entrada registrada.</li>
        )}
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
          >
            <div className="font-medium">{r.client.name}</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              {r.destinationCity} · setor {r.sector}
              {r.supplierOrBrand ? ` · ${r.supplierOrBrand}` : ""}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {new Date(r.createdAt).toLocaleString("pt-BR")} · NFs:{" "}
              {r.invoices.map((i) => i.number).join(", ")}
            </div>
            <ul className="mt-2 list-inside list-disc text-xs text-zinc-600">
              {r.lines.map((l) => (
                <li key={l.product.name + l.unit}>
                  {l.product.name}: {l.quantity} {l.unit}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
