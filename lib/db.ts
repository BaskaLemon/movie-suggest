import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { DEFAULT_DATABASE_URL } from "./database-url";

// One client per process; in dev, reuse it across hot reloads instead of opening a new connection each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type { Profile, User, WatchlistItem } from "@/generated/prisma/client";
