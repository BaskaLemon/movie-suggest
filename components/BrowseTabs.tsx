"use client";

import { Flame, Plus, Star, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { MediaToggle } from "./MediaToggle";
import { MovieCard } from "./MovieCard";
import { GENRES, TV_GENRES } from "@/lib/genres";
import type { ListKind, MediaType, Movie } from "@/lib/types";

const TABS: { id: ListKind; label: string; icon: typeof Flame }[] = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "recent", label: "Recently added", icon: Plus },
  { id: "top", label: "Top rated", icon: Star },
];

export function BrowseTabs({ initial }: { initial: Movie[] }) {
  const [tab, setTab] = useState<ListKind>("trending");
  const [genre, setGenre] = useState(0);
  const [media, setMedia] = useState<MediaType>("movie");
  const [movies, setMovies] = useState(initial);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, Movie[]>([["movie:trending:0", initial]]));
  const latest = useRef("movie:trending:0");
  const chips = media === "tv" ? TV_GENRES : GENRES;

  async function load(nextTab: ListKind, nextGenre: number, nextMedia: MediaType = media) {
    // Some movie genres (Music, Romance) have no TV equivalent; fall back to All.
    if (nextMedia === "tv" && nextGenre && !TV_GENRES.some((g) => g.id === nextGenre)) nextGenre = 0;
    setTab(nextTab);
    setGenre(nextGenre);
    setMedia(nextMedia);
    const key = `${nextMedia}:${nextTab}:${nextGenre}`;
    latest.current = key;
    const hit = cache.current.get(key);
    if (hit) {
      setMovies(hit);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/browse?list=${nextTab}&genre=${nextGenre}&media=${nextMedia}`);
      const data: { movies: Movie[] } = await res.json();
      cache.current.set(key, data.movies);
      if (latest.current === key) setMovies(data.movies);
    } catch {
      if (latest.current === key) setMovies([]);
    } finally {
      if (latest.current === key) setLoading(false);
    }
  }

  return (
    <section id="browse" aria-label="Browse movies" className="scroll-mt-20 px-4 sm:px-8">
      <div className="mb-8 flex justify-center">
        <MediaToggle value={media} onChange={(m) => load(tab, genre, m)} layoutGroup="browse" />
      </div>
      <div role="tablist" aria-label="Lists" className="no-scrollbar flex justify-start gap-2 overflow-x-auto sm:justify-center sm:gap-10">
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = id === tab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => load(id, genre)}
              className={`relative flex shrink-0 items-center gap-2 px-3 pb-4 pt-2 transition ${on ? "text-lg font-semibold text-ink" : "text-ink/60 hover:text-ink"}`}
            >
              <Icon size={on ? 22 : 18} />
              {id === "recent" && media === "tv" ? "On the air" : label}
              {on && <motion.span layoutId="tab-dot" className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>

      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2 sm:justify-center sm:flex-wrap">
        {[{ id: 0, name: "All" }, ...chips].map((g) => {
          const on = g.id === genre;
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={on}
              onClick={() => load(tab, g.id)}
              className={`h-11 shrink-0 rounded-full px-6 text-sm font-medium transition active:scale-95 ${
                on ? "bg-accent text-accent-ink shadow-[0_8px_24px_-8px_rgba(25,181,254,0.8)]" : "bg-white/[0.06] text-ink/90 hover:bg-white/10"
              }`}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 12 }, (_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[0.06]" />
                <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))
          : movies.map((m) => <MovieCard key={`${m.mediaType}-${m.id}`} movie={m} />)}
      </div>
      {!loading && movies.length === 0 && <p className="mt-6 text-center text-muted">Nothing here yet. Try another genre.</p>}
    </section>
  );
}
