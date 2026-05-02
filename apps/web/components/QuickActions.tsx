import Link from "next/link";

const btnPrimary =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700";
const btnOutline =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50";

export function QuickActions() {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-sm"
      role="navigation"
      aria-label="Atalhos do dia a dia"
    >
      <span className="w-full text-xs font-medium uppercase tracking-wide text-zinc-500 sm:w-auto sm:self-center">
        Atalhos
      </span>
      <Link href="/entradas/nova" className={btnPrimary}>
        Nova entrada de carga
      </Link>
      <Link href="/saidas/nova" className={btnOutline}>
        Nova retirada (saída)
      </Link>
      <Link href="/estoque" className={btnOutline}>
        Estoque
      </Link>
      <Link href="/movimentacoes" className={btnOutline}>
        Movimentações
      </Link>
    </div>
  );
}
