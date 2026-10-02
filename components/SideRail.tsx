"use client";

import { Bookmark, Compass, Dices, Home, Search, Tv } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#pick", label: "Pick for me", icon: Dices },
  { href: "/#series", label: "Series", icon: Tv },
  { href: "/#browse", label: "Browse", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

const SECTIONS = ["pick", "series", "browse"];

// On the home page, the last section whose top has crossed 40% of the viewport.
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      const passed = SECTIONS.map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el) && el!.getBoundingClientRect().top <= line)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      setActive(passed.length ? passed[passed.length - 1].id : null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);
  return enabled ? active : null;
}

export function SideRail() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const section = useActiveSection(onHome);

  const isCurrent = (href: string) => {
    if (href.startsWith("/#")) return onHome && section === href.slice(2);
    if (href === "/") return onHome && section === null;
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Quick links" className="fixed left-0 top-0 z-30 hidden h-dvh w-20 flex-col items-center justify-center lg:flex">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-[#05071a]/60 p-2 backdrop-blur-xl">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={current ? "location" : undefined}
              title={label}
              className={`group relative grid size-11 place-items-center rounded-xl transition duration-300 ${
                current
                  ? "bg-accent/15 text-accent shadow-[0_0_24px_-4px_rgba(25,181,254,0.6)]"
                  : "text-ink/60 hover:bg-white/5 hover:text-ink"
              }`}
            >
              {current && <span className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent" />}
              <Icon size={21} strokeWidth={current ? 2.25 : 1.75} />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-surface-solid px-2.5 py-1 text-xs text-ink opacity-0 shadow-lg transition group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
