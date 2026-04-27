import { LoadStatus, Prisma } from "@prisma/client";
import { createInboundSchema, updateInboundStatusSchema } from "../../schemas";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { assertPositiveQty } from "../../domain/stock-policy";
import {
  assertNoDuplicateInvoiceNumbers,
  normalizeInvoiceNumber,
  sanitizeInvoiceNumbers,
} from "../../domain/invoice-policy";
import {
  aggregateDeltas,
  decrementBalancesWithGuard,
  incrementBalances,
} from "../../repositories/stock-balance.repository";
import * as inboundRepo from "../../repositories/inbound.repository";

export async function createInbound(body: unknown) {
  const data = createInboundSchema.parse(body);
  const occurredAt = new Date();

  const invoiceNumbers = sanitizeInvoiceNumbers(data.invoiceNumbers);
  assertNoDuplicateInvoiceNumbers(invoiceNumbers);

  const lineDecimals = data.lines.map((line) => {
    const quantity = new Prisma.Decimal(line.quantity);
    assertPositiveQty(quantity, line.productId);
    return {
      productId: line.productId,
      quantity,
      unit: line.unit,
    };
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const inbound = await inboundRepo.createInboundWithRelations({
        tx,
        data: {
          clientId: data.clientId,
          destinationCity: data.destinationCity,
          supplierOrBrand: data.supplierOrBrand,
          notes: data.notes,
          sector: data.sector,
          invoices: invoiceNumbers.map((number) => ({
            number,
            clientId: data.clientId,
            numberNormalized: normalizeInvoiceNumber(number),
          })),
          lines: lineDecimals.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unit: line.unit,
          })),
        },
      });

      await inboundRepo.createInboundStockMovements(
        tx,
        inbound.lines.map((line) => ({
          occurredAt,
          clientId: data.clientId,
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
          sector: data.sector,
          referenceId: inbound.id,
        }))
      );

      const inboundDeltas = aggregateDeltas(
        inbound.lines.map((line) => ({
          clientId: data.clientId,
          productId: line.productId,
          sector: data.sector,
          unit: line.unit,
          quantity: new Prisma.Decimal(line.quantity),
        }))
      );
      await incrementBalances(tx, inboundDeltas);

      return inbound;
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      const conflict = new Error(
        "Uma ou mais NFs informadas já estão registradas para este cliente."
      );
      (conflict as { status?: number }).status = 409;
      throw conflict;
    }
    throw err;
  }
}

const inboundListFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  nf: z.string().optional(),
  productId: z.string().uuid().optional(),
  status: z.nativeEnum(LoadStatus).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export async function listInbounds(filters: unknown) {
  const f = inboundListFilterSchema.parse(filters);
  const where = {
    ...(f.clientId ? { clientId: f.clientId } : {}),
    ...(f.nf
      ? { invoices: { some: { number: { contains: f.nf, mode: "insensitive" as const } } } }
      : {}),
    ...(f.productId ? { lines: { some: { productId: f.productId } } } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.q
      ? {
          OR: [
            { destinationCity: { contains: f.q, mode: "insensitive" as const } },
            { supplierOrBrand: { contains: f.q, mode: "insensitive" as const } },
            { invoices: { some: { number: { contains: f.q, mode: "insensitive" as const } } } },
            { lines: { some: { product: { name: { contains: f.q, mode: "insensitive" as const } } } } },
            { client: { name: { contains: f.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const { items, total } = await inboundRepo.findInboundsPage({
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

export async function updateInboundStatus(id: string, body: unknown) {
  const data = updateInboundStatusSchema.parse(body);
  return inboundRepo.updateInboundStatus(id, data.status);
}

export async function getInboundById(id: string) {
  return inboundRepo.findInboundById(id);
}

export async function deleteInbound(id: string) {
  const existing = await inboundRepo.findInboundWithLines(id);
  if (!existing) {
    const err = new Error("Entrada não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    const oldDeltas = aggregateDeltas(
      existing.lines.map((line) => ({
        clientId: existing.clientId,
        productId: line.productId,
        sector: existing.sector,
        unit: line.unit,
        quantity: new Prisma.Decimal(line.quantity),
      }))
    );
    await decrementBalancesWithGuard(tx, oldDeltas);

    await inboundRepo.deleteInboundMovements(id, tx);

    await inboundRepo.deleteInboundById(id, tx);
  });
}

export async function replaceInbound(id: string, body: unknown) {
  const data = createInboundSchema.parse(body);
  const occurredAt = new Date();

  const existing = await inboundRepo.findInboundWithLines(id);
  if (!existing) {
    const err = new Error("Entrada não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }

  const invoiceNumbers = sanitizeInvoiceNumbers(data.invoiceNumbers);
  assertNoDuplicateInvoiceNumbers(invoiceNumbers);

  const lineDecimals = data.lines.map((line) => {
    const quantity = new Prisma.Decimal(line.quantity);
    assertPositiveQty(quantity, line.productId);
    return {
      productId: line.productId,
      quantity,
      unit: line.unit,
    };
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const oldDeltas = aggregateDeltas(
        existing.lines.map((line) => ({
          clientId: existing.clientId,
          productId: line.productId,
          sector: existing.sector,
          unit: line.unit,
          quantity: new Prisma.Decimal(line.quantity),
        }))
      );
      await decrementBalancesWithGuard(tx, oldDeltas);

      await inboundRepo.deleteInboundMovements(id, tx);

      await inboundRepo.replaceInboundRelations(id, tx);

      const inbound = await inboundRepo.updateInboundWithRelations({
        tx,
        id,
        data: {
          clientId: data.clientId,
          destinationCity: data.destinationCity,
          supplierOrBrand: data.supplierOrBrand,
          notes: data.notes,
          sector: data.sector,
          invoices: invoiceNumbers.map((number) => ({
            number,
            clientId: data.clientId,
            numberNormalized: normalizeInvoiceNumber(number),
          })),
          lines: lineDecimals.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unit: line.unit,
          })),
        },
      });

      await inboundRepo.createInboundStockMovements(
        tx,
        inbound.lines.map((line) => ({
          occurredAt,
          clientId: data.clientId,
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
          sector: data.sector,
          referenceId: inbound.id,
        }))
      );

      const inboundDeltas = aggregateDeltas(
        inbound.lines.map((line) => ({
          clientId: data.clientId,
          productId: line.productId,
          sector: data.sector,
          unit: line.unit,
          quantity: new Prisma.Decimal(line.quantity),
        }))
      );
      await incrementBalances(tx, inboundDeltas);

      return inbound;
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      const conflict = new Error(
        "Uma ou mais NFs informadas já estão registradas para este cliente."
      );
      (conflict as { status?: number }).status = 409;
      throw conflict;
    }
    throw err;
  }
}
