"use client";

import { PlusIcon } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { createBrandAction, updateBrandAction } from "@/app/brands/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrandWithConsoleCount } from "@/lib/brands";

export interface BrandFormValues {
  id: string;
  name: string;
  origin: string | null;
}

const DEFAULT_VALUES = { name: "", origin: "" };

export function BrandFormDialog({
  brand,
  trigger,
  onSuccess,
}: {
  brand?: BrandFormValues;
  trigger?: ReactNode;
  onSuccess: (brand: BrandWithConsoleCount) => void;
}) {
  const isEdit = brand !== undefined;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(brand?.name ?? DEFAULT_VALUES.name);
  const [origin, setOrigin] = useState(brand?.origin ?? DEFAULT_VALUES.origin);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(brand?.name ?? DEFAULT_VALUES.name);
      setOrigin(brand?.origin ?? DEFAULT_VALUES.origin);
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setIsSaving(true);
    const result = isEdit
      ? await updateBrandAction(brand.id, name, origin)
      : await createBrandAction(name, origin);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess(result.data);
    toast.success(isEdit ? "Brand updated" : "Brand added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon />
            Add Brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Brand" : "Add Brand"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-name">Name *</Label>
            <Input
              id="brand-name"
              name="name"
              placeholder="e.g. Nintendo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-origin">Origin</Label>
            <Input
              id="brand-origin"
              name="origin"
              placeholder="e.g. Japan"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              maxLength={30}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
