import {
  MovementType,
  PackUnit,
  PrismaClient,
  ReferenceType,
  Sector,
} from "@prisma/client";

const prisma = new PrismaClient();

function normalizeInvoiceNumber(value: string) {
  return value.trim().toLowerCase();
}

async function addInbound(params: {
  clientId: string;
  destinationCity: string;
  supplierOrBrand?: string;
  sector: Sector;
  invoiceNumbers: string[];
  lines: Array<{ productId: string; quantity: string; unit: PackUnit }>;
  createdAt: Date;
}) {
  const inbound = await prisma.inbound.create({
    data: {
      clientId: params.clientId,
      destinationCity: params.destinationCity,
      supplierOrBrand: params.supplierOrBrand,
      sector: params.sector,
      createdAt: params.createdAt,
      invoices: {
        create: params.invoiceNumbers.map((number) => ({
          number,
          clientId: params.clientId,
          numberNormalized: normalizeInvoiceNumber(number),
        })),
      },
      lines: {
        create: params.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
        })),
      },
    },
    include: { lines: true },
  });

  for (const line of inbound.lines) {
    await prisma.stockMovement.create({
      data: {
        occurredAt: params.createdAt,
        type: MovementType.ENTRADA,
        clientId: params.clientId,
        productId: line.productId,
        quantity: line.quantity,
        unit: line.unit,
        sector: params.sector,
        referenceType: ReferenceType.INBOUND,
        referenceId: inbound.id,
      },
    });
  }
}

async function addOutbound(params: {
  clientId: string;
  exitInvoiceNumber: string;
  withdrawalDate: Date;
  pickedUpBy: string;
  destination: string;
  lines: Array<{
    productId: string;
    quantity: string;
    unit: PackUnit;
    sector: Sector;
  }>;
}) {
  const outbound = await prisma.outbound.create({
    data: {
      clientId: params.clientId,
      exitInvoiceNumber: params.exitInvoiceNumber,
      withdrawalDate: params.withdrawalDate,
      pickedUpBy: params.pickedUpBy,
      destination: params.destination,
      lines: {
        create: params.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
          sector: line.sector,
        })),
      },
    },
    include: { lines: true },
  });

  for (const line of outbound.lines) {
    await prisma.stockMovement.create({
      data: {
        occurredAt: params.withdrawalDate,
        type: MovementType.SAIDA,
        clientId: params.clientId,
        productId: line.productId,
        quantity: line.quantity,
        unit: line.unit,
        sector: line.sector,
        referenceType: ReferenceType.OUTBOUND,
        referenceId: outbound.id,
      },
    });
  }
}

async function main() {
  await prisma.stockMovement.deleteMany();
  await prisma.outboundLine.deleteMany();
  await prisma.outbound.deleteMany();
  await prisma.inboundLine.deleteMany();
  await prisma.inboundInvoice.deleteMany();
  await prisma.inbound.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();

  const [acme, viaNorte, solar] = await Promise.all([
    prisma.client.create({ data: { name: "ACME Alimentos" } }),
    prisma.client.create({ data: { name: "Via Norte Distribuição" } }),
    prisma.client.create({ data: { name: "Solar Bebidas" } }),
  ]);

  const [arroz, feijao, refrigerante, detergente, papel] = await Promise.all([
    prisma.product.create({ data: { name: "Arroz tipo 1" } }),
    prisma.product.create({ data: { name: "Feijão preto" } }),
    prisma.product.create({ data: { name: "Refrigerante 2L" } }),
    prisma.product.create({ data: { name: "Detergente 500ml" } }),
    prisma.product.create({ data: { name: "Papel higiênico 12 rolos" } }),
  ]);

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  await addInbound({
    clientId: acme.id,
    destinationCity: "Campinas",
    supplierOrBrand: "Marca Bom Grão",
    sector: Sector.A,
    invoiceNumbers: ["45100", "45101"],
    lines: [
      { productId: arroz.id, quantity: "140", unit: PackUnit.CX },
      { productId: feijao.id, quantity: "80", unit: PackUnit.CX },
    ],
    createdAt: new Date(now.getTime() - 5 * day),
  });

  await addInbound({
    clientId: viaNorte.id,
    destinationCity: "São Paulo",
    supplierOrBrand: "Higiene Total",
    sector: Sector.B,
    invoiceNumbers: ["77810"],
    lines: [
      { productId: detergente.id, quantity: "55", unit: PackUnit.CX },
      { productId: papel.id, quantity: "24", unit: PackUnit.PAL },
    ],
    createdAt: new Date(now.getTime() - 4 * day),
  });

  await addInbound({
    clientId: solar.id,
    destinationCity: "Sorocaba",
    supplierOrBrand: "Solar",
    sector: Sector.C,
    invoiceNumbers: ["99001", "99002", "99003"],
    lines: [{ productId: refrigerante.id, quantity: "38", unit: PackUnit.PAL }],
    createdAt: new Date(now.getTime() - 3 * day),
  });

  await addInbound({
    clientId: acme.id,
    destinationCity: "Jundiaí",
    supplierOrBrand: "Marca Bom Grão",
    sector: Sector.D,
    invoiceNumbers: ["45150"],
    lines: [{ productId: arroz.id, quantity: "620", unit: PackUnit.UN }],
    createdAt: new Date(now.getTime() - 2 * day),
  });

  await addOutbound({
    clientId: acme.id,
    exitInvoiceNumber: "S-1001",
    withdrawalDate: new Date(now.getTime() - day),
    pickedUpBy: "Carlos Silva",
    destination: "Campinas",
    lines: [
      { productId: arroz.id, quantity: "20", unit: PackUnit.CX, sector: Sector.A },
      { productId: feijao.id, quantity: "10", unit: PackUnit.CX, sector: Sector.A },
    ],
  });

  await addOutbound({
    clientId: viaNorte.id,
    exitInvoiceNumber: "S-2001",
    withdrawalDate: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    pickedUpBy: "Fernanda Lima",
    destination: "São Paulo",
    lines: [{ productId: detergente.id, quantity: "5", unit: PackUnit.CX, sector: Sector.B }],
  });

  await addOutbound({
    clientId: solar.id,
    exitInvoiceNumber: "S-3001",
    withdrawalDate: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    pickedUpBy: "João Pedro",
    destination: "Sorocaba",
    lines: [{ productId: refrigerante.id, quantity: "4", unit: PackUnit.PAL, sector: Sector.C }],
  });

  console.log("Seed concluído com dados de demonstração.");
}

main()
  .catch((error) => {
    console.error("Erro no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
