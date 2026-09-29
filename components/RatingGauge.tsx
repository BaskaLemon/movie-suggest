import { formatCount } from "@/lib/format";

// Arc gauge from the reviews card mock: 240° sweep, value out of 10.
export function RatingGauge({ rating, votes }: { rating: number; votes: number }) {
  const r = 80;
  const sweep = 240;
  const circumference = 2 * Math.PI * r;
  const arc = (sweep / 360) * circumference;
  const value = Math.max(0, Math.min(rating / 10, 1)) * arc;
  const angle = ((150 + (sweep * rating) / 10) * Math.PI) / 180;
  const knob = { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) };
  const R = r + 13;
  const point = (deg: number) => `${100 + R * Math.cos((deg * Math.PI) / 180)} ${100 + R * Math.sin((deg * Math.PI) / 180)}`;
  const outer = `M ${point(150)} A ${R} ${R} 0 1 1 ${point(30)}`;

  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[250px]">
      <svg viewBox="0 0 200 160" className="size-full" aria-hidden>
        <defs>
          <linearGradient id="gauge" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path d={outer} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 7" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arc} ${circumference}`} transform="rotate(150 100 100)" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="url(#gauge)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${value} ${circumference}`} transform="rotate(150 100 100)" />
        {rating > 0 && <circle cx={knob.x} cy={knob.y} r="8" fill="#fff" stroke="#fbbf24" strokeWidth="4" />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-[20%]">
        <span className="text-6xl font-semibold tracking-tight">{rating ? rating.toFixed(1) : "–"}</span>
        <span className="mt-1 text-sm text-muted">{formatCount(votes)} rated</span>
      </div>
    </div>
  );
}
