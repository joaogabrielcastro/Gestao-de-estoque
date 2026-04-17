import { PackUnit, Prisma, Sector } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function getBalance(
  clientId: string,
  productId: string,
  sector: Sector,
  unit: PackUnit
): Promise<Prisma.Decimal> {
  const row = await prisma.stockBalance.findUnique({
    where: {
      clientId_productId_sector_unit: { clientId, productId, sector, unit },
    },
    select: { quantity: true },
  });
  return row?.quantity ?? new Prisma.Decimal(0);
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
        `Estoque insuficiente para produto ${line.productId} no setor ${line.sector} (${line.unit}). Disponível ${balance.toString()} | Solicitado ${line.quantity.toString()}`
      );
      (err as { status?: number; code?: string }).status = 409;
      (err as { status?: number; code?: string }).code = "INSUFFICIENT_STOCK";
      throw err;
    }
  }
}
