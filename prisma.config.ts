import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { databaseConfig } from "./lib/database-url";

// Load .env / .env.local the same way Next does, so the Prisma CLI (migrate, studio)
// and the running app always point at the same database.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: databaseConfig().url },
});
