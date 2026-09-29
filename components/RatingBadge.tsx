import { Star } from "lucide-react";

export function RatingBadge({ rating, className = "" }: { rating: number; className?: string }) {
  if (!rating) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-teal/90 px-2 py-0.5 text-[11px] font-semibold text-[#032b27] shadow-lg backdrop-blur ${className}`}
    >
      <Star size={11} className="fill-current" strokeWidth={0} />
      {rating.toFixed(1)}
    </span>
  );
}
