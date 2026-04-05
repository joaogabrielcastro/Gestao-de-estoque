import { MovementType, PackUnit, Sector } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type BalanceKey = `${string}|${string}|${Sector}|${PackUnit}`;

function movementKey(
  clientId: string,
  productId: string,
  sector: Sector,
  unit: PackUnit
): BalanceKey {
  return `${clientId}|${productId}|${sector}|${unit}`;
}

/** Agrega saldos a partir das movimentações (piloto). */
export async function computeBalances() {
  const movements = await prisma.stockMovement.findMany();
  const balances = new Map<BalanceKey, Prisma.Decimal>();

  for (const m of movements) {
    const k = movementKey(m.clientId, m.productId, m.sector, m.unit);
    const q = new Prisma.Decimal(m.quantity);
    const prev = balances.get(k) ?? new Prisma.Decimal(0);
    const next =
      m.type === MovementType.ENTRADA ? prev.add(q) : prev.sub(q);
    balances.set(k, next);
  }

  return { movements, balances };
}

export async function getDashboardSummary() {
  const { balances } = await computeBalances();

  const totalByUnit: Record<PackUnit, Prisma.Decimal> = {
    UN: new Prisma.Decimal(0),
    CX: new Prisma.Decimal(0),
    PAL: new Prisma.Decimal(0),
  };

  const byClient = new Map<
    string,
    { clientId: string; clientName: string; byUnit: Record<PackUnit, Prisma.Decimal> }
  >();
  const bySector = new Map<
    Sector,
    Record<PackUnit, Prisma.Decimal>
  >();

  const clients = await prisma.client.findMany();
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  for (const s of Object.values(Sector)) {
    bySector.set(s, {
      UN: new Prisma.Decimal(0),
      CX: new Prisma.Decimal(0),
      PAL: new Prisma.Decimal(0),
    });
  }

  for (const [key, qty] of balances) {
    if (qty.lte(0)) continue;
    const [clientId, _productId, sectorStr, unitStr] = key.split("|") as [
      string,
      string,
      Sector,
      PackUnit
    ];
    const sector = sectorStr as Sector;
    const unit = unitStr as PackUnit;

    totalByUnit[unit] = totalByUnit[unit].add(qty);

    const cname = clientName.get(clientId) ?? clientId;
    if (!byClient.has(clientId)) {
      byClient.set(clientId, {
        clientId,
        clientName: cname,
        byUnit: {
          UN: new Prisma.Decimal(0),
          CX: new Prisma.Decimal(0),
          PAL: new Prisma.Decimal(0),
        },
      });
    }
    const bc = byClient.get(clientId)!;
    bc.byUnit[unit] = bc.byUnit[unit].add(qty);

    const bs = bySector.get(sector)!;
    bs[unit] = bs[unit].add(qty);
  }

  const recentInbounds = await prisma.inbound.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { client: true, invoices: true },
  });

  const recentOutbounds = await prisma.outbound.findMany({
    take: 10,
    orderBy: { withdrawalDate: "desc" },
    include: { client: true },
  });

  return {
    totalByUnit: {
      UN: totalByUnit.UN.toString(),
      CX: totalByUnit.CX.toString(),
      PAL: totalByUnit.PAL.toString(),
    },
    byClient: Array.from(byClient.values()).map((c) => ({
      clientId: c.clientId,
      clientName: c.clientName,
      byUnit: {
        UN: c.byUnit.UN.toString(),
        CX: c.byUnit.CX.toString(),
        PAL: c.byUnit.PAL.toString(),
      },
    })),
    bySector: Object.fromEntries(
      Array.from(bySector.entries()).map(([s, u]) => [
        s,
        { UN: u.UN.toString(), CX: u.CX.toString(), PAL: u.PAL.toString() },
      ])
    ) as Record<Sector, { UN: string; CX: string; PAL: string }>,
    recentInbounds,
    recentOutbounds,
  };
}
