export type Movie = {
  id: number;
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

export type MovieDetail = Movie & {
  runtime: number | null;
  tagline: string;
  releaseDate: string | null;
  cast: CastMember[];
  trailerKey: string | null;
  similar: Movie[];
};

export type ListKind = "trending" | "popular" | "recent" | "top";

export type PickFilters = {
  genres: number[];
  era: string;
  minRating: number;
  maxRuntime: number | null;
  exclude: number[];
};
