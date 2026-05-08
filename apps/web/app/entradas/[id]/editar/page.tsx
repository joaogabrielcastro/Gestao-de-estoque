import { notFound } from "next/navigation";
import { EntradaForm } from "@/components/EntradaForm";
import { api } from "@/lib/api";

export const metadata = {
  title: "Editar entrada — Gestão de estoque",
};

type Inbound = {
  id: string;
  clientId: string;
  destinationCity: string;
  supplierOrBrand: string | null;
  notes: string | null;
  sector: "A" | "B" | "C" | "D";
  invoices: Array<{ number: string }>;
  lines: Array<{
    productId: string;
    quantity: string;
    unit: "UN" | "CX" | "PAL";
  }>;
};

export default async function EditarEntradaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let row: Inbound;
  try {
    row = await api<Inbound>(`/inbounds/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Editar entrada de carga</h1>
      <EntradaForm
        mode="edit"
        inboundId={id}
        initial={{
          clientId: row.clientId,
          destinationCity: row.destinationCity,
          supplierOrBrand: row.supplierOrBrand,
          notes: row.notes,
          sector: row.sector,
          invoiceNumbers: row.invoices.map((i) => i.number),
          lines: row.lines.map((l) => ({
            productId: l.productId,
            quantity: String(l.quantity),
            unit: l.unit,
          })),
        }}
      />
    </div>
  );
}
