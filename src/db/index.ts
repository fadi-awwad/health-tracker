import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

// Survive dev hot-reloads without opening a new connection each time.
const globalForDb = globalThis as unknown as { __db?: DB };

function open(): DB {
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

/** Lazily opened so `next build` never touches a database. */
export function db(): DB {
  globalForDb.__db ??= open();
  return globalForDb.__db;
}

export * from "./schema";
