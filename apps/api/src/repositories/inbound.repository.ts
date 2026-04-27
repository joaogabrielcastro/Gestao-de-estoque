import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

function getDb(tx?: Prisma.TransactionClient): DbClient {
  return tx ?? prisma;
}

export async function createInboundWithRelations(params: {
  tx: Prisma.TransactionClient;
  data: {
    clientId: string;
    destinationCity: string;
    supplierOrBrand?: string;
    notes?: string;
    sector: "A" | "B" | "C" | "D";
    invoices: Array<{ number: string; clientId: string; numberNormalized: string }>;
    lines: Array<{ productId: string; quantity: Prisma.Decimal; unit: "UN" | "CX" | "PAL" }>;
  };
}) {
  const { tx, data } = params;
  return tx.inbound.create({
    data: {
      clientId: data.clientId,
      destinationCity: data.destinationCity,
      supplierOrBrand: data.supplierOrBrand,
      notes: data.notes,
      sector: data.sector,
      invoices: { create: data.invoices },
      lines: { create: data.lines },
    },
    include: {
      invoices: true,
      lines: { include: { product: true } },
      client: true,
    },
  });
}

export async function createInboundStockMovements(
  tx: Prisma.TransactionClient,
  payload: Array<{
    occurredAt: Date;
    clientId: string;
    productId: string;
    quantity: Prisma.Decimal;
    unit: "UN" | "CX" | "PAL";
    sector: "A" | "B" | "C" | "D";
    referenceId: string;
  }>
) {
  await Promise.all(
    payload.map((m) =>
      tx.stockMovement.create({
        data: {
          occurredAt: m.occurredAt,
          type: "ENTRADA",
          clientId: m.clientId,
          productId: m.productId,
          quantity: m.quantity,
          unit: m.unit,
          sector: m.sector,
          referenceType: "INBOUND",
          referenceId: m.referenceId,
        },
      })
    )
  );
}

export async function findInboundsPage(params: {
  where: Prisma.InboundWhereInput;
  page: number;
  pageSize: number;
}) {
  const { where, page, pageSize } = params;
  const [items, total] = await Promise.all([
    prisma.inbound.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: true,
        invoices: true,
        lines: { include: { product: true } },
      },
    }),
    prisma.inbound.count({ where }),
  ]);
  return { items, total };
}

export async function updateInboundStatus(id: string, status: "ARMAZENADA" | "SEPARADA" | "RETIRADA") {
  return prisma.inbound.update({
    where: { id },
    data: { status },
  });
}

export async function findInboundById(id: string) {
  return prisma.inbound.findUnique({
    where: { id },
    include: {
      client: true,
      invoices: true,
      lines: { include: { product: true } },
    },
  });
}

export async function findInboundWithLines(id: string, tx?: Prisma.TransactionClient) {
  return getDb(tx).inbound.findUnique({
    where: { id },
    include: { lines: true },
  });
}

export async function deleteInboundMovements(id: string, tx: Prisma.TransactionClient) {
  await tx.stockMovement.deleteMany({
    where: { referenceType: "INBOUND", referenceId: id },
  });
}

export async function deleteInboundById(id: string, tx: Prisma.TransactionClient) {
  await tx.inbound.delete({ where: { id } });
}

export async function replaceInboundRelations(id: string, tx: Prisma.TransactionClient) {
  await tx.inboundLine.deleteMany({ where: { inboundId: id } });
  await tx.inboundInvoice.deleteMany({ where: { inboundId: id } });
}

export async function updateInboundWithRelations(params: {
  tx: Prisma.TransactionClient;
  id: string;
  data: {
    clientId: string;
    destinationCity: string;
    supplierOrBrand?: string;
    notes?: string;
    sector: "A" | "B" | "C" | "D";
    invoices: Array<{ number: string; clientId: string; numberNormalized: string }>;
    lines: Array<{ productId: string; quantity: Prisma.Decimal; unit: "UN" | "CX" | "PAL" }>;
  };
}) {
  const { tx, id, data } = params;
  return tx.inbound.update({
    where: { id },
    data: {
      clientId: data.clientId,
      destinationCity: data.destinationCity,
      supplierOrBrand: data.supplierOrBrand,
      notes: data.notes,
      sector: data.sector,
      invoices: { create: data.invoices },
      lines: { create: data.lines },
    },
    include: {
      invoices: true,
      lines: { include: { product: true } },
      client: true,
    },
  });
}
