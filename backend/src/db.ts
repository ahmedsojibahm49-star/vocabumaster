// Turso (libSQL) database: client + Drizzle instance + migrations.
//
// TURSO_DATABASE_URL is either a remote Turso URL
// (libsql://<name>-<org>.turso.io) with TURSO_AUTH_TOKEN, or a local file
// for development / testing (file:./local.db). The same code path serves
// both — the local file is how the zip was verified without a Turso
// account.

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.js";

export interface DbEnv {
  url: string;
  authToken?: string;
}

/**
 * A `file:./local.db` URL in backend/.env must always mean
 * backend/local.db, no matter which directory the command was started
 * from — resolve it against the backend folder. Remote libsql:// URLs
 * pass through untouched.
 */
export function resolveDbUrl(url: string, backendDir: string): string {
  if (!url.startsWith("file:")) return url;
  const p = url.slice("file:".length);
  if (path.isAbsolute(p)) return url;
  return `file:${path.resolve(backendDir, p)}`;
}

export function createDb(env: DbEnv): {
  client: Client;
  db: LibSQLDatabase<typeof schema>;
} {
  const client = createClient({
    url: env.url,
    authToken: env.authToken || undefined,
  });
  const db = drizzle(client, { schema });
  return { client, db };
}

/**
 * Where the drizzle/ migration folder lives. Works both when running
 * from TypeScript source (backend/src -> backend/drizzle) and from the
 * compiled build (backend/dist/src -> backend/dist/drizzle, copied there
 * by `npm run build`).
 */
export function migrationsFolder(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../drizzle");
}

/** Applies drizzle/0001–0010 in order (idempotent — already-applied migrations are skipped). */
export async function runMigrations(
  db: LibSQLDatabase<typeof schema>,
): Promise<void> {
  await migrate(db, { migrationsFolder: migrationsFolder() });
}
