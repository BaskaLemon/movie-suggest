import { eraRange, toTvGenres } from "./genres";
import { fallbackDetail, fallbackList, fallbackMatches, fallbackSearch } from "./fallback";
import type { CastMember, ListKind, MediaType, Movie, MovieDetail, PickFilters, Season } from "./types";

// Server-only data access. Every call falls back to the bundled catalogue so the
// site still works without a key or when TMDB is down.

const API = process.env.TMDB_API_URL ?? "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

export const hasTmdb = Boolean(API_KEY || ACCESS_TOKEN);

// Movies carry title/release_date; series carry name/first_air_date.
type TmdbTitle = {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  poster_path: string | null;
  backdrop_path: string | null;
  adult?: boolean;
  media_type?: string;
};

type TmdbPage = { page: number; total_pages: number; total_results: number; results: TmdbTitle[] };

type TmdbCast = { id: number; name: string; character?: string; profile_path: string | null; roles?: { character: string }[] };

type TmdbDetail = TmdbTitle & {
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_episodes?: number;
  seasons?: { season_number: number; name: string; episode_count: number; air_date: string | null; poster_path: string | null }[];
  last_episode_to_air?: { runtime: number | null } | null;
  tagline: string;
  credits?: { cast: TmdbCast[] };
  aggregate_credits?: { cast: TmdbCast[] };
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

const yearOf = (date?: string | null) => (date ? Number(date.slice(0, 4)) || null : null);

function toMovie(m: TmdbTitle, mediaType: MediaType): Movie {
  return {
    id: m.id,
    mediaType,
    title: m.title ?? m.name ?? "Untitled",
    overview: m.overview,
    year: yearOf(m.release_date ?? m.first_air_date),
    rating: Math.round(m.vote_average * 10) / 10,
    voteCount: m.vote_count,
    genreIds: m.genre_ids ?? m.genres?.map((g) => g.id) ?? [],
    poster: m.poster_path,
    backdrop: m.backdrop_path,
  };
}

const usable = (m: TmdbTitle) => !m.adult && Boolean(m.poster_path);

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

// Discover uses different date fields per media type.
const dateField = (media: MediaType) => (media === "tv" ? "first_air_date" : "primary_release_date");

// `genre` is a movie genre id; series lists translate it to the TV equivalents.
export function getList(kind: ListKind, genre?: number, media: MediaType = "movie"): Promise<Movie[]> {
  return withFallback(
    async () => {
      let page: TmdbPage;
      if (genre) {
        const date = dateField(media);
        const sort = { trending: "popularity.desc", popular: "vote_count.desc", recent: `${date}.desc`, top: "vote_average.desc" }[kind];
        const genres = media === "tv" ? toTvGenres([genre]) : [genre];
        if (!genres.length) return [];
        page = await tmdb<TmdbPage>(`/discover/${media}`, {
          with_genres: genres.join("|"),
          sort_by: sort,
          include_adult: "false",
          "vote_count.gte": kind === "top" ? (media === "tv" ? 300 : 1000) : kind === "recent" ? 40 : 100,
          [`${date}.lte`]: today(),
        });
      } else {
        const paths = {
          movie: { trending: "/trending/movie/week", popular: "/movie/popular", recent: "/movie/now_playing", top: "/movie/top_rated" },
          tv: { trending: "/trending/tv/week", popular: "/tv/popular", recent: "/tv/on_the_air", top: "/tv/top_rated" },
        };
        page = await tmdb<TmdbPage>(paths[media][kind]);
      }
      return page.results.filter(usable).map((m) => toMovie(m, media));
    },
    () => fallbackList(kind, genre, media),
  );
}

// Searches movies and series together; people in the results are dropped.
export function searchMovies(query: string): Promise<Movie[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);
  return withFallback(
    async () => {
      const page = await tmdb<TmdbPage>("/search/multi", { query: q, include_adult: "false" }, 600);
      return page.results
        .filter((m) => (m.media_type === "movie" || m.media_type === "tv") && usable(m))
        .map((m) => toMovie(m, m.media_type as MediaType));
    },
    () => fallbackSearch(q),
  );
}

export function getTitle(media: MediaType, id: number): Promise<MovieDetail | null> {
  return withFallback(
    async () => {
      let d: TmdbDetail;
      try {
        const credits = media === "tv" ? "aggregate_credits" : "credits";
        d = await tmdb<TmdbDetail>(`/${media}/${id}`, { append_to_response: `${credits},videos,recommendations,similar` });
      } catch (err) {
        if (err instanceof Error && err.message.endsWith(" 404")) return null;
        throw err;
      }
      const videos = d.videos?.results.filter((v) => v.site === "YouTube") ?? [];
      const trailer =
        videos.find((v) => v.type === "Trailer" && v.official) ?? videos.find((v) => v.type === "Trailer") ?? videos[0];
      const castSource = (media === "tv" ? d.aggregate_credits?.cast : d.credits?.cast) ?? [];
      const cast: CastMember[] = castSource.slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? c.roles?.[0]?.character ?? "",
        photo: c.profile_path,
      }));
      const related = d.recommendations?.results.length ? d.recommendations.results : (d.similar?.results ?? []);
      const seasons: Season[] = (d.seasons ?? [])
        .filter((s) => s.season_number > 0)
        .map((s) => ({ number: s.season_number, name: s.name, episodes: s.episode_count, year: yearOf(s.air_date), poster: s.poster_path }));
      return {
        ...toMovie(d, media),
        runtime: media === "tv" ? (d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime ?? null) : (d.runtime ?? null),
        tagline: d.tagline,
        releaseDate: (media === "tv" ? d.first_air_date : d.release_date) || null,
        cast,
        trailerKey: trailer?.key ?? null,
        similar: related.filter(usable).slice(0, 12).map((m) => toMovie(m, media)),
        seasons,
        episodeCount: d.number_of_episodes ?? null,
      };
    },
    () => fallbackDetail(media, id),
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
      const tv = f.media === "tv";
      const genres = tv ? toTvGenres(f.genres) : f.genres;
      // Every selected genre lacks a TV equivalent (e.g. only Music): nothing can match.
      if (f.genres.length && !genres.length) return { movies: [], pool: 0 };
      const date = dateField(f.media);
      const params = {
        with_genres: genres.join("|"),
        sort_by: "popularity.desc",
        include_adult: "false",
        "vote_count.gte": tv ? 100 : 150,
        "vote_average.gte": f.minRating || undefined,
        // Runtime filters episode length on TV, which isn't what "Length" means, so skip it.
        "with_runtime.lte": tv ? undefined : (f.maxRuntime ?? undefined),
        "with_runtime.gte": !tv && f.maxRuntime ? 60 : undefined,
        [`${date}.gte`]: from ? `${from}-01-01` : undefined,
        [`${date}.lte`]: to ? `${to}-12-31` : today(),
      };
      const path = `/discover/${f.media}`;
      const first = await tmdb<TmdbPage>(path, params, 3600);
      // Popularity-sorted pages stay recognisable; cap depth so picks aren't obscure.
      const pages = Math.min(first.total_pages, 15);
      const pageNo = 1 + Math.floor(Math.random() * pages);
      const page = pageNo === 1 ? first : await tmdb<TmdbPage>(path, { ...params, page: pageNo }, 3600);
      const excluded = new Set(f.exclude);
      const fresh = (p: TmdbPage) => shuffle(p.results.filter((m) => usable(m) && !excluded.has(m.id)));
      const picks = takeDistinct(count, fresh(page), fresh(first));
      return { movies: picks.map((m) => toMovie(m, f.media)), pool: first.total_results };
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
