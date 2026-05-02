import Link from "next/link";

export const metadata = {
  title: "Guia rápido — Gestão de estoque",
};

const steps = [
  {
    title: "1. Clientes",
    href: "/clientes",
    body: "Cadastre cada empresa ou conta que deposita carga no barracão.",
  },
  {
    title: "2. Produtos",
    href: "/produtos",
    body: "Cadastre o que entra e sai (nome único no sistema).",
  },
  {
    title: "3. Entrada de carga",
    href: "/entradas/nova",
    body: "Registre NF, setor do barracão, cidade de destino e quantidades. Gera saldo e movimentação.",
  },
  {
    title: "4. Estoque",
    href: "/estoque",
    body: "Consulte saldo por cliente, produto, setor e unidade (UN/CX/PAL). Use filtros; eles podem ser lembrados neste navegador.",
  },
  {
    title: "5. Retirada (saída)",
    href: "/saidas/nova",
    body: "Registre NF de saída, data da retirada e itens por setor de origem. O sistema bloqueia saldo negativo.",
  },
  {
    title: "6. Movimentações e relatórios",
    href: "/movimentacoes",
    body: "Histórico com data e hora. Em Relatórios, baixe CSV para o financeiro (Excel abre melhor com os arquivos gerados aqui).",
  },
];

export default function GuiaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="page-title">Guia rápido de uso</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Ordem sugerida para começar a operar no barracão. Você pode voltar a esta página pelo menu{" "}
          <strong>Guia</strong>.
        </p>
      </div>

      <ol className="space-y-5">
        {steps.map((s) => (
          <li
            key={s.title}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <h2 className="font-semibold text-zinc-900">{s.title}</h2>
            <p className="mt-2 text-sm text-zinc-700">{s.body}</p>
            <Link
              href={s.href}
              className="mt-3 inline-flex text-sm font-medium text-red-700 underline hover:no-underline"
            >
              Abrir →
            </Link>
          </li>
        ))}
      </ol>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Folha de carga e QR:</strong> em qualquer entrada, use{" "}
        <strong>Folha / QR</strong> para imprimir ou escanear no celular no barracão.
      </section>
    </div>
  );
}
