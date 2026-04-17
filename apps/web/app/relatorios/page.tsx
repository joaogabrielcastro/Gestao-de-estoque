import { apiUrl } from "@/lib/api";

export const metadata = {
  title: "Relatórios — Gestão de estoque",
};

const downloads = [
  {
    href: "/reports/stock.csv",
    label: "Estoque atual",
    description: "Saldo atual por cliente, produto, setor e unidade.",
  },
  {
    href: "/reports/movements.csv",
    label: "Movimentação de estoque",
    description: "Histórico de entradas e saídas com data e referência.",
  },
  {
    href: "/reports/stock-by-client.csv",
    label: "Estoque por cliente",
    description: "Resumo do estoque agrupado por cliente.",
  },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Relatórios (CSV)</h1>
      <p className="text-sm text-zinc-600">
        Baixe os arquivos para compartilhar com o cliente e apoiar a apresentação do piloto.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {downloads.map((d) => (
          <article
            key={d.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-base font-semibold text-zinc-900">{d.label}</h2>
            <p className="mt-2 min-h-10 text-sm text-zinc-700">{d.description}</p>
            <a
              href={apiUrl(d.href)}
              className="mt-4 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Baixar CSV
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
