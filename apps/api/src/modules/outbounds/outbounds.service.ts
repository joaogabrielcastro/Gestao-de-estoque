import { Prisma } from "@prisma/client";
import { createOutboundSchema } from "../../schemas";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { assertPositiveQty } from "../../domain/stock-policy";
import {
  aggregateDeltas,
  decrementBalancesWithGuard,
  incrementBalances,
} from "../../repositories/stock-balance.repository";
import * as outboundRepo from "../../repositories/outbound.repository";

const outboundFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  nf: z.string().optional(),
  productId: z.string().uuid().optional(),
  q: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

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

  return prisma.$transaction(async (tx) => {
    const outboundDeltas = aggregateDeltas(
      lineDecimals.map((line) => ({
        clientId: data.clientId,
        productId: line.productId,
        sector: line.sector,
        unit: line.unit,
        quantity: line.quantity,
      }))
    );
    await decrementBalancesWithGuard(tx, outboundDeltas);

    const outbound = await outboundRepo.createOutboundWithRelations({
      tx,
      data: {
        clientId: data.clientId,
        exitInvoiceNumber: data.exitInvoiceNumber,
        withdrawalDate: data.withdrawalDate,
        pickedUpBy: data.pickedUpBy,
        destination: data.destination,
        notes: data.notes,
        lines: lineDecimals.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unit: l.unit,
          sector: l.sector,
        })),
      },
    });

    await outboundRepo.createOutboundStockMovements(
      tx,
      outbound.lines.map((line) => ({
        occurredAt: data.withdrawalDate,
        clientId: data.clientId,
        productId: line.productId,
        quantity: line.quantity,
        unit: line.unit,
        sector: line.sector,
        referenceId: outbound.id,
      }))
    );

    return outbound;
  });
}

export async function listOutbounds(filters: unknown) {
  const f = outboundFilterSchema.parse(filters);
  const dateFilter =
    f.from || f.to
      ? {
          withdrawalDate: {
            ...(f.from ? { gte: f.from } : {}),
            ...(f.to ? { lte: f.to } : {}),
          },
        }
      : {};

  const where = {
    ...(f.clientId ? { clientId: f.clientId } : {}),
    ...(f.nf
      ? {
          exitInvoiceNumber: {
            contains: f.nf,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(f.productId ? { lines: { some: { productId: f.productId } } } : {}),
    ...(f.q
      ? {
          OR: [
            { destination: { contains: f.q, mode: "insensitive" as const } },
            { pickedUpBy: { contains: f.q, mode: "insensitive" as const } },
            { client: { name: { contains: f.q, mode: "insensitive" as const } } },
            { lines: { some: { product: { name: { contains: f.q, mode: "insensitive" as const } } } } },
          ],
        }
      : {}),
    ...dateFilter,
  };

  const { items, total } = await outboundRepo.findOutboundsPage({
    where,
    page: f.page,
    pageSize: f.pageSize,
  });

  return {
    items,
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}

export async function getOutboundById(id: string) {
  return outboundRepo.findOutboundById(id);
}

export async function deleteOutbound(id: string) {
  const existing = await outboundRepo.findOutboundWithLines(id);
  if (!existing) {
    const err = new Error("Saída não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    const restoreDeltas = aggregateDeltas(
      existing.lines.map((line) => ({
        clientId: existing.clientId,
        productId: line.productId,
        sector: line.sector,
        unit: line.unit,
        quantity: new Prisma.Decimal(line.quantity),
      }))
    );
    await incrementBalances(tx, restoreDeltas);

    await outboundRepo.deleteOutboundMovements(id, tx);

    await outboundRepo.deleteOutboundById(id, tx);
  });
}

export async function replaceOutbound(id: string, body: unknown) {
  const data = createOutboundSchema.parse(body);

  const existing = await outboundRepo.findOutboundWithLines(id);
  if (!existing) {
    const err = new Error("Saída não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }

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

  return prisma.$transaction(async (tx) => {
    const restoreDeltas = aggregateDeltas(
      existing.lines.map((line) => ({
        clientId: existing.clientId,
        productId: line.productId,
        sector: line.sector,
        unit: line.unit,
        quantity: new Prisma.Decimal(line.quantity),
      }))
    );
    await incrementBalances(tx, restoreDeltas);

    await outboundRepo.deleteOutboundMovements(id, tx);

    await outboundRepo.deleteOutboundLines(id, tx);

    const outboundDeltas = aggregateDeltas(
      lineDecimals.map((line) => ({
        clientId: data.clientId,
        productId: line.productId,
        sector: line.sector,
        unit: line.unit,
        quantity: line.quantity,
      }))
    );
    await decrementBalancesWithGuard(tx, outboundDeltas);

    const outbound = await outboundRepo.updateOutboundWithRelations({
      tx,
      id,
      data: {
        clientId: data.clientId,
        exitInvoiceNumber: data.exitInvoiceNumber,
        withdrawalDate: data.withdrawalDate,
        pickedUpBy: data.pickedUpBy,
        destination: data.destination,
        notes: data.notes,
        lines: lineDecimals.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unit: l.unit,
          sector: l.sector,
        })),
      },
    });

    await outboundRepo.createOutboundStockMovements(
      tx,
      outbound.lines.map((line) => ({
        occurredAt: data.withdrawalDate,
        clientId: data.clientId,
        productId: line.productId,
        quantity: line.quantity,
        unit: line.unit,
        sector: line.sector,
        referenceId: outbound.id,
      }))
    );

    return outbound;
  });
}
