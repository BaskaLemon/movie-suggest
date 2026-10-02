import type { WatchlistItem } from "./db";
import type { MediaType, Movie } from "./types";

export function fromWatchlistRow(row: WatchlistItem): Movie {
  let genreIds: number[] = [];
  try {
    const parsed = JSON.parse(row.genreIds);
    if (Array.isArray(parsed)) genreIds = parsed.filter((n) => Number.isInteger(n));
  } catch {
    // Corrupt row: show it without genres rather than fail the whole list.
  }
  return {
    id: row.tmdbId,
    mediaType: row.mediaType === "tv" ? "tv" : "movie",
    title: row.title,
    overview: row.overview,
    year: row.year,
    rating: row.rating,
    voteCount: row.voteCount,
    genreIds,
    poster: row.poster,
    backdrop: row.backdrop,
  };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const imagePath = (v: unknown) => (typeof v === "string" && /^\/[\w.-]{1,200}$/.test(v) ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

// Client-sent titles are untrusted: keep only well-formed fields with sane sizes.
export function toWatchlistData(m: unknown): Omit<WatchlistItem, "id" | "profileId" | "addedAt"> | null {
  if (!m || typeof m !== "object") return null;
  const o = m as Record<string, unknown>;
  const mediaType: MediaType | null = o.mediaType === "tv" ? "tv" : o.mediaType === "movie" || o.mediaType === undefined ? "movie" : null;
  const tmdbId = o.id;
  if (!mediaType || typeof tmdbId !== "number" || !Number.isInteger(tmdbId) || tmdbId <= 0) return null;
  const title = str(o.title, 300);
  if (!title) return null;
  const genres = Array.isArray(o.genreIds) ? o.genreIds.filter((g) => Number.isInteger(g)).slice(0, 20) : [];
  return {
    mediaType,
    tmdbId,
    title,
    overview: str(o.overview, 2000),
    year: Number.isInteger(o.year) ? (o.year as number) : null,
    rating: Math.min(Math.max(num(o.rating), 0), 10),
    voteCount: Math.max(Math.trunc(num(o.voteCount)), 0),
    genreIds: JSON.stringify(genres),
    poster: imagePath(o.poster),
    backdrop: imagePath(o.backdrop),
  };
}
