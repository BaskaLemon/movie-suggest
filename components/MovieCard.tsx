import Link from "next/link";
import { Poster } from "./Poster";
import { RatingBadge } from "./RatingBadge";
import { titleHref, type Movie } from "@/lib/types";

export function MovieCard({ movie, priority, showMeta = true }: { movie: Movie; priority?: boolean; showMeta?: boolean }) {
  return (
    <Link href={titleHref(movie)} className="group block outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface-solid shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_60px_-18px_rgba(25,181,254,0.45)] group-hover:ring-accent/40 group-focus-visible:ring-2 group-focus-visible:ring-accent">
        <Poster movie={movie} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 220px" priority={priority} className="transition duration-500 group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <RatingBadge rating={movie.rating} className="absolute right-2 top-2" />
      </div>
      {showMeta && (
        <div className="mt-3 px-0.5">
          <p className="truncate text-sm font-medium text-ink">{movie.title}</p>
          <p className="text-xs text-muted">
            {movie.mediaType === "tv" ? "Series · " : ""}
            {movie.year ?? "TBA"}
          </p>
        </div>
      )}
    </Link>
  );
}
