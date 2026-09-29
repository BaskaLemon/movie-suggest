"use client";

import { Bookmark, Compass, Dices, Home, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#pick", label: "Pick for me", icon: Dices },
  { href: "/#browse", label: "Browse", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

export function SideRail() {
  const pathname = usePathname();
  return (
    <nav aria-label="Quick links" className="fixed left-0 top-0 z-30 hidden h-dvh w-20 flex-col items-center justify-center gap-3 lg:flex">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const current = href === pathname;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            className={`group relative grid size-11 place-items-center rounded-xl transition ${
              current ? "bg-white/10 text-ink" : "text-ink/60 hover:bg-white/5 hover:text-ink"
            }`}
          >
            <Icon size={21} strokeWidth={1.75} />
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-surface-solid px-2.5 py-1 text-xs opacity-0 shadow-lg transition group-hover:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
