"use client";

import { Bookmark, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileMenu } from "./ProfileMenu";
import { SearchBox } from "./SearchBox";
import { useWatchlist } from "@/lib/watchlist";

export function Header() {
  const { list } = useWatchlist();
  // The search page has its own big input.
  const onSearch = usePathname() === "/search";
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
        <Link href="/" className="font-display text-3xl tracking-[0.12em] text-ink">
          REEL<span className="text-accent">PICK</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {!onSearch && <SearchBox className="hidden w-72 md:block" />}
          <Link href="/search" aria-label="Search" className={`size-10 place-items-center rounded-full text-ink/80 hover:bg-white/10 md:hidden ${onSearch ? "hidden" : "grid"}`}>
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
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
