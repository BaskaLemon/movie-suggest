import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PickMedia } from "./types";

// A tiny JSON-file store for accounts. Good for running locally; swap for a real
// database before deploying anywhere with an ephemeral or shared filesystem.

export type User = { id: string; email: string; passwordHash: string; salt: string; createdAt: number };
export type Profile = { id: string; userId: string; name: string; color: string; defaultMedia: PickMedia; createdAt: number };
export type Session = { tokenHash: string; userId: string; profileId: string | null; expiresAt: number };
type Data = { users: User[]; profiles: Profile[]; sessions: Session[] };

const FILE = path.join(process.env.REELPICK_DATA_DIR ?? path.join(process.cwd(), ".data"), "db.json");

async function load(): Promise<Data> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { users: [], profiles: [], sessions: [] };
    throw err;
  }
}

async function save(data: Data) {
  await mkdir(path.dirname(FILE), { recursive: true });
  // Write then rename so a crash mid-write never leaves a half-written file.
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, FILE);
}

let queue: Promise<unknown> = Promise.resolve();

// Serialises read-modify-write cycles so concurrent requests don't overwrite each other.
export function transact<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function read<T>(fn: (data: Data) => T): Promise<T> {
  await queue;
  return fn(await load());
}
