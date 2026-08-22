"use client";

import { PlusIcon } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createConsoleAction,
  updateConsoleAction,
} from "@/app/brands/[brandId]/consoles/actions";
import type { BrandOptionListItem } from "@/lib/brands";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONSOLE_GENERATIONS, getConsoleYearOptions } from "@/lib/console-utils";
import type { ConsoleWithGameCount } from "@/lib/consoles";

export interface ConsoleFormValues {
  id: string;
  name: string;
  shortName: string;
  brandId: string;
  year: string;
  generation: string;
  isPortable: boolean;
}

const YEAR_OPTIONS = getConsoleYearOptions();

function defaultValues(brandId: string): Omit<ConsoleFormValues, "id"> {
  return {
    name: "",
    shortName: "",
    brandId,
    year: "",
    generation: "",
    isPortable: false,
  };
}

export function ConsoleFormDialog({
  brandId,
  brands,
  console: consoleValues,
  trigger,
  onSuccess,
}: {
  brandId: string;
  brands: BrandOptionListItem[];
  console?: ConsoleFormValues;
  trigger?: ReactNode;
  onSuccess: (consoleItem: ConsoleWithGameCount) => void;
}) {
  const isEdit = consoleValues !== undefined;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Omit<ConsoleFormValues, "id">>(
    consoleValues ?? defaultValues(brandId)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(consoleValues ?? defaultValues(brandId));
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!values.shortName.trim()) {
      setError("Short name is required.");
      return;
    }
    if (!values.brandId) {
      setError("Brand is required.");
      return;
    }

    setIsSaving(true);
    const result = isEdit
      ? await updateConsoleAction(consoleValues.id, values)
      : await createConsoleAction(brandId, values);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess(result.data);
    toast.success(isEdit ? "Console updated" : "Console added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon />
            Add Console
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Console" : "Add Console"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="console-name">Name *</Label>
            <Input
              id="console-name"
              name="name"
              placeholder="Enter console name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              maxLength={60}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="console-short-name">Short Name *</Label>
            <Input
              id="console-short-name"
              name="shortName"
              placeholder="Enter console short name or abbreviation"
              value={values.shortName}
              onChange={(event) =>
                setValues((current) => ({ ...current, shortName: event.target.value }))
              }
              maxLength={30}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="console-brand">Brand *</Label>
            <Select
              value={values.brandId}
              onValueChange={(value) =>
                setValues((current) => ({ ...current, brandId: value }))
              }
            >
              <SelectTrigger id="console-brand" className="w-full">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="console-year">Year</Label>
              <Select
                value={values.year}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, year: value }))
                }
              >
                <SelectTrigger id="console-year" className="w-full">
                  <SelectValue placeholder="Enter console release year..." />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="console-generation">Generation</Label>
              <Select
                value={values.generation}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, generation: value }))
                }
              >
                <SelectTrigger id="console-generation" className="w-full">
                  <SelectValue placeholder="Select console generation" />
                </SelectTrigger>
                <SelectContent>
                  {CONSOLE_GENERATIONS.map((generation) => (
                    <SelectItem key={generation.value} value={generation.text}>
                      {generation.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={values.isPortable}
              onCheckedChange={(checked) =>
                setValues((current) => ({ ...current, isPortable: checked === true }))
              }
            />
            Is Portable
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isEdit ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
