import { headers } from "next/headers";
import { prisma } from "./db";

// Counts events per key in the database rather than in memory, because serverless
// instances don't share memory and each one would otherwise get its own allowance.

export type Limit = { key: string; max: number; windowMinutes: number };

// The visitor's address as reported by Vercel's proxy (first hop of x-forwarded-for).
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// Minutes until the first exceeded limit frees up, or 0 if every limit has room.
export async function retryAfterMinutes(limits: Limit[]): Promise<number> {
  let wait = 0;
  for (const { key, max, windowMinutes } of limits) {
    const since = new Date(Date.now() - windowMinutes * 60_000);
    const hits = await prisma.rateLimitHit.findMany({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (hits.length >= max) {
      // The window frees up when the oldest hit that keeps us at the limit ages out.
      const freesAt = hits[hits.length - max].createdAt.getTime() + windowMinutes * 60_000;
      wait = Math.max(wait, Math.ceil((freesAt - Date.now()) / 60_000));
    }
  }
  return wait;
}

export async function recordHit(...keys: string[]) {
  await prisma.rateLimitHit.createMany({ data: keys.map((key) => ({ key })) });
  // Opportunistic cleanup: nothing counts hits older than a day.
  if (Math.random() < 0.05) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
  }
}

export async function clearHits(...keys: string[]) {
  await prisma.rateLimitHit.deleteMany({ where: { key: { in: keys } } });
}

export function tooManyMessage(minutes: number) {
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
