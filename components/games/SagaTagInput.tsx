"use client";

import { PlusIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gameSagaTagSchema, isDuplicateSagaTag } from "@/lib/game-utils";

export function SagaTagInput({
  value,
  onValueChange,
  tags,
  onTagsChange,
  onError,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onError: (message: string) => void;
}) {
  function addTag() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const validation = gameSagaTagSchema.safeParse(trimmed);
    if (!validation.success) {
      onError(validation.error.issues[0].message);
      return;
    }
    if (isDuplicateSagaTag(tags, trimmed)) {
      onValueChange("");
      return;
    }
    onTagsChange([...tags, trimmed]);
    onValueChange("");
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter((existingTag) => existingTag !== tag));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="game-saga">Sagas / Tags</Label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex gap-2">
          <Input
            id="game-saga"
            placeholder="Add a saga"
            value={value}
            maxLength={50}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
            <PlusIcon />
          </Button>
        </div>
        <div className="flex min-h-10 flex-wrap content-start gap-2 rounded-lg border border-input p-2.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="-m-1 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
