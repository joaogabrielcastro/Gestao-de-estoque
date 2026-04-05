import { fetchJson } from "@/lib/api";

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

export default async function MovimentacoesPage() {
  let rows: Movement[] = [];
  let err: string | null = null;
  try {
    rows = await fetchJson<Movement[]>("/movements");
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Movimentações de estoque
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Últimas 500 movimentações. Use filtros na API se necessário (
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          ?clientId=&productId=&type=
        </code>
        ).
      </p>
      {err && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{err}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium">Qtd</th>
              <th className="px-3 py-2 font-medium">Setor</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-zinc-500">
                  Nenhuma movimentação.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-100 dark:border-zinc-800/80"
              >
                <td className="px-3 py-2 whitespace-nowrap text-zinc-600">
                  {new Date(r.occurredAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2">
                  {r.type === "ENTRADA" ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      entrada
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400">
                      saída
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
    </div>
  );
}
