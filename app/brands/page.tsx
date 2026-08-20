import { auth } from "@/auth";
import { BrandCard } from "@/components/brands/BrandCard";
import { AddBrandDialog } from "@/components/brands/AddBrandDialog";
import { getBrandsWithConsoleCounts } from "@/lib/brands";

export default async function BrandsPage() {
  const isLoggedIn = !!(await auth());

  let brands;
  try {
    brands = await getBrandsWithConsoleCounts();
  } catch (error) {
    console.error("Failed to load brands:", error);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Brands unavailable
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading your collection. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pick a brand</h1>
          <p className="mt-1 text-muted-foreground">
            {brands.length} brand{brands.length === 1 ? "" : "s"} in collection
          </p>
        </div>
        {isLoggedIn && <AddBrandDialog />}
      </div>

      {brands.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-foreground/10">
          <p className="text-lg font-semibold text-foreground">
            No brands yet
          </p>
          <p className="text-sm text-muted-foreground">
            {isLoggedIn
              ? "Add your first brand to start building your collection."
              : "Log in to add your first brand."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
