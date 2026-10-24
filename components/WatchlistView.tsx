"use client";

import { Bookmark, Dices, Eye, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MovieCard } from "./MovieCard";
import { useViewer } from "./ViewerProvider";
import { titleHref } from "@/lib/types";
import { useWatched, useWatchlist } from "@/lib/watchlist";

type Tab = "watchlist" | "watched";

export function WatchlistView() {
  const router = useRouter();
  const watchlist = useWatchlist();
  const watched = useWatched();
  const [tab, setTab] = useState<Tab>("watchlist");
  const profile = useViewer()?.profile;
  const { list, remove } = tab === "watchlist" ? watchlist : watched;
  const whose = profile ? ` on ${profile.name}’s list` : ", saved on this device";

  return (
    <div className="px-4 pt-28 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{tab === "watchlist" ? "Saved for later" : "Already seen"}</p>
          <h1 className="mt-2 font-display text-6xl tracking-wide sm:text-7xl">{tab === "watchlist" ? "Your watchlist" : "Watched"}</h1>
          <p className="mt-2 text-muted">
            {list.length
              ? `${list.length} ${list.length === 1 ? "title" : "titles"}${whose}.`
              : profile
                ? `${profile.name}’s list`
                : "Saved on this device, no account needed."}
          </p>
        </div>
        {tab === "watchlist" && list.length > 1 && (
          <button
            type="button"
            onClick={() => router.push(titleHref(list[Math.floor(Math.random() * list.length)]))}
            className="shimmer inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink"
          >
            <Dices size={18} />
            Pick one from my list
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Lists" className="mt-8 inline-flex rounded-full border border-line bg-white/[0.04] p-1">
        {(
          [
            ["watchlist", "Watchlist", watchlist.list.length],
            ["watched", "Watched", watched.list.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-9 rounded-full px-5 text-sm font-medium transition ${tab === id ? "bg-accent text-accent-ink" : "text-ink/75 hover:text-ink"}`}
          >
            {label} <span className="opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="glass mt-8 flex flex-col items-center rounded-3xl px-6 py-20 text-center">
          {tab === "watchlist" ? <Bookmark size={36} className="text-muted" /> : <Eye size={36} className="text-muted" />}
          <p className="mt-4 text-lg font-medium">{tab === "watchlist" ? "Nothing saved yet" : "Nothing marked as watched"}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {tab === "watchlist"
              ? "Hit “Watch later” on any movie or series and it lands here."
              : "Hit “Seen it” on a title and Pick for me stops suggesting it."}
          </p>
          <Link href="/#pick" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink">
            <Dices size={18} />
            Get a suggestion
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((m) => (
            <li key={`${m.mediaType}-${m.id}`} className="relative">
              <MovieCard movie={m} />
              <button
                type="button"
                onClick={() => remove(m.mediaType, m.id)}
                aria-label={`Remove ${m.title} from ${tab === "watchlist" ? "watchlist" : "watched"}`}
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
