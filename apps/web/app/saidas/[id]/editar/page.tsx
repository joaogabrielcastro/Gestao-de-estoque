import { notFound } from "next/navigation";
import { SaidaForm } from "@/components/SaidaForm";
import { api } from "@/lib/api";

export const metadata = {
  title: "Editar saída — Gestão de estoque",
};

type Outbound = {
  id: string;
  clientId: string;
  exitInvoiceNumber: string;
  withdrawalDate: string;
  pickedUpBy: string;
  destination: string;
  notes: string | null;
  lines: Array<{
    productId: string;
    quantity: string;
    unit: "UN" | "CX" | "PAL";
    sector: "A" | "B" | "C" | "D";
  }>;
};

export default async function EditarSaidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let row: Outbound;
  try {
    row = await api<Outbound>(`/outbounds/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Editar saída de carga</h1>
      <SaidaForm
        mode="edit"
        outboundId={id}
        initial={{
          clientId: row.clientId,
          exitInvoiceNumber: row.exitInvoiceNumber,
          withdrawalDateIso: row.withdrawalDate,
          pickedUpBy: row.pickedUpBy,
          destination: row.destination,
          notes: row.notes,
          lines: row.lines.map((l) => ({
            productId: l.productId,
            quantity: String(l.quantity),
            unit: l.unit,
            sector: l.sector,
          })),
        }}
      />
    </div>
  );
}
