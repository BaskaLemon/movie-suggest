import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-4 pt-24 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">404</p>
        <h1 className="mt-2 font-display text-7xl tracking-wide">Lost in the cut</h1>
        <p className="mt-3 text-muted">That page doesn’t exist.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-accent-ink">
            Go home
          </Link>
          <Link href="/#pick" className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium hover:bg-white/5">
            Pick something to watch
          </Link>
        </div>
      </div>
    </div>
  );
}
