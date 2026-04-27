import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

function getDb(tx?: Prisma.TransactionClient): DbClient {
  return tx ?? prisma;
}

export async function createOutboundWithRelations(params: {
  tx: Prisma.TransactionClient;
  data: {
    clientId: string;
    exitInvoiceNumber: string;
    withdrawalDate: Date;
    pickedUpBy: string;
    destination: string;
    notes?: string;
    lines: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unit: "UN" | "CX" | "PAL";
      sector: "A" | "B" | "C" | "D";
    }>;
  };
}) {
  const { tx, data } = params;
  return tx.outbound.create({
    data: {
      clientId: data.clientId,
      exitInvoiceNumber: data.exitInvoiceNumber,
      withdrawalDate: data.withdrawalDate,
      pickedUpBy: data.pickedUpBy,
      destination: data.destination,
      notes: data.notes,
      lines: {
        create: data.lines,
      },
    },
    include: {
      lines: { include: { product: true } },
      client: true,
    },
  });
}

export async function createOutboundStockMovements(
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
          type: "SAIDA",
          clientId: m.clientId,
          productId: m.productId,
          quantity: m.quantity,
          unit: m.unit,
          sector: m.sector,
          referenceType: "OUTBOUND",
          referenceId: m.referenceId,
        },
      })
    )
  );
}

export async function findOutboundsPage(params: {
  where: Prisma.OutboundWhereInput;
  page: number;
  pageSize: number;
}) {
  const { where, page, pageSize } = params;
  const [items, total] = await Promise.all([
    prisma.outbound.findMany({
      where,
      orderBy: { withdrawalDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: true,
        lines: { include: { product: true } },
      },
    }),
    prisma.outbound.count({ where }),
  ]);
  return { items, total };
}

export async function findOutboundById(id: string) {
  return prisma.outbound.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { include: { product: true } },
    },
  });
}

export async function findOutboundWithLines(id: string, tx?: Prisma.TransactionClient) {
  return getDb(tx).outbound.findUnique({
    where: { id },
    include: { lines: true },
  });
}

export async function deleteOutboundMovements(id: string, tx: Prisma.TransactionClient) {
  await tx.stockMovement.deleteMany({
    where: { referenceType: "OUTBOUND", referenceId: id },
  });
}

export async function deleteOutboundById(id: string, tx: Prisma.TransactionClient) {
  await tx.outbound.delete({ where: { id } });
}

export async function deleteOutboundLines(id: string, tx: Prisma.TransactionClient) {
  await tx.outboundLine.deleteMany({ where: { outboundId: id } });
}

export async function updateOutboundWithRelations(params: {
  tx: Prisma.TransactionClient;
  id: string;
  data: {
    clientId: string;
    exitInvoiceNumber: string;
    withdrawalDate: Date;
    pickedUpBy: string;
    destination: string;
    notes?: string;
    lines: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unit: "UN" | "CX" | "PAL";
      sector: "A" | "B" | "C" | "D";
    }>;
  };
}) {
  const { tx, id, data } = params;
  return tx.outbound.update({
    where: { id },
    data: {
      clientId: data.clientId,
      exitInvoiceNumber: data.exitInvoiceNumber,
      withdrawalDate: data.withdrawalDate,
      pickedUpBy: data.pickedUpBy,
      destination: data.destination,
      notes: data.notes,
      lines: { create: data.lines },
    },
    include: {
      lines: { include: { product: true } },
      client: true,
    },
  });
}
