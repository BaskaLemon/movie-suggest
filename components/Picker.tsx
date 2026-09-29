"use client";

import { ArrowRight, Brain, Dices, Ghost, Heart, Laugh, RotateCcw, Sun, Swords, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Poster } from "./Poster";
import { RatingBadge } from "./RatingBadge";
import { WatchlistButton } from "./WatchlistButton";
import { ERAS, GENRES, MOODS, RUNTIMES, genreNames } from "@/lib/genres";
import type { Movie } from "@/lib/types";

const MOOD_ICONS: Record<string, typeof Zap> = {
  adrenaline: Zap,
  laugh: Laugh,
  mind: Brain,
  feelgood: Sun,
  heartfelt: Heart,
  spooky: Ghost,
  epic: Swords,
};

type Status = "idle" | "loading" | "done" | "empty" | "error";

const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x) => b.includes(x));

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition active:scale-95 ${
        on ? "bg-accent text-accent-ink" : "bg-white/[0.06] text-ink/85 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">{children}</p>;
}

export function Picker() {
  const reduce = useReducedMotion();
  const [genres, setGenres] = useState<number[]>([]);
  const [era, setEra] = useState("any");
  const [minRating, setMinRating] = useState(6.5);
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [movie, setMovie] = useState<Movie | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const [pool, setPool] = useState(0);

  const toggleGenre = (id: number) => setGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const reset = () => {
    setGenres([]);
    setEra("any");
    setMinRating(6.5);
    setMaxRuntime(null);
  };

  async function pick() {
    setStatus("loading");
    const params = new URLSearchParams({
      genres: genres.join(","),
      era,
      minRating: String(minRating),
      maxRuntime: String(maxRuntime ?? 0),
      exclude: seen.slice(-60).join(","),
    });
    try {
      // Hold the shuffle for a beat so the reveal reads as a reveal, not a flicker.
      const [res] = await Promise.all([fetch(`/api/pick?${params}`), new Promise((r) => setTimeout(r, reduce ? 0 : 900))]);
      if (!res.ok) throw new Error(String(res.status));
      const data: { movie: Movie | null; pool: number } = await res.json();
      setPool(data.pool);
      if (!data.movie) {
        setStatus("empty");
        return;
      }
      setMovie(data.movie);
      setSeen((s) => [...s, data.movie!.id]);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="pick" aria-labelledby="pick-heading" className="scroll-mt-20 px-4 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Can’t decide?</p>
        <h2 id="pick-heading" className="mt-2 font-display text-5xl leading-none tracking-wide sm:text-6xl">
          Let us pick tonight’s movie
        </h2>
        <p className="mt-3 text-ink/70">Set a mood, narrow it down if you like, and roll. Don’t like the pick? Roll again, we won’t repeat ourselves.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="glass rounded-3xl p-6 sm:p-7">
          <Label>Mood</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const Icon = MOOD_ICONS[m.id];
              const on = sameSet(genres, m.genres);
              return (
                <Chip key={m.id} on={on} onClick={() => setGenres(on ? [] : [...m.genres])}>
                  <Icon size={15} />
                  {m.label}
                </Chip>
              );
            })}
          </div>

          <div className="mt-7">
            <Label>Genres {genres.length > 0 && <span className="normal-case tracking-normal">· any of {genres.length}</span>}</Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <Chip key={g.id} on={genres.includes(g.id)} onClick={() => toggleGenre(g.id)}>
                  {g.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <Label>Era</Label>
            <div className="flex flex-wrap gap-2">
              {ERAS.map((e) => (
                <Chip key={e.id} on={era === e.id} onClick={() => setEra(e.id)}>
                  {e.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <Label>Length</Label>
            <div className="flex flex-wrap gap-2">
              {RUNTIMES.map((r) => (
                <Chip key={r.label} on={maxRuntime === r.value} onClick={() => setMaxRuntime(r.value)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <Label>Minimum rating</Label>
              <span className="text-sm font-semibold text-star">★ {minRating.toFixed(1)}+</span>
            </div>
            <input
              type="range"
              min={0}
              max={8.5}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label="Minimum rating out of 10"
              className="w-full"
            />
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={pick}
              disabled={status === "loading"}
              className="shimmer inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-accent text-base font-semibold text-accent-ink shadow-[0_14px_40px_-10px_rgba(25,181,254,0.8)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              <Dices size={20} className={status === "loading" ? "animate-spin" : ""} />
              {status === "done" ? "Pick another" : "Pick for me"}
            </button>
            <button type="button" onClick={reset} aria-label="Reset filters" title="Reset filters" className="grid size-14 place-items-center rounded-full border border-line text-ink/70 hover:bg-white/5 hover:text-ink">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="glass relative min-h-[700px] sm:min-h-[540px] overflow-hidden rounded-3xl" aria-live="polite">
          <AnimatePresence mode="wait">
            {status === "done" && movie ? (
              <motion.article
                key={movie.id}
                initial={reduce ? false : { opacity: 0, rotateY: -25, scale: 0.94 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                style={{ transformPerspective: 1200 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0">
                  <Poster movie={movie} variant="backdrop" sizes="(max-width: 1024px) 100vw, 60vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070a1c] via-[#070a1c]/85 to-[#070a1c]/30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#070a1c]/90 to-transparent" />
                </div>
                <div className="relative flex h-full flex-col justify-end gap-6 p-6 sm:flex-row sm:items-end sm:p-9">
                  <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 sm:w-48">
                    <Poster movie={movie} sizes="200px" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">Your pick</p>
                    <h3 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{movie.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/70">
                      <RatingBadge rating={movie.rating} />
                      <span>{[movie.year, ...genreNames(movie.genreIds)].filter(Boolean).join(" · ")}</span>
                    </div>
                    <p className="mt-4 line-clamp-4 max-w-xl text-[15px] leading-relaxed text-ink/85">{movie.overview}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/movie/${movie.id}`}
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#070a1c] transition hover:bg-white/90"
                      >
                        Details & trailer
                        <ArrowRight size={17} />
                      </Link>
                      <WatchlistButton movie={movie} />
                    </div>
                    <p className="mt-4 text-xs text-muted">Picked from {pool.toLocaleString()} matches.</p>
                  </div>
                </div>
              </motion.article>
            ) : (
              <motion.div
                key={status}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-10 p-8 text-center"
              >
                <div className="relative h-56 w-40">
                  {[-1, 0, 1].map((n) => (
                    <motion.div
                      key={n}
                      className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1b2356] to-[#0b0f28] shadow-2xl"
                      initial={{ rotate: n * 10, x: n * 34 }}
                      animate={
                        status === "loading" && !reduce
                          ? { rotate: [n * 10, -n * 14, n * 10], x: [n * 34, -n * 40, n * 34], y: [0, -14, 0] }
                          : { rotate: n * 10, x: n * 34, y: 0 }
                      }
                      transition={status === "loading" ? { duration: 0.5, repeat: Infinity, delay: (n + 1) * 0.08 } : { duration: 0.4 }}
                      style={{ zIndex: n === 0 ? 2 : 1 }}
                    >
                      <span className="grid h-full place-items-center font-display text-6xl text-white/15">?</span>
                    </motion.div>
                  ))}
                </div>
                <div className="max-w-sm">
                  {status === "loading" && <p className="text-lg font-medium">Shuffling the reels…</p>}
                  {status === "idle" && (
                    <>
                      <p className="text-lg font-medium">Your next movie is one click away</p>
                      <p className="mt-1 text-sm text-muted">Leave everything blank for a total surprise.</p>
                    </>
                  )}
                  {status === "empty" && (
                    <>
                      <p className="text-lg font-medium">Nothing matches all of that</p>
                      <p className="mt-1 text-sm text-muted">Try lowering the rating or widening the era.</p>
                    </>
                  )}
                  {status === "error" && (
                    <>
                      <p className="text-lg font-medium">Couldn’t reach the film vault</p>
                      <p className="mt-1 text-sm text-muted">Check your connection and roll again.</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
