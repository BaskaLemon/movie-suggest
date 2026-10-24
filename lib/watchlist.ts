"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { addToList, importList, removeFromList } from "@/app/actions/watchlist";
import { useViewer } from "@/components/ViewerProvider";
import type { MediaType, Movie } from "./types";
import type { ListName } from "./watchlist-db";

// Two per-profile lists share this store: the watchlist and the watched list.
// Signed-out visitors keep them in browser storage. A signed-in profile's lists live in the
// database: the layout sends them down, and edits apply here first, then save on the server.
const GUEST_KEYS: Record<ListName, string> = { watchlist: "reelpick:watchlist", watched: "reelpick:watched" };
const EMPTY: Movie[] = [];
const listeners = new Set<() => void>();
const lists = new Map<string, Movie[]>();
// The server list each profile's local copy was last seeded from.
const seeds = new Map<string, Movie[]>();

const notify = () => listeners.forEach((l) => l());
const profileKey = (list: ListName, profileId: string) => `${list}:${profileId}`;

function readGuest(list: ListName): Movie[] {
  const key = GUEST_KEYS[list];
  const hit = lists.get(key);
  if (hit) return hit;
  let items: Movie[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    // Entries saved before series existed have no mediaType; they are all movies.
    if (Array.isArray(parsed)) items = parsed.map((m: Movie) => ({ ...m, mediaType: m.mediaType ?? "movie" }));
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  lists.set(key, items);
  return items;
}

function writeGuest(list: ListName, next: Movie[]) {
  const key = GUEST_KEYS[list];
  lists.set(key, next);
  try {
    if (next.length) localStorage.setItem(key, JSON.stringify(next));
    else localStorage.removeItem(key);
  } catch {
    // Storage full or blocked: keep the in-memory copy for this session.
  }
  notify();
}

function readProfile(list: ListName, profileId: string, seed: Movie[]): Movie[] {
  const key = profileKey(list, profileId);
  // A fresh server render (new seed) replaces whatever we had; otherwise keep local edits.
  if (seeds.get(key) !== seed) {
    seeds.set(key, seed);
    lists.set(key, seed);
  }
  return lists.get(key)!;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || !Object.values(GUEST_KEYS).includes(e.key)) return;
    lists.delete(e.key);
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

export function useList(list: ListName) {
  const viewer = useViewer();
  const profileId = viewer?.profile?.id ?? null;
  const seed = viewer?.[list] ?? EMPTY;

  const getSnapshot = useCallback(
    () => (profileId ? readProfile(list, profileId, seed) : readGuest(list)),
    [list, profileId, seed],
  );
  // The server knows a profile's lists, so its first render already shows the right counts.
  const getServerSnapshot = useCallback(() => (profileId ? seed : EMPTY), [profileId, seed]);
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const has = useCallback((mediaType: MediaType, id: number) => items.some((m) => same(m, mediaType, id)), [items]);

  const toggle = useCallback(
    (movie: Movie) => {
      if (!profileId) {
        const current = readGuest(list);
        const saved = current.some((m) => same(m, movie.mediaType, movie.id));
        writeGuest(list, saved ? current.filter((m) => !same(m, movie.mediaType, movie.id)) : [movie, ...current]);
        return;
      }
      const key = profileKey(list, profileId);
      const before = lists.get(key) ?? seed;
      const saved = before.some((m) => same(m, movie.mediaType, movie.id));
      lists.set(key, saved ? before.filter((m) => !same(m, movie.mediaType, movie.id)) : [movie, ...before]);
      notify();
      (saved ? removeFromList(list, movie.mediaType, movie.id) : addToList(list, movie)).catch(() => {
        // Save failed (signed out elsewhere, offline): put the list back as it was.
        lists.set(key, before);
        notify();
      });
    },
    [list, profileId, seed],
  );

  const remove = useCallback(
    (mediaType: MediaType, id: number) => {
      const current = profileId ? (lists.get(profileKey(list, profileId)) ?? seed) : readGuest(list);
      const movie = current.find((m) => same(m, mediaType, id));
      if (movie) toggle(movie);
    },
    [list, profileId, seed, toggle],
  );

  return { list: items, has, toggle, remove };
}

export const useWatchlist = () => useList("watchlist");
export const useWatched = () => useList("watched");

const importing = new Set<ListName>();

// Mounted once in the layout: the first time a profile is active in this browser,
// any signed-out lists are moved into it.
export function useImportGuestLists() {
  const viewer = useViewer();
  const profileId = viewer?.profile?.id ?? null;
  const watchlistSeed = viewer?.watchlist;
  const watchedSeed = viewer?.watched;
  useEffect(() => {
    if (!profileId) return;
    for (const [list, seed] of [["watchlist", watchlistSeed], ["watched", watchedSeed]] as const) {
      if (!seed || importing.has(list)) continue;
      const guest = readGuest(list);
      if (!guest.length) continue;
      importing.add(list);
      const key = profileKey(list, profileId);
      const current = readProfile(list, profileId, seed);
      lists.set(key, [...current, ...guest.filter((g) => !current.some((m) => same(m, g.mediaType, g.id)))]);
      notify();
      importList(list, guest)
        .then(() => writeGuest(list, []))
        .catch(() => {
          lists.set(key, current);
          notify();
        })
        .finally(() => importing.delete(list));
    }
  }, [profileId, watchlistSeed, watchedSeed]);
}
