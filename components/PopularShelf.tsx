"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useId, useRef } from "react";
import { Poster } from "./Poster";
import { titleHref, type Movie } from "@/lib/types";

// Glass shelf from the hero mock: the hovered or focused poster lifts out with a hot outline,
// and everything settles back when the pointer leaves.
export function PopularShelf({ id, title, movies, className = "" }: { id?: string; title: string; movies: Movie[]; className?: string }) {
  const headingId = useId();
  const track = useRef<HTMLDivElement>(null);
  if (!movies.length) return null;

  return (
    <section id={id} aria-labelledby={headingId} className={`relative z-10 scroll-mt-20 px-4 sm:px-8 ${className}`}>
      <h2 id={headingId} className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="relative">
        <div className="glass pointer-events-none absolute inset-x-0 bottom-2 top-10 rounded-3xl" />
        <div ref={track} className="no-scrollbar relative flex items-end gap-4 overflow-x-auto px-4 pb-6 pt-14 sm:gap-6 sm:px-6">
          {movies.map((m) => (
            <Link
              key={m.id}
              href={titleHref(m)}
              className="relative aspect-[2/3] w-32 shrink-0 origin-bottom overflow-hidden rounded-2xl bg-surface-solid opacity-85 ring-1 ring-white/10 outline-none transition duration-300 ease-out hover:z-10 hover:scale-[1.15] hover:opacity-100 hover:shadow-[0_30px_60px_-20px_rgba(214,58,120,0.6)] hover:ring-[3px] hover:ring-hot/70 focus-visible:z-10 focus-visible:scale-[1.15] focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-hot/70 sm:w-40"
            >
              <Poster movie={m} sizes="220px" />
              <span className="sr-only">{m.title}</span>
            </Link>
          ))}
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
