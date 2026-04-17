import { MovementType, PackUnit, Sector } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";
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

/** Agrega saldos a partir da tabela materializada de saldos. */
export async function computeBalances() {
  const balancesRows = await prisma.stockBalance.findMany({
    where: {
      quantity: { gt: new Prisma.Decimal(0) },
    },
  });
  const balances = new Map<BalanceKey, Prisma.Decimal>();

  for (const row of balancesRows) {
    const k = movementKey(row.clientId, row.productId, row.sector, row.unit);
    balances.set(k, new Prisma.Decimal(row.quantity));
  }

  return { balances };
}

const dashboardFilterSchema = z.object({
  period: z.enum(["7d", "30d", "month"]).default("7d"),
});

function getFromDate(period: "7d" | "30d" | "month") {
  const now = new Date();
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getDashboardSummary(query: unknown) {
  const f = dashboardFilterSchema.parse(query);
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

  const fromDate = getFromDate(f.period);
  const periodMovements = await prisma.stockMovement.findMany({
    where: { occurredAt: { gte: fromDate } },
  });
  const activeLoads = await prisma.inbound.count({
    where: { status: { not: "RETIRADA" } },
  });
  const topClientByVolumeMap = new Map<string, number>();
  const topSectorByVolumeMap = new Map<Sector, number>();

  for (const m of periodMovements) {
    const q = Number(m.quantity);
    topClientByVolumeMap.set(
      m.clientId,
      (topClientByVolumeMap.get(m.clientId) ?? 0) + q
    );
    topSectorByVolumeMap.set(
      m.sector,
      (topSectorByVolumeMap.get(m.sector) ?? 0) + q
    );
  }

  let topClientId: string | null = null;
  let topClientVolume = 0;
  for (const [clientId, volume] of topClientByVolumeMap.entries()) {
    if (volume > topClientVolume) {
      topClientVolume = volume;
      topClientId = clientId;
    }
  }

  let topSector: Sector | null = null;
  let topSectorVolume = 0;
  for (const [sector, volume] of topSectorByVolumeMap.entries()) {
    if (volume > topSectorVolume) {
      topSectorVolume = volume;
      topSector = sector;
    }
  }

  const topClientName =
    (topClientId ? clientName.get(topClientId) : null) ?? "Sem dados";

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
    period: f.period,
    periodFrom: fromDate.toISOString(),
    executive: {
      activeLoads,
      topClientByVolume: {
        clientId: topClientId,
        clientName: topClientName,
        volume: topClientVolume,
      },
      busiestSector: {
        sector: topSector,
        volume: topSectorVolume,
      },
      movementCountInPeriod: periodMovements.length,
    },
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
