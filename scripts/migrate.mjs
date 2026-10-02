// Applies pending migrations before the app starts (and before `build`, which is what Vercel runs).
//
// Local SQLite files go through `prisma migrate deploy`. Prisma's migration engine doesn't
// accept libsql:// (Turso) URLs, so for those this applies prisma/migrations/*/migration.sql
// itself, recording each one in Prisma's own _prisma_migrations table (same columns,
// checksum and timestamp format), so either path sees the same history.
import { createClient } from "@libsql/client";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { authToken, databaseUrl, isLocalFile } from "./env.mjs";

// On Vercel the filesystem is read-only and reset per request, so a SQLite file can't hold
// accounts. Fail the build with the fix instead of deploying a site whose sign-in is broken.
if (isLocalFile && process.env.VERCEL) {
  console.error(
    "No database is set for this Vercel deployment, so the app would fall back to a local SQLite file, " +
      "which can't work on Vercel.\nIn Vercel → Project → Settings → Environment Variables, set DATABASE_URL to " +
      "libsql://<db>.turso.io?authToken=<token> (or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN), then redeploy.",
  );
  process.exit(1);
}

if (isLocalFile) {
  const cli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [cli, "migrate", "deploy"], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

const dir = path.join(process.cwd(), "prisma", "migrations");
const names = (await readdir(dir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const db = createClient({ url: databaseUrl, authToken });
const host = new URL(databaseUrl).host;

try {
  await db.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
  )`);
  const done = await db.execute(
    `SELECT migration_name, checksum FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
  );
  const applied = new Map(done.rows.map((r) => [String(r.migration_name), String(r.checksum)]));

  let count = 0;
  for (const name of names) {
    const sql = await readFile(path.join(dir, name, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (applied.has(name)) {
      if (applied.get(name) !== checksum) {
        console.warn(`! Migration ${name} was edited after it was applied to ${host}; leaving the database as is.`);
      }
      continue;
    }
    const startedAt = Date.now();
    // The migration and its history row commit together, so a failure leaves nothing half-applied.
    await db.batch(
      [
        sql,
        {
          sql: `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (?, ?, ?, ?, ?, 1)`,
          args: [randomUUID(), checksum, Date.now(), name, startedAt],
        },
      ].flatMap((s) => (typeof s === "string" ? splitStatements(s) : [s])),
      "write",
    );
    console.log(`Applied migration ${name} to ${host}`);
    count++;
  }
  console.log(count ? `${count} migration(s) applied to ${host}.` : `Database at ${host} is up to date.`);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Migrating ${host} failed: ${message}`);
  if (/\b401\b/.test(message)) {
    const hasToken = Boolean(authToken) || new URL(databaseUrl).searchParams.has("authToken");
    console.error(
      hasToken
        ? "Turso rejected the auth token. It may be expired, revoked, or for another database. Create a new one with " +
            "`turso db tokens create <db>` (or in the Turso dashboard) and update it where you set it."
        : "No Turso auth token was sent. Either end DATABASE_URL with ?authToken=<token>, or set TURSO_AUTH_TOKEN " +
            "(or DATABASE_AUTH_TOKEN) next to it.",
    );
  }
  process.exit(1);
} finally {
  db.close();
}

// db.batch takes one statement per entry. Prisma's SQLite migrations are plain DDL separated
// by semicolons at line ends, with no triggers or string literals containing ";\n".
function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
}
