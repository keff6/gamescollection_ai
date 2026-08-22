import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ConsolesGrid } from "@/components/consoles/ConsolesGrid";
import type { ConsoleFilterType } from "@/components/consoles/ConsoleFilterTabs";
import { getAllBrands } from "@/lib/brands";
import { getBrandConsoles } from "@/lib/consoles";

function parseFilterType(raw: string | string[] | undefined): ConsoleFilterType {
  return raw === "home" || raw === "portable" ? raw : "all";
}

export default async function BrandConsolesPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { brandId } = await params;
  const { type } = await searchParams;
  const filter = parseFilterType(type);
  const isLoggedIn = !!(await auth());

  let data;
  try {
    data = await getBrandConsoles(brandId);
  } catch (error) {
    console.error("Failed to load consoles:", error);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Consoles unavailable
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading this brand. Try refreshing the page.
        </p>
      </div>
    );
  }

  if (!data) notFound();

  const brands = isLoggedIn ? await getAllBrands() : [];

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        segments={[
          { label: "Brands", href: "/brands" },
          { label: "Consoles" },
        ]}
      />

      <ConsolesGrid
        brand={data.brand}
        brands={brands}
        initialConsoles={data.consoles}
        filter={filter}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
