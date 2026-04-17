import { z } from "zod";
import { prisma } from "../lib/prisma";

const schema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export async function globalSearch(query: unknown) {
  const f = schema.parse(query);
  const skip = (f.page - 1) * f.pageSize;

  const [clients, products, inbounds, outbounds] = await Promise.all([
    prisma.client.findMany({
      where: { name: { contains: f.q, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: f.pageSize,
      skip,
    }),
    prisma.product.findMany({
      where: { name: { contains: f.q, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: f.pageSize,
      skip,
    }),
    prisma.inbound.findMany({
      where: {
        OR: [
          { destinationCity: { contains: f.q, mode: "insensitive" } },
          { invoices: { some: { number: { contains: f.q, mode: "insensitive" } } } },
          { client: { name: { contains: f.q, mode: "insensitive" } } },
          { lines: { some: { product: { name: { contains: f.q, mode: "insensitive" } } } } },
        ],
      },
      include: { client: true, invoices: true },
      orderBy: { createdAt: "desc" },
      take: f.pageSize,
      skip,
    }),
    prisma.outbound.findMany({
      where: {
        OR: [
          { exitInvoiceNumber: { contains: f.q, mode: "insensitive" } },
          { destination: { contains: f.q, mode: "insensitive" } },
          { pickedUpBy: { contains: f.q, mode: "insensitive" } },
          { client: { name: { contains: f.q, mode: "insensitive" } } },
          { lines: { some: { product: { name: { contains: f.q, mode: "insensitive" } } } } },
        ],
      },
      include: { client: true },
      orderBy: { withdrawalDate: "desc" },
      take: f.pageSize,
      skip,
    }),
  ]);

  return { q: f.q, page: f.page, pageSize: f.pageSize, clients, products, inbounds, outbounds };
}
