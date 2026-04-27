import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { fetchJson } from "@/lib/api";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

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

function publicAppOrigin() {
  const u =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  return u || "http://localhost:3000";
}

async function loadInbound(id: string): Promise<Inbound> {
  try {
    return await fetchJson<Inbound>(`/inbounds/${id}`);
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

  const folhaUrl = `${publicAppOrigin()}/entradas/${row.id}/folha`;
  const qrDataUrl = await QRCode.toDataURL(folhaUrl, {
    margin: 1,
    width: 200,
    errorCorrectionLevel: "M",
  });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { body header { display: none !important; } body main { padding: 0 !important; max-width: none !important; } }`,
        }}
      />
      <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
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
            <div>Registrado em</div>
            <div className="font-medium text-zinc-800">
              {new Date(row.createdAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </header>

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
            <div className="font-medium">{row.status}</div>
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
          <div className="text-xs text-zinc-500">Notas fiscais</div>
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

        <section className="flex flex-wrap items-start gap-6 border-t border-zinc-200 pt-4">
          <div>
            <div className="mb-1 text-xs text-zinc-500">QR (abre esta folha)</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code" width={200} height={200} />
          </div>
          <div className="max-w-md text-xs text-zinc-600">
            <p className="break-all font-mono">{folhaUrl}</p>
            <p className="mt-2">
              Escaneie para abrir a mesma página no celular (use o endereço público
              da aplicação; ajuste{" "}
              <code className="rounded bg-zinc-100 px-1">
                NEXT_PUBLIC_APP_URL
              </code>{" "}
              se necessário).
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
