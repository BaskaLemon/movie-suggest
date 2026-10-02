"use server";

import { getViewer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { MediaType } from "@/lib/types";
import { toWatchlistData } from "@/lib/watchlist-db";

const MAX_ITEMS = 1000;

async function activeProfileId() {
  const profileId = (await getViewer())?.profile?.id;
  if (!profileId) throw new Error("Sign in and choose a profile first.");
  return profileId;
}

export async function addToWatchlist(movie: unknown) {
  const profileId = await activeProfileId();
  const data = toWatchlistData(movie);
  if (!data) throw new Error("Invalid title.");
  if ((await prisma.watchlistItem.count({ where: { profileId } })) >= MAX_ITEMS) throw new Error("Watchlist is full.");
  await prisma.watchlistItem.upsert({
    where: { profileId_mediaType_tmdbId: { profileId, mediaType: data.mediaType, tmdbId: data.tmdbId } },
    create: { ...data, profileId },
    update: {},
  });
}

export async function removeFromWatchlist(mediaType: MediaType, tmdbId: number) {
  const profileId = await activeProfileId();
  await prisma.watchlistItem.deleteMany({ where: { profileId, mediaType: mediaType === "tv" ? "tv" : "movie", tmdbId } });
}

// Moves a signed-out visitor's browser list into the profile. Existing entries win.
export async function importWatchlist(movies: unknown) {
  const profileId = await activeProfileId();
  if (!Array.isArray(movies)) return;
  const rows = movies.slice(0, 200).map(toWatchlistData).filter((r) => r !== null);
  const existing = await prisma.watchlistItem.findMany({ where: { profileId }, select: { mediaType: true, tmdbId: true } });
  const have = new Set(existing.map((e) => `${e.mediaType}:${e.tmdbId}`));
  const fresh = rows.filter((r) => !have.has(`${r.mediaType}:${r.tmdbId}`) && have.add(`${r.mediaType}:${r.tmdbId}`));
  // Oldest first so the browser list's order (newest first) survives the insert timestamps.
  for (const row of fresh.reverse()) await prisma.watchlistItem.create({ data: { ...row, profileId } });
}
