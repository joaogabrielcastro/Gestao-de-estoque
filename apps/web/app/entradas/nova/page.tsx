import { EntradaForm } from "@/components/EntradaForm";

export const metadata = {
  title: "Nova entrada — Gestão de estoque",
};

export default function NovaEntradaPage() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Nova entrada de carga</h1>
      <EntradaForm />
    </div>
  );
}
