import { FALLBACK_MOVIES, type FallbackMovie } from "./fallback-data";
import { eraRange } from "./genres";
import type { ListKind, Movie, MovieDetail, PickFilters } from "./types";

function toMovie(m: FallbackMovie): Movie {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview,
    year: m.year,
    rating: m.rating,
    voteCount: m.votes,
    genreIds: m.genres,
    poster: null,
    backdrop: null,
  };
}

// Stable pseudo-shuffle so "trending" differs from "popular" without changing per request.
function scramble(seed: number) {
  return (m: FallbackMovie) => ((m.id * 2654435761 + seed) >>> 0) % 1000;
}

export function fallbackList(kind: ListKind, genre?: number): Movie[] {
  let list = [...FALLBACK_MOVIES];
  if (genre) list = list.filter((m) => m.genres.includes(genre));
  switch (kind) {
    case "trending": {
      const key = scramble(7);
      list.sort((a, b) => key(a) - key(b));
      break;
    }
    case "popular":
      list.sort((a, b) => b.votes - a.votes);
      break;
    case "recent":
      list.sort((a, b) => b.year - a.year);
      break;
    case "top":
      list.sort((a, b) => b.rating - a.rating);
      break;
  }
  return list.slice(0, 20).map(toMovie);
}

export function fallbackSearch(query: string): Movie[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FALLBACK_MOVIES.filter(
    (m) => m.title.toLowerCase().includes(q) || m.cast.some(([name]) => name.toLowerCase().includes(q)),
  )
    .slice(0, 20)
    .map(toMovie);
}

export function fallbackMatches(f: PickFilters): Movie[] {
  const { from, to } = eraRange(f.era);
  return FALLBACK_MOVIES.filter(
    (m) =>
      (f.genres.length === 0 || m.genres.some((g) => f.genres.includes(g))) &&
      (from === null || m.year >= from) &&
      (to === null || m.year <= to) &&
      m.rating >= f.minRating &&
      (f.maxRuntime === null || m.runtime <= f.maxRuntime),
  ).map(toMovie);
}

export function fallbackDetail(id: number): MovieDetail | null {
  const m = FALLBACK_MOVIES.find((x) => x.id === id);
  if (!m) return null;
  const similar = FALLBACK_MOVIES.filter((x) => x.id !== id)
    .map((x) => ({ x, score: x.genres.filter((g) => m.genres.includes(g)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.x.rating - a.x.rating)
    .slice(0, 12)
    .map(({ x }) => toMovie(x));
  return {
    ...toMovie(m),
    runtime: m.runtime,
    tagline: m.tagline,
    releaseDate: null,
    cast: m.cast.map(([name, character], i) => ({ id: m.id * 100 + i, name, character, photo: null })),
    trailerKey: null,
    similar,
  };
}
