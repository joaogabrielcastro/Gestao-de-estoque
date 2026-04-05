import { MovementType, Prisma } from "@prisma/client";
import { createInboundSchema } from "@gestao/shared";
import { prisma } from "../lib/prisma";

function assertPositiveQty(q: Prisma.Decimal, label: string) {
  if (q.lte(0)) {
    const err = new Error(`Quantidade deve ser maior que zero (${label})`);
    (err as { status?: number }).status = 400;
    throw err;
  }
}

export async function createInbound(body: unknown) {
  const data = createInboundSchema.parse(body);
  const occurredAt = new Date();

  return prisma.$transaction(async (tx) => {
    const inbound = await tx.inbound.create({
      data: {
        clientId: data.clientId,
        destinationCity: data.destinationCity,
        supplierOrBrand: data.supplierOrBrand,
        sector: data.sector,
        invoices: {
          create: data.invoiceNumbers.map((number) => ({ number })),
        },
        lines: {
          create: data.lines.map((line) => {
            const quantity = new Prisma.Decimal(line.quantity);
            assertPositiveQty(quantity, line.productId);
            return {
              productId: line.productId,
              quantity,
              unit: line.unit,
            };
          }),
        },
      },
      include: {
        invoices: true,
        lines: { include: { product: true } },
        client: true,
      },
    });

    for (const line of inbound.lines) {
      await tx.stockMovement.create({
        data: {
          occurredAt,
          type: MovementType.ENTRADA,
          clientId: data.clientId,
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
          sector: data.sector,
          referenceType: "INBOUND",
          referenceId: inbound.id,
        },
      });
    }

    return inbound;
  });
}

export async function listInbounds(filters: {
  clientId?: string;
  nf?: string;
  productId?: string;
}) {
  return prisma.inbound.findMany({
    where: {
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.nf
        ? { invoices: { some: { number: { contains: filters.nf, mode: "insensitive" } } } }
        : {}),
      ...(filters.productId
        ? { lines: { some: { productId: filters.productId } } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      invoices: true,
      lines: { include: { product: true } },
    },
  });
}

export async function getInboundById(id: string) {
  return prisma.inbound.findUnique({
    where: { id },
    include: {
      client: true,
      invoices: true,
      lines: { include: { product: true } },
    },
  });
}
