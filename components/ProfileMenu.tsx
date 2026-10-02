"use client";

import { ChevronDown, LogOut, Settings, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { useViewer } from "./ViewerProvider";
import { chooseProfile, signOut } from "@/app/actions/account";

export function ProfileMenu() {
  const viewer = useViewer();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!viewer) {
    return (
      <Link href="/login" className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition hover:brightness-110">
        Sign in
      </Link>
    );
  }

  const { profile, profiles } = viewer;
  if (!profile) {
    return (
      <Link href="/profiles" className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium hover:bg-white/10">
        Choose profile
      </Link>
    );
  }

  const others = profiles.filter((p) => p.id !== profile.id);
  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/85 transition hover:bg-white/10 hover:text-ink";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Profile menu, ${profile.name}`}
        className="flex items-center gap-1.5 rounded-xl p-1 transition hover:bg-white/10"
      >
        <Avatar name={profile.name} color={profile.color} size={34} />
        <ChevronDown size={16} className={`text-ink/70 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="glass absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl p-2 shadow-2xl">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={profile.name} color={profile.color} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium">{profile.name}</p>
              <p className="truncate text-xs text-muted">{viewer.email}</p>
            </div>
          </div>

          {others.length > 0 && (
            <div className="my-1 border-t border-line pt-1">
              {others.map((p) => (
                <form key={p.id} action={chooseProfile.bind(null, p.id)}>
                  <button type="submit" role="menuitem" className={item}>
                    <Avatar name={p.name} color={p.color} size={26} />
                    <span className="truncate">Switch to {p.name}</span>
                  </button>
                </form>
              ))}
            </div>
          )}

          <div className="my-1 border-t border-line pt-1">
            <Link href={`/profiles/${profile.id}`} role="menuitem" className={item} onClick={() => setOpen(false)}>
              <UserCog size={18} /> Profile settings
            </Link>
            <Link href="/profiles" role="menuitem" className={item} onClick={() => setOpen(false)}>
              <Users size={18} /> Manage profiles
            </Link>
            <Link href="/account" role="menuitem" className={item} onClick={() => setOpen(false)}>
              <Settings size={18} /> Account
            </Link>
          </div>
          <div className="mt-1 border-t border-line pt-1">
            <form action={signOut}>
              <button type="submit" role="menuitem" className={item}>
                <LogOut size={18} /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
