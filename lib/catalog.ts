import { eraRange } from "./genres";
import { fallbackDetail, fallbackList, fallbackMatches, fallbackSearch } from "./fallback";
import type { CastMember, ListKind, Movie, MovieDetail, PickFilters } from "./types";

// Server-only data access. Every call falls back to the bundled catalogue so the
// site still works without a key or when TMDB is down.

const API = process.env.TMDB_API_URL ?? "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

export const hasTmdb = Boolean(API_KEY || ACCESS_TOKEN);

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  poster_path: string | null;
  backdrop_path: string | null;
  adult?: boolean;
};

type TmdbPage = { page: number; total_pages: number; results: TmdbMovie[] };

type TmdbDetail = TmdbMovie & {
  runtime: number | null;
  tagline: string;
  credits?: { cast: { id: number; name: string; character: string; profile_path: string | null }[] };
  videos?: { results: { key: string; site: string; type: string; official: boolean }[] };
  recommendations?: TmdbPage;
  similar?: TmdbPage;
};

async function tmdb<T>(path: string, params: Record<string, string | number | undefined> = {}, revalidate = 3600): Promise<T> {
  const url = new URL(API + path);
  if (API_KEY && !ACCESS_TOKEN) url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : undefined,
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`TMDB ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

function toMovie(m: TmdbMovie): Movie {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) || null : null,
    rating: Math.round(m.vote_average * 10) / 10,
    voteCount: m.vote_count,
    genreIds: m.genre_ids ?? m.genres?.map((g) => g.id) ?? [],
    poster: m.poster_path,
    backdrop: m.backdrop_path,
  };
}

const usable = (m: TmdbMovie) => !m.adult && Boolean(m.poster_path);

async function withFallback<T>(live: () => Promise<T>, offline: () => T): Promise<T> {
  if (!hasTmdb) return offline();
  try {
    return await live();
  } catch (err) {
    console.error("[catalog] TMDB request failed, serving fallback data:", err);
    return offline();
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export function getList(kind: ListKind, genre?: number): Promise<Movie[]> {
  return withFallback(
    async () => {
      let page: TmdbPage;
      if (genre) {
        const sort = { trending: "popularity.desc", popular: "vote_count.desc", recent: "primary_release_date.desc", top: "vote_average.desc" }[kind];
        page = await tmdb<TmdbPage>("/discover/movie", {
          with_genres: genre,
          sort_by: sort,
          include_adult: "false",
          "vote_count.gte": kind === "top" ? 1000 : kind === "recent" ? 40 : 100,
          "primary_release_date.lte": today(),
        });
      } else {
        const path = { trending: "/trending/movie/week", popular: "/movie/popular", recent: "/movie/now_playing", top: "/movie/top_rated" }[kind];
        page = await tmdb<TmdbPage>(path);
      }
      return page.results.filter(usable).map(toMovie);
    },
    () => fallbackList(kind, genre),
  );
}

export function searchMovies(query: string): Promise<Movie[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);
  return withFallback(
    async () => {
      const page = await tmdb<TmdbPage>("/search/movie", { query: q, include_adult: "false" }, 600);
      return page.results.filter(usable).map(toMovie);
    },
    () => fallbackSearch(q),
  );
}

export function getMovie(id: number): Promise<MovieDetail | null> {
  return withFallback(
    async () => {
      let d: TmdbDetail;
      try {
        d = await tmdb<TmdbDetail>(`/movie/${id}`, { append_to_response: "credits,videos,recommendations,similar" });
      } catch (err) {
        if (err instanceof Error && err.message.endsWith(" 404")) return null;
        throw err;
      }
      const videos = d.videos?.results.filter((v) => v.site === "YouTube") ?? [];
      const trailer =
        videos.find((v) => v.type === "Trailer" && v.official) ?? videos.find((v) => v.type === "Trailer") ?? videos[0];
      const cast: CastMember[] = (d.credits?.cast ?? []).slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        photo: c.profile_path,
      }));
      const related = d.recommendations?.results.length ? d.recommendations.results : (d.similar?.results ?? []);
      return {
        ...toMovie(d),
        runtime: d.runtime,
        tagline: d.tagline,
        releaseDate: d.release_date || null,
        cast,
        trailerKey: trailer?.key ?? null,
        similar: related.filter(usable).slice(0, 12).map(toMovie),
      };
    },
    () => fallbackDetail(id),
  );
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fill up to `count` from each source in order, skipping duplicates.
function takeDistinct<T extends { id: number }>(count: number, ...sources: T[][]): T[] {
  const out: T[] = [];
  const ids = new Set<number>();
  for (const source of sources) {
    for (const item of source) {
      if (out.length === count) return out;
      if (ids.has(item.id)) continue;
      ids.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function pickMovies(f: PickFilters, count: number): Promise<{ movies: Movie[]; pool: number }> {
  return withFallback(
    async () => {
      const { from, to } = eraRange(f.era);
      const params = {
        with_genres: f.genres.join("|"),
        sort_by: "popularity.desc",
        include_adult: "false",
        "vote_count.gte": 150,
        "vote_average.gte": f.minRating || undefined,
        "with_runtime.lte": f.maxRuntime ?? undefined,
        "with_runtime.gte": f.maxRuntime ? 60 : undefined,
        "primary_release_date.gte": from ? `${from}-01-01` : undefined,
        "primary_release_date.lte": to ? `${to}-12-31` : today(),
      };
      const first = await tmdb<TmdbPage & { total_results: number }>("/discover/movie", params, 3600);
      // Popularity-sorted pages stay recognisable; cap depth so picks aren't obscure.
      const pages = Math.min(first.total_pages, 15);
      const pageNo = 1 + Math.floor(Math.random() * pages);
      const page = pageNo === 1 ? first : await tmdb<TmdbPage>("/discover/movie", { ...params, page: pageNo }, 3600);
      const excluded = new Set(f.exclude);
      const fresh = (p: TmdbPage) => shuffle(p.results.filter((m) => usable(m) && !excluded.has(m.id)));
      const picks = takeDistinct(count, fresh(page), fresh(first));
      return { movies: picks.map(toMovie), pool: first.total_results };
    },
    () => {
      const all = fallbackMatches(f);
      const excluded = new Set(f.exclude);
      // The demo catalogue is small, so top up with already-seen titles rather than return a short list.
      const picks = takeDistinct(
        count,
        shuffle(all.filter((m) => !excluded.has(m.id))),
        shuffle(all.filter((m) => excluded.has(m.id))),
      );
      return { movies: picks, pool: all.length };
    },
  );
}
