"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MAX_PROFILES,
  PROFILE_COLORS,
  endSession,
  getViewer,
  hashPassword,
  newProfile,
  setSessionProfile,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { read, transact } from "@/lib/db";
import type { PickMedia } from "@/lib/types";

export type FormState = { error?: string; ok?: string };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;
const MEDIA: PickMedia[] = ["all", "movie", "tv"];

// The header, picker and watchlist read the viewer in the root layout. Changing the
// active profile doesn't touch the cookie, so the layout must be refreshed explicitly.
const refreshViewer = () => revalidatePath("/", "layout");

function validName(name: string) {
  return name.length >= 1 && name.length <= 20;
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!validName(name)) return { error: "Enter a name up to 20 characters." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };

  const { salt, passwordHash } = await hashPassword(password);
  const created = await transact((d) => {
    if (d.users.some((u) => u.email === email)) return null;
    const user = { id: randomUUID(), email, salt, passwordHash, createdAt: Date.now() };
    const profile = newProfile(user.id, name, 0);
    d.users.push(user);
    d.profiles.push(profile);
    return { userId: user.id, profileId: profile.id };
  });
  if (!created) return { error: "An account with that email already exists. Sign in instead." };
  await startSession(created.userId, created.profileId);
  refreshViewer();
  redirect("/");
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await read((d) => d.users.find((u) => u.email === email));
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) {
    return { error: "That email and password don't match." };
  }
  const profiles = await read((d) => d.profiles.filter((p) => p.userId === user.id));
  await startSession(user.id, profiles.length === 1 ? profiles[0].id : null);
  refreshViewer();
  redirect(profiles.length === 1 ? "/" : "/profiles");
}

export async function signOut() {
  await endSession();
  refreshViewer();
  redirect("/");
}

async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function chooseProfile(profileId: string) {
  const viewer = await requireViewer();
  if (!viewer.profiles.some((p) => p.id === profileId)) redirect("/profiles");
  await setSessionProfile(profileId);
  refreshViewer();
  redirect("/");
}

function readProfileForm(fd: FormData) {
  const name = text(fd, "name");
  const color = text(fd, "color");
  const media = text(fd, "defaultMedia") as PickMedia;
  return {
    name,
    color: PROFILE_COLORS.includes(color) ? color : PROFILE_COLORS[0],
    defaultMedia: MEDIA.includes(media) ? media : "all",
  };
}

export async function createProfile(_: FormState, fd: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const form = readProfileForm(fd);
  if (!validName(form.name)) return { error: "Enter a name up to 20 characters." };
  const id = await transact((d) => {
    const mine = d.profiles.filter((p) => p.userId === viewer.userId);
    if (mine.length >= MAX_PROFILES) return null;
    const profile = { ...newProfile(viewer.userId, form.name, mine.length), color: form.color, defaultMedia: form.defaultMedia };
    d.profiles.push(profile);
    return profile.id;
  });
  if (!id) return { error: `You can have up to ${MAX_PROFILES} profiles.` };
  refreshViewer();
  redirect("/profiles");
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = text(fd, "id");
  const form = readProfileForm(fd);
  if (!validName(form.name)) return { error: "Enter a name up to 20 characters." };
  const found = await transact((d) => {
    const p = d.profiles.find((x) => x.id === id && x.userId === viewer.userId);
    if (p) Object.assign(p, form);
    return Boolean(p);
  });
  if (!found) return { error: "That profile no longer exists." };
  refreshViewer();
  return { ok: "Saved." };
}

export async function deleteProfile(profileId: string) {
  const viewer = await requireViewer();
  if (viewer.profiles.length <= 1) return;
  await transact((d) => {
    d.profiles = d.profiles.filter((p) => !(p.id === profileId && p.userId === viewer.userId));
    for (const s of d.sessions) if (s.profileId === profileId) s.profileId = null;
  });
  refreshViewer();
  redirect("/profiles");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "Use a new password of at least 8 characters." };
  const user = await read((d) => d.users.find((u) => u.id === viewer.userId));
  if (!user || !(await verifyPassword(current, user.salt, user.passwordHash))) {
    return { error: "Your current password is wrong." };
  }
  const { salt, passwordHash } = await hashPassword(next);
  await transact((d) => {
    const u = d.users.find((x) => x.id === viewer.userId);
    if (u) Object.assign(u, { salt, passwordHash });
  });
  return { ok: "Password updated." };
}
