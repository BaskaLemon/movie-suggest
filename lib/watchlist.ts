"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { MediaType, Movie } from "./types";

const KEY = "reelpick:watchlist";
const EMPTY: Movie[] = [];
const listeners = new Set<() => void>();
let cache: Movie[] | null = null;

function read(): Movie[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    // Entries saved before series existed have no mediaType; they are all movies.
    cache = Array.isArray(parsed) ? parsed.map((m: Movie) => ({ ...m, mediaType: m.mediaType ?? "movie" })) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: Movie[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory copy for this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
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
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const has = useCallback((mediaType: MediaType, id: number) => list.some((m) => same(m, mediaType, id)), [list]);
  const toggle = useCallback((movie: Movie) => {
    const current = read();
    const saved = current.some((m) => same(m, movie.mediaType, movie.id));
    write(saved ? current.filter((m) => !same(m, movie.mediaType, movie.id)) : [movie, ...current]);
  }, []);
  const remove = useCallback((mediaType: MediaType, id: number) => write(read().filter((m) => !same(m, mediaType, id))), []);
  return { list, has, toggle, remove };
}
