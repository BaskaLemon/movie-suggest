import type { NextRequest } from "next/server";
import { pickMixed, pickMovies } from "@/lib/catalog";
import { ERAS } from "@/lib/genres";

const ids = (v: string | null) =>
  (v ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const media = q.get("media");
  const era = q.get("era") ?? "any";
  const minRating = Number(q.get("minRating") ?? 0);
  const maxRuntime = Number(q.get("maxRuntime") ?? 0);
  const count = Number(q.get("count") ?? 5);
  const filters = {
    genres: ids(q.get("genres")),
    era: ERAS.some((e) => e.id === era) ? era : "any",
    minRating: Number.isFinite(minRating) ? Math.min(Math.max(minRating, 0), 9.5) : 0,
    maxRuntime: maxRuntime > 0 ? maxRuntime : null,
  };
  // Movie and series ids overlap on TMDB, so already-shown titles come in two lists.
  const exclude = { movie: ids(q.get("exclude")).slice(-100), tv: ids(q.get("excludeTv")).slice(-100) };
  const n = Number.isInteger(count) ? Math.min(Math.max(count, 1), 8) : 5;
  const result =
    media === "all"
      ? await pickMixed(filters, exclude, n)
      : media === "tv"
        ? await pickMovies({ ...filters, media: "tv", exclude: exclude.tv }, n)
        : await pickMovies({ ...filters, media: "movie", exclude: exclude.movie }, n);
  return Response.json(result);
}
