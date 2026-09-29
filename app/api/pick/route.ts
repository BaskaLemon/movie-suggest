import type { NextRequest } from "next/server";
import { pickMovie } from "@/lib/catalog";
import { ERAS } from "@/lib/genres";

const ids = (v: string | null) =>
  (v ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const era = q.get("era") ?? "any";
  const minRating = Number(q.get("minRating") ?? 0);
  const maxRuntime = Number(q.get("maxRuntime") ?? 0);
  const result = await pickMovie({
    genres: ids(q.get("genres")),
    era: ERAS.some((e) => e.id === era) ? era : "any",
    minRating: Number.isFinite(minRating) ? Math.min(Math.max(minRating, 0), 9.5) : 0,
    maxRuntime: maxRuntime > 0 ? maxRuntime : null,
    exclude: ids(q.get("exclude")).slice(-100),
  });
  return Response.json(result);
}
