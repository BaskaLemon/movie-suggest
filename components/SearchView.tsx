"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MovieCard } from "./MovieCard";
import type { MediaType, Movie } from "@/lib/types";

type Filter = "all" | MediaType;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "Series" },
];

export function SearchView({ initialQuery, initialResults, suggestions }: { initialQuery: string; initialResults: Movie[]; suggestions: Movie[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [searched, setSearched] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!initialQuery) input.current?.focus();
  }, [initialQuery]);

  useEffect(() => {
    const q = query.trim();
    if (q === searched) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      // Keep the URL shareable without adding a history entry per keystroke.
      router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", { scroll: false });
      if (!q) {
        setResults([]);
        setSearched("");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=40`, { signal: ctrl.signal });
        const data: { movies: Movie[] } = await res.json();
        setResults(data.movies);
        setSearched(q);
      } catch {
        // Aborted by the next keystroke, or offline: keep the previous results.
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, searched, router]);

  const shown = results.filter((m) => filter === "all" || m.mediaType === filter);
  const counts = { all: results.length, movie: results.filter((m) => m.mediaType === "movie").length, tv: results.filter((m) => m.mediaType === "tv").length };

  return (
    <div className="px-4 pt-28 sm:px-8">
      <h1 className="font-display text-6xl tracking-wide sm:text-7xl">Search</h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          input.current?.blur();
        }}
        className="mt-6 flex h-16 max-w-3xl items-center gap-4 rounded-2xl border border-line bg-white/5 px-5 backdrop-blur-md transition focus-within:border-accent/60 focus-within:bg-white/10"
      >
        <Search size={22} className="shrink-0 text-muted" aria-hidden />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, series or actors"
          aria-label="Search movies, series or actors"
          className="min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:text-muted focus:outline-none"
        />
        {loading && <span className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-accent" aria-label="Searching" />}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              input.current?.focus();
            }}
            aria-label="Clear search"
            className="text-muted hover:text-ink"
          >
            <X size={20} />
          </button>
        )}
      </form>

      {searched ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`h-9 rounded-full px-4 text-sm font-medium transition ${filter === f.id ? "bg-accent text-accent-ink" : "bg-white/[0.06] text-ink/85 hover:bg-white/10"}`}
              >
                {f.label} <span className="opacity-70">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mt-4 text-sm text-muted">
            {shown.length ? `Results for “${searched}”` : `Nothing matched “${searched}”${filter === "all" ? "" : ` in ${filter === "tv" ? "series" : "movies"}`}. Try a shorter title or an actor’s name.`}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map((m) => (
              <MovieCard key={`${m.mediaType}-${m.id}`} movie={m} />
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-12 text-xl font-semibold">Trending right now</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {suggestions.map((m) => (
              <MovieCard key={`${m.mediaType}-${m.id}`} movie={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
