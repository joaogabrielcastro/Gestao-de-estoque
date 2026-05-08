import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { api } from "@/lib/api";
import { formatDateTimePtBr } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

const STATUS_PT: Record<
  "ARMAZENADA" | "SEPARADA" | "RETIRADA",
  string
> = {
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

async function publicAppOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

async function loadInbound(id: string): Promise<Inbound> {
  try {
    return await api<Inbound>(`/inbounds/${id}`);
  } catch {
    notFound();
  }
}

export default async function FolhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await loadInbound(id);

  const publicUrl = `${await publicAppOrigin()}/p/entradas/${row.id}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 1,
    width: 240,
    errorCorrectionLevel: "M",
  });

  const consultaEm = formatDateTimePtBr(new Date().toISOString());

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { body header { display: none !important; } body main { padding: 0 !important; max-width: none !important; } }`,
        }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-1 sm:px-0 print:max-w-none">
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <Link
            href="/entradas"
            className="text-sm text-zinc-600 underline"
          >
            ← Voltar às entradas
          </Link>
          <PrintButton />
        </div>

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
                Folha de carga
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

        <p className="text-xs text-zinc-600 print:text-[11px]">
          Consulta / impressão em <strong>{consultaEm}</strong> — use para conferência
          no barracão.
        </p>

        <section className="grid gap-4 sm:grid-cols-2">
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
            <div>
              <div className="text-xs text-zinc-500">Fornecedor / marca</div>
              <div className="font-medium">{row.supplierOrBrand}</div>
            </div>
          ) : null}
        </section>

        {row.notes ? (
          <section>
            <div className="text-xs text-zinc-500">Observação</div>
            <p className="text-sm">{row.notes}</p>
          </section>
        ) : null}

        <section>
          <div className="text-xs text-zinc-500">NFs (notas fiscais)</div>
          <p className="font-mono text-sm">
            {row.invoices.map((i) => i.number).join(" · ")}
          </p>
        </section>

        <section>
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

        <section className="flex flex-col gap-6 border-t border-zinc-200 pt-4 sm:flex-row sm:flex-wrap sm:items-start">
          <div className="w-full max-w-[280px] sm:w-auto">
            <div className="mb-1 text-xs text-zinc-500">
              QR — abre esta folha no celular
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code para esta folha de carga"
              width={240}
              height={240}
              className="h-auto w-full max-w-[240px]"
            />
          </div>
          <div className="min-w-0 max-w-md flex-1 text-xs text-zinc-600">
            <p className="break-all font-mono">{publicUrl}</p>
            <p className="mt-2">
              Esse QR abre uma página <strong>somente leitura</strong> com os dados
              desta entrada — ideal para conferência no barracão sem expor o resto
              do sistema. Use o endereço público correto em{" "}
              <code className="rounded bg-zinc-100 px-1">
                NEXT_PUBLIC_APP_URL
              </code>
              .
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
