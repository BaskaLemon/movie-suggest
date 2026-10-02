import type { NextRequest } from "next/server";
import { searchMovies } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const query = (q.get("q") ?? "").slice(0, 100);
  const limit = Math.min(Math.max(Number(q.get("limit")) || 8, 1), 40);
  const movies = await searchMovies(query);
  return Response.json({ movies: movies.slice(0, limit) });
}
