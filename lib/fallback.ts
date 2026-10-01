import { FALLBACK_MOVIES, FALLBACK_SHOWS, type FallbackMovie, type FallbackShow } from "./fallback-data";
import { eraRange, toTvGenres } from "./genres";
import type { ListKind, MediaType, Movie, MovieDetail, PickFilters } from "./types";

const dataset = (media: MediaType): (FallbackMovie | FallbackShow)[] => (media === "tv" ? FALLBACK_SHOWS : FALLBACK_MOVIES);

function toMovie(m: FallbackMovie, mediaType: MediaType): Movie {
  return {
    id: m.id,
    mediaType,
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

// `genre` is a movie genre id; series lists translate it to the TV equivalents.
export function fallbackList(kind: ListKind, genre?: number, media: MediaType = "movie"): Movie[] {
  let list = [...dataset(media)];
  if (genre) {
    const wanted = media === "tv" ? toTvGenres([genre]) : [genre];
    list = list.filter((m) => m.genres.some((g) => wanted.includes(g)));
  }
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
  return list.slice(0, 20).map((m) => toMovie(m, media));
}

export function fallbackSearch(query: string): Movie[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = (m: FallbackMovie) =>
    m.title.toLowerCase().includes(q) || m.cast.some(([name]) => name.toLowerCase().includes(q));
  return [
    ...FALLBACK_MOVIES.filter(hit).map((m) => toMovie(m, "movie")),
    ...FALLBACK_SHOWS.filter(hit).map((m) => toMovie(m, "tv")),
  ].slice(0, 20);
}

export function fallbackMatches(f: PickFilters): Movie[] {
  const { from, to } = eraRange(f.era);
  const genres = f.media === "tv" ? toTvGenres(f.genres) : f.genres;
  // Every selected genre lacks a TV equivalent (e.g. only Music): nothing can match.
  if (f.genres.length && !genres.length) return [];
  return dataset(f.media)
    .filter(
      (m) =>
        (genres.length === 0 || m.genres.some((g) => genres.includes(g))) &&
        (from === null || m.year >= from) &&
        (to === null || m.year <= to) &&
        m.rating >= f.minRating &&
        (f.media === "tv" || f.maxRuntime === null || m.runtime <= f.maxRuntime),
    )
    .map((m) => toMovie(m, f.media));
}

export function fallbackDetail(media: MediaType, id: number): MovieDetail | null {
  const items = dataset(media);
  const m = items.find((x) => x.id === id);
  if (!m) return null;
  const similar = items
    .filter((x) => x.id !== id)
    .map((x) => ({ x, score: x.genres.filter((g) => m.genres.includes(g)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.x.rating - a.x.rating)
    .slice(0, 12)
    .map(({ x }) => toMovie(x, media));
  const show = "seasons" in m ? m : null;
  return {
    ...toMovie(m, media),
    runtime: m.runtime,
    tagline: m.tagline,
    releaseDate: null,
    cast: m.cast.map(([name, character], i) => ({ id: m.id * 100 + i, name, character, photo: null })),
    trailerKey: null,
    similar,
    seasons: show
      ? Array.from({ length: show.seasons }, (_, i) => ({ number: i + 1, name: `Season ${i + 1}`, episodes: null, year: null, poster: null }))
      : [],
    episodeCount: show?.episodes ?? null,
  };
}
