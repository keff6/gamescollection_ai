"use client";

import { PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { GenreOption } from "@/lib/genres";

type MediaStatus = "incomplete" | "complete" | "new" | "digital";
type OwnedStatus = "owned" | "wishlist";

export interface GameFormValues {
  title: string;
  genreIds: string[];
  ownedStatus: OwnedStatus;
  mediaStatus: MediaStatus;
  isBacklog: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  year: string;
  rating: string;
  developer: string;
  publisher: string;
  notes: string;
}

const DEFAULT_VALUES: GameFormValues = {
  title: "",
  genreIds: [],
  ownedStatus: "owned",
  mediaStatus: "incomplete",
  isBacklog: false,
  isPlaying: false,
  isFinished: false,
  year: "",
  rating: "",
  developer: "",
  publisher: "",
  notes: "",
};

const YEAR_PATTERN = /^\d{4}$/;

export function GameFormDialog({
  genres,
  game,
  trigger,
}: {
  genres: GenreOption[];
  game?: GameFormValues;
  trigger?: React.ReactNode;
}) {
  const isEdit = game !== undefined;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<GameFormValues>(game ?? DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(game ?? DEFAULT_VALUES);
      setError(null);
    }
  }

  function toggleGenre(genreId: string) {
    setValues((current) => ({
      ...current,
      genreIds: current.genreIds.includes(genreId)
        ? current.genreIds.filter((id) => id !== genreId)
        : [...current.genreIds, genreId],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (values.genreIds.length === 0) {
      setError("Select at least one genre.");
      return;
    }
    if (values.year && !YEAR_PATTERN.test(values.year)) {
      setError("Release year must be a 4-digit year, e.g. 1998.");
      return;
    }
    if (values.rating) {
      const rating = Number(values.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        setError("Rating must be a whole number between 1 and 10.");
        return;
      }
    }

    setError(null);
    // TODO: wire up the create/update mutation once auth exists (see 12-games-crud.md)
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon />
            Add Game
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Game" : "Add Game"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-title">Title *</Label>
            <Input
              id="game-title"
              name="title"
              placeholder="e.g. Pokémon Red"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Genre *</Label>
            <div className="flex flex-col gap-2 rounded-lg border border-input p-2.5">
              {genres.map((genre) => (
                <label
                  key={genre.id}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={values.genreIds.includes(genre.id)}
                    onCheckedChange={() => toggleGenre(genre.id)}
                  />
                  {genre.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <RadioGroup
              value={values.ownedStatus}
              onValueChange={(value) =>
                setValues((current) => ({
                  ...current,
                  ownedStatus: value as OwnedStatus,
                }))
              }
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="owned" />
                Owned
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="wishlist" />
                Wishlist
              </label>
            </RadioGroup>
          </div>

          {values.ownedStatus === "owned" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Game media status</Label>
                <RadioGroup
                  value={values.mediaStatus}
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      mediaStatus: value as MediaStatus,
                    }))
                  }
                  className="flex flex-col gap-2"
                >
                  {(
                    [
                      ["incomplete", "Incomplete"],
                      ["complete", "Complete (CIB)"],
                      ["new", "New"],
                      ["digital", "Digital"],
                    ] as [MediaStatus, string][]
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <RadioGroupItem value={value} />
                      {label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Game playable status</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={values.isBacklog}
                      onCheckedChange={(checked) =>
                        setValues((current) => ({
                          ...current,
                          isBacklog: checked === true,
                        }))
                      }
                    />
                    Is on Backlog
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={values.isPlaying}
                      onCheckedChange={(checked) =>
                        setValues((current) => ({
                          ...current,
                          isPlaying: checked === true,
                        }))
                      }
                    />
                    Currently Playing
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={values.isFinished}
                      onCheckedChange={(checked) =>
                        setValues((current) => ({
                          ...current,
                          isFinished: checked === true,
                        }))
                      }
                    />
                    Finished
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="game-year">Release Year</Label>
              <Input
                id="game-year"
                name="year"
                placeholder="1998"
                value={values.year}
                onChange={(event) =>
                  setValues((current) => ({ ...current, year: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="game-rating">Rating (1-10)</Label>
              <Input
                id="game-rating"
                name="rating"
                type="number"
                min={1}
                max={10}
                placeholder="8"
                value={values.rating}
                onChange={(event) =>
                  setValues((current) => ({ ...current, rating: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-developer">Developer</Label>
            <Input
              id="game-developer"
              name="developer"
              placeholder="e.g. Nintendo"
              value={values.developer}
              onChange={(event) =>
                setValues((current) => ({ ...current, developer: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-publisher">Publisher</Label>
            <Input
              id="game-publisher"
              name="publisher"
              placeholder="e.g. Nintendo"
              value={values.publisher}
              onChange={(event) =>
                setValues((current) => ({ ...current, publisher: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-notes">Notes</Label>
            <Textarea
              id="game-notes"
              name="notes"
              placeholder="Personal notes about this game..."
              value={values.notes}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
