import { Star, StarHalf } from "lucide-react";

// TMDB rates out of 10; show it as five stars in halves.
export function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  const halves = Math.round(rating);
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 10`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = halves >= (i + 1) * 2;
        const half = !filled && halves === i * 2 + 1;
        if (half) {
          return (
            <span key={i} className="relative inline-flex" style={{ width: size, height: size }}>
              <Star size={size} className="absolute text-star" strokeWidth={1.5} />
              <StarHalf size={size} className="absolute fill-star text-star" strokeWidth={1.5} />
            </span>
          );
        }
        return <Star key={i} size={size} strokeWidth={1.5} className={filled ? "fill-star text-star" : "text-star"} />;
      })}
    </div>
  );
}
