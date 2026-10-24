import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appUrl } from "@/lib/app-url";
import { OAUTH_COOKIE, googleEnabled } from "@/lib/google";

// Starts Google sign-in: remembers a random state and PKCE verifier in a short-lived
// cookie, then sends the browser to Google's consent screen.
export async function GET() {
  if (!googleEnabled) redirect("/login");
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = `${await appUrl({ preferRequestHost: true })}/auth/google/callback`;

  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ state, verifier, redirectUri }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/google",
    maxAge: 600,
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  redirect(url.toString());
}
