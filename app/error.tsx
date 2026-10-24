"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

// Shown inside the normal layout when a page fails (TMDB or the database unreachable, a bug).
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70svh] place-items-center px-4 pt-24 text-center">
      <div className="max-w-md">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Technical difficulties</p>
        <h1 className="mt-2 font-display text-6xl tracking-wide">The reel snapped</h1>
        <p className="mt-3 text-muted">Something went wrong loading this page. It’s usually temporary.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition hover:brightness-110"
          >
            <RotateCcw size={17} /> Try again
          </button>
          <Link href="/" className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-medium hover:bg-white/5">
            Go home
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-muted">Error reference: {error.digest}</p>}
      </div>
    </div>
  );
}
