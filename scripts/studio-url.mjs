// Prints the database URL for Prisma Studio, which only accepts the file:// form for SQLite.
// The app and migrations use file:./relative paths, so resolve those to an absolute file:// URL.
import path from "node:path";
import { databaseUrl, isLocalFile } from "./env.mjs";

if (!isLocalFile) {
  console.error(
    `Prisma Studio can't open ${new URL(databaseUrl).host}: it doesn't support libsql/Turso URLs.\n` +
      "Browse the data in the Turso dashboard (https://app.turso.tech) or with `turso db shell <db>`.",
  );
  process.exit(1);
}
console.log(databaseUrl.startsWith("file://") ? databaseUrl : `file://${path.resolve(databaseUrl.slice("file:".length))}`);
