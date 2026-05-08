import Link from "next/link";

type Props = {
  /** URL base sem query (ex.: "/entradas"). */
  basePath: string;
  /** Demais filtros já presentes na URL — os links de paginação preservam tudo. */
  query: URLSearchParams;
  page: number;
  totalPages: number;
  total: number;
};

/** Componente único de paginação para todas as listagens. */
export function Pagination({ basePath, query, page, totalPages, total }: Props) {
  if (totalPages <= 1) return null;

  const buildHref = (nextPage: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(nextPage));
    return `${basePath}?${next.toString()}`;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        className={`rounded border px-3 py-1 ${
          prevDisabled ? "pointer-events-none opacity-50" : ""
        }`}
        aria-disabled={prevDisabled}
      >
        Anterior
      </Link>
      <span>
        Página {page} de {totalPages} ({total} itens)
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={`rounded border px-3 py-1 ${
          nextDisabled ? "pointer-events-none opacity-50" : ""
        }`}
        aria-disabled={nextDisabled}
      >
        Próxima
      </Link>
    </div>
  );
}
