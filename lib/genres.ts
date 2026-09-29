// TMDB movie genre ids are stable, so they live here instead of costing a request.
export const GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const byId = new Map(GENRES.map((g) => [g.id, g.name]));

export function genreNames(ids: number[], limit = 3): string[] {
  return ids.map((id) => byId.get(id)).filter((n): n is string => Boolean(n)).slice(0, limit);
}

// A mood is a preset that selects a set of genres in the picker.
export const MOODS = [
  { id: "adrenaline", label: "Adrenaline", genres: [28, 12, 53] },
  { id: "laugh", label: "Laugh out loud", genres: [35] },
  { id: "mind", label: "Mind-bending", genres: [878, 9648] },
  { id: "feelgood", label: "Feel-good", genres: [10751, 16, 35] },
  { id: "heartfelt", label: "Heartfelt", genres: [18, 10749] },
  { id: "spooky", label: "Spooky", genres: [27] },
  { id: "epic", label: "Epic", genres: [14, 36, 10752] },
] as const;

export const ERAS = [
  { id: "any", label: "Any era", from: null, to: null },
  { id: "classic", label: "Pre-1980", from: null, to: 1979 },
  { id: "8090", label: "80s & 90s", from: 1980, to: 1999 },
  { id: "2000s", label: "2000s", from: 2000, to: 2009 },
  { id: "2010s", label: "2010s", from: 2010, to: 2019 },
  { id: "2020s", label: "2020s", from: 2020, to: null },
] as const;

export const RUNTIMES = [
  { label: "Any length", value: null },
  { label: "Under 1h 40", value: 100 },
  { label: "Under 2h 10", value: 130 },
] as const;

export function eraRange(id: string): { from: number | null; to: number | null } {
  const era = ERAS.find((e) => e.id === id) ?? ERAS[0];
  return { from: era.from, to: era.to };
}
