"use client";

import { Flame, Plus, Star, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { MediaToggle } from "./MediaToggle";
import { MovieCard } from "./MovieCard";
import type { ListKind, MediaType, Movie } from "@/lib/types";

const TABS: { id: ListKind; label: string; icon: typeof Flame }[] = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "recent", label: "Recently added", icon: Plus },
  { id: "top", label: "Top rated", icon: Star },
];

export function BrowseTabs({ initial }: { initial: Movie[] }) {
  const [tab, setTab] = useState<ListKind>("trending");
  const [media, setMedia] = useState<MediaType>("movie");
  const [movies, setMovies] = useState(initial);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, Movie[]>([["movie:trending", initial]]));
  const latest = useRef("movie:trending");

  async function load(nextTab: ListKind, nextMedia: MediaType = media) {
    setTab(nextTab);
    setMedia(nextMedia);
    const key = `${nextMedia}:${nextTab}`;
    latest.current = key;
    const hit = cache.current.get(key);
    if (hit) {
      setMovies(hit);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/browse?list=${nextTab}&media=${nextMedia}`);
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
    <section id="browse" aria-label="Browse" className="scroll-mt-20 px-4 sm:px-8">
      <div className="mb-8 flex justify-center">
        <MediaToggle value={media} onChange={(m) => load(tab, m)} layoutGroup="browse" />
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
              onClick={() => load(id)}
              className={`relative flex shrink-0 items-center gap-2 px-3 pb-4 pt-2 transition ${on ? "text-lg font-semibold text-ink" : "text-ink/60 hover:text-ink"}`}
            >
              <Icon size={on ? 22 : 18} />
              {id === "recent" && media === "tv" ? "On the air" : label}
              {on && <motion.span layoutId="tab-dot" className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent" />}
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
      {!loading && movies.length === 0 && <p className="mt-6 text-center text-muted">Nothing here yet. Try another list.</p>}
    </section>
  );
}
