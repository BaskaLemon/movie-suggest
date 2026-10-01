export type MediaType = "movie" | "tv";

// A movie or a TV series. TMDB ids are only unique within a media type.
export type Movie = {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  year: number | null;
  rating: number;
  voteCount: number;
  genreIds: number[];
  poster: string | null;
  backdrop: string | null;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  photo: string | null;
};

export type Season = {
  number: number;
  name: string;
  episodes: number | null;
  year: number | null;
  poster: string | null;
};

export type MovieDetail = Movie & {
  // Movie runtime, or typical episode length for a series.
  runtime: number | null;
  tagline: string;
  releaseDate: string | null;
  cast: CastMember[];
  trailerKey: string | null;
  similar: Movie[];
  seasons: Season[];
  episodeCount: number | null;
};

export type ListKind = "trending" | "popular" | "recent" | "top";

export type PickFilters = {
  media: MediaType;
  genres: number[];
  era: string;
  minRating: number;
  maxRuntime: number | null;
  exclude: number[];
};

export function titleHref(m: Pick<Movie, "id" | "mediaType">) {
  return `/${m.mediaType === "tv" ? "tv" : "movie"}/${m.id}`;
}
