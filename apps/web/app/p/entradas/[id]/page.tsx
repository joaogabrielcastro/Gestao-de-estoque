import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { formatDateTimePtBr } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_PT: Record<"ARMAZENADA" | "SEPARADA" | "RETIRADA", string> = {
  ARMAZENADA: "Armazenada",
  SEPARADA: "Separada",
  RETIRADA: "Retirada",
};

type Inbound = {
  id: string;
  createdAt: string;
  destinationCity: string;
  sector: string;
  status: "ARMAZENADA" | "SEPARADA" | "RETIRADA";
  notes?: string | null;
  supplierOrBrand: string | null;
  client: { name: string };
  invoices: Array<{ number: string }>;
  lines: Array<{
    quantity: string;
    unit: string;
    product: { name: string };
  }>;
};

async function loadInbound(id: string): Promise<Inbound> {
  try {
    return await api<Inbound>(`/inbounds/${id}`);
  } catch {
    notFound();
  }
}

export const metadata = {
  title: "Carga — consulta",
  robots: { index: false, follow: false },
};

export default async function PublicInboundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await loadInbound(id);
  const consultaEm = formatDateTimePtBr(new Date().toISOString());

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-1 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-10 w-auto"
            width={120}
            height={48}
          />
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Consulta de carga
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Entrada #{row.id.slice(0, 8)}
            </h1>
          </div>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div>Carga registrada em</div>
          <div className="font-medium text-zinc-800">
            {formatDateTimePtBr(row.createdAt)}
          </div>
        </div>
      </header>

      <p className="text-xs text-zinc-600">
        Consulta somente leitura em <strong>{consultaEm}</strong>. Nenhuma
        alteração é possível por esta página.
      </p>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div>
          <div className="text-xs text-zinc-500">Cliente</div>
          <div className="font-medium">{row.client.name}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Cidade de destino</div>
          <div className="font-medium">{row.destinationCity}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Setor do barracão</div>
          <div className="font-mono text-lg font-semibold">{row.sector}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Status da carga</div>
          <div className="font-medium">{STATUS_PT[row.status]}</div>
        </div>
        {row.supplierOrBrand ? (
          <div className="sm:col-span-2">
            <div className="text-xs text-zinc-500">Fornecedor / marca</div>
            <div className="font-medium">{row.supplierOrBrand}</div>
          </div>
        ) : null}
      </section>

      {row.notes ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Observação
          </div>
          <p className="mt-1">{row.notes}</p>
        </section>
      ) : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500">NFs (notas fiscais)</div>
        <p className="font-mono text-sm">
          {row.invoices.length > 0
            ? row.invoices.map((i) => i.number).join(" · ")
            : "—"}
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-medium">Produtos</div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="py-2 pr-2">Produto</th>
              <th className="py-2 pr-2">Qtd</th>
              <th className="py-2">Un.</th>
            </tr>
          </thead>
          <tbody>
            {row.lines.map((l) => (
              <tr
                key={`${l.product.name}-${l.unit}-${l.quantity}`}
                className="border-b border-zinc-100"
              >
                <td className="py-2 pr-2">{l.product.name}</td>
                <td className="py-2 pr-2 tabular-nums">{l.quantity}</td>
                <td className="py-2">{l.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="pt-2 text-center text-[11px] text-zinc-400">
        Esta página é somente leitura. Para alterar dados, acesse o sistema
        interno.
      </footer>
    </div>
  );
}
