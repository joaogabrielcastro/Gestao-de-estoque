import { MovementType, Prisma } from "@prisma/client";
import { createOutboundSchema } from "../schemas";
import { prisma } from "../lib/prisma";
import { assertOutboundLinesAvailable } from "./stock.service";

function assertPositiveQty(q: Prisma.Decimal, label: string) {
  if (q.lte(0)) {
    const err = new Error(`Quantidade deve ser maior que zero (${label})`);
    (err as { status?: number }).status = 400;
    throw err;
  }
}

export async function createOutbound(body: unknown) {
  const data = createOutboundSchema.parse(body);

  const lineDecimals = data.lines.map((line) => {
    const quantity = new Prisma.Decimal(line.quantity);
    assertPositiveQty(quantity, line.productId);
    return {
      productId: line.productId,
      quantity,
      unit: line.unit,
      sector: line.sector,
    };
  });

  await assertOutboundLinesAvailable(data.clientId, lineDecimals);

  return prisma.$transaction(async (tx) => {
    const outbound = await tx.outbound.create({
      data: {
        clientId: data.clientId,
        exitInvoiceNumber: data.exitInvoiceNumber,
        withdrawalDate: data.withdrawalDate,
        pickedUpBy: data.pickedUpBy,
        destination: data.destination,
        lines: {
          create: lineDecimals.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unit: l.unit,
            sector: l.sector,
          })),
        },
      },
      include: {
        lines: { include: { product: true } },
        client: true,
      },
    });

    for (const line of outbound.lines) {
      await tx.stockMovement.create({
        data: {
          occurredAt: data.withdrawalDate,
          type: MovementType.SAIDA,
          clientId: data.clientId,
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
          sector: line.sector,
          referenceType: "OUTBOUND",
          referenceId: outbound.id,
        },
      });
    }

    return outbound;
  });
}

export async function listOutbounds() {
  return prisma.outbound.findMany({
    orderBy: { withdrawalDate: "desc" },
    include: {
      client: true,
      lines: { include: { product: true } },
    },
  });
}

export async function getOutboundById(id: string) {
  return prisma.outbound.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { include: { product: true } },
    },
  });
}
