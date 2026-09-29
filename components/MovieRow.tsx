"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { MovieCard } from "./MovieCard";
import type { Movie } from "@/lib/types";

export function MovieRow({ title, movies }: { title: string; movies: Movie[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  if (!movies.length) return null;
  return (
    <section aria-label={title} className="relative">
      <div className="mb-5 flex items-end justify-between px-4 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="glass grid size-10 place-items-center rounded-full hover:bg-white/10">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="glass grid size-10 place-items-center rounded-full hover:bg-white/10">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-8 sm:gap-5 sm:px-8">
        {movies.map((m) => (
          <div key={m.id} className="w-[42vw] shrink-0 snap-start sm:w-44 lg:w-52">
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
