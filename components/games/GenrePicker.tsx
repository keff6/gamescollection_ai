"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GenreOption } from "@/lib/genres";

export function GenrePicker({
  genres,
  selectedIds,
  onChange,
}: {
  genres: GenreOption[];
  selectedIds: string[];
  onChange: (genreIds: string[]) => void;
}) {
  function addGenre(genreId: string) {
    if (!selectedIds.includes(genreId)) {
      onChange([...selectedIds, genreId]);
    }
  }

  function removeGenre(genreId: string) {
    onChange(selectedIds.filter((id) => id !== genreId));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Genre(s) *</Label>
      <Select value="" onValueChange={addGenre}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Add genre(s)" />
        </SelectTrigger>
        <SelectContent>
          {genres
            .filter((genre) => !selectedIds.includes(genre.id))
            .map((genre) => (
              <SelectItem key={genre.id} value={genre.id}>
                {genre.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((genreId) => {
            const genre = genres.find((option) => option.id === genreId);
            if (!genre) return null;
            return (
              <Badge key={genreId} variant="secondary" className="gap-1">
                {genre.name}
                <button
                  type="button"
                  onClick={() => removeGenre(genreId)}
                  aria-label={`Remove ${genre.name}`}
                  className="-m-1 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
