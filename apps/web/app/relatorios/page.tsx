import { apiUrl } from "@/lib/api";

export const metadata = {
  title: "Relatórios — Gestão de estoque",
};

const downloads = [
  { href: "/reports/stock.csv", label: "Estoque atual" },
  { href: "/reports/movements.csv", label: "Movimentação de estoque" },
  { href: "/reports/stock-by-client.csv", label: "Estoque por cliente" },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Relatórios (CSV)
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Os arquivos são gerados pela API. Certifique-se de que ela está em
        execução.
      </p>
      <ul className="space-y-3 text-sm">
        {downloads.map((d) => (
          <li key={d.href}>
            <a
              href={apiUrl(d.href)}
              className="text-zinc-900 underline hover:no-underline dark:text-zinc-100"
            >
              {d.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
