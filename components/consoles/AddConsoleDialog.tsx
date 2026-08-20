"use client";

import { PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
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

export function AddConsoleDialog() {
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: wire up the create mutation once auth exists (see 11-consoles-crud.md)
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Add Console
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Console</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="console-name">Name *</Label>
            <Input id="console-name" name="name" placeholder="e.g. Xbox 360" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="console-year">Year</Label>
            <Input id="console-year" name="year" placeholder="e.g. 2005" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="console-generation">Generation</Label>
            <Input
              id="console-generation"
              name="generation"
              placeholder="e.g. 7th (128 bits)"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
