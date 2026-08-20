"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GameSortKey } from "@/lib/games";

const SORT_LABELS: Record<GameSortKey, string> = {
  title: "Title",
  year: "Year",
  rating: "Rating",
};

export function GamesControls({
  search,
  sort,
}: {
  search: string;
  sort: GameSortKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function updateParams(next: { q?: string; sort?: GameSortKey }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    const nextSort = next.sort ?? sort;

    if (q) params.set("q", q);
    if (nextSort !== "title") params.set("sort", nextSort);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value }), 300);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search games..."
          value={searchValue}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="pl-8"
          aria-label="Search games"
        />
      </div>

      <Select
        value={sort}
        onValueChange={(value) => updateParams({ sort: value as GameSortKey })}
      >
        <SelectTrigger aria-label="Sort games">
          <span className="text-muted-foreground">Sort:</span>
          <SelectValue>{SORT_LABELS[sort]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABELS) as GameSortKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {SORT_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
