"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useViewer } from "@/components/ViewerProvider";
import type { MediaType, Movie } from "./types";

const BASE_KEY = "reelpick:watchlist";
const EMPTY: Movie[] = [];
const listeners = new Set<() => void>();
const cache = new Map<string, Movie[]>();

// Signed-in profiles each get their own list; signed-out visitors share the original key.
const keyFor = (profileId: string | null | undefined) => (profileId ? `${BASE_KEY}:${profileId}` : BASE_KEY);

function read(key: string): Movie[] {
  const hit = cache.get(key);
  if (hit) return hit;
  let list: Movie[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    // Entries saved before series existed have no mediaType; they are all movies.
    if (Array.isArray(parsed)) list = parsed.map((m: Movie) => ({ ...m, mediaType: m.mediaType ?? "movie" }));
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  cache.set(key, list);
  return list;
}

function write(key: string, next: Movie[]) {
  cache.set(key, next);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory copy for this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (!e.key?.startsWith(BASE_KEY)) return;
    cache.delete(e.key);
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
  const key = keyFor(useViewer()?.profile?.id);
  const getSnapshot = useCallback(() => read(key), [key]);
  const list = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const has = useCallback((mediaType: MediaType, id: number) => list.some((m) => same(m, mediaType, id)), [list]);
  const toggle = useCallback((movie: Movie) => {
    const current = read(key);
    const saved = current.some((m) => same(m, movie.mediaType, movie.id));
    write(key, saved ? current.filter((m) => !same(m, movie.mediaType, movie.id)) : [movie, ...current]);
  }, [key]);
  const remove = useCallback((mediaType: MediaType, id: number) => write(key, read(key).filter((m) => !same(m, mediaType, id))), [key]);
  return { list, has, toggle, remove };
}
