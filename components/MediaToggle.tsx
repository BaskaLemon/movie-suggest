"use client";

import { Clapperboard, Tv } from "lucide-react";
import { motion } from "motion/react";
import type { MediaType } from "@/lib/types";

const OPTIONS: { id: MediaType; label: string; icon: typeof Tv }[] = [
  { id: "movie", label: "Movies", icon: Clapperboard },
  { id: "tv", label: "Series", icon: Tv },
];

// `layoutGroup` keeps the sliding pill separate when several toggles are on one page.
export function MediaToggle({ value, onChange, layoutGroup }: { value: MediaType; onChange: (m: MediaType) => void; layoutGroup: string }) {
  return (
    <div role="radiogroup" aria-label="Movies or series" className="inline-flex rounded-full border border-line bg-white/[0.04] p-1">
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const on = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className={`relative inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${on ? "text-accent-ink" : "text-ink/75 hover:text-ink"}`}
          >
            {on && <motion.span layoutId={`${layoutGroup}-pill`} className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <Icon size={16} className="relative" />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
