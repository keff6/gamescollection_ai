import { auth } from "@/auth";
import { BrandsGrid } from "@/components/brands/BrandsGrid";
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

  return <BrandsGrid initialBrands={brands} isLoggedIn={isLoggedIn} />;
}
