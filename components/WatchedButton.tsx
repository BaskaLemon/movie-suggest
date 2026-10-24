"use client";

import { Eye, EyeOff } from "lucide-react";
import { summary } from "./WatchlistButton";
import { useWatched, useWatchlist } from "@/lib/watchlist";
import type { Movie } from "@/lib/types";

// "Seen it": the picker stops suggesting the title, and it leaves the watchlist.
export function WatchedButton({ movie, className = "" }: { movie: Movie; className?: string }) {
  const watched = useWatched();
  const watchlist = useWatchlist();
  const seen = watched.has(movie.mediaType, movie.id);
  return (
    <button
      type="button"
      aria-pressed={seen}
      title={seen ? "Marked as watched. Click to undo." : "Mark as watched so it isn't suggested again"}
      onClick={() => {
        if (!seen && watchlist.has(movie.mediaType, movie.id)) watchlist.remove(movie.mediaType, movie.id);
        watched.toggle(summary(movie));
      }}
      className={`inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-5 text-sm font-semibold transition active:scale-[0.97] ${
        seen ? "border-star/50 bg-star/15 text-star" : "border-white/30 text-ink/85 hover:bg-white/10 hover:text-ink"
      } ${className}`}
    >
      {seen ? <Eye size={18} /> : <EyeOff size={18} />}
      {seen ? "Watched" : "Seen it"}
    </button>
  );
}
