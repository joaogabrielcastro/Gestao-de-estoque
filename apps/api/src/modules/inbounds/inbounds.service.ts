import { LoadStatus, Prisma } from "@prisma/client";
import { createInboundSchema, updateInboundStatusSchema } from "@gestao/shared";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { conflict, notFound } from "../../lib/http-error";
import { paginated } from "../../lib/pagination";
import { assertPositiveQty } from "../../domain/stock-policy";
import {
  assertNoDuplicateInvoiceNumbers,
  normalizeInvoiceNumber,
  sanitizeInvoiceNumbers,
} from "../../domain/invoice-policy";
import { assertNoNegativeBalances, uniqueKeys } from "../../services/stock.service";
import * as inboundRepo from "./inbounds.repository";

const DUPLICATE_INVOICE_MSG =
  "Uma ou mais NFs informadas já estão registradas para este cliente.";

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

      return inbound;
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw conflict(DUPLICATE_INVOICE_MSG, "DUPLICATE_INVOICE");
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

  return paginated(items, f.page, f.pageSize, total);
}

export async function updateInboundStatus(id: string, body: unknown) {
  const data = updateInboundStatusSchema.parse(body);
  return inboundRepo.updateInboundStatus(id, data.status);
}

export async function getInboundById(id: string) {
  return inboundRepo.findInboundById(id);
}

/**
 * Sempre deleta — não falha por "saldo insuficiente". Apagar os movimentos da
 * entrada já reflete a devolução no saldo derivado. Se isso deixar alguma
 * posição com saldo < 0 (porque parte já saiu via Outbound), o snapshot vai
 * filtrar (> 0) e o time corrige no fluxo normal de operação.
 */
export async function deleteInbound(id: string) {
  const existing = await inboundRepo.findInboundWithLines(id);
  if (!existing) throw notFound("Entrada não encontrada");

  await prisma.$transaction(async (tx) => {
    await inboundRepo.deleteInboundMovements(id, tx);
    await inboundRepo.deleteInboundById(id, tx);
  });
}

export async function replaceInbound(id: string, body: unknown) {
  const data = createInboundSchema.parse(body);
  const occurredAt = new Date();

  const existing = await inboundRepo.findInboundWithLines(id);
  if (!existing) throw notFound("Entrada não encontrada");

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

  const oldKeys = uniqueKeys(
    existing.lines.map((line) => ({
      clientId: existing.clientId,
      productId: line.productId,
      sector: existing.sector,
      unit: line.unit,
    }))
  );
  const newKeys = uniqueKeys(
    lineDecimals.map((line) => ({
      clientId: data.clientId,
      productId: line.productId,
      sector: data.sector,
      unit: line.unit,
    }))
  );
  const affectedKeys = uniqueKeys([...oldKeys, ...newKeys]);

  try {
    return await prisma.$transaction(async (tx) => {
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

      // Se a edição reduziu/moveu produtos e parte já saiu via Outbound,
      // alguma posição afetada pode ter ficado negativa: nesse caso aborta tudo.
      await assertNoNegativeBalances(tx, affectedKeys);

      return inbound;
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw conflict(DUPLICATE_INVOICE_MSG, "DUPLICATE_INVOICE");
    }
    throw err;
  }
}
