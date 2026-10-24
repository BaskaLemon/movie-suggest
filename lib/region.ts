import { headers } from "next/headers";

// The visitor's country for streaming availability: Vercel's geo header when deployed,
// otherwise the region in the browser's language (en-GB → GB), otherwise the US.
export async function visitorCountry(): Promise<string> {
  const h = await headers();
  const geo = h.get("x-vercel-ip-country");
  if (geo && /^[A-Z]{2}$/.test(geo)) return geo;
  const lang = h.get("accept-language")?.match(/^[a-z]{2,3}-([A-Z]{2})\b/)?.[1];
  return lang ?? "US";
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
