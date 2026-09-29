"use client";

import { Bookmark, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchBox } from "./SearchBox";
import { useWatchlist } from "@/lib/watchlist";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#pick", label: "Pick for me" },
  { href: "/#browse", label: "Browse" },
  { href: "/watchlist", label: "Watchlist" },
];

export function Header() {
  const pathname = usePathname();
  const { list } = useWatchlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-line bg-[#05071a]/75 backdrop-blur-xl" : "bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div className="flex h-16 items-center gap-4 px-4 sm:px-8 lg:pl-28">
        <Link href="/" className="font-display text-3xl tracking-[0.12em] text-ink lg:order-2 lg:mx-auto">
          REEL<span className="text-accent">PICK</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium lg:order-1 lg:flex">
          {NAV.map((item) => {
            const current = item.href === pathname;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`relative transition hover:text-ink ${current ? "text-ink" : "text-ink/70"}`}
              >
                {item.label}
                {current && <span className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:order-3 lg:ml-0">
          <SearchBox className="hidden w-72 md:block" />
          <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-full text-ink/80 hover:bg-white/10 md:hidden">
            <Search size={20} />
          </Link>
          <Link
            href="/watchlist"
            aria-label={`Watchlist, ${list.length} saved`}
            className="relative grid size-10 place-items-center rounded-full text-ink/80 transition hover:bg-white/10 hover:text-ink"
          >
            <Bookmark size={20} />
            {list.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-hot px-1 text-[10px] font-semibold text-white">
                {list.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
