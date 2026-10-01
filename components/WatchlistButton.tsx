"use client";

import { Check, Plus } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist";
import type { Movie } from "@/lib/types";

// Store only the summary fields so detail payloads (cast, similar) don't bloat localStorage.
function summary(m: Movie): Movie {
  const { id, mediaType, title, overview, year, rating, voteCount, genreIds, poster, backdrop } = m;
  return { id, mediaType, title, overview, year, rating, voteCount, genreIds, poster, backdrop };
}

export function WatchlistButton({ movie, compact = false, className = "" }: { movie: Movie; compact?: boolean; className?: string }) {
  const { has, toggle } = useWatchlist();
  const saved = has(movie.mediaType, movie.id);
  return (
    <button
      type="button"
      onClick={() => toggle(summary(movie))}
      aria-pressed={saved}
      className={`inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-6 text-sm font-semibold transition active:scale-[0.97] ${
        saved ? "border-teal/50 bg-teal/15 text-teal" : "border-white/70 text-ink hover:bg-white/10"
      } ${className}`}
    >
      {saved ? <Check size={18} /> : <Plus size={18} />}
      {saved ? (compact ? "Saved" : "On your watchlist") : "Watch later"}
    </button>
  );
}
