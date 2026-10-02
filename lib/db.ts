import { PrismaClient } from "@/generated/prisma/client";
import { databaseConfig } from "./database-url";

const { url, authToken } = databaseConfig();

// The Node libsql client loads a native binary as soon as it's imported (via a computed
// require that serverless file tracing can miss). Remote databases such as Turso only need
// the HTTP client, so the native one is loaded only for a local SQLite file.
const { PrismaLibSql } = url.startsWith("file:")
  ? await import("@prisma/adapter-libsql")
  : await import("@prisma/adapter-libsql/web");

// One client per process; in dev, reuse it across hot reloads instead of opening a new connection each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaLibSql({ url, authToken }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type { Profile, User, WatchlistItem } from "@/generated/prisma/client";
