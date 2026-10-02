import { defineConfig } from "prisma/config";

// SQLite file for local use. Override with DATABASE_URL (e.g. a Turso/libsql URL).
export const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL },
});
