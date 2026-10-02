// SQLite file for local use. Override with DATABASE_URL (e.g. a Turso/libsql URL).
export const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

// Accepts either a single DATABASE_URL with ?authToken=… or Turso's usual pair of variables
// (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, which the Vercel–Turso integration sets).
// Keep in sync with scripts/env.mjs.
export function databaseConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.DATABASE_URL || env.TURSO_DATABASE_URL || DEFAULT_DATABASE_URL;
  const authToken = env.DATABASE_AUTH_TOKEN || env.TURSO_AUTH_TOKEN || undefined;
  return { url, authToken };
}
