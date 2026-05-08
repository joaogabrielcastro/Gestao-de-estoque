import { Prisma } from "@prisma/client";
import { createOutboundSchema } from "@gestao/shared";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { notFound } from "../../lib/http-error";
import { paginated } from "../../lib/pagination";
import { assertPositiveQty } from "../../domain/stock-policy";
import {
  aggregateDeltas,
  assertEnoughStock,
} from "../../services/stock.service";
import * as outboundRepo from "./outbounds.repository";

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
    await assertEnoughStock(tx, outboundDeltas);

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

  return paginated(items, f.page, f.pageSize, total);
}

export async function getOutboundById(id: string) {
  return outboundRepo.findOutboundById(id);
}

/**
 * Sempre deleta — apagar os movimentos da saída devolve naturalmente o estoque
 * (o saldo é derivado de StockMovement). Antes precisávamos de uma chamada
 * `incrementBalances` separada, agora isso some.
 */
export async function deleteOutbound(id: string) {
  const existing = await outboundRepo.findOutboundWithLines(id);
  if (!existing) throw notFound("Saída não encontrada");

  await prisma.$transaction(async (tx) => {
    await outboundRepo.deleteOutboundMovements(id, tx);
    await outboundRepo.deleteOutboundById(id, tx);
  });
}

export async function replaceOutbound(id: string, body: unknown) {
  const data = createOutboundSchema.parse(body);

  const existing = await outboundRepo.findOutboundWithLines(id);
  if (!existing) throw notFound("Saída não encontrada");

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
    // Apaga movimentos antigos: o saldo dentro da transação reflete a "devolução".
    await outboundRepo.deleteOutboundMovements(id, tx);
    await outboundRepo.deleteOutboundLines(id, tx);

    // Agora valida que o saldo pós-devolução cobre os novos deltas.
    const outboundDeltas = aggregateDeltas(
      lineDecimals.map((line) => ({
        clientId: data.clientId,
        productId: line.productId,
        sector: line.sector,
        unit: line.unit,
        quantity: line.quantity,
      }))
    );
    await assertEnoughStock(tx, outboundDeltas);

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
