import { z } from "zod";

export const sectorSchema = z.enum(["A", "B", "C", "D"]);
export const packUnitSchema = z.enum(["UN", "CX", "PAL"]);

export const createClientSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
});

export const inboundLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.union([z.string(), z.number()]).transform((v) => String(v)),
  unit: packUnitSchema,
});

export const createInboundSchema = z.object({
  clientId: z.string().uuid(),
  destinationCity: z.string().min(1),
  supplierOrBrand: z.string().optional(),
  sector: sectorSchema,
  invoiceNumbers: z.array(z.string().min(1)).min(1, "Informe ao menos uma NF"),
  lines: z.array(inboundLineSchema).min(1, "Informe ao menos um produto"),
});

export const outboundLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.union([z.string(), z.number()]).transform((v) => String(v)),
  unit: packUnitSchema,
  sector: sectorSchema,
});

export const createOutboundSchema = z.object({
  clientId: z.string().uuid(),
  exitInvoiceNumber: z.string().min(1),
  withdrawalDate: z.coerce.date(),
  pickedUpBy: z.string().min(1),
  destination: z.string().min(1),
  lines: z.array(outboundLineSchema).min(1),
});
