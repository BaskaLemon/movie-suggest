"use client";

import { ArrowRight, Brain, Dices, Ghost, Heart, Laugh, RotateCcw, Sun, Swords, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { MediaToggle } from "./MediaToggle";
import { Poster } from "./Poster";
import { RatingBadge } from "./RatingBadge";
import { useViewer } from "./ViewerProvider";
import { WatchedButton } from "./WatchedButton";
import { WatchlistButton } from "./WatchlistButton";
import { ERAS, GENRES, MOODS, RUNTIMES, TV_GENRES, genreNames } from "@/lib/genres";
import { titleHref, type MediaType, type Movie, type PickMedia } from "@/lib/types";
import { useWatched, useWatchlist } from "@/lib/watchlist";

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

const COUNTS = [1, 3, 5, 8];

const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x) => b.includes(x));

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition active:scale-95 ${
        on ? "bg-accent text-accent-ink" : "bg-white/[0.06] text-ink/85 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{children}</p>;
}

const selectClass =
  "h-9 w-full rounded-xl border border-line bg-white/5 px-2.5 text-sm text-ink transition focus:border-accent/60 focus:outline-none disabled:opacity-40";

function Select({ label, value, onChange, disabled, children }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={selectClass}>
        {children}
      </select>
    </label>
  );
}

// Already-shown, watched and saved ids are sent so the server skips them; cap the URL length.
const MAX_EXCLUDE = 400;

export function Picker() {
  const reduce = useReducedMotion();
  const [media, setMedia] = useState<PickMedia>(useViewer()?.profile?.defaultMedia ?? "all");
  const [genres, setGenres] = useState<number[]>([]);
  const [era, setEra] = useState("any");
  const [minRating, setMinRating] = useState(6.5);
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [count, setCount] = useState(5);
  const [picks, setPicks] = useState<Movie[]>([]);
  const [active, setActive] = useState(0);
  // Ids are only unique per media type, so remember what we've shown separately.
  const [seen, setSeen] = useState<Record<MediaType, number[]>>({ movie: [], tv: [] });
  const [pool, setPool] = useState(0);
  const [skipKnown, setSkipKnown] = useState(true);
  const watched = useWatched().list;
  const saved = useWatchlist().list;
  const section = useRef<HTMLElement>(null);

  const featured = picks[active] ?? null;
  const tv = media === "tv";
  const noun = media === "all" ? "watch" : tv ? "series" : "movie";

  const switchMedia = (next: PickMedia) => {
    if (next === media) return;
    setMedia(next);
    // Drop genres with no TV equivalent so the chip count matches what's sent.
    if (next === "tv") setGenres((g) => g.filter((id) => TV_GENRES.some((t) => t.id === id)));
    setPicks([]);
    setStatus("idle");
  };

  const toggleGenre = (id: number) => setGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const reset = () => {
    setGenres([]);
    setEra("any");
    setMinRating(6.5);
    setMaxRuntime(null);
  };

  async function pick() {
    setStatus("loading");
    // Bring the whole picker into view so the result lands on screen, not below the fold.
    // Wait a frame: started inside the click, the smooth scroll is cancelled when the
    // focused button re-renders as disabled.
    requestAnimationFrame(() => {
      const box = section.current?.getBoundingClientRect();
      if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
        section.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
    const exclude = (type: MediaType) => {
      const known = skipKnown ? [...watched, ...saved].filter((m) => m.mediaType === type).map((m) => m.id) : [];
      return [...new Set([...known, ...seen[type].slice(-80)])].slice(-MAX_EXCLUDE).join(",");
    };
    const params = new URLSearchParams({
      media,
      genres: genres.join(","),
      era,
      minRating: String(minRating),
      maxRuntime: String(tv ? 0 : (maxRuntime ?? 0)),
      count: String(count),
      exclude: exclude("movie"),
      excludeTv: exclude("tv"),
    });
    try {
      // Hold the shuffle for a beat so the reveal reads as a reveal, not a flicker.
      const [res] = await Promise.all([fetch(`/api/pick?${params}`), new Promise((r) => setTimeout(r, reduce ? 0 : 900))]);
      if (!res.ok) throw new Error(String(res.status));
      const data: { movies: Movie[]; pool: number } = await res.json();
      setPool(data.pool);
      if (!data.movies.length) {
        setStatus("empty");
        return;
      }
      setPicks(data.movies);
      setActive(0);
      const shown = (type: MediaType) => data.movies.filter((m) => m.mediaType === type).map((m) => m.id);
      setSeen((s) => ({ movie: [...s.movie, ...shown("movie")], tv: [...s.tv, ...shown("tv")] }));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    // scroll-mt matches the 64px header plus a little air.
    <section ref={section} id="pick" aria-labelledby="pick-heading" className="scroll-mt-[72px] px-4 sm:px-8">
      <div className="mb-3 flex items-end justify-between gap-6">
        <h2 id="pick-heading" className="font-display text-4xl leading-none tracking-wide sm:text-5xl">
          {media === "all" ? "Let us pick what to watch tonight" : `Let us pick tonight’s ${noun}`}
        </h2>
        <p className="hidden shrink-0 text-sm text-ink/60 xl:block">Roll for a shortlist. Roll again and we won’t repeat ourselves.</p>
      </div>

      {/* Sized so the heading, filters and result fit on one screen from 720px tall up. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="glass rounded-3xl p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <MediaToggle value={media} onChange={switchMedia} layoutGroup="picker" includeAll />
            <button type="button" onClick={reset} aria-label="Reset filters" title="Reset filters" className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink/70 hover:bg-white/5 hover:text-ink">
              <RotateCcw size={15} />
            </button>
          </div>

          <Label>Mood</Label>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => {
              const Icon = MOOD_ICONS[m.id];
              const on = sameSet(genres, m.genres);
              return (
                <Chip key={m.id} on={on} onClick={() => setGenres(on ? [] : [...m.genres])}>
                  <Icon size={13} />
                  {m.label}
                </Chip>
              );
            })}
          </div>

          <div className="mt-3">
            <Label>Genres {genres.length > 0 && <span className="normal-case tracking-normal">· any of {genres.length}</span>}</Label>
            <div className="flex flex-wrap gap-1.5">
              {(tv ? TV_GENRES : GENRES).map((g) => (
                <Chip key={g.id} on={genres.includes(g.id)} onClick={() => toggleGenre(g.id)}>
                  {g.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 items-end gap-2.5">
            <Select label="Era" value={era} onChange={setEra}>
              {ERAS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </Select>
            <Select
              label={media === "all" ? "Movie length" : "Length"}
              value={tv ? "" : String(maxRuntime ?? "")}
              onChange={(v) => setMaxRuntime(v ? Number(v) : null)}
              disabled={tv}
            >
              {/* TMDB can only filter series by episode length, so series ignore this. */}
              {tv ? (
                <option value="">Any length</option>
              ) : (
                RUNTIMES.map((r) => (
                  <option key={r.label} value={String(r.value ?? "")}>
                    {r.label}
                  </option>
                ))
              )}
            </Select>
            <Select label="Per roll" value={String(count)} onChange={(v) => setCount(Number(v))}>
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "Just one" : `${n} ${media === "all" ? "titles" : tv ? "series" : "movies"}`}
                </option>
              ))}
            </Select>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 flex items-baseline justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
              Minimum rating <span className="text-xs normal-case tracking-normal text-star">★ {minRating.toFixed(1)}+</span>
            </span>
            <input
              type="range"
              min={0}
              max={8.5}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label="Minimum rating out of 10"
              className="h-6 w-full"
            />
          </label>

          <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm text-ink/80">
            <input type="checkbox" checked={skipKnown} onChange={(e) => setSkipKnown(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            Skip what I’ve seen or saved
            {(watched.length > 0 || saved.length > 0) && <span className="text-xs text-muted">({watched.length + saved.length})</span>}
          </label>

          <button
            type="button"
            onClick={pick}
            disabled={status === "loading"}
            className="shimmer mt-3 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-accent text-base font-semibold text-accent-ink shadow-[0_14px_40px_-10px_rgba(25,181,254,0.8)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
          >
            <Dices size={20} className={status === "loading" ? "animate-spin" : ""} />
            {status === "done" ? (count > 1 ? "Roll new picks" : "Pick another") : "Pick for me"}
          </button>
        </div>

        <div className="glass relative min-h-[560px] overflow-hidden rounded-3xl sm:min-h-[460px]" aria-live="polite">
          <AnimatePresence mode="wait">
            {status === "done" && featured ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                <AnimatePresence mode="wait">
                  <motion.article
                    key={featured.id}
                    initial={reduce ? false : { opacity: 0, rotateY: -25, scale: 0.94 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    style={{ transformPerspective: 1200 }}
                    className="relative min-h-0 flex-1"
                  >
                    <div className="absolute inset-0">
                      <Poster movie={featured} variant="backdrop" sizes="(max-width: 1024px) 100vw, 60vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070a1c] via-[#070a1c]/85 to-[#070a1c]/30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#070a1c]/90 to-transparent" />
                    </div>
                    <div className="relative flex h-full flex-col justify-end gap-5 p-5 sm:flex-row sm:items-end sm:p-7">
                      <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 sm:w-36">
                        <Poster movie={featured} sizes="200px" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
                          {picks.length > 1 ? `Pick ${active + 1} of ${picks.length}` : "Your pick"}
                        </p>
                        <h3 className="mt-1.5 text-2xl font-semibold leading-tight sm:text-3xl">{featured.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/70">
                          <RatingBadge rating={featured.rating} />
                          <span>{[featured.mediaType === "tv" ? "Series" : null, featured.year, ...genreNames(featured.genreIds)].filter(Boolean).join(" · ")}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-ink/85">{featured.overview}</p>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <Link
                            href={titleHref(featured)}
                            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#070a1c] transition hover:bg-white/90"
                          >
                            Details & trailer
                            <ArrowRight size={17} />
                          </Link>
                          <WatchlistButton movie={featured} />
                          <WatchedButton movie={featured} />
                        </div>
                        <p className="mt-3 text-xs text-muted">Picked from {pool.toLocaleString()} matches.</p>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>

                {picks.length > 1 && (
                  <div className="relative border-t border-line bg-[#070a1c]/85 px-4 py-3 backdrop-blur sm:px-5">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">All {picks.length} picks</p>
                    <div role="tablist" aria-label="Suggested movies" className="no-scrollbar -m-1 flex gap-3 overflow-x-auto p-1">
                      {picks.map((m, i) => {
                        const on = i === active;
                        return (
                          <motion.button
                            key={m.id}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setActive(i)}
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className={`flex w-48 shrink-0 items-center gap-2.5 rounded-xl p-1.5 text-left transition ${
                              on ? "bg-white/10 ring-2 ring-hot/70" : "hover:bg-white/5"
                            }`}
                          >
                            <span className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md bg-surface-solid">
                              <Poster movie={m} sizes="36px" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{m.title}</span>
                              <span className="block text-xs text-muted">
                                {m.mediaType === "tv" ? "Series · " : ""}
                                {m.year ?? "TBA"} {m.rating ? `· ★ ${m.rating.toFixed(1)}` : ""}
                              </span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={status}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-8 text-center"
              >
                <div className="relative h-44 w-32">
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
                      <p className="text-lg font-medium">Your next {noun} is one click away</p>
                      <p className="mt-1 text-sm text-muted">Leave everything blank for a total surprise.</p>
                    </>
                  )}
                  {status === "empty" && (
                    <>
                      <p className="text-lg font-medium">Nothing matches all of that</p>
                      <p className="mt-1 text-sm text-muted">
                        Try lowering the rating or widening the era{skipKnown && watched.length + saved.length > 0 ? ", or untick “Skip what I’ve seen or saved”" : ""}.
                      </p>
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
