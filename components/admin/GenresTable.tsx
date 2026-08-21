"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { toast } from "sonner";
import {
  createGenreAction,
  deleteGenreAction,
  updateGenreAction,
} from "@/app/admin/genres/actions";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isDuplicateGenreName,
  sortGenresByName,
  type GenreOption,
} from "@/lib/genre-utils";

const NEW_ROW_ID = "__new__";

interface GenreRowProps {
  value: string;
  error: string | null;
  isSaving: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

function GenreEditRow({
  value,
  error,
  isSaving,
  inputRef,
  onChange,
  onKeyDown,
  onBlur,
}: GenreRowProps) {
  return (
    <tr className="border-b border-border last:border-0">
      <td colSpan={2} className="px-4 py-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={isSaving}
          aria-invalid={!!error}
          placeholder="Genre name"
          maxLength={50}
          className="max-w-xs"
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </td>
    </tr>
  );
}

export function GenresTable({ initialGenres }: { initialGenres: GenreOption[] }) {
  const [genres, setGenres] = useState(initialGenres);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GenreOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  function startAdd() {
    setIsAddingNew(true);
    setEditingId(NEW_ROW_ID);
    setDraftValue("");
    setFieldError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function startEdit(genre: GenreOption) {
    setIsAddingNew(false);
    setEditingId(genre.id);
    setDraftValue(genre.name);
    setFieldError(null);
  }

  function cancelEdit() {
    setIsAddingNew(false);
    setEditingId(null);
    setDraftValue("");
    setFieldError(null);
  }

  async function commitEdit() {
    const name = draftValue.trim();

    if (isAddingNew && name === "") {
      cancelEdit();
      return;
    }

    if (name === "") {
      setFieldError("Name is required");
      return;
    }

    if (isDuplicateGenreName(genres, name, isAddingNew ? undefined : editingId ?? undefined)) {
      setFieldError("A genre with this name already exists");
      return;
    }

    setIsSaving(true);
    const result = isAddingNew
      ? await createGenreAction(name)
      : await updateGenreAction(editingId as string, name);
    setIsSaving(false);

    if (!result.success) {
      setFieldError(result.error);
      return;
    }

    if (isAddingNew) {
      setGenres((prev) => sortGenresByName([...prev, result.data]));
      toast.success("Genre added");
    } else {
      setGenres((prev) =>
        sortGenresByName(
          prev.map((genre) => (genre.id === result.data.id ? result.data : genre))
        )
      );
      toast.success("Genre updated");
    }

    cancelEdit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      skipBlurCommitRef.current = true;
      cancelEdit();
    }
  }

  function handleBlur() {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    void commitEdit();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteGenreAction(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      setDeleteTarget(null);
      return;
    }

    setGenres((prev) => prev.filter((genre) => genre.id !== deleteTarget.id));
    toast.success("Genre deleted");
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Genres</h1>
          <p className="mt-1 text-muted-foreground">
            {genres.length} genre{genres.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button type="button" onClick={startAdd} disabled={isAddingNew}>
          <PlusIcon />
          Add Genre
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {genres.length === 0 && !isAddingNew ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">No genres yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first genre to start tagging games.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isAddingNew && (
                <GenreEditRow
                  value={draftValue}
                  error={fieldError}
                  isSaving={isSaving}
                  inputRef={inputRef}
                  onChange={setDraftValue}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                />
              )}
              {genres.map((genre) =>
                editingId === genre.id ? (
                  <GenreEditRow
                    key={genre.id}
                    value={draftValue}
                    error={fieldError}
                    isSaving={isSaving}
                    inputRef={inputRef}
                    onChange={setDraftValue}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                  />
                ) : (
                  <tr key={genre.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => startEdit(genre)}
                        className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {genre.name}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${genre.name}`}
                        onClick={() => setDeleteTarget(genre)}
                      >
                        <Trash2Icon className="text-destructive" />
                      </Button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from every game currently tagged with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
