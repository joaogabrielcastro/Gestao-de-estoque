export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Monta o payload paginado padrão a partir dos parâmetros e total já consultado. */
export function paginated<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
