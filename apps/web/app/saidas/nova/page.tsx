import { SaidaForm } from "@/components/SaidaForm";

export const metadata = {
  title: "Nova saída — Gestão de estoque",
};

export default function NovaSaidaPage() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Nova saída de carga</h1>
      <SaidaForm />
    </div>
  );
}
