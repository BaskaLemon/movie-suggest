"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Movie } from "./types";

const KEY = "reelpick:watchlist";
const EMPTY: Movie[] = [];
const listeners = new Set<() => void>();
let cache: Movie[] | null = null;

function read(): Movie[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
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

export function useWatchlist() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const has = useCallback((id: number) => list.some((m) => m.id === id), [list]);
  const toggle = useCallback((movie: Movie) => {
    const current = read();
    write(current.some((m) => m.id === movie.id) ? current.filter((m) => m.id !== movie.id) : [movie, ...current]);
  }, []);
  const remove = useCallback((id: number) => write(read().filter((m) => m.id !== id)), []);
  return { list, has, toggle, remove };
}
