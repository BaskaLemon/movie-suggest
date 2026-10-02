"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Poster } from "./Poster";
import { titleHref, type Movie } from "@/lib/types";

// Glass shelf from the hero mock: the focused poster lifts out with a hot outline.
export function PopularShelf({ id, title, movies, className = "" }: { id?: string; title: string; movies: Movie[]; className?: string }) {
  const headingId = useId();
  const [active, setActive] = useState(1);
  const track = useRef<HTMLDivElement>(null);
  if (!movies.length) return null;

  return (
    <section id={id} aria-labelledby={headingId} className={`relative z-10 scroll-mt-20 px-4 sm:px-8 ${className}`}>
      <h2 id={headingId} className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="relative">
        <div className="glass pointer-events-none absolute inset-x-0 bottom-6 top-10 rounded-3xl" />
        <div ref={track} className="no-scrollbar relative flex items-center gap-4 overflow-x-auto px-4 py-6 sm:gap-6 sm:px-6">
          {movies.map((m, i) => {
            const on = i === active;
            return (
              <Link
                key={m.id}
                href={titleHref(m)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`relative aspect-[2/3] shrink-0 overflow-hidden rounded-2xl bg-surface-solid transition-all duration-300 ease-out ${
                  on
                    ? "w-40 shadow-[0_30px_60px_-20px_rgba(214,58,120,0.6)] ring-[3px] ring-hot/70 sm:w-52"
                    : "mt-8 w-32 opacity-85 ring-1 ring-white/10 sm:w-40"
                }`}
              >
                <Poster movie={m} sizes="220px" />
                <span className="sr-only">{m.title}</span>
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          aria-label={`Scroll ${title.toLowerCase()}`}
          onClick={() => track.current?.scrollBy({ left: track.current.clientWidth * 0.8, behavior: "smooth" })}
          className="absolute -right-1 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-ink backdrop-blur hover:bg-black/80 sm:grid"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
