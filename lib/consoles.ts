import { db } from "@/lib/prisma";

export interface ConsoleWithGameCount {
  id: string;
  name: string;
  year: string | null;
  generation: string | null;
  isPortable: boolean;
  gameCount: number;
}

export interface BrandConsolesData {
  brand: { id: string; name: string };
  consoles: ConsoleWithGameCount[];
}

export async function getBrandConsoles(
  brandId: string
): Promise<BrandConsolesData | null> {
  const [brand, consoles] = await Promise.all([
    db.brand.findUnique({ where: { id: brandId }, select: { id: true, name: true } }),
    db.console.findMany({
      where: { brandId },
      include: { _count: { select: { games: true } } },
    }),
  ]);

  if (!brand) return null;

  const parseYear = (year: string | null) => {
    const parsed = parseInt(year ?? "", 10);
    return Number.isNaN(parsed) ? Infinity : parsed;
  };

  return {
    brand,
    consoles: consoles
      .map((consoleItem) => ({
        id: consoleItem.id,
        name: consoleItem.name,
        year: consoleItem.year,
        generation: consoleItem.generation,
        isPortable: consoleItem.isPortable ?? false,
        gameCount: consoleItem._count.games,
      }))
      .sort((a, b) => parseYear(a.year) - parseYear(b.year)),
  };
}
