"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MAX_PROFILES,
  PROFILE_COLORS,
  endSession,
  getViewer,
  hashPassword,
  profileDefaults,
  setSessionProfile,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists. Sign in instead." };
  }
  const { salt, passwordHash } = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, salt, passwordHash, profiles: { create: { name, ...profileDefaults(0) } } },
    include: { profiles: true },
  });
  await startSession(user.id, user.profiles[0].id);
  refreshViewer();
  redirect("/");
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email }, include: { profiles: { select: { id: true } } } });
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) {
    return { error: "That email and password don't match." };
  }
  const only = user.profiles.length === 1 ? user.profiles[0].id : null;
  await startSession(user.id, only);
  refreshViewer();
  redirect(only ? "/" : "/profiles");
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
  const count = await prisma.profile.count({ where: { userId: viewer.userId } });
  if (count >= MAX_PROFILES) return { error: `You can have up to ${MAX_PROFILES} profiles.` };
  await prisma.profile.create({ data: { ...form, userId: viewer.userId } });
  refreshViewer();
  redirect("/profiles");
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const form = readProfileForm(fd);
  if (!validName(form.name)) return { error: "Enter a name up to 20 characters." };
  // Scoped to the viewer's own profiles, so an id from another account matches nothing.
  const { count } = await prisma.profile.updateMany({ where: { id: text(fd, "id"), userId: viewer.userId }, data: form });
  if (!count) return { error: "That profile no longer exists." };
  refreshViewer();
  return { ok: "Saved." };
}

export async function deleteProfile(profileId: string) {
  const viewer = await requireViewer();
  if (viewer.profiles.length <= 1) return;
  // Sessions on this profile fall back to "Choose profile"; its watchlist goes with it (cascade).
  await prisma.profile.deleteMany({ where: { id: profileId, userId: viewer.userId } });
  refreshViewer();
  redirect("/profiles");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "Use a new password of at least 8 characters." };
  const user = await prisma.user.findUnique({ where: { id: viewer.userId } });
  if (!user || !(await verifyPassword(current, user.salt, user.passwordHash))) {
    return { error: "Your current password is wrong." };
  }
  await prisma.user.update({ where: { id: user.id }, data: await hashPassword(next) });
  return { ok: "Password updated." };
}
