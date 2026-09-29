import type { NextRequest } from "next/server";
import { searchMovies } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  const movies = await searchMovies(query);
  return Response.json({ movies: movies.slice(0, 8) });
}
