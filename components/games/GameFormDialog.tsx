"use client";

import { PlusIcon, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { createGameAction, updateGameAction } from "@/app/consoles/[consoleId]/games/actions";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getGameYearOptions,
  isDuplicateSagaTag,
  mapBooleansToMediaStatus,
  mapMediaStatusToBooleans,
  type MediaStatus,
} from "@/lib/game-utils";
import type { ConsoleOptionListItem } from "@/lib/consoles";
import type { GameListItem } from "@/lib/games";
import type { GenreOption } from "@/lib/genres";

export interface GameFormValues {
  id: string;
  title: string;
  consoleId: string;
  genreIds: string[];
  mediaStatus: MediaStatus;
  isBacklog: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  year: string;
  rating: string;
  developer: string;
  publisher: string;
  notes: string;
  saga: string[];
}

const YEAR_OPTIONS = getGameYearOptions();

function defaultValues(consoleId: string): Omit<GameFormValues, "id"> {
  return {
    title: "",
    consoleId,
    genreIds: [],
    mediaStatus: "incomplete",
    isBacklog: false,
    isPlaying: false,
    isFinished: false,
    year: "",
    rating: "",
    developer: "",
    publisher: "",
    notes: "",
    saga: [],
  };
}

export function gameToFormValues(game: GameListItem): GameFormValues {
  return {
    id: game.id,
    title: game.title,
    consoleId: game.consoleId,
    genreIds: game.genreIds,
    mediaStatus: mapBooleansToMediaStatus(game),
    isBacklog: game.isBacklog,
    isPlaying: game.isPlaying,
    isFinished: game.isFinished,
    year: game.year ?? "",
    rating: game.rating !== null ? String(game.rating) : "",
    developer: game.developer ?? "",
    publisher: game.publisher ?? "",
    notes: game.notes ?? "",
    saga: game.saga,
  };
}

export function GameFormDialog({
  consoleId,
  consoles,
  genres,
  game,
  trigger,
  onSuccess,
}: {
  consoleId: string;
  consoles: ConsoleOptionListItem[];
  genres: GenreOption[];
  game?: GameFormValues;
  trigger?: ReactNode;
  onSuccess: (game: GameListItem) => void;
}) {
  const isEdit = game !== undefined;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Omit<GameFormValues, "id">>(
    game ?? defaultValues(consoleId)
  );
  const [sagaInput, setSagaInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(game ?? defaultValues(consoleId));
      setSagaInput("");
      setError(null);
    }
  }

  function addGenre(genreId: string) {
    setValues((current) =>
      current.genreIds.includes(genreId)
        ? current
        : { ...current, genreIds: [...current.genreIds, genreId] }
    );
  }

  function removeGenre(genreId: string) {
    setValues((current) => ({
      ...current,
      genreIds: current.genreIds.filter((id) => id !== genreId),
    }));
  }

  function addSaga() {
    const trimmed = sagaInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 50) {
      setError("Saga tag must be 50 characters or fewer.");
      return;
    }
    if (isDuplicateSagaTag(values.saga, trimmed)) {
      setSagaInput("");
      return;
    }
    setValues((current) => ({ ...current, saga: [...current.saga, trimmed] }));
    setSagaInput("");
  }

  function removeSaga(tag: string) {
    setValues((current) => ({
      ...current,
      saga: current.saga.filter((existingTag) => existingTag !== tag),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!values.consoleId) {
      setError("Console is required.");
      return;
    }
    if (values.genreIds.length === 0) {
      setError("Select at least one genre.");
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

    const input = {
      title: values.title,
      consoleId: values.consoleId,
      genreIds: values.genreIds,
      year: values.year,
      rating: values.rating,
      developer: values.developer,
      publisher: values.publisher,
      notes: values.notes,
      saga: values.saga,
      ...mapMediaStatusToBooleans(values.mediaStatus),
      isBacklog: values.isBacklog,
      isPlaying: values.isPlaying,
      isFinished: values.isFinished,
    };

    setIsSaving(true);
    const result = isEdit
      ? await updateGameAction(game.id, input)
      : await createGameAction(input);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess(result.data);
    toast.success(isEdit ? "Game updated" : "Game added");
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
              placeholder="Enter game title"
              value={values.title}
              maxLength={80}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="game-console">Console *</Label>
              <Select
                value={values.consoleId}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, consoleId: value }))
                }
              >
                <SelectTrigger id="game-console" className="w-full">
                  <SelectValue placeholder="Select console" />
                </SelectTrigger>
                <SelectContent>
                  {consoles.map((consoleOption) => (
                    <SelectItem key={consoleOption.id} value={consoleOption.id}>
                      {consoleOption.name} ({consoleOption.brandName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="game-year">Year</Label>
              <Select
                value={values.year}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, year: value }))
                }
              >
                <SelectTrigger id="game-year" className="w-full">
                  <SelectValue placeholder="Enter release year (America)" />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="game-developer">Developer</Label>
              <Input
                id="game-developer"
                name="developer"
                placeholder="Enter game developer"
                value={values.developer}
                maxLength={50}
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
                placeholder="Enter game publisher"
                value={values.publisher}
                maxLength={50}
                onChange={(event) =>
                  setValues((current) => ({ ...current, publisher: event.target.value }))
                }
              />
            </div>
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
              className="flex flex-wrap gap-4"
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
            <div className="flex flex-wrap gap-4">
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-notes">Notes</Label>
            <Textarea
              id="game-notes"
              name="notes"
              placeholder="Personal notes about this game..."
              value={values.notes}
              maxLength={200}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Genre(s) *</Label>
            <Select value="" onValueChange={addGenre}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add genre(s)" />
              </SelectTrigger>
              <SelectContent>
                {genres
                  .filter((genre) => !values.genreIds.includes(genre.id))
                  .map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {values.genreIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {values.genreIds.map((genreId) => {
                  const genre = genres.find((option) => option.id === genreId);
                  if (!genre) return null;
                  return (
                    <Badge key={genreId} variant="secondary" className="gap-1">
                      {genre.name}
                      <button
                        type="button"
                        onClick={() => removeGenre(genreId)}
                        aria-label={`Remove ${genre.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-saga">Sagas / Tags</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2">
                <Input
                  id="game-saga"
                  placeholder="Add a saga"
                  value={sagaInput}
                  maxLength={50}
                  onChange={(event) => setSagaInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSaga();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSaga}>
                  Add
                  <PlusIcon />
                </Button>
              </div>
              <div className="flex min-h-10 flex-wrap content-start gap-2 rounded-lg border border-input p-2.5">
                {values.saga.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeSaga(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

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
