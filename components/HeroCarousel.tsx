"use client";

import { Dices, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Poster } from "./Poster";
import { Stars } from "./Stars";
import { WatchlistButton } from "./WatchlistButton";
import { genreNames } from "@/lib/genres";
import type { Movie } from "@/lib/types";

function splitTitle(title: string): [string, string | null] {
  const i = title.indexOf(":");
  return i > 0 ? [title.slice(0, i), title.slice(i + 1).trim()] : [title, null];
}

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const movie = movies[index];

  useEffect(() => {
    if (paused || reduce || movies.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % movies.length), 9000);
    return () => clearTimeout(t);
  }, [index, paused, reduce, movies.length]);

  if (!movie) return null;
  const [main, sub] = splitTitle(movie.title);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured movies"
      className="relative isolate min-h-[88svh] overflow-hidden lg:-ml-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
        <AnimatePresence initial={false}>
          <motion.div
            key={movie.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Poster movie={movie} variant="backdrop" sizes="100vw" priority />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#04060d] via-[#04060d]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04060d]/60 via-transparent to-black/30" />
      </div>

      <div className="flex min-h-[88svh] flex-col justify-end px-4 pb-40 pt-28 sm:px-8 lg:pl-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-accent">Trending this week</p>
            <h1 className="font-display uppercase leading-[0.88] text-white drop-shadow-2xl">
              <span className="block text-[clamp(3.2rem,10vw,7.5rem)]">{main}</span>
              {sub && <span className="mt-2 block text-[clamp(1.8rem,5vw,4rem)]">{sub}</span>}
            </h1>
            <p className="mt-3 text-sm text-ink/70">
              {[movie.year, ...genreNames(movie.genreIds)].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-ink/90">{movie.overview}</p>
            <div className="mt-5">
              <Stars rating={movie.rating} size={22} />
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/movie/${movie.id}`}
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-accent px-7 text-sm font-semibold text-accent-ink shadow-[0_10px_30px_-8px_rgba(25,181,254,0.7)] transition hover:brightness-110 active:scale-[0.97]"
              >
                <Play size={18} className="fill-current" />
                View details
              </Link>
              <WatchlistButton movie={movie} />
              <Link
                href="#pick"
                className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink/80 transition hover:text-ink"
              >
                <Dices size={18} />
                Not feeling it? Pick for me
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {movies.length > 1 && (
          <div className="mt-10 flex gap-2" role="tablist" aria-label="Choose featured movie">
            {movies.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={m.title}
                onClick={() => setIndex(i)}
                className="group relative h-1.5 w-10 overflow-hidden rounded-full bg-white/20"
              >
                {i === index && (
                  <motion.span
                    key={`${m.id}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-accent"
                    initial={{ width: paused || reduce ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: paused || reduce ? 0 : 9, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
