// Prints the database URL for Prisma Studio, which only accepts the file:// form for SQLite.
// The app and migrations use file:./relative paths, so resolve those to an absolute file:// URL.
import nextEnv from "@next/env";
import path from "node:path";

nextEnv.loadEnvConfig(process.cwd());
// Keep in sync with lib/database-url.ts.
const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
console.log(url.startsWith("file:") && !url.startsWith("file://") ? `file://${path.resolve(url.slice("file:".length))}` : url);
