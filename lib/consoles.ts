import { db } from "@/lib/prisma";
import {
  consoleBrandIdSchema,
  consoleGenerationSchema,
  consoleNameSchema,
  consoleShortNameSchema,
  consoleYearSchema,
  sortConsolesByYear,
  type ConsoleOption,
} from "@/lib/console-utils";

export type ConsoleWithGameCount = ConsoleOption;

export interface BrandConsolesData {
  brand: { id: string; name: string };
  consoles: ConsoleWithGameCount[];
}

function toConsoleWithGameCount(consoleItem: {
  id: string;
  name: string;
  shortName: string;
  brandId: string;
  year: string | null;
  generation: string | null;
  isPortable: boolean | null;
  _count: { games: number };
}): ConsoleWithGameCount {
  return {
    id: consoleItem.id,
    name: consoleItem.name,
    shortName: consoleItem.shortName,
    brandId: consoleItem.brandId,
    year: consoleItem.year,
    generation: consoleItem.generation,
    isPortable: consoleItem.isPortable ?? false,
    gameCount: consoleItem._count.games,
  };
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

  return {
    brand,
    consoles: sortConsolesByYear(consoles.map(toConsoleWithGameCount)),
  };
}

export async function createConsole(
  brandId: string,
  input: {
    name: string;
    shortName: string;
    year?: string;
    generation?: string;
    isPortable: boolean;
  }
): Promise<ConsoleWithGameCount> {
  const name = consoleNameSchema.parse(input.name);
  const shortName = consoleShortNameSchema.parse(input.shortName);
  const year = consoleYearSchema.parse(input.year);
  const generation = consoleGenerationSchema.parse(input.generation);
  const validBrandId = consoleBrandIdSchema.parse(brandId);

  const brand = await db.brand.findUnique({ where: { id: validBrandId } });
  if (!brand) {
    throw new Error("Selected brand doesn't exist");
  }

  const consoleItem = await db.console.create({
    data: {
      name,
      shortName,
      brandId: validBrandId,
      year: year ?? null,
      generation: generation ?? null,
      isPortable: input.isPortable,
    },
    include: { _count: { select: { games: true } } },
  });

  return toConsoleWithGameCount(consoleItem);
}

export async function updateConsole(
  id: string,
  input: {
    name: string;
    shortName: string;
    brandId: string;
    year?: string;
    generation?: string;
    isPortable: boolean;
  }
): Promise<ConsoleWithGameCount> {
  const name = consoleNameSchema.parse(input.name);
  const shortName = consoleShortNameSchema.parse(input.shortName);
  const brandId = consoleBrandIdSchema.parse(input.brandId);
  const year = consoleYearSchema.parse(input.year);
  const generation = consoleGenerationSchema.parse(input.generation);

  const brand = await db.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    throw new Error("Selected brand doesn't exist");
  }

  const consoleItem = await db.console.update({
    where: { id },
    data: {
      name,
      shortName,
      brandId,
      year: year ?? null,
      generation: generation ?? null,
      isPortable: input.isPortable,
    },
    include: { _count: { select: { games: true } } },
  });

  return toConsoleWithGameCount(consoleItem);
}

export async function deleteConsole(id: string): Promise<void> {
  const consoleItem = await db.console.findUnique({
    where: { id },
    include: { _count: { select: { games: true } } },
  });

  if (!consoleItem) {
    throw new Error("Console not found");
  }

  if (consoleItem._count.games > 0) {
    throw new Error(
      `Can't delete "${consoleItem.name}" — it still has ${consoleItem._count.games} game${
        consoleItem._count.games === 1 ? "" : "s"
      }. Remove or reassign them first.`
    );
  }

  await db.console.delete({ where: { id } });
}
