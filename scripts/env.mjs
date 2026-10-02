// Shared by the db scripts: load .env/.env.local like Next does and resolve the database.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

// Keep in sync with lib/database-url.ts.
export const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";
export const databaseUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || DEFAULT_DATABASE_URL;
export const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;
export const isLocalFile = databaseUrl.startsWith("file:");
