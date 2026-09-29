"use client";

import { Bookmark, Dices, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MovieCard } from "./MovieCard";
import { useWatchlist } from "@/lib/watchlist";

export function WatchlistView() {
  const router = useRouter();
  const { list, remove } = useWatchlist();

  return (
    <div className="px-4 pt-28 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Saved for later</p>
          <h1 className="mt-2 font-display text-6xl tracking-wide sm:text-7xl">Your watchlist</h1>
          <p className="mt-2 text-muted">
            {list.length ? `${list.length} ${list.length === 1 ? "movie" : "movies"}, saved on this device.` : "Saved on this device, no account needed."}
          </p>
        </div>
        {list.length > 1 && (
          <button
            type="button"
            onClick={() => router.push(`/movie/${list[Math.floor(Math.random() * list.length)].id}`)}
            className="shimmer inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink"
          >
            <Dices size={18} />
            Pick one from my list
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="glass mt-12 flex flex-col items-center rounded-3xl px-6 py-20 text-center">
          <Bookmark size={36} className="text-muted" />
          <p className="mt-4 text-lg font-medium">Nothing saved yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">Hit “Watch later” on any movie and it lands here.</p>
          <Link href="/#pick" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink">
            <Dices size={18} />
            Get a suggestion
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((m) => (
            <li key={m.id} className="relative">
              <MovieCard movie={m} />
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label={`Remove ${m.title} from watchlist`}
                className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-hot"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
