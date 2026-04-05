import Link from "next/link";
import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Outbound = {
  id: string;
  withdrawalDate: string;
  exitInvoiceNumber: string;
  pickedUpBy: string;
  destination: string;
  client: { name: string };
  lines: Array<{
    quantity: string;
    unit: string;
    sector: string;
    product: { name: string };
  }>;
};

export default async function SaidasPage() {
  let rows: Outbound[] = [];
  let err: string | null = null;
  try {
    rows = await fetchJson<Outbound[]>("/outbounds");
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Saídas de carga
        </h1>
        <Link
          href="/saidas/nova"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nova saída
        </Link>
      </div>
      {err && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{err}</p>
      )}
      <ul className="space-y-3">
        {rows.length === 0 && !err && (
          <li className="text-sm text-zinc-500">Nenhuma saída registrada.</li>
        )}
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
          >
            <div className="font-medium">{r.client.name}</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              NF saída {r.exitInvoiceNumber} · {r.pickedUpBy} → {r.destination}
            </div>
            <div className="text-xs text-zinc-500">
              {new Date(r.withdrawalDate).toLocaleString("pt-BR")}
            </div>
            <ul className="mt-2 list-inside list-disc text-xs text-zinc-600">
              {r.lines.map((l) => (
                <li key={`${l.product.name}-${l.sector}-${l.unit}`}>
                  {l.product.name}: {l.quantity} {l.unit} (setor {l.sector})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
