"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { addToWatchlist, importWatchlist, removeFromWatchlist } from "@/app/actions/watchlist";
import { useViewer } from "@/components/ViewerProvider";
import type { MediaType, Movie } from "./types";

// Signed-out visitors keep a list in browser storage. A signed-in profile's list lives in
// the database: the layout sends it down, and edits apply here first, then save on the server.
const GUEST_KEY = "reelpick:watchlist";
const EMPTY: Movie[] = [];
const listeners = new Set<() => void>();
const lists = new Map<string, Movie[]>();
// The server list each profile's local copy was last seeded from.
const seeds = new Map<string, Movie[]>();

const notify = () => listeners.forEach((l) => l());

function readGuest(): Movie[] {
  const hit = lists.get(GUEST_KEY);
  if (hit) return hit;
  let list: Movie[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_KEY) ?? "[]");
    // Entries saved before series existed have no mediaType; they are all movies.
    if (Array.isArray(parsed)) list = parsed.map((m: Movie) => ({ ...m, mediaType: m.mediaType ?? "movie" }));
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  lists.set(GUEST_KEY, list);
  return list;
}

function writeGuest(next: Movie[]) {
  lists.set(GUEST_KEY, next);
  try {
    if (next.length) localStorage.setItem(GUEST_KEY, JSON.stringify(next));
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage full or blocked: keep the in-memory copy for this session.
  }
  notify();
}

function readProfile(profileId: string, seed: Movie[]): Movie[] {
  // A fresh server render (new seed) replaces whatever we had; otherwise keep local edits.
  if (seeds.get(profileId) !== seed) {
    seeds.set(profileId, seed);
    lists.set(profileId, seed);
  }
  return lists.get(profileId)!;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== GUEST_KEY) return;
    lists.delete(GUEST_KEY);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Movie and series ids overlap on TMDB, so entries are keyed on both.
const same = (m: Movie, mediaType: MediaType, id: number) => m.mediaType === mediaType && m.id === id;

export function useWatchlist() {
  const viewer = useViewer();
  const profileId = viewer?.profile?.id ?? null;
  const seed = viewer?.watchlist ?? EMPTY;

  const getSnapshot = useCallback(() => (profileId ? readProfile(profileId, seed) : readGuest()), [profileId, seed]);
  // The server knows a profile's list, so its first render already shows the right count.
  const getServerSnapshot = useCallback(() => (profileId ? seed : EMPTY), [profileId, seed]);
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const has = useCallback((mediaType: MediaType, id: number) => list.some((m) => same(m, mediaType, id)), [list]);

  const toggle = useCallback(
    (movie: Movie) => {
      if (!profileId) {
        const current = readGuest();
        const saved = current.some((m) => same(m, movie.mediaType, movie.id));
        writeGuest(saved ? current.filter((m) => !same(m, movie.mediaType, movie.id)) : [movie, ...current]);
        return;
      }
      const before = lists.get(profileId) ?? seed;
      const saved = before.some((m) => same(m, movie.mediaType, movie.id));
      lists.set(profileId, saved ? before.filter((m) => !same(m, movie.mediaType, movie.id)) : [movie, ...before]);
      notify();
      (saved ? removeFromWatchlist(movie.mediaType, movie.id) : addToWatchlist(movie)).catch(() => {
        // Save failed (signed out elsewhere, offline): put the list back as it was.
        lists.set(profileId, before);
        notify();
      });
    },
    [profileId, seed],
  );

  const remove = useCallback(
    (mediaType: MediaType, id: number) => {
      const current = profileId ? (lists.get(profileId) ?? seed) : readGuest();
      const movie = current.find((m) => same(m, mediaType, id));
      if (movie) toggle(movie);
    },
    [profileId, seed, toggle],
  );

  return { list, has, toggle, remove };
}

let importing = false;

// Mounted once in the layout: the first time a profile is active in this browser,
// any signed-out list is moved into it.
export function useImportGuestWatchlist() {
  const viewer = useViewer();
  const profileId = viewer?.profile?.id ?? null;
  const seed = viewer?.watchlist;
  useEffect(() => {
    if (!profileId || !seed || importing) return;
    const guest = readGuest();
    if (!guest.length) return;
    importing = true;
    const current = readProfile(profileId, seed);
    const merged = [...current, ...guest.filter((g) => !current.some((m) => same(m, g.mediaType, g.id)))];
    lists.set(profileId, merged);
    notify();
    importWatchlist(guest)
      .then(() => writeGuest([]))
      .catch(() => {
        lists.set(profileId, current);
        notify();
      })
      .finally(() => {
        importing = false;
      });
  }, [profileId, seed]);
}
