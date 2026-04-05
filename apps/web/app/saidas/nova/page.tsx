import { SaidaForm } from "@/components/SaidaForm";

export const metadata = {
  title: "Nova saída — Gestão de estoque",
};

export default function NovaSaidaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Nova saída de carga
      </h1>
      <SaidaForm />
    </div>
  );
}
