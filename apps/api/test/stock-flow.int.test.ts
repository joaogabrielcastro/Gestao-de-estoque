/**
 * Requer Postgres dedicado: exporte TEST_DATABASE_URL antes de rodar.
 * Ex.: TEST_DATABASE_URL="postgresql://gestao:gestao@localhost:5432/gestao_estoque_test?schema=public"
 * Depois: npm run db:push && npm run test -w @gestao/api
 */
import { PackUnit, Sector } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createInbound } from "../src/services/inbound.service";
import { createOutbound } from "../src/services/outbound.service";

const RUN = Boolean(process.env.TEST_DATABASE_URL);

async function resetDb() {
  await prisma.stockBalance.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.outboundLine.deleteMany();
  await prisma.outbound.deleteMany();
  await prisma.inboundLine.deleteMany();
  await prisma.inboundInvoice.deleteMany();
  await prisma.inbound.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
}

describe.skipIf(!RUN)("integração: estoque e NFs", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("bloqueia NF de entrada duplicada para o mesmo cliente", async () => {
    const client = await prisma.client.create({ data: { name: "Cliente Teste NF" } });
    const product = await prisma.product.create({ data: { name: "Produto Teste NF" } });

    await createInbound({
      clientId: client.id,
      destinationCity: "X",
      sector: Sector.A,
      invoiceNumbers: ["999001"],
      lines: [{ productId: product.id, quantity: "1", unit: PackUnit.UN }],
    });

    await expect(
      createInbound({
        clientId: client.id,
        destinationCity: "Y",
        sector: Sector.B,
        invoiceNumbers: ["999001"],
        lines: [{ productId: product.id, quantity: "1", unit: PackUnit.UN }],
      })
    ).rejects.toThrow(/já está registrada/);
  });

  it("entrada gera saldo e bloqueia saída acima do disponível", async () => {
    const client = await prisma.client.create({ data: { name: "Cliente Teste Saldo" } });
    const product = await prisma.product.create({ data: { name: "Produto Teste Saldo" } });

    await createInbound({
      clientId: client.id,
      destinationCity: "Campinas",
      sector: Sector.A,
      invoiceNumbers: ["888001"],
      lines: [{ productId: product.id, quantity: "10", unit: PackUnit.CX }],
    });

    await expect(
      createOutbound({
        clientId: client.id,
        exitInvoiceNumber: "S-NO",
        withdrawalDate: new Date().toISOString(),
        pickedUpBy: "Motorista",
        destination: "SP",
        lines: [
          {
            productId: product.id,
            quantity: "11",
            unit: PackUnit.CX,
            sector: Sector.A,
          },
        ],
      })
    ).rejects.toThrow(/Estoque insuficiente/);

    await expect(
      createOutbound({
        clientId: client.id,
        exitInvoiceNumber: "S-OK",
        withdrawalDate: new Date().toISOString(),
        pickedUpBy: "Motorista",
        destination: "SP",
        lines: [
          {
            productId: product.id,
            quantity: "10",
            unit: PackUnit.CX,
            sector: Sector.A,
          },
        ],
      })
    ).resolves.toMatchObject({ exitInvoiceNumber: "S-OK" });
  });
});
