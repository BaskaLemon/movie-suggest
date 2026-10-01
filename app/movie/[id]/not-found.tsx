import Link from "next/link";

export default function MovieNotFound() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-4 pt-24 text-center">
      <div>
        <p className="font-display text-7xl tracking-wide">Lost in the cut</p>
        <p className="mt-3 text-muted">We couldn’t find that title.</p>
        <Link href="/#pick" className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-accent-ink">
          Pick something else
        </Link>
      </div>
    </div>
  );
}
