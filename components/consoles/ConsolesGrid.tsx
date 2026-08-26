"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteConsoleAction } from "@/app/brands/[brandId]/consoles/actions";
import { ConsoleCard } from "@/components/consoles/ConsoleCard";
import {
  ConsoleFilterTabs,
  type ConsoleFilterType,
} from "@/components/consoles/ConsoleFilterTabs";
import { ConsoleFormDialog } from "@/components/consoles/ConsoleFormDialog";
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
import type { BrandOptionListItem } from "@/lib/brands";
import { sortConsolesByYear } from "@/lib/console-utils";
import type { ConsoleWithGameCount } from "@/lib/consoles";

export function ConsolesGrid({
  brand,
  brands,
  initialConsoles,
  filter,
  isLoggedIn,
}: {
  brand: { id: string; name: string };
  brands: BrandOptionListItem[];
  initialConsoles: ConsoleWithGameCount[];
  filter: ConsoleFilterType;
  isLoggedIn: boolean;
}) {
  const [consoles, setConsoles] = useState(initialConsoles);
  const [deleteTarget, setDeleteTarget] = useState<ConsoleWithGameCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isBlocked = !!deleteTarget && deleteTarget.gameCount > 0;

  function handleCreated(consoleItem: ConsoleWithGameCount) {
    setConsoles((prev) => sortConsolesByYear([...prev, consoleItem]));
  }

  function handleUpdated(consoleItem: ConsoleWithGameCount) {
    setConsoles((prev) => {
      if (consoleItem.brandId !== brand.id) {
        return prev.filter((c) => c.id !== consoleItem.id);
      }
      return sortConsolesByYear(
        prev.map((c) => (c.id === consoleItem.id ? consoleItem : c))
      );
    });
  }

  async function confirmDelete() {
    if (!deleteTarget || isBlocked) return;
    setIsDeleting(true);
    const result = await deleteConsoleAction(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      setDeleteTarget(null);
      return;
    }

    setConsoles((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success("Console deleted");
    setDeleteTarget(null);
  }

  const filteredConsoles = consoles.filter((consoleItem) => {
    if (filter === "home") return !consoleItem.isPortable;
    if (filter === "portable") return consoleItem.isPortable;
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{brand.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {consoles.length} console{consoles.length === 1 ? "" : "s"}
          </p>
        </div>
        {isLoggedIn && (
          <ConsoleFormDialog brandId={brand.id} brands={brands} onSuccess={handleCreated} />
        )}
      </div>

      <ConsoleFilterTabs brandId={brand.id} active={filter} />

      {consoles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-divider">
          <p className="text-lg font-semibold text-foreground">No consoles yet</p>
          <p className="text-sm text-muted-foreground">
            {isLoggedIn
              ? "Add this brand's first console to start building your collection."
              : "Log in to add this brand's first console."}
          </p>
        </div>
      ) : filteredConsoles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-divider">
          <p className="text-lg font-semibold text-foreground">
            No consoles match this filter
          </p>
          <p className="text-sm text-muted-foreground">Try a different filter tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredConsoles.map((consoleItem) => (
            <ConsoleCard
              key={consoleItem.id}
              console={consoleItem}
              brandId={brand.id}
              brands={brands}
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
                ? `It still has ${deleteTarget?.gameCount} game${
                    deleteTarget && deleteTarget.gameCount === 1 ? "" : "s"
                  }. Remove or reassign them before deleting this console.`
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
