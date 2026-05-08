import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTimePtBr } from "@/lib/format";

export const dynamic = "force-dynamic";

type Summary = {
  period: "7d" | "30d" | "month";
  periodFrom: string;
  executive: {
    activeLoads: number;
    topClientByVolume: { clientName: string; volume: number };
    busiestSector: { sector: string | null; volume: number };
    movementCountInPeriod: number;
  };
  totalByUnit: { UN: string; CX: string; PAL: string };
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
    bySector:
      raw.bySector && typeof raw.bySector === "object" ? raw.bySector : {},
    recentInbounds: Array.isArray(raw.recentInbounds) ? raw.recentInbounds : [],
    recentOutbounds: Array.isArray(raw.recentOutbounds)
      ? raw.recentOutbounds
      : [],
  };
}

type TimelineItem =
  | {
      kind: "in";
      id: string;
      at: string;
      clientName: string;
      label: string;
      meta: string;
      href: string;
    }
  | {
      kind: "out";
      id: string;
      at: string;
      clientName: string;
      label: string;
      meta: string;
      href: string;
    };

export default async function DashboardPage() {
  let data: Summary;
  try {
    const payload = await api<unknown>(`/dashboard/summary?period=7d`);
    const normalized = safeSummary(payload);
    if (!normalized) throw new Error("Payload inválido do dashboard");
    data = normalized;
  } catch {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não foi possível carregar o painel. Confira se a API está no ar.
      </div>
    );
  }

  const sectors = ["A", "B", "C", "D"] as const;
  const sectorVolumes = sectors.map((s) => {
    const u = data.bySector[s] ?? { UN: "0", CX: "0", PAL: "0" };
    return {
      sector: s,
      total:
        parseFloat(u.UN || "0") +
        parseFloat(u.CX || "0") +
        parseFloat(u.PAL || "0"),
      breakdown: u,
    };
  });
  const maxSector = Math.max(1, ...sectorVolumes.map((s) => s.total));

  const timeline: TimelineItem[] = [
    ...data.recentInbounds.map<TimelineItem>((e) => ({
      kind: "in" as const,
      id: e.id,
      at: e.createdAt,
      clientName: e.client.name,
      label: `Entrada · setor ${e.sector}`,
      meta: `${e.destinationCity}${
        e.invoices.length ? ` · NFs ${e.invoices.map((i) => i.number).join(", ")}` : ""
      }`,
      href: `/entradas/${e.id}/folha`,
    })),
    ...data.recentOutbounds.map<TimelineItem>((o) => ({
      kind: "out" as const,
      id: o.id,
      at: o.withdrawalDate,
      clientName: o.client.name,
      label: `Saída · NF ${o.exitInvoiceNumber}`,
      meta: `${o.pickedUpBy} → ${o.destination}`,
      href: `/saidas`,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Painel do barracão</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Visão dos últimos 7 dias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/entradas/nova"
            className="inline-flex min-h-10 items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Registrar entrada
          </Link>
          <Link
            href="/saidas/nova"
            className="inline-flex min-h-10 items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Registrar saída
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Hero
            label="Cargas ativas"
            value={String(data.executive.activeLoads)}
            sub="ARMAZENADA + SEPARADA"
          />
          <Hero
            label="Setor mais carregado"
            value={data.executive.busiestSector.sector ?? "—"}
            sub={`${data.executive.busiestSector.volume.toFixed(0)} mov. no período`}
          />
          <Hero
            label="Cliente com mais volume"
            value={data.executive.topClientByVolume.clientName}
            valueClass="text-base sm:text-lg"
            sub={`${data.executive.topClientByVolume.volume.toFixed(0)} mov. no período`}
          />
          <Hero
            label="Movimentações 7 dias"
            value={String(data.executive.movementCountInPeriod)}
            sub="entradas + saídas"
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-200 pt-4">
          {(["UN", "CX", "PAL"] as const).map((u) => (
            <div key={u} className="text-center">
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                {u} no barracão
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 sm:text-3xl">
                {data.totalByUnit[u]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Ocupação por setor
          </h2>
          <Link href="/estoque" className="text-xs text-red-700 underline">
            Ver estoque completo
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sectorVolumes.map((s) => {
            const pct = Math.round((s.total / maxSector) * 100);
            return (
              <Link
                key={s.sector}
                href={`/estoque?sector=${s.sector}`}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-red-300"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-semibold text-zinc-900">
                    {s.sector}
                  </span>
                  <span className="text-xs text-zinc-500">setor</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-red-500/80 transition-all group-hover:bg-red-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs tabular-nums text-zinc-700">
                  <span>
                    UN <strong>{s.breakdown.UN}</strong>
                  </span>
                  <span>
                    CX <strong>{s.breakdown.CX}</strong>
                  </span>
                  <span>
                    PAL <strong>{s.breakdown.PAL}</strong>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Movimentações recentes
          </h2>
          <Link
            href="/movimentacoes"
            className="text-xs text-red-700 underline"
          >
            Ver histórico completo
          </Link>
        </div>
        {timeline.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            Nenhuma movimentação recente.
          </p>
        ) : (
          <ol className="relative space-y-2">
            {timeline.map((t) => (
              <li
                key={`${t.kind}-${t.id}`}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm"
              >
                <span
                  className={`mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                    t.kind === "in" ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-zinc-900">
                      {t.clientName}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDateTimePtBr(t.at)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-700">{t.label}</div>
                  <div className="text-xs text-zinc-500">{t.meta}</div>
                </div>
                <Link
                  href={t.href}
                  className="self-center text-xs text-red-700 underline"
                >
                  Abrir
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Hero({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 truncate font-semibold text-zinc-900 ${
          valueClass ?? "text-2xl sm:text-3xl"
        }`}
        title={value}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  );
}
