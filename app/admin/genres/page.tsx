import { GenresTable } from "@/components/admin/GenresTable";
import { getAllGenres } from "@/lib/genres";

export default async function AdminGenresPage() {
  let genres;
  try {
    genres = await getAllGenres();
  } catch (error) {
    console.error("Failed to load genres:", error);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Genres unavailable
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading genres. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <GenresTable initialGenres={genres} />
    </div>
  );
}
