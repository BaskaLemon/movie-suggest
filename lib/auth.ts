import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma, type Profile } from "./db";
import type { Movie, PickMedia } from "./types";
import { fromWatchlistRow } from "./watchlist-db";

const COOKIE = "rp_session";
const SESSION_DAYS = 30;
export const MAX_PROFILES = 5;

export const PROFILE_COLORS = ["#19b5fe", "#d63a78", "#f59e0b", "#2dd4bf", "#8b5cf6", "#ef4444", "#22c55e", "#f97316"];

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return { salt, passwordHash: (await scryptAsync(password, salt)).toString("hex") };
}

export async function verifyPassword(password: string, salt: string, passwordHash: string) {
  const expected = Buffer.from(passwordHash, "hex");
  const actual = await scryptAsync(password, salt);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Only a hash of the session token is stored, so a leaked database can't be replayed as cookies.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string, profileId: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, profileId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(COOKIE);
}

export async function setSessionProfile(profileId: string | null) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;
  await prisma.session.updateMany({ where: { tokenHash: hashToken(token) }, data: { profileId } });
}

export type Viewer = {
  userId: string;
  email: string;
  profiles: Profile[];
  profile: Profile | null;
  // The active profile's watchlist, newest first.
  watchlist: Movie[];
};

// Cached per request so the layout and page share one lookup.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { include: { profiles: { orderBy: { createdAt: "asc" } } } },
      profile: { include: { watchlist: { orderBy: { addedAt: "desc" } } } },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const { user, profile } = session;
  return {
    userId: user.id,
    email: user.email,
    profiles: user.profiles,
    profile: profile ? user.profiles.find((p) => p.id === profile.id) ?? null : null,
    watchlist: profile ? profile.watchlist.map(fromWatchlistRow) : [],
  };
});

export function profileDefaults(index: number): { color: string; defaultMedia: PickMedia } {
  return { color: PROFILE_COLORS[index % PROFILE_COLORS.length], defaultMedia: "all" };
}
