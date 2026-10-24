import { headers } from "next/headers";

// The site's public address, for links that leave the site (reset emails, OAuth callbacks).
// An explicit APP_URL wins; on Vercel, the production domain; otherwise the request's own host.
export async function appUrl({ preferRequestHost = false } = {}): Promise<string> {
  const explicit = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;
  if (!preferRequestHost && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
