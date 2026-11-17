// VocabMaster standalone backend — Node + Express + TypeScript, Turso
// (libSQL) via Drizzle. Every action from actions.ts is served as
// `POST /api/<actionName>` with a JSON body; the React client calls them
// through frontend/src/api.ts.
//
//   npm run dev      -> this file via tsx (port 4000, auto migrate+seed)
//   npm run build    -> tsc -> backend/dist/server.js
//   npm start        -> node backend/dist/server.js (also serves the
//                       built frontend from frontend/dist when present)
//
// Uploaded files live on local disk under backend/uploads/ (see blobs.ts):
// public course videos/images at /api/files/<key>, the private book PDF
// only at /api/files/book?token=<10-minute signed token> for verified buyers.

import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { createReadStream, existsSync } from "node:fs";
import { Actions } from "./actions.js";
import { DiskBlobs, isPublicBlobKey } from "./blobs.js";
import { makeCtx, type Ctx } from "./ctx.js";
import { createDb, resolveDbUrl, runMigrations } from "./db.js";
import * as schema from "./schema.js";
import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// backend/.env sits next to package.json (backend/), whether we run from
// src (tsx) or dist/src (built).
dotenv.config({ path: path.resolve(HERE, "../.env") });

const PORT = Number(process.env.PORT ?? 4000);
const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "";

let JWT_SECRET = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
  JWT_SECRET = randomBytes(32).toString("hex");
  console.warn(
    "[vocabmaster] WARNING: JWT_SECRET is not set — using a random one for this run only.\n" +
      "  Book download links will stop working after a restart. Run `npm run setup` to generate one.",
  );
}

const UPLOADS_DIR = path.resolve(HERE, "../uploads");

function log(...args: unknown[]) {
  console.log("[vocabmaster]", ...args);
}

/** Find frontend/dist (built client) from either src or dist layout. */
function findFrontendDist(): string | null {
  const candidates = [
    path.resolve(HERE, "../../frontend/dist"),
    path.resolve(HERE, "../../../frontend/dist"),
    path.resolve(process.cwd(), "frontend/dist"),
    path.resolve(process.cwd(), "../frontend/dist"),
  ];
  return candidates.find((c) => {
    try {
      return existsSync(path.join(c, "index.html"));
    } catch {
      return false;
    }
  }) ?? null;
}

// ---------- file serving (Range-aware, so <video> seeking and PDF.js work) ----------

async function sendFileRange(
  req: Request,
  res: Response,
  filePath: string,
  contentType: string,
  size: number,
  opts: { noStore?: boolean; filename?: string } = {},
): Promise<void> {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (opts.noStore) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
  } else {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
  if (opts.filename) {
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${opts.filename.replace(/"/g, "")}"`,
    );
  }
  const range = req.headers.range;
  if (!range) {
    res.setHeader("Content-Length", size);
    res.status(200);
    createReadStream(filePath).pipe(res);
    return;
  }
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) {
    res.status(416).end();
    return;
  }
  const start = m[1] ? Number(m[1]) : 0;
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
    return;
  }
  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  res.setHeader("Content-Length", end - start + 1);
  createReadStream(filePath, { start, end }).pipe(res);
}

// ---------- boot: connect, migrate, seed ----------

async function bootDb(): Promise<{
  db: LibSQLDatabase<typeof schema>;
  blobs: DiskBlobs;
}> {
  if (!TURSO_URL) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Copy backend/.env.example to backend/.env " +
        "and paste your Turso libsql:// URL (or file:./local.db for local dev), then run `npm run setup`.",
    );
  }
  const { db } = createDb({
    url: resolveDbUrl(TURSO_URL, path.resolve(HERE, "..")),
    authToken: TURSO_TOKEN,
  });
  const displayUrl = TURSO_URL.startsWith("file:")
    ? TURSO_URL
    : TURSO_URL.replace(/\/\/([^:]+):[^@]+@/, "//$1@");
  log(`database: ${displayUrl}`);
  await runMigrations(db);
  log("migrations: 0001-0007 applied");
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const blobs = new DiskBlobs(
    UPLOADS_DIR,
    () => `http://localhost:${PORT}`,
    JWT_SECRET,
  );
  const bootCtx = makeCtx(db, blobs);
  const seed = (await Actions.importVocab.handler(bootCtx, {})) as {
    wordsImported: number;
    lessonsSeeded: number;
    coursesSeeded: number;
    alreadyDone: boolean;
  };
  const stats = await db
    .select({
      level: schema.words.level,
      count: sql<number>`count(*)`,
    })
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
  log(
    `seed: words=${total} (${stats.map((r) => `${r.level}:${r.count}`).join(" ")}), ` +
      `grammar=${lessons[0]?.n ?? 0}, courses=${courses[0]?.n ?? 0}, ` +
      `courseLessons=${courseLessons[0]?.n ?? 0} ` +
      `(importVocab: wordsImported=${seed.wordsImported}, alreadyDone=${seed.alreadyDone})`,
  );
  return { db, blobs };
}

// ---------- app ----------

async function main() {
  const { db, blobs } = await bootDb();
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors());
  // Base64 uploads (course video / book PDF up to 45 MB) arrive as JSON.
  app.use(express.json({ limit: "70mb" }));
  app.use(express.urlencoded({ extended: false, limit: "70mb" }));

  const ctxFor = (req: Request): Ctx => {
    const origin = `${req.protocol}://${req.get("host")}`;
    const requestBlobs = new DiskBlobs(UPLOADS_DIR, () => origin, JWT_SECRET);
    return makeCtx(db, requestBlobs);
  };

  app.get("/api/health", async (_req, res) => {
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.words);
    res.json({ ok: true, words: rows[0]?.n ?? 0 });
  });

  // Private book PDF — only with a valid 10-minute signed token AND live
  // access (the student's book_access flag, re-checked at download) — or
  // while the admin has switched the book free-for-all (book_free setting).
  app.get("/api/files/book", async (req, res) => {
    const studentId = blobs.verifyBookToken(
      typeof req.query.token === "string" ? req.query.token : undefined,
    );
    if (!studentId) {
      res.status(403).json({ error: "লিংকটির মেয়াদ শেষ হয়েছে বা সঠিক নয়।" });
      return;
    }
    const rows = await db
      .select({ bookAccess: schema.students.bookAccess })
      .from(schema.students)
      .where(eq(schema.students.id, studentId));
    const freeRows = await db
      .select({ value: schema.settings.value })
      .from(schema.settings)
      .where(eq(schema.settings.key, "book_free"));
    const bookFree = freeRows[0]?.value === "1";
    if (rows[0]?.bookAccess !== 1 && !bookFree) {
      res.status(403).json({ error: "এই বইটি পড়ার অ্যাক্সেস নেই।" });
      return;
    }
    const key = "book/oxford-7000-words.pdf";
    const head = await blobs.head(key);
    if (!head) {
      res.status(404).json({ error: "বইয়ের ফাইলটি এখনো আপলোড হয়নি।" });
      return;
    }
    const filePath = path.join(UPLOADS_DIR, "book", "oxford-7000-words.pdf");
    await sendFileRange(req, res, filePath, "application/pdf", head.sizeBytes, {
      noStore: true,
      filename: "Oxford-7000-Words.pdf",
    });
  });

  // Public uploads: course videos + cover images.
  app.get("/api/files/*", async (req, res) => {
    const key = (req.params as { 0?: string })[0] ?? "";
    if (!isPublicBlobKey(key)) {
      res.status(404).json({ error: "ফাইলটি পাওয়া যায়নি।" });
      return;
    }
    const head = await blobs.head(key);
    if (!head) {
      res.status(404).json({ error: "ফাইলটি পাওয়া যায়নি।" });
      return;
    }
    const filePath = path.join(UPLOADS_DIR, ...key.split("/"));
    await sendFileRange(req, res, filePath, head.contentType, head.sizeBytes);
  });

  // Every action as POST /api/<actionName> with a JSON body.
  app.post("/api/:action", async (req, res) => {
    const def = (Actions as Record<string, { request: { parse: (v: unknown) => unknown }; handler: (ctx: Ctx, args: never) => Promise<unknown> } | undefined>)[
      req.params.action ?? ""
    ];
    if (!def) {
      res.status(404).json({ error: `unknown action: ${req.params.action}` });
      return;
    }
    let args: unknown;
    try {
      args = def.request.parse(req.body ?? {});
    } catch (e) {
      res.status(400).json({
        error:
          e instanceof Error ? e.message : "অনুরোধটি সঠিক নয় — আবার চেষ্টা করুন।",
      });
      return;
    }
    try {
      const out = await def.handler(ctxFor(req), args as never);
      res.json(out);
    } catch (e) {
      console.error(`[vocabmaster] action ${req.params.action} failed:`, e);
      res.status(500).json({
        error: e instanceof Error ? e.message : "সার্ভারে সমস্যা হয়েছে।",
      });
    }
  });

  // Built frontend (after `npm run build`): serve it from this same server.
  const frontendDist = findFrontendDist();
  if (frontendDist) {
    app.use(express.static(frontendDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    log(`frontend: serving built client from ${frontendDist}`);
  } else {
    app.get("/", (_req, res) => {
      res.json({
        ok: true,
        message:
          "VocabMaster API is running. Start the frontend with `npm run dev:frontend` or build it with `npm run build`.",
      });
    });
    log("frontend: no built client found — run `npm run dev:frontend` for the UI");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[vocabmaster] error:", err);
    res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে।" });
  });

  app.listen(PORT, () => {
    log(`listening on http://localhost:${PORT}`);
    log(`API: http://localhost:${PORT}/api  |  health: http://localhost:${PORT}/api/health`);
  });
}

main().catch((e) => {
  console.error("[vocabmaster] failed to start:", e);
  process.exit(1);
});
