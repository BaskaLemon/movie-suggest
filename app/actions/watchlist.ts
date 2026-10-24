"use server";

import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { MediaType } from "@/lib/types";
import { toWatchlistData, type ListName } from "@/lib/watchlist-db";

const MAX_ITEMS = 1000;

async function activeProfileId() {
  const profileId = (await getViewer())?.profile?.id;
  if (!profileId) throw new Error("Sign in and choose a profile first.");
  return profileId;
}

const checkList = (list: unknown): ListName => {
  if (list !== "watchlist" && list !== "watched") throw new Error("Unknown list.");
  return list;
};

type Row = NonNullable<ReturnType<typeof toWatchlistData>>;
type Key = { profileId: string; mediaType: string; tmdbId: number };

// The two tables have identical shapes; this picks the right one without losing types.
function table(list: ListName) {
  return list === "watched"
    ? {
        count: (profileId: string) => prisma.watchedItem.count({ where: { profileId } }),
        keys: (profileId: string) => prisma.watchedItem.findMany({ where: { profileId }, select: { mediaType: true, tmdbId: true } }),
        upsert: (k: Key, row: Row) =>
          prisma.watchedItem.upsert({ where: { profileId_mediaType_tmdbId: k }, create: { ...row, profileId: k.profileId }, update: {} }),
        create: (profileId: string, row: Row) => prisma.watchedItem.create({ data: { ...row, profileId } }),
        remove: (k: Key) => prisma.watchedItem.deleteMany({ where: k }),
      }
    : {
        count: (profileId: string) => prisma.watchlistItem.count({ where: { profileId } }),
        keys: (profileId: string) => prisma.watchlistItem.findMany({ where: { profileId }, select: { mediaType: true, tmdbId: true } }),
        upsert: (k: Key, row: Row) =>
          prisma.watchlistItem.upsert({ where: { profileId_mediaType_tmdbId: k }, create: { ...row, profileId: k.profileId }, update: {} }),
        create: (profileId: string, row: Row) => prisma.watchlistItem.create({ data: { ...row, profileId } }),
        remove: (k: Key) => prisma.watchlistItem.deleteMany({ where: k }),
      };
}

export async function addToList(list: ListName, movie: unknown) {
  const t = table(checkList(list));
  const profileId = await activeProfileId();
  const row = toWatchlistData(movie);
  if (!row) throw new Error("Invalid title.");
  if ((await t.count(profileId)) >= MAX_ITEMS) throw new Error("List is full.");
  await t.upsert({ profileId, mediaType: row.mediaType, tmdbId: row.tmdbId }, row);
}

export async function removeFromList(list: ListName, mediaType: MediaType, tmdbId: number) {
  const t = table(checkList(list));
  const profileId = await activeProfileId();
  await t.remove({ profileId, mediaType: mediaType === "tv" ? "tv" : "movie", tmdbId });
}

// Moves a signed-out visitor's browser list into the profile. Existing entries win.
export async function importList(list: ListName, movies: unknown) {
  const t = table(checkList(list));
  const profileId = await activeProfileId();
  if (!Array.isArray(movies)) return;
  const rows = movies.slice(0, 200).map(toWatchlistData).filter((r) => r !== null);
  const have = new Set((await t.keys(profileId)).map((e) => `${e.mediaType}:${e.tmdbId}`));
  const fresh: Row[] = [];
  for (const r of rows) {
    const key = `${r.mediaType}:${r.tmdbId}`;
    if (have.has(key)) continue;
    have.add(key);
    fresh.push(r);
  }
  // Oldest first so the browser list's order (newest first) survives the insert timestamps.
  for (const row of fresh.reverse()) await t.create(profileId, row);
}
