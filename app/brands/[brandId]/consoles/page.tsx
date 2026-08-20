import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AddConsoleDialog } from "@/components/consoles/AddConsoleDialog";
import { ConsoleCard } from "@/components/consoles/ConsoleCard";
import {
  ConsoleFilterTabs,
  type ConsoleFilterType,
} from "@/components/consoles/ConsoleFilterTabs";
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

  const { brand, consoles } = data;
  const filteredConsoles = consoles.filter((consoleItem) => {
    if (filter === "home") return !consoleItem.isPortable;
    if (filter === "portable") return consoleItem.isPortable;
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        segments={[
          { label: "Brands", href: "/brands" },
          { label: "Consoles" },
        ]}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{brand.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {consoles.length} console{consoles.length === 1 ? "" : "s"}
          </p>
        </div>
        {isLoggedIn && <AddConsoleDialog />}
      </div>

      <ConsoleFilterTabs brandId={brand.id} active={filter} />

      {consoles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-foreground/10">
          <p className="text-lg font-semibold text-foreground">
            No consoles yet
          </p>
          <p className="text-sm text-muted-foreground">
            {isLoggedIn
              ? "Add this brand's first console to start building your collection."
              : "Log in to add this brand's first console."}
          </p>
        </div>
      ) : filteredConsoles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-foreground/10">
          <p className="text-lg font-semibold text-foreground">
            No consoles match this filter
          </p>
          <p className="text-sm text-muted-foreground">
            Try a different filter tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredConsoles.map((consoleItem) => (
            <ConsoleCard key={consoleItem.id} console={consoleItem} />
          ))}
        </div>
      )}
    </div>
  );
}
