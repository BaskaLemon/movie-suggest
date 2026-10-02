import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { read, transact, type Profile } from "./db";
import type { PickMedia } from "./types";

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

// Only a hash of the session token is stored, so a leaked data file can't be replayed as cookies.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string, profileId: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000;
  await transact((d) => {
    d.sessions = d.sessions.filter((s) => s.expiresAt > Date.now());
    d.sessions.push({ tokenHash: hashToken(token), userId, profileId, expiresAt });
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await transact((d) => {
      d.sessions = d.sessions.filter((s) => s.tokenHash !== tokenHash);
    });
  }
  store.delete(COOKIE);
}

export async function setSessionProfile(profileId: string | null) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;
  const tokenHash = hashToken(token);
  await transact((d) => {
    const s = d.sessions.find((x) => x.tokenHash === tokenHash);
    if (s) s.profileId = profileId;
  });
}

export type Viewer = {
  userId: string;
  email: string;
  profiles: Profile[];
  profile: Profile | null;
};

// Cached per request so the layout and page share one lookup.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  return read((d) => {
    const session = d.sessions.find((s) => s.tokenHash === tokenHash && s.expiresAt > Date.now());
    const user = session && d.users.find((u) => u.id === session.userId);
    if (!session || !user) return null;
    const profiles = d.profiles.filter((p) => p.userId === user.id).sort((a, b) => a.createdAt - b.createdAt);
    return { userId: user.id, email: user.email, profiles, profile: profiles.find((p) => p.id === session.profileId) ?? null };
  });
});

export function newProfile(userId: string, name: string, index: number, defaultMedia: PickMedia = "all"): Profile {
  return { id: randomUUID(), userId, name, color: PROFILE_COLORS[index % PROFILE_COLORS.length], defaultMedia, createdAt: Date.now() + index };
}
