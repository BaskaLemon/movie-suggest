"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Poster } from "./Poster";
import { titleHref, type Movie } from "@/lib/types";

export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data: { movies: Movie[] } = await res.json();
        setResults(data.movies);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted by the next keystroke, or offline: keep the previous results.
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const visible = open && query.trim().length >= 2;

  function submit() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(active >= 0 && results[active] ? titleHref(results[active]) : `/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={wrapper} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex h-11 items-center gap-3 rounded-xl border border-line bg-white/5 px-3 backdrop-blur-md transition focus-within:border-accent/60 focus-within:bg-white/10"
      >
        <Search size={18} className="shrink-0 text-muted" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, -1));
            }
          }}
          placeholder="Search movies, series, actors"
          aria-label="Search movies and series"
          role="combobox"
          aria-expanded={visible}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-muted hover:text-ink">
            <X size={16} />
          </button>
        )}
      </form>

      {visible && (
        <div id={listId} role="listbox" className="glass absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl p-2 shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No matches for “{query.trim()}”.</p>
          ) : (
            <>
              {results.map((m, i) => (
                <Link
                  key={`${m.mediaType}-${m.id}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={titleHref(m)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl p-2 transition ${i === active ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-solid">
                    <Poster movie={m} sizes="40px" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted">
                      {m.mediaType === "tv" ? "Series · " : ""}
                      {m.year ?? "TBA"} {m.rating ? `· ★ ${m.rating.toFixed(1)}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-xl px-3 py-2 text-center text-xs text-accent hover:bg-white/5"
              >
                See all results
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
