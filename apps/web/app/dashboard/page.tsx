import { QuickActions } from "@/components/QuickActions";
import { fetchJson } from "@/lib/api";
import { formatDateTimePtBr } from "@/lib/format";
import type { Paginated } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Summary = {
  period: "7d" | "30d" | "month";
  periodFrom: string;
  executive: {
    activeLoads: number;
    topClientByVolume: {
      clientName: string;
      volume: number;
    };
    busiestSector: {
      sector: string | null;
      volume: number;
    };
    movementCountInPeriod: number;
  };
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

function safeSummary(payload: unknown): Summary | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Partial<Summary>;
  if (!raw.executive || typeof raw.executive !== "object") return null;
  if (!raw.totalByUnit || typeof raw.totalByUnit !== "object") return null;

  return {
    period: raw.period === "30d" || raw.period === "month" ? raw.period : "7d",
    periodFrom: typeof raw.periodFrom === "string" ? raw.periodFrom : "",
    executive: {
      activeLoads:
        typeof raw.executive.activeLoads === "number"
          ? raw.executive.activeLoads
          : 0,
      topClientByVolume: {
        clientName:
          typeof raw.executive.topClientByVolume?.clientName === "string"
            ? raw.executive.topClientByVolume.clientName
            : "—",
        volume:
          typeof raw.executive.topClientByVolume?.volume === "number"
            ? raw.executive.topClientByVolume.volume
            : 0,
      },
      busiestSector: {
        sector:
          typeof raw.executive.busiestSector?.sector === "string"
            ? raw.executive.busiestSector.sector
            : null,
        volume:
          typeof raw.executive.busiestSector?.volume === "number"
            ? raw.executive.busiestSector.volume
            : 0,
      },
      movementCountInPeriod:
        typeof raw.executive.movementCountInPeriod === "number"
          ? raw.executive.movementCountInPeriod
          : 0,
    },
    totalByUnit: {
      UN: String(raw.totalByUnit.UN ?? "0"),
      CX: String(raw.totalByUnit.CX ?? "0"),
      PAL: String(raw.totalByUnit.PAL ?? "0"),
    },
    byClient: Array.isArray(raw.byClient) ? raw.byClient : [],
    bySector:
      raw.bySector && typeof raw.bySector === "object" ? raw.bySector : {},
    recentInbounds: Array.isArray(raw.recentInbounds) ? raw.recentInbounds : [],
    recentOutbounds: Array.isArray(raw.recentOutbounds)
      ? raw.recentOutbounds
      : [],
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: "7d" | "30d" | "month" }>;
}) {
  const sp = await searchParams;
  const period = sp.period ?? "7d";
  let data: Summary;
  let recentClients: Array<{ id: string; name: string; createdAt: string }> = [];
  let recentProducts: Array<{ id: string; name: string; createdAt: string }> = [];
  try {
    const payload = await fetchJson<unknown>(`/dashboard/summary?period=${period}`);
    const normalized = safeSummary(payload);
    if (!normalized) throw new Error("Payload inválido do dashboard");
    data = normalized;
    try {
      const [clientsRecent, productsRecent] = await Promise.all([
        fetchJson<Paginated<{ id: string; name: string; createdAt: string }>>(
          "/clients?page=1&pageSize=5&sort=recent"
        ),
        fetchJson<Paginated<{ id: string; name: string; createdAt: string }>>(
          "/products?page=1&pageSize=5&sort=recent"
        ),
      ]);
      recentClients = clientsRecent.items;
      recentProducts = productsRecent.items;
    } catch {
      /* lista recente é opcional */
    }
  } catch {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não foi possível carregar o dashboard. Confira se a API está no ar (por
        padrão porta <strong>3011</strong>), se{" "}
        <code className="rounded bg-amber-100 px-1">
          NEXT_PUBLIC_API_URL
        </code>{" "}
        aponta para <code className="rounded bg-amber-100 px-1">…/api</code> e,
        se estiver usando Docker para a web, se{" "}
        <code className="rounded bg-amber-100 px-1">API_URL</code>{" "}
        aponta para o serviço interno (ex.: <code className="rounded bg-amber-100 px-1">http://api:3011/api</code>).
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Painel</h1>
        <form
          method="get"
          action="/dashboard"
          className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 text-sm"
        >
          <select name="period" defaultValue={period} className="rounded border border-zinc-300 px-2 py-1">
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="month">Mês atual</option>
          </select>
          <button type="submit" className="rounded bg-red-600 px-3 py-1 text-white">
            Aplicar período
          </button>
        </form>
      </div>

      <QuickActions />

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Últimos clientes cadastrados
          </h2>
          <ul className="space-y-2 text-sm">
            {recentClients.length === 0 && (
              <li className="text-zinc-500">
                Nenhum cliente ainda.{" "}
                <Link className="text-red-700 underline" href="/clientes">
                  Cadastrar
                </Link>
              </li>
            )}
            {recentClients.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-zinc-500">
                  {formatDateTimePtBr(c.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Últimos produtos cadastrados
          </h2>
          <ul className="space-y-2 text-sm">
            {recentProducts.length === 0 && (
              <li className="text-zinc-500">
                Nenhum produto ainda.{" "}
                <Link className="text-red-700 underline" href="/produtos">
                  Cadastrar
                </Link>
              </li>
            )}
            {recentProducts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-zinc-500">
                  {formatDateTimePtBr(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-xs uppercase text-zinc-500">Cargas ativas</div>
          <div className="text-2xl font-semibold">{data.executive.activeLoads}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-xs uppercase text-zinc-500">Cliente mais volume</div>
          <div className="font-semibold">{data.executive.topClientByVolume.clientName}</div>
          <div className="text-xs text-zinc-600">{data.executive.topClientByVolume.volume.toFixed(2)} no período</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-xs uppercase text-zinc-500">Setor mais carregado</div>
          <div className="text-2xl font-semibold">{data.executive.busiestSector.sector ?? "—"}</div>
          <div className="text-xs text-zinc-600">{data.executive.busiestSector.volume.toFixed(2)} no período</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-xs uppercase text-zinc-500">Movimentações período</div>
          <div className="text-2xl font-semibold">{data.executive.movementCountInPeriod}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          Quantidade armazenada (por tipo de unidade)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["UN", "CX", "PAL"] as const).map((u) => (
            <div
              key={u}
              className="rounded-lg border border-zinc-200 bg-white p-4"
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
              className="rounded-md border border-zinc-200 px-3 py-2"
              >
                <span className="font-medium">{c.clientName}</span>
              <span className="ml-2 text-zinc-600">
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
                className="rounded-md border border-zinc-200 px-3 py-2"
              >
                <span className="font-mono font-medium">Setor {s}</span>
                <span className="ml-2 text-zinc-600">
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
                className="rounded-md border border-zinc-200 px-3 py-2"
              >
                <div className="font-medium">{e.client.name}</div>
                <div className="text-zinc-600">
                  {e.destinationCity} · setor {e.sector} · registrado em{" "}
                  {formatDateTimePtBr(e.createdAt)}
                </div>
                <div className="text-xs text-zinc-500">
                  NFs: {e.invoices.map((i) => i.number).join(", ")}
                </div>
                <Link href={`/entradas/${e.id}/folha`} className="text-xs text-red-700 underline">
                  Abrir folha
                </Link>
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
                className="rounded-md border border-zinc-200 px-3 py-2"
              >
                <div className="font-medium">{o.client.name}</div>
                <div className="text-zinc-600">
                  NF saída {o.exitInvoiceNumber} · {o.pickedUpBy} →{" "}
                  {o.destination}
                </div>
                <div className="text-xs text-zinc-500">
                  Retirada em {formatDateTimePtBr(o.withdrawalDate)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
