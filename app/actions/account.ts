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
import { createHash, randomBytes } from "node:crypto";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { googleEnabled } from "@/lib/google";
import { clearHits, clientIp, recordHit, retryAfterMinutes, tooManyMessage } from "@/lib/rate-limit";
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

// Wrong-password attempts share these limits wherever a password is checked.
const passwordLimits = (email: string, ip: string) => [
  { key: `signin:email:${email}`, max: 5, windowMinutes: 15 },
  { key: `signin:ip:${ip}`, max: 20, windowMinutes: 15 },
];

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!validName(name)) return { error: "Enter a name up to 20 characters." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };

  // Caps account creation (and probing which emails exist) per network address.
  const ip = await clientIp();
  const wait = await retryAfterMinutes([{ key: `signup:ip:${ip}`, max: 5, windowMinutes: 60 }]);
  if (wait) return { error: tooManyMessage(wait) };
  await recordHit(`signup:ip:${ip}`);

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
  const ip = await clientIp();
  const limits = passwordLimits(email, ip);
  const wait = await retryAfterMinutes(limits);
  if (wait) return { error: tooManyMessage(wait) };

  const user = await prisma.user.findUnique({ where: { email }, include: { profiles: { select: { id: true } } } });
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) {
    await recordHit(...limits.map((l) => l.key));
    // The same message whatever the reason (unknown email, wrong password, Google-only
    // account), so it can't reveal which emails have accounts.
    return {
      error: googleEnabled
        ? "That email and password don't match. If you signed up with Google, use “Continue with Google”."
        : "That email and password don't match.",
    };
  }
  await clearHits(`signin:email:${email}`);
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
  if (!user) redirect("/login");
  // Accounts created with Google have no password yet; they set one without a current one.
  if (user.passwordHash) {
    const limits = passwordLimits(user.email, await clientIp());
    const wait = await retryAfterMinutes(limits);
    if (wait) return { error: tooManyMessage(wait) };
    if (!(await verifyPassword(current, user.salt, user.passwordHash))) {
      await recordHit(...limits.map((l) => l.key));
      return { error: "Your current password is wrong." };
    }
  }
  await prisma.user.update({ where: { id: user.id }, data: await hashPassword(next) });
  return { ok: user.passwordHash ? "Password updated." : "Password set. You can now also sign in with your email." };
}

const RESET_MINUTES = 60;
const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  const ip = await clientIp();
  const limits = [
    { key: `reset:email:${email}`, max: 3, windowMinutes: 60 },
    { key: `reset:ip:${ip}`, max: 10, windowMinutes: 60 },
  ];
  const wait = await retryAfterMinutes(limits);
  if (wait) return { error: tooManyMessage(wait) };
  await recordHit(...limits.map((l) => l.key));

  // Same reply whether or not the account exists, so the form can't be used to find accounts.
  const sent: FormState = { ok: `If ${email} has an account, a reset link is on its way. It works for ${RESET_MINUTES} minutes.` };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return sent;

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { tokenHash: hashResetToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
  });
  const link = `${await appUrl()}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Reelpick password",
    text: `Someone asked to reset the password for this Reelpick account.\n\nSet a new password: ${link}\n\nThe link works for ${RESET_MINUTES} minutes. If it wasn't you, ignore this email; your password stays the same.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.5"><h2 style="margin:0 0 12px">Reset your Reelpick password</h2><p>Someone asked to reset the password for this Reelpick account.</p><p><a href="${link}" style="display:inline-block;background:#19b5fe;color:#00131f;padding:12px 22px;border-radius:999px;font-weight:600;text-decoration:none">Set a new password</a></p><p style="color:#666;font-size:14px">The link works for ${RESET_MINUTES} minutes. If it wasn't you, ignore this email; your password stays the same.</p></div>`,
  });
  return sent;
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = text(fd, "token");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: { include: { profiles: { select: { id: true } } } } },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: "This reset link has expired or was already used. Request a new one." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: await hashPassword(password) }),
    prisma.passwordResetToken.update({ where: { tokenHash: row.tokenHash }, data: { usedAt: new Date() } }),
    // Sign out every device: whoever had the old password shouldn't stay signed in.
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  await clearHits(`signin:email:${row.user.email}`);
  const only = row.user.profiles.length === 1 ? row.user.profiles[0].id : null;
  await startSession(row.userId, only);
  refreshViewer();
  redirect(only ? "/" : "/profiles");
}

export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const user = await prisma.user.findUnique({ where: { id: viewer.userId } });
  if (!user) redirect("/");
  if (text(fd, "confirmEmail").toLowerCase() !== user.email) {
    return { error: "Type your email exactly to confirm." };
  }
  if (user.passwordHash) {
    const limits = passwordLimits(user.email, await clientIp());
    const wait = await retryAfterMinutes(limits);
    if (wait) return { error: tooManyMessage(wait) };
    if (!(await verifyPassword(String(fd.get("password") ?? ""), user.salt, user.passwordHash))) {
      await recordHit(...limits.map((l) => l.key));
      return { error: "Your password is wrong." };
    }
  }
  // Profiles, watchlists, watched lists, sessions, reset tokens and Google links cascade.
  await prisma.user.delete({ where: { id: user.id } });
  await endSession();
  refreshViewer();
  redirect("/");
}
