import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Summary = {
  totalByUnit: { UN: string; CX: string; PAL: string };
  byClient: Array<{
    clientName: string;
    byUnit: { UN: string; CX: string; PAL: string };
  }>;
  bySector: Record<string, { UN: string; CX: string; PAL: string }>;
  recentInbounds: Array<{
    id: string;
    createdAt: string;
    destinationCity: string;
    sector: string;
    client: { name: string };
    invoices: Array<{ number: string }>;
  }>;
  recentOutbounds: Array<{
    id: string;
    withdrawalDate: string;
    exitInvoiceNumber: string;
    destination: string;
    pickedUpBy: string;
    client: { name: string };
  }>;
};

export default async function DashboardPage() {
  let data: Summary;
  try {
    data = await fetchJson<Summary>("/dashboard/summary");
  } catch {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        Não foi possível carregar o dashboard. Confira se a API está rodando
        (porta 4000) e se{" "}
        <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
          NEXT_PUBLIC_API_URL
        </code>{" "}
        está correto.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          Quantidade armazenada (por tipo de unidade)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["UN", "CX", "PAL"] as const).map((u) => (
            <div
              key={u}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="text-xs uppercase text-zinc-500">{u}</div>
              <div className="text-2xl font-semibold tabular-nums">
                {data.totalByUnit[u]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Por cliente
          </h2>
          <ul className="space-y-2 text-sm">
            {data.byClient.length === 0 && (
              <li className="text-zinc-500">Nenhum saldo positivo.</li>
            )}
            {data.byClient.map((c) => (
              <li
                key={c.clientName}
                className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <span className="font-medium">{c.clientName}</span>
                <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                  UN {c.byUnit.UN} · CX {c.byUnit.CX} · PAL {c.byUnit.PAL}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">Por setor</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(data.bySector).map(([s, u]) => (
              <li
                key={s}
                className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <span className="font-mono font-medium">Setor {s}</span>
                <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                  UN {u.UN} · CX {u.CX} · PAL {u.PAL}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Últimas entradas
          </h2>
          <ul className="space-y-2 text-sm">
            {data.recentInbounds.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div className="font-medium">{e.client.name}</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {e.destinationCity} · setor {e.sector} ·{" "}
                  {new Date(e.createdAt).toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-zinc-500">
                  NFs: {e.invoices.map((i) => i.number).join(", ")}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Últimas saídas
          </h2>
          <ul className="space-y-2 text-sm">
            {data.recentOutbounds.map((o) => (
              <li
                key={o.id}
                className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div className="font-medium">{o.client.name}</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  NF saída {o.exitInvoiceNumber} · {o.pickedUpBy} →{" "}
                  {o.destination}
                </div>
                <div className="text-xs text-zinc-500">
                  {new Date(o.withdrawalDate).toLocaleString("pt-BR")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
