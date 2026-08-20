import { db } from "@/lib/prisma";

export interface BrandWithConsoleCount {
  id: string;
  name: string;
  consoleCount: number;
}

export async function getBrandsWithConsoleCounts(): Promise<
  BrandWithConsoleCount[]
> {
  const brands = await db.brand.findMany({
    include: { _count: { select: { consoles: true } } },
    orderBy: { name: "asc" },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    consoleCount: brand._count.consoles,
  }));
}
