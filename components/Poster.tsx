import Image from "next/image";
import { tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/types";

const PALETTES = [
  ["#1d4ed8", "#0f172a", "#f472b6"],
  ["#7c2d12", "#1c1917", "#fb923c"],
  ["#134e4a", "#042f2e", "#5eead4"],
  ["#4c1d95", "#0b0620", "#c084fc"],
  ["#831843", "#1a0610", "#fda4af"],
  ["#1e3a8a", "#020617", "#38bdf8"],
  ["#3f6212", "#0c1405", "#bef264"],
  ["#713f12", "#140b02", "#facc15"],
];

type Props = {
  movie: Pick<Movie, "id" | "title" | "year" | "poster" | "backdrop">;
  variant?: "poster" | "backdrop";
  sizes: string;
  priority?: boolean;
  className?: string;
};

// Real TMDB artwork when we have it; otherwise a generated typographic poster.
export function Poster({ movie, variant = "poster", sizes, priority, className = "" }: Props) {
  const path = variant === "poster" ? movie.poster : (movie.backdrop ?? movie.poster);
  const src = tmdbImage(path, variant === "poster" ? "w500" : "w1280");
  if (src) {
    return (
      <Image
        src={src}
        alt={variant === "poster" ? `${movie.title} poster` : ""}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }
  const [a, b, c] = PALETTES[movie.id % PALETTES.length];
  return (
    <div
      role={variant === "poster" ? "img" : undefined}
      aria-label={variant === "poster" ? `${movie.title} poster` : undefined}
      aria-hidden={variant === "backdrop" ? true : undefined}
      className={`@container absolute inset-0 flex flex-col justify-end overflow-hidden p-[8%] ${className}`}
      style={{
        background: `radial-gradient(120% 70% at 80% 10%, ${c}55 0%, transparent 55%), radial-gradient(90% 60% at 10% 30%, ${a} 0%, transparent 70%), linear-gradient(180deg, ${a} 0%, ${b} 85%)`,
      }}
    >
      <div
        className="absolute -right-[20%] top-[12%] aspect-square w-[75%] rounded-full opacity-60 blur-[2px]"
        style={{ background: `radial-gradient(circle at 35% 35%, ${c}, transparent 70%)` }}
      />
      {variant === "poster" && (
        <div className="relative @max-[100px]:hidden">
          <p className="font-display text-[clamp(1rem,16cqi,3rem)] leading-[0.95] tracking-wide text-white drop-shadow-lg [overflow-wrap:anywhere]">
            {movie.title}
          </p>
          {movie.year && <p className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">{movie.year}</p>}
        </div>
      )}
    </div>
  );
}
