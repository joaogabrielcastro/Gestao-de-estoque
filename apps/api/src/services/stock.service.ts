import { MovementType, PackUnit, Prisma, Sector } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function getBalance(
  clientId: string,
  productId: string,
  sector: Sector,
  unit: PackUnit
): Promise<Prisma.Decimal> {
  const rows = await prisma.stockMovement.findMany({
    where: { clientId, productId, sector, unit },
  });
  let sum = new Prisma.Decimal(0);
  for (const r of rows) {
    const q = new Prisma.Decimal(r.quantity);
    sum =
      r.type === MovementType.ENTRADA
        ? sum.add(q)
        : sum.sub(q);
  }
  return sum;
}

export async function assertOutboundLinesAvailable(
  clientId: string,
  lines: Array<{
    productId: string;
    quantity: Prisma.Decimal;
    unit: PackUnit;
    sector: Sector;
  }>
): Promise<void> {
  for (const line of lines) {
    const balance = await getBalance(
      clientId,
      line.productId,
      line.sector,
      line.unit
    );
    if (balance.lt(line.quantity)) {
      const err = new Error(
        `Estoque insuficiente para produto ${line.productId} no setor ${line.sector} (${line.unit}). Disponível: ${balance.toString()}, solicitado: ${line.quantity.toString()}`
      );
      (err as { status?: number }).status = 409;
      throw err;
    }
  }
}
