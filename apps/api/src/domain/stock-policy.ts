import { Prisma } from "@prisma/client";
import { badRequest } from "../lib/http-error";

export function assertPositiveQty(q: Prisma.Decimal, label: string) {
  if (q.lte(0)) {
    throw badRequest(`Quantidade deve ser maior que zero (${label})`);
  }
}
