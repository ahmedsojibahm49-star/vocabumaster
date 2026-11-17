// One-shot migrate + seed, used by `npm run setup` and `npm run migrate`.
// Exits after printing the counts — the same code also runs automatically
// on every backend boot (server.ts), so this is only needed for the first
// setup or a manual re-seed.

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Actions } from "./actions.js";
import { DiskBlobs } from "./blobs.js";
import { makeCtx } from "./ctx.js";
import { createDb, resolveDbUrl, runMigrations } from "./db.js";
import * as schema from "./schema.js";
import { sql } from "drizzle-orm";

const HERE = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(HERE, "../.env") });

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set — copy backend/.env.example to backend/.env first.",
    );
  }
  const { db } = createDb({
    url: resolveDbUrl(url, path.resolve(HERE, "..")),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  console.log("[vocabmaster] database:", url);
  await runMigrations(db);
  console.log("[vocabmaster] migrations: 0001-0010 applied");
  const blobs = new DiskBlobs(
    path.resolve(HERE, "../uploads"),
    () => "http://localhost:4000",
    process.env.JWT_SECRET ?? "setup-only",
  );
  const ctx = makeCtx(db, blobs);
  const seed = (await Actions.importVocab.handler(ctx, {})) as {
    wordsImported: number;
    lessonsSeeded: number;
    coursesSeeded: number;
    strayLessonsRemoved: number;
    respellingsSynced: number;
    alreadyDone: boolean;
  };
  console.log("[vocabmaster] importVocab:", JSON.stringify(seed));
  const stats = await db
    .select({ level: schema.words.level, count: sql<number>`count(*)` })
    .from(schema.words)
    .groupBy(schema.words.level);
  const total = stats.reduce((s, r) => s + r.count, 0);
  const lessons = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.grammarLessons);
  const courses = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.courses);
  const courseLessons = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.courseLessons);
  const settings = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.settings);
  console.log(
    `[vocabmaster] counts: words=${total} (${stats
      .map((r) => `${r.level}:${r.count}`)
      .join(" ")}), grammar=${lessons[0]?.n ?? 0}, courses=${courses[0]?.n ?? 0}, ` +
      `courseLessons=${courseLessons[0]?.n ?? 0}, settings=${settings[0]?.n ?? 0}`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("[vocabmaster] setup failed:", e);
  process.exit(1);
});
