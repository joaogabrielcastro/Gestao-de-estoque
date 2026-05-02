import { PackUnit, Prisma, Sector } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const dashboardFilterSchema = z.object({
  period: z.enum(["7d", "30d", "month"]).default("7d"),
});

function getFromDate(period: "7d" | "30d" | "month") {
  const now = new Date();
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function zeroUnits(): Record<PackUnit, Prisma.Decimal> {
  return {
    UN: new Prisma.Decimal(0),
    CX: new Prisma.Decimal(0),
    PAL: new Prisma.Decimal(0),
  };
}

export async function getDashboardSummary(query: unknown) {
  const f = dashboardFilterSchema.parse(query);
  const fromDate = getFromDate(f.period);

  const [
    clients,
    unitTotals,
    clientUnitRows,
    sectorUnitRows,
    movementCountInPeriod,
    clientVolumeRows,
    sectorVolumeRows,
    activeLoads,
    recentInbounds,
    recentOutbounds,
  ] = await Promise.all([
    prisma.client.findMany({ select: { id: true, name: true } }),
    prisma.stockBalance.groupBy({
      by: ["unit"],
      where: { quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
    prisma.stockBalance.groupBy({
      by: ["clientId", "unit"],
      where: { quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
    prisma.stockBalance.groupBy({
      by: ["sector", "unit"],
      where: { quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
    prisma.stockMovement.count({
      where: { occurredAt: { gte: fromDate } },
    }),
    prisma.stockMovement.groupBy({
      by: ["clientId"],
      where: { occurredAt: { gte: fromDate } },
      _sum: { quantity: true },
    }),
    prisma.stockMovement.groupBy({
      by: ["sector"],
      where: { occurredAt: { gte: fromDate } },
      _sum: { quantity: true },
    }),
    prisma.inbound.count({
      where: { status: { not: "RETIRADA" } },
    }),
    prisma.inbound.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { client: true, invoices: true },
    }),
    prisma.outbound.findMany({
      take: 10,
      orderBy: { withdrawalDate: "desc" },
      include: { client: true },
    }),
  ]);

  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const totalByUnit = zeroUnits();
  for (const row of unitTotals) {
    totalByUnit[row.unit] = row._sum.quantity ?? new Prisma.Decimal(0);
  }

  const byClient = new Map<
    string,
    { clientId: string; clientName: string; byUnit: Record<PackUnit, Prisma.Decimal> }
  >();

  for (const row of clientUnitRows) {
    const sum = row._sum.quantity ?? new Prisma.Decimal(0);
    if (!byClient.has(row.clientId)) {
      byClient.set(row.clientId, {
        clientId: row.clientId,
        clientName: clientName.get(row.clientId) ?? row.clientId,
        byUnit: zeroUnits(),
      });
    }
    const bc = byClient.get(row.clientId)!;
    bc.byUnit[row.unit] = sum;
  }

  const bySector = new Map<Sector, Record<PackUnit, Prisma.Decimal>>();
  for (const s of Object.values(Sector)) {
    bySector.set(s, zeroUnits());
  }
  for (const row of sectorUnitRows) {
    const sum = row._sum.quantity ?? new Prisma.Decimal(0);
    const bs = bySector.get(row.sector)!;
    bs[row.unit] = sum;
  }

  let topClientId: string | null = null;
  let topClientVolume = 0;
  for (const row of clientVolumeRows) {
    const vol = Number(row._sum.quantity ?? 0);
    if (vol > topClientVolume) {
      topClientVolume = vol;
      topClientId = row.clientId;
    }
  }

  let topSector: Sector | null = null;
  let topSectorVolume = 0;
  for (const row of sectorVolumeRows) {
    const vol = Number(row._sum.quantity ?? 0);
    if (vol > topSectorVolume) {
      topSectorVolume = vol;
      topSector = row.sector;
    }
  }

  const topClientName =
    (topClientId ? clientName.get(topClientId) : null) ?? "Sem dados";

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
      movementCountInPeriod,
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
