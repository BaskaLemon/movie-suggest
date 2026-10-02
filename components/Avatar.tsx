export function Avatar({ name, color, size = 36, className = "" }: { name: string; color: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-xl font-semibold text-white shadow-inner ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, ${color}, ${color}99)` }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
