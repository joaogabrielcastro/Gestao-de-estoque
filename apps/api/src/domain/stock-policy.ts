import { Prisma } from "@prisma/client";

export function assertPositiveQty(q: Prisma.Decimal, label: string) {
  if (q.lte(0)) {
    const err = new Error(`Quantidade deve ser maior que zero (${label})`);
    (err as { status?: number }).status = 400;
    throw err;
  }
}
