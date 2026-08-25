import { AppError } from "@/lib/app-error";
import { db } from "@/lib/prisma";
import { brandNameSchema, brandOriginSchema, type BrandOption } from "@/lib/brand-utils";

export type BrandWithConsoleCount = BrandOption;

export interface BrandOptionListItem {
  id: string;
  name: string;
}

export async function getAllBrands(): Promise<BrandOptionListItem[]> {
  const brands = await db.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return brands;
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
    origin: brand.origin,
    consoleCount: brand._count.consoles,
  }));
}

export async function createBrand(input: {
  name: string;
  origin?: string;
}): Promise<BrandWithConsoleCount> {
  const name = brandNameSchema.parse(input.name);
  const origin = brandOriginSchema.parse(input.origin);

  const brand = await db.brand.create({
    data: { name, origin },
  });

  return { id: brand.id, name: brand.name, origin: brand.origin, consoleCount: 0 };
}

export async function updateBrand(
  id: string,
  input: { name: string; origin?: string }
): Promise<BrandWithConsoleCount> {
  const name = brandNameSchema.parse(input.name);
  const origin = brandOriginSchema.parse(input.origin);

  const brand = await db.brand.update({
    where: { id },
    data: { name, origin: origin ?? null },
    include: { _count: { select: { consoles: true } } },
  });

  return {
    id: brand.id,
    name: brand.name,
    origin: brand.origin,
    consoleCount: brand._count.consoles,
  };
}

export async function deleteBrand(id: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const brand = await tx.brand.findUnique({
      where: { id },
      include: { _count: { select: { consoles: true } } },
    });

    if (!brand) {
      throw new AppError("Brand not found");
    }

    if (brand._count.consoles > 0) {
      throw new AppError(
        `Can't delete "${brand.name}" — it still has ${brand._count.consoles} console${
          brand._count.consoles === 1 ? "" : "s"
        }. Remove or reassign them first.`
      );
    }

    await tx.brand.delete({ where: { id } });
  });
}
