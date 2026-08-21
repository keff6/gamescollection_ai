"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteBrandAction } from "@/app/brands/actions";
import { BrandCard } from "@/components/brands/BrandCard";
import { BrandFormDialog } from "@/components/brands/BrandFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sortBrandsByName } from "@/lib/brand-utils";
import type { BrandWithConsoleCount } from "@/lib/brands";

export function BrandsGrid({
  initialBrands,
  isLoggedIn,
}: {
  initialBrands: BrandWithConsoleCount[];
  isLoggedIn: boolean;
}) {
  const [brands, setBrands] = useState(initialBrands);
  const [deleteTarget, setDeleteTarget] = useState<BrandWithConsoleCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isBlocked = !!deleteTarget && deleteTarget.consoleCount > 0;

  function handleCreated(brand: BrandWithConsoleCount) {
    setBrands((prev) => sortBrandsByName([...prev, brand]));
  }

  function handleUpdated(brand: BrandWithConsoleCount) {
    setBrands((prev) =>
      sortBrandsByName(prev.map((b) => (b.id === brand.id ? brand : b)))
    );
  }

  async function confirmDelete() {
    if (!deleteTarget || isBlocked) return;
    setIsDeleting(true);
    const result = await deleteBrandAction(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      setDeleteTarget(null);
      return;
    }

    setBrands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    toast.success("Brand deleted");
    setDeleteTarget(null);
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
        {isLoggedIn && <BrandFormDialog onSuccess={handleCreated} />}
      </div>

      {brands.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-foreground/10">
          <p className="text-lg font-semibold text-foreground">No brands yet</p>
          <p className="text-sm text-muted-foreground">
            {isLoggedIn
              ? "Add your first brand to start building your collection."
              : "Log in to add your first brand."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              isLoggedIn={isLoggedIn}
              onUpdated={handleUpdated}
              onDeleteClick={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBlocked
                ? `Can't delete "${deleteTarget?.name}"`
                : `Delete "${deleteTarget?.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBlocked
                ? `It still has ${deleteTarget?.consoleCount} console${
                    deleteTarget && deleteTarget.consoleCount === 1 ? "" : "s"
                  }. Remove or reassign them before deleting this brand.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {isBlocked ? "Close" : "Cancel"}
            </AlertDialogCancel>
            {!isBlocked && (
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  void confirmDelete();
                }}
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
