import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Tiny JSON-file store. Fine for one Node server (next start).
 * On serverless hosts the disk is temporary: swap these functions for a real
 * database (Postgres, SQLite on a volume, KV) before launch.
 */
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let queue: Promise<unknown> = Promise.resolve();

async function readFile<T>(name: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, name), "utf8")) as T[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeFile<T>(name: string, rows: T[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, name);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
  await fs.rename(tmp, file);
}

/** Serialises writes so concurrent requests can't clobber each other. */
function locked<R>(fn: () => Promise<R>): Promise<R> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export function table<T extends { id: string }>(name: string) {
  const file = `${name}.json`;
  return {
    all: () => readFile<T>(file),
    get: async (id: string) => (await readFile<T>(file)).find((r) => r.id === id),
    insert: (row: T) => locked(async () => {
      const rows = await readFile<T>(file);
      rows.push(row);
      await writeFile(file, rows);
      return row;
    }),
    update: (id: string, patch: Partial<T>) => locked(async () => {
      const rows = await readFile<T>(file);
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) return undefined;
      rows[i] = { ...rows[i], ...patch };
      await writeFile(file, rows);
      return rows[i];
    }),
  };
}
