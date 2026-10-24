import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { profileDefaults, startSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OAUTH_COOKIE, googleEnabled } from "@/lib/google";

type GoogleUser = { sub: string; email?: string; email_verified?: boolean; given_name?: string; name?: string };

async function fetchGoogleUser(code: string, verifier: string, redirectUri: string): Promise<GoogleUser | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenRes.ok) {
    console.error("[google] token exchange failed:", tokenRes.status, await tokenRes.text().catch(() => ""));
    return null;
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return null;
  // The profile comes straight from Google over TLS with our token, so no ID-token signature check is needed.
  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  return userRes.ok ? ((await userRes.json()) as GoogleUser) : null;
}

export async function GET(request: NextRequest) {
  if (!googleEnabled) redirect("/login");
  const params = request.nextUrl.searchParams;
  const store = await cookies();
  const saved = store.get(OAUTH_COOKIE)?.value;
  store.delete({ name: OAUTH_COOKIE, path: "/auth/google" });

  if (params.get("error")) redirect("/login?error=google_cancelled");
  let flow: { state: string; verifier: string; redirectUri: string } | null = null;
  try {
    flow = saved ? JSON.parse(saved) : null;
  } catch {
    flow = null;
  }
  const code = params.get("code");
  // The state must match what this browser was sent off with, or this isn't our sign-in.
  if (!flow || !code || params.get("state") !== flow.state) redirect("/login?error=google_failed");

  const google = await fetchGoogleUser(code, flow.verifier, flow.redirectUri).catch((err) => {
    console.error("[google] sign-in failed:", err);
    return null;
  });
  if (!google?.sub) redirect("/login?error=google_failed");

  let userId = (await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: google.sub } },
  }))?.userId;

  if (!userId) {
    const email = google.email?.toLowerCase();
    // Linking by email is only safe when Google has verified the address belongs to this person.
    if (!email || !google.email_verified) redirect("/login?error=google_unverified");
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.oAuthAccount.create({ data: { provider: "google", providerAccountId: google.sub, userId: existing.id } });
      userId = existing.id;
    } else {
      const name = (google.given_name || google.name || email.split("@")[0]).slice(0, 20);
      const created = await prisma.user.create({
        data: {
          email,
          // No password until they set one on the account page; verifyPassword never matches "".
          passwordHash: "",
          salt: "",
          profiles: { create: { name, ...profileDefaults(0) } },
          oauthAccounts: { create: { provider: "google", providerAccountId: google.sub } },
        },
      });
      userId = created.id;
    }
  }

  const profiles = await prisma.profile.findMany({ where: { userId }, select: { id: true } });
  const only = profiles.length === 1 ? profiles[0].id : null;
  await startSession(userId, only);
  revalidatePath("/", "layout");
  redirect(only ? "/" : "/profiles");
}
