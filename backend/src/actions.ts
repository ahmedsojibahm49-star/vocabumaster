// VocabMaster actions: vocabulary hub, grammar lessons, courses, student
// profiles with XP/streaks, bookmarks, quizzes, daily task, enrolments,
// admin CRUD, and the one-time importVocab bootstrap that loads the
// author's own Oxford 7000 Words dataset (v3.4) + IELTS 600 into the DB.
//
// Standalone (Turso) port of the Muse artifact's actions: the same
// handlers, request/response schemas and business rules, served over
// HTTP by backend/src/server.ts. The only differences from the artifact
// version are the Ctx type (./ctx.ts) and the blob store (./blobs.ts,
// local disk instead of the artifact runtime's blob storage).

import { z } from "zod";
import type { Ctx } from "./ctx.js";
import { defineAction, type ActionsModule } from "./framework.js";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import * as schema from "./schema.js";
import { VOCAB } from "./vocab-data.js";
import { GRAMMAR_LESSONS } from "./grammar-seed.js";
import { COURSE_SEEDS } from "./course-seed.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";


const wordOut = z.object({
  id: z.number(),
  word: z.string(),
  pos: z.string(),
  level: z.string(),
  bn: z.string(),
  bnPron: z.string(),
  respUs: z.string(),
  respUk: z.string(),
  syn: z.string(),
  ant: z.string(),
  ex: z.string(),
  exBn: z.string(),
});

type WordRow = typeof schema.words.$inferSelect;

function toWord(row: WordRow): z.infer<typeof wordOut> {
  return {
    id: row.id,
    word: row.word,
    pos: row.pos,
    level: row.level,
    bn: row.bn,
    bnPron: row.bnPron,
    respUs: row.respUs,
    respUk: row.respUk,
    syn: row.syn,
    ant: row.ant,
    ex: row.ex,
    exBn: row.exBn,
  };
}

const studentOut = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  premium: z.boolean(),
  bookAccess: z.boolean(),
  xp: z.number(),
  streak: z.number(),
  lastDaily: z.string().nullable(),
  // Vocabulary levels the admin has personally freed for THIS student
  // (per-student level grants) — on top of the site-wide free levels.
  levelGrants: z.array(z.string()),
});

type StudentRow = typeof schema.students.$inferSelect;

function toStudent(
  row: StudentRow,
  levelGrants: string[] = [],
): z.infer<typeof studentOut> {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    premium: row.premium === 1,
    bookAccess: row.bookAccess === 1,
    xp: row.xp,
    streak: row.streak,
    lastDaily: row.lastDaily,
    levelGrants,
  };
}

/**
 * The last six calendar months (Asia/Dhaka, the students' timezone) as
 * "YYYY-MM" keys, oldest first — the dashboard learning-activity chart's
 * buckets. Dhaka has no DST, so fixed arithmetic on the Dhaka wall clock
 * is exact.
 */
function activityMonthKeys(now = new Date()): string[] {
  const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const keys: string[] = [];
  for (let back = 5; back >= 0; back--) {
    const d = new Date(
      Date.UTC(dhaka.getUTCFullYear(), dhaka.getUTCMonth() - back, 1),
    );
    keys.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return keys;
}

function monthKeyOf(d: Date): string {
  const dhaka = new Date(d.getTime() + 6 * 60 * 60 * 1000);
  return `${dhaka.getUTCFullYear()}-${String(dhaka.getUTCMonth() + 1).padStart(2, "0")}`;
}

function emptyActivity(): { month: string; words: number; lessons: number }[] {
  return activityMonthKeys().map((month) => ({ month, words: 0, lessons: 0 }));
}

const courseOut = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  price: z.number().nullable(),
  oldPrice: z.number().nullable(),
  lessons: z.number().nullable(),
  features: z.string(),
  badge: z.string(),
  accessMode: z.string(),
  imageBlobKey: z.string(),
  imageSrc: z.string(),
  published: z.number(),
  sortOrder: z.number(),
});

type CourseRow = typeof schema.courses.$inferSelect;

async function toCourse(
  ctx: Ctx,
  row: CourseRow,
): Promise<z.infer<typeof courseOut>> {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    price: row.price,
    oldPrice: row.oldPrice,
    lessons: row.lessons,
    features: row.features,
    badge: row.badge,
    accessMode: row.accessMode,
    imageBlobKey: row.imageBlobKey,
    imageSrc: row.imageBlobKey
      ? await ctx.blobs.getUrl(row.imageBlobKey, { public: true })
      : "",
    published: row.published,
    sortOrder: row.sortOrder,
  };
}

const lessonOut = z.object({
  id: z.number(),
  titleBn: z.string(),
  titleEn: z.string(),
  category: z.string(),
  level: z.string(),
  summary: z.string(),
  body: z.string(),
  sortOrder: z.number(),
});

const quizQuestion = z.object({
  wordId: z.number(),
  word: z.string(),
  pos: z.string(),
  level: z.string(),
  prompt: z.string(),
  options: z.array(z.string()),
  answer: z.number(),
});

// ---------- helpers ----------

/** Today's date (YYYY-MM-DD) in Asia/Dhaka, plus day number for rotation. */
function dhakaToday(): { date: string; dayNumber: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "1970";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
  return { date, dayNumber };
}

// ---------- auth helpers ----------

function makeDb(ctx: Ctx) {
  return ctx.db();
}
type Db = ReturnType<typeof makeDb>;


/** SHA-256 hex digest (WebCrypto is available in the action runtime). */
async function hashSecret(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`vocabmaster:${value}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const authResponse = z.object({
  ok: z.boolean(),
  error: z.string().nullable(),
  student: studentOut.nullable(),
});

type AuthResult = z.infer<typeof authResponse>;

// Admin credentials live in the settings table. Until the owner changes
// them, the bootstrap credentials below apply — they exist ONLY in this
// server module (never in client code or page copy), and the first login
// with them forces an immediate password change (see adminLogin).
const ADMIN_DEFAULT_EMAIL = "admin@vocabmaster.local";
const ADMIN_DEFAULT_PASSWORD = "Jarif-Admin-2026!";

async function getSetting(
  db: Db,
  key: string,
): Promise<string> {
  const rows = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key));
  return rows[0]?.value ?? "";
}

async function setSetting(
  db: Db,
  key: string,
  value: string,
) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}

async function adminCredentials(db: Db) {
  const email = (await getSetting(db, "admin_email")) || ADMIN_DEFAULT_EMAIL;
  const storedHash = await getSetting(db, "admin_password_hash");
  const hash = storedHash || (await hashSecret(ADMIN_DEFAULT_PASSWORD));
  // True while the account still runs on the bootstrap password.
  return { email, hash, mustChangePassword: !storedHash };
}

/**
 * Strong-password policy (owner's request): at least 8 characters with at
 * least one letter and one digit. Returns a Bangla explanation when the
 * password is too weak, or null when it passes. Enforced server-side on
 * student signup, legacy-account password claims, admin password changes
 * and admin-created student accounts — the client mirrors the same rules
 * in its live strength meter.
 */
function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।";
  if (!/[A-Za-z]/.test(pw))
    return "পাসওয়ার্ডে অন্তত একটি ইংরেজি অক্ষর (a–z) থাকতে হবে।";
  if (!/\d/.test(pw)) return "পাসওয়ার্ডে অন্তত একটি সংখ্যা (0–9) থাকতে হবে।";
  return null;
}

// ---------- premium levels (owner's model, admin-controlled) ----------
// Which vocabulary levels are FREE is an admin setting (`free_levels`,
// comma-separated level names) the owner can change any time from the
// admin panel — flipping a level free or premium takes effect on the
// very next request, no code change. Default (setting never saved):
// A1 and A2 free, B1–IELTS premium. Premium-level words are served only
// to students whose account carries the premium flag — granted by the
// admin (manually from the students tab, or automatically when a
// premium application is approved). The gate lives here on the server,
// so premium word data never reaches a non-premium client at all.
const ALL_LEVELS: readonly string[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "IELTS",
];
const DEFAULT_FREE_LEVELS: readonly string[] = ["A1", "A2"];

/**
 * Parses the stored free-levels list; null when the setting was never
 * saved. A BLANK string also means "never saved": getSetting returns ""
 * for a missing row, and an earlier version of this parser turned that
 * "" into an EMPTY set — which silently locked EVERY level (even the
 * free A1/A2) for every non-premium student while the settings page
 * still showed A1/A2 as free. That was the "all levels became premium"
 * bug. An admin who deliberately wants NO free level stores the "NONE"
 * sentinel instead (adminSaveSettings writes it), which parses to a
 * genuinely empty set.
 */
function parseFreeLevels(raw: string | undefined): Set<string> | null {
  if (raw == null || raw.trim() === "") return null;
  if (raw.trim().toUpperCase() === "NONE") return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => ALL_LEVELS.includes(s)),
  );
}

async function getFreeLevels(db: Db): Promise<Set<string>> {
  const parsed = parseFreeLevels(await getSetting(db, "free_levels"));
  return parsed ?? new Set(DEFAULT_FREE_LEVELS);
}

/** Enrolment title that marks a premium application (courseId is null). */
const PREMIUM_APPLICATION_TITLE = "VocabMaster Premium";

/** Enrolment title that marks a book purchase application (courseId null). */
const BOOK_APPLICATION_TITLE = "Oxford 7000 Words — বই";

/**
 * The book PDF lives ONLY in private blob storage under this key — it is
 * never bundled with the client and never given a public URL. Buyers get
 * a short-lived signed URL (10 minutes) from getBookReader after the
 * server verifies their book_access flag, and the reader renders pages
 * with PDF.js (no download control, no raw-file navigation). The short
 * lifetime plus the reader's periodic re-checks mean an admin revoking
 * access takes effect within minutes, not hours.
 */
const BOOK_BLOB_KEY = "book/oxford-7000-words.pdf";

/** The author's finished book (v3.4, 762 pages) on the operator's machine.
 * seedBookFile reads it from here; the PDF itself is never shipped in
 * the zip — on a machine without this file the action reports
 * not-available and the admin uploads the PDF from the book tab. */
const BOOK_PDF_PATH =
  "/home/hatch/workspace/goals/oxford-7000-words-vocabulary-book/files/oxford-7000-words-book/Oxford-7000-Words-A1-to-C2-v3.4.pdf";
/** The author's real book price (user-supplied fact): 990 taka. */
const BOOK_DEFAULT_PRICE = 990;
const BOOK_DEFAULT_PAGES = 762;

async function studentIsPremium(
  db: Db,
  studentId: number | null,
): Promise<boolean> {
  if (!studentId) return false;
  const rows = await db
    .select({ premium: schema.students.premium })
    .from(schema.students)
    .where(eq(schema.students.id, studentId));
  return rows[0]?.premium === 1;
}

/**
 * Levels the admin has personally freed for ONE student (per-student
 * level grants, students tab): the owner can hand any single level —
 * say B2 — to any single student for free, without making that student
 * full premium and without freeing the level for everyone.
 */
async function getStudentLevelGrants(
  db: Db,
  studentId: number | null,
): Promise<Set<string>> {
  if (!studentId) return new Set();
  const rows = await db
    .select({ level: schema.studentLevelGrants.level })
    .from(schema.studentLevelGrants)
    .where(eq(schema.studentLevelGrants.studentId, studentId));
  return new Set(rows.map((r) => r.level));
}

/**
 * The full set of levels a student may open: the site-wide free levels,
 * plus their personal grants, plus everything when they are premium.
 * Every vocabulary gate (browse, search, flashcards, quizzes, mock,
 * daily words, bookmarks) goes through this one helper so the three
 * doors can never disagree.
 */
async function accessibleLevels(
  db: Db,
  studentId: number | null,
): Promise<Set<string>> {
  const out = await getFreeLevels(db);
  if (!studentId) return out;
  for (const l of await getStudentLevelGrants(db, studentId)) out.add(l);
  if (await studentIsPremium(db, studentId)) {
    for (const l of ALL_LEVELS) out.add(l);
  }
  return out;
}

async function canAccessLevel(
  db: Db,
  studentId: number | null,
  level: string,
): Promise<boolean> {
  return (await accessibleLevels(db, studentId)).has(level);
}

/** toStudent with the student's personal level grants loaded. */
async function studentWithGrants(
  db: Db,
  row: StudentRow,
): Promise<z.infer<typeof studentOut>> {
  const grants = await getStudentLevelGrants(db, row.id);
  return toStudent(row, ALL_LEVELS.filter((l) => grants.has(l)));
}

/**
 * Book access = the student bought the book (book_access flag) OR the
 * admin has switched the book to free-for-all (`book_free` setting) —
 * the owner can flip the book free/premium any time from the admin
 * panel. Reading still requires a logged-in account (the reader needs
 * the student's identity for its watermark and resume point).
 */
async function studentHasBookAccess(
  db: Db,
  studentId: number | null,
): Promise<boolean> {
  if (!studentId) return false;
  if ((await getSetting(db, "book_free")) === "1") return true;
  const rows = await db
    .select({ bookAccess: schema.students.bookAccess })
    .from(schema.students)
    .where(eq(schema.students.id, studentId));
  return rows[0]?.bookAccess === 1;
}

const BOOK_DEFAULT_TITLE = "Oxford 7000 Words";

async function bookSettings(db: Db): Promise<{
  price: number;
  totalPages: number;
  fileName: string;
  title: string;
  freeForAll: boolean;
}> {
  const rawPrice = Number(await getSetting(db, "book_price"));
  const rawPages = Number(await getSetting(db, "book_total_pages"));
  const rawTitle = (await getSetting(db, "book_title")).trim();
  return {
    price:
      Number.isFinite(rawPrice) && rawPrice > 0
        ? Math.floor(rawPrice)
        : BOOK_DEFAULT_PRICE,
    totalPages:
      Number.isFinite(rawPages) && rawPages > 0
        ? Math.floor(rawPages)
        : BOOK_DEFAULT_PAGES,
    fileName: await getSetting(db, "book_file_name"),
    title: rawTitle || BOOK_DEFAULT_TITLE,
    freeForAll: (await getSetting(db, "book_free")) === "1",
  };
}

/** True when a course is switched to free-for-all by the admin. */
async function courseIsFree(db: Db, courseId: number): Promise<boolean> {
  const rows = await db
    .select({ accessMode: schema.courses.accessMode })
    .from(schema.courses)
    .where(eq(schema.courses.id, courseId));
  return rows[0]?.accessMode === "free";
}

/**
 * Re-syncs a student's premium / book flags after one of their purchase
 * applications is moved AWAY from "approved" or deleted. The matching
 * flag is switched OFF for the account with that mobile number UNLESS
 * another approved application of the same kind still exists for it.
 * This is the seam that makes "remove the student from book buy"
 * actually lock the book again: previously the flags were only ever
 * switched ON, so un-approving or deleting an application left the
 * student reading forever.
 */
async function revokeApplicationAccessIfOrphaned(
  db: Db,
  phone: string,
  title: string,
  exceptId: number,
): Promise<{ premiumRevoked: boolean; bookRevoked: boolean }> {
  const out = { premiumRevoked: false, bookRevoked: false };
  const isPremiumApp = title === PREMIUM_APPLICATION_TITLE;
  const isBookApp = title === BOOK_APPLICATION_TITLE;
  if (!isPremiumApp && !isBookApp) return out;
  const approved = await db
    .select({ id: schema.enrollments.id })
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.phone, phone),
        eq(schema.enrollments.courseTitle, title),
        eq(schema.enrollments.status, "approved"),
      ),
    );
  if (approved.some((r) => r.id !== exceptId)) return out;
  const sRows = await db
    .select()
    .from(schema.students)
    .where(eq(schema.students.phone, phone));
  const student = sRows[0];
  if (!student) return out;
  if (isPremiumApp && student.premium === 1) {
    await db
      .update(schema.students)
      .set({ premium: 0 })
      .where(eq(schema.students.id, student.id));
    out.premiumRevoked = true;
  }
  if (isBookApp && student.bookAccess === 1) {
    await db
      .update(schema.students)
      .set({ bookAccess: 0 })
      .where(eq(schema.students.id, student.id));
    out.bookRevoked = true;
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j] as T;
    a[j] = tmp as T;
  }
  return a;
}

function makeQuestions(pool: WordRow[], count: number): z.infer<typeof quizQuestion>[] {
  const picked = shuffle(pool).slice(0, count);
  const questions: z.infer<typeof quizQuestion>[] = [];
  for (const w of picked) {
    const distractors = shuffle(pool.filter((p) => p.id !== w.id && p.bn !== w.bn))
      .slice(0, 3)
      .map((p) => p.bn);
    if (distractors.length < 3) continue;
    const options = shuffle([w.bn, ...distractors]);
    questions.push({
      wordId: w.id,
      word: w.word,
      pos: w.pos,
      level: w.level,
      prompt: `"${w.word}" শব্দের সঠিক বাংলা অর্থ কোনটি?`,
      options,
      answer: options.indexOf(w.bn),
    });
  }
  return questions;
}

// ---------- actions ----------

export const Actions = {
  importVocab: defineAction({
    description:
      "Bootstrap: imports the author's 7,600-word book dataset and default settings if empty, and tops up any missing starter grammar lessons (matched by English title, so admin edits are never overwritten).",
    request: z.object({}),
    response: z.object({
      wordsImported: z.number(),
      lessonsSeeded: z.number(),
      coursesSeeded: z.number(),
      strayLessonsRemoved: z.number(),
      respellingsSynced: z.number(),
      alreadyDone: z.boolean(),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const existing = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.words);
      const wordCount = existing[0]?.n ?? 0;

      // Top-up seeding: insert only seed lessons whose English title is not
      // already present (admin edits are never overwritten). New lessons are
      // appended after the current maximum sortOrder, in seed-array order,
      // so the teaching sequence stays stable across top-ups.
      let lessonsSeeded = 0;
      const existingLessons = await db
        .select({
          titleEn: schema.grammarLessons.titleEn,
          sortOrder: schema.grammarLessons.sortOrder,
        })
        .from(schema.grammarLessons);
      const haveTitles = new Set(existingLessons.map((r) => r.titleEn));
      const maxSort = existingLessons.reduce(
        (m, r) => Math.max(m, r.sortOrder),
        0,
      );
      const missing = GRAMMAR_LESSONS.filter((l) => !haveTitles.has(l.titleEn));
      if (missing.length > 0) {
        const now = new Date();
        const stmts: BatchItem<"sqlite">[] = missing.map((l, i) =>
          db.insert(schema.grammarLessons).values({
            titleBn: l.titleBn,
            titleEn: l.titleEn,
            category: l.category,
            level: l.level,
            summary: l.summary,
            body: l.body,
            sortOrder: maxSort + i + 1,
            createdAt: now,
          }),
        );
        const [first, ...rest] = stmts;
        if (first) await db.batch([first, ...rest]);
        lessonsSeeded = missing.length;
      }

      // One-time cleanup (flag-guarded): a stray course lesson titled
      // "Jarif ahmed" appeared as an 8th lesson in the Spoken course's
      // curriculum. It is not part of either seeded course (each has
      // exactly 7 lessons) and the owner reported it as a bogus row.
      // Matched by exact normalized title, so no legitimate lesson an
      // admin added can ever be touched by this cleanup.
      let strayLessonsRemoved = 0;
      const cleanupFlag = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, "cleanup_stray_lessons_v1"));
      if (!cleanupFlag[0]) {
        const allCourseLessons = await db
          .select({
            id: schema.courseLessons.id,
            title: schema.courseLessons.title,
            courseId: schema.courseLessons.courseId,
          })
          .from(schema.courseLessons);
        const stray = allCourseLessons.filter(
          (l) => l.title.trim().toLowerCase() === "jarif ahmed",
        );
        for (const s of stray) {
          await db
            .delete(schema.courseLessons)
            .where(eq(schema.courseLessons.id, s.id));
          strayLessonsRemoved++;
        }
        if (strayLessonsRemoved > 0) {
          // Keep each affected course's stored lesson count truthful.
          const affected = [...new Set(stray.map((s) => s.courseId))];
          for (const cid of affected) {
            const cnt = await db
              .select({ n: sql<number>`count(*)` })
              .from(schema.courseLessons)
              .where(eq(schema.courseLessons.courseId, cid));
            await db
              .update(schema.courses)
              .set({ lessons: cnt[0]?.n ?? 0 })
              .where(eq(schema.courses.id, cid));
          }
        }
        await db.insert(schema.settings).values({
          key: "cleanup_stray_lessons_v1",
          value: "1",
        });
      }

      const noteRow = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, "payment_note"));
      if (!noteRow[0]) {
        await db.insert(schema.settings).values({
          key: "payment_note",
          value:
            "ভর্তির জন্য প্রথমে ইমেইল বা সোশ্যাল মিডিয়ায় যোগাযোগ করে bKash/Nagad নম্বর নিন। পেমেন্টের পর ট্রানজ্যাকশন আইডিসহ এখানে আবেদন করুন — যাচাই শেষে অ্যাক্সেস চালু করা হবে।",
        });
      }

      // Book defaults (seeded once, admin-editable afterwards): the
      // author's real price for Oxford 7000 Words is 990 taka and the
      // current v3.4 PDF has 762 pages — both user-supplied facts.
      const bookPriceRow = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, "book_price"));
      if (!bookPriceRow[0]) {
        await db.insert(schema.settings).values({
          key: "book_price",
          value: String(BOOK_DEFAULT_PRICE),
        });
      }
      const bookPagesRow = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, "book_total_pages"));
      if (!bookPagesRow[0]) {
        await db.insert(schema.settings).values({
          key: "book_total_pages",
          value: String(BOOK_DEFAULT_PAGES),
        });
      }

      // One-time starter courses (flag-guarded, so courses the admin later
      // edits or deletes are never recreated). Prices stay unset — the
      // owner sets his own prices in the admin panel.
      let coursesSeeded = 0;
      const courseFlag = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, "courses_seeded_v1"));
      if (!courseFlag[0]) {
        const now = new Date();
        for (let ci = 0; ci < COURSE_SEEDS.length; ci++) {
          const seed = COURSE_SEEDS[ci];
          if (!seed) continue;
          const insertedCourse = await db
            .insert(schema.courses)
            .values({
              title: seed.title,
              subtitle: seed.subtitle,
              price: null,
              oldPrice: null,
              lessons: seed.lessons.length,
              features: seed.features,
              badge: seed.badge,
              published: 1,
              sortOrder: ci,
              createdAt: now,
            })
            .returning({ id: schema.courses.id });
          const courseRow = insertedCourse[0];
          if (!courseRow) continue;
          const stmts: BatchItem<"sqlite">[] = seed.lessons.map((l, li) =>
            db.insert(schema.courseLessons).values({
              courseId: courseRow.id,
              title: l.title,
              kind: "text",
              videoUrl: "",
              body: l.body,
              freePreview: l.freePreview ? 1 : 0,
              sortOrder: li,
              createdAt: now,
            }),
          );
          const [firstLesson, ...restLessons] = stmts;
          if (firstLesson) await db.batch([firstLesson, ...restLessons]);
          coursesSeeded++;
        }
        await db.insert(schema.settings).values({
          key: "courses_seeded_v1",
          value: "1",
        });
      }

      // One-time v3.4 respelling sync (flag-guarded): the live DB was
      // imported from the book's v3.3 data, whose respelling wrote the
      // schwa as "uh" (about = uh·bowt); the book's v3.4 writes "ah"
      // (ah·bowt). A plain file swap changes nothing because the import
      // above is one-time, so existing rows are updated in place —
      // matched by sort index (the dataset's word/pos/level order is
      // identical between v3.3 and v3.4) and ONLY respUs/respUk are
      // written. Every other field keeps whatever the admin has in the
      // DB, and word ids never change, so student bookmarks, learned
      // words and progress are untouched. A row whose word no longer
      // matches the dataset word at its sort index (admin renamed it)
      // is skipped rather than overwritten.
      let respellingsSynced = 0;
      if (wordCount > 0) {
        const syncFlag = await db
          .select()
          .from(schema.settings)
          .where(eq(schema.settings.key, "respelling_sync_v34"));
        if (!syncFlag[0]) {
          const rows = await db
            .select({
              id: schema.words.id,
              word: schema.words.word,
              sort: schema.words.sort,
              respUs: schema.words.respUs,
              respUk: schema.words.respUk,
            })
            .from(schema.words);
          const stmts: BatchItem<"sqlite">[] = [];
          for (const r of rows) {
            const t = VOCAB[r.sort];
            if (!t) continue;
            if (t[0].trim().toLowerCase() !== r.word.trim().toLowerCase()) {
              continue;
            }
            if (t[5] === r.respUs && t[6] === r.respUk) continue;
            stmts.push(
              db
                .update(schema.words)
                .set({ respUs: t[5], respUk: t[6] })
                .where(eq(schema.words.id, r.id)),
            );
            respellingsSynced++;
          }
          const SYNC_CHUNK = 400;
          for (let s = 0; s < stmts.length; s += SYNC_CHUNK) {
            const chunk = stmts.slice(s, s + SYNC_CHUNK);
            const [firstStmt, ...restStmts] = chunk;
            if (firstStmt) await db.batch([firstStmt, ...restStmts]);
          }
          await db.insert(schema.settings).values({
            key: "respelling_sync_v34",
            value: "1",
          });
          if (respellingsSynced > 0) ctx.invalidateQueries();
        }
      }

      if (wordCount > 0) {
        return { wordsImported: 0, lessonsSeeded, coursesSeeded, strayLessonsRemoved, respellingsSynced, alreadyDone: true };
      }

      const CHUNK = 400;
      for (let start = 0; start < VOCAB.length; start += CHUNK) {
        const slice = VOCAB.slice(start, start + CHUNK);
        const stmts: BatchItem<"sqlite">[] = slice.map((t, i) =>
          db.insert(schema.words).values({
            word: t[0],
            pos: t[1],
            level: t[2],
            bn: t[3],
            bnPron: t[4],
            respUs: t[5],
            respUk: t[6],
            syn: t[7],
            ant: t[8],
            ex: t[9],
            exBn: t[10],
            sort: start + i,
          }),
        );
        const [first, ...rest] = stmts;
        if (first) await db.batch([first, ...rest]);
      }
      // A fresh import already carries the v3.4 respellings, so the
      // one-time sync above never needs to run on this database.
      await db.insert(schema.settings).values({
        key: "respelling_sync_v34",
        value: "1",
      });
      ctx.invalidateQueries();
      return { wordsImported: VOCAB.length, lessonsSeeded, coursesSeeded, strayLessonsRemoved, respellingsSynced: 0, alreadyDone: false };
    },
  }),

  getStats: defineAction({
    description: "Site-wide counts: words per level, lessons, courses, students.",
    request: z.object({}),
    response: z.object({
      totalWords: z.number(),
      byLevel: z.array(z.object({ level: z.string(), count: z.number() })),
      lessonCount: z.number(),
      courseCount: z.number(),
      studentCount: z.number(),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const byLevel = await db
        .select({
          level: schema.words.level,
          count: sql<number>`count(*)`,
        })
        .from(schema.words)
        .groupBy(schema.words.level);
      const lessons = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.grammarLessons);
      const courses = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.courses)
        .where(eq(schema.courses.published, 1));
      const students = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.students);
      return {
        totalWords: byLevel.reduce((s, r) => s + r.count, 0),
        byLevel,
        lessonCount: lessons[0]?.n ?? 0,
        courseCount: courses[0]?.n ?? 0,
        studentCount: students[0]?.n ?? 0,
      };
    },
  }),

  searchWords: defineAction({
    description:
      "Searches words by English word or Bangla meaning. Premium-level (B1–IELTS) matches are hidden from non-premium students and only counted in hiddenPremium.",
    request: z.object({
      query: z.string().min(1).max(80),
      studentId: z.number().int().positive().nullable().default(null),
    }),
    response: z.object({
      words: z.array(wordOut),
      hiddenPremium: z.number(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const q = args.query.trim().toLowerCase();
      const like = `%${q}%`;
      const rows = await db
        .select()
        .from(schema.words)
        .where(
          sql`lower(${schema.words.word}) like ${like} or ${schema.words.bn} like ${like}`,
        )
        .orderBy(asc(schema.words.word))
        .limit(200);
      const access = await accessibleLevels(db, args.studentId);
      const visible = rows.filter((r) => access.has(r.level));
      return {
        words: visible.slice(0, 60).map(toWord),
        hiddenPremium: rows.length - visible.length,
      };
    },
  }),

  adminListWords: defineAction({
    description:
      "Admin word browser: pages through all words, optionally filtered by level and/or a search query (English word or Bangla meaning).",
    request: z.object({
      level: z.string().max(10).default(""),
      query: z.string().max(80).default(""),
      offset: z.number().int().min(0).default(0),
      limit: z.number().int().positive().max(100).default(25),
    }),
    response: z.object({ words: z.array(wordOut), total: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const q = args.query.trim().toLowerCase();
      const like = `%${q}%`;
      const conds = [];
      if (args.level) conds.push(eq(schema.words.level, args.level));
      if (q) {
        conds.push(
          sql`lower(${schema.words.word}) like ${like} or ${schema.words.bn} like ${like}`,
        );
      }
      const where = conds.length > 0 ? and(...conds) : undefined;
      const totalRows = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.words)
        .where(where);
      const rows = await db
        .select()
        .from(schema.words)
        .where(where)
        .orderBy(asc(schema.words.level), asc(schema.words.sort), asc(schema.words.word))
        .limit(args.limit)
        .offset(args.offset);
      return { words: rows.map(toWord), total: totalRows[0]?.n ?? 0 };
    },
  }),

  getWordsByLevel: defineAction({
    description:
      "Pages through the words of one CEFR level (or IELTS). Premium levels (B1–IELTS) return locked=true with no words for non-premium students.",
    request: z.object({
      level: z.string().min(1).max(10),
      offset: z.number().int().min(0).default(0),
      limit: z.number().int().positive().max(100).default(40),
      studentId: z.number().int().positive().nullable().default(null),
    }),
    response: z.object({
      words: z.array(wordOut),
      total: z.number(),
      locked: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const totalRows = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.words)
        .where(eq(schema.words.level, args.level));
      const total = totalRows[0]?.n ?? 0;
      const allowed = await canAccessLevel(db, args.studentId, args.level);
      if (!allowed) return { words: [], total, locked: true };
      const rows = await db
        .select()
        .from(schema.words)
        .where(eq(schema.words.level, args.level))
        .orderBy(asc(schema.words.sort))
        .limit(args.limit)
        .offset(args.offset);
      return { words: rows.map(toWord), total, locked: false };
    },
  }),

  getDailyWords: defineAction({
    description:
      "Returns today's rotating set of 10 study words (Asia/Dhaka day). Non-premium students draw only from the free levels (A1/A2).",
    request: z.object({
      studentId: z.number().int().positive().nullable().default(null),
    }),
    response: z.object({ words: z.array(wordOut), date: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const { date, dayNumber } = dhakaToday();
      const access = await accessibleLevels(db, args.studentId);
      const idRows = await db
        .select({ id: schema.words.id, level: schema.words.level })
        .from(schema.words)
        .orderBy(asc(schema.words.sort));
      const pool = idRows.filter((r) => access.has(r.level));
      if (pool.length === 0) return { words: [], date };
      const ids: number[] = [];
      for (let i = 0; i < 10; i++) {
        const pick = pool[(dayNumber * 10 + i * 379) % pool.length];
        if (pick) ids.push(pick.id);
      }
      const rows = await db
        .select()
        .from(schema.words)
        .where(inArray(schema.words.id, ids));
      const byId = new Map(rows.map((r) => [r.id, r]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter((r): r is WordRow => r != null);
      return { words: ordered.map(toWord), date };
    },
  }),

  getLevelTest: defineAction({
    description: "Builds a 20-question CEFR placement test from real words, 4 per band A1–C1.",
    request: z.object({}),
    response: z.object({ questions: z.array(quizQuestion) }),
    async handler(ctx) {
      const db = ctx.db();
      const bands = ["A1", "A2", "B1", "B2", "C1"];
      const questions: z.infer<typeof quizQuestion>[] = [];
      for (const band of bands) {
        const pool = await db
          .select()
          .from(schema.words)
          .where(eq(schema.words.level, band))
          .orderBy(sql`random()`)
          .limit(48);
        questions.push(...makeQuestions(pool, 4));
      }
      return { questions };
    },
  }),

  getMockTest: defineAction({
    description:
      "Builds a 15-question IELTS vocabulary mock test from the IELTS/C1/C2 levels the student can access (free levels per the admin setting, or all of them with premium). Locked only when none of those levels is accessible.",
    request: z.object({
      studentId: z.number().int().positive().nullable().default(null),
    }),
    response: z.object({
      questions: z.array(quizQuestion),
      locked: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const access = await accessibleLevels(db, args.studentId);
      const poolLevels = ["IELTS", "C1", "C2"].filter((l) => access.has(l));
      if (poolLevels.length === 0) return { questions: [], locked: true };
      const pool = await db
        .select()
        .from(schema.words)
        .where(inArray(schema.words.level, poolLevels))
        .orderBy(sql`random()`)
        .limit(80);
      return { questions: makeQuestions(pool, 15), locked: false };
    },
  }),

  getVocabQuiz: defineAction({
    description:
      "Builds a 10-question practice quiz for one level. Premium levels return locked=true with no questions for non-premium students.",
    request: z.object({
      level: z.string().min(1).max(10),
      studentId: z.number().int().positive().nullable().default(null),
    }),
    response: z.object({
      questions: z.array(quizQuestion),
      locked: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const allowed = await canAccessLevel(db, args.studentId, args.level);
      if (!allowed) return { questions: [], locked: true };
      const pool = await db
        .select()
        .from(schema.words)
        .where(eq(schema.words.level, args.level))
        .orderBy(sql`random()`)
        .limit(60);
      return { questions: makeQuestions(pool, 10), locked: false };
    },
  }),

  listGrammarLessons: defineAction({
    description: "Lists grammar lessons (summaries only) in teaching order.",
    request: z.object({}),
    response: z.object({
      lessons: z.array(
        lessonOut.omit({ body: true }).extend({ body: z.string().default("") }),
      ),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db
        .select({
          id: schema.grammarLessons.id,
          titleBn: schema.grammarLessons.titleBn,
          titleEn: schema.grammarLessons.titleEn,
          category: schema.grammarLessons.category,
          level: schema.grammarLessons.level,
          summary: schema.grammarLessons.summary,
          sortOrder: schema.grammarLessons.sortOrder,
        })
        .from(schema.grammarLessons)
        .orderBy(asc(schema.grammarLessons.sortOrder));
      return { lessons: rows.map((r) => ({ ...r, body: "" })) };
    },
  }),

  getGrammarLesson: defineAction({
    description: "Returns one grammar lesson with its full body.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ lesson: lessonOut.nullable() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.grammarLessons)
        .where(eq(schema.grammarLessons.id, args.id));
      const r = rows[0];
      if (!r) return { lesson: null };
      return {
        lesson: {
          id: r.id,
          titleBn: r.titleBn,
          titleEn: r.titleEn,
          category: r.category,
          level: r.level,
          summary: r.summary,
          body: r.body,
          sortOrder: r.sortOrder,
        },
      };
    },
  }),

  listCourses: defineAction({
    description: "Lists published courses in display order.",
    request: z.object({}),
    response: z.object({ courses: z.array(courseOut) }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.courses)
        .where(eq(schema.courses.published, 1))
        .orderBy(asc(schema.courses.sortOrder));
      return {
        courses: await Promise.all(rows.map((r) => toCourse(ctx, r))),
      };
    },
  }),

  getCourseDetail: defineAction({
    description:
      "Returns one course with its lesson list (titles only), the student's enrolment status for it, and per-lesson completion — lesson content itself comes from getCourseLesson.",
    request: z.object({
      courseId: z.number().int().positive(),
      studentId: z.number().int().positive().nullable(),
    }),
    response: z.object({
      course: courseOut.nullable(),
      enrolled: z.boolean(),
      enrollmentStatus: z.string().nullable(),
      lessons: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          kind: z.string(),
          freePreview: z.boolean(),
          completed: z.boolean(),
          hasVideo: z.boolean(),
          fileCount: z.number(),
          sortOrder: z.number(),
        }),
      ),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const cRows = await db
        .select()
        .from(schema.courses)
        .where(eq(schema.courses.id, args.courseId));
      const c = cRows[0];
      if (!c) return { course: null, enrolled: false, enrollmentStatus: null, lessons: [] };

      let enrolled = false;
      let enrollmentStatus: string | null = null;
      if (args.studentId) {
        const sRows = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.id, args.studentId));
        const student = sRows[0];
        if (student) {
          const eRows = await db
            .select()
            .from(schema.enrollments)
            .where(
              and(
                eq(schema.enrollments.phone, student.phone),
                eq(schema.enrollments.courseId, args.courseId),
              ),
            )
            .orderBy(desc(schema.enrollments.id));
          const latest = eRows[0];
          if (latest) {
            enrollmentStatus = latest.status;
            enrolled = latest.status === "approved";
          }
        }
      }

      // A course the admin switched to free-for-all counts as enrolled
      // for everyone — every lesson unlocks without an application.
      if (c.accessMode === "free") enrolled = true;

      const lessonRows = await db
        .select()
        .from(schema.courseLessons)
        .where(eq(schema.courseLessons.courseId, args.courseId))
        .orderBy(asc(schema.courseLessons.sortOrder));
      const doneIds = new Set<number>();
      if (args.studentId && lessonRows.length > 0) {
        const pRows = await db
          .select({ lessonId: schema.lessonProgress.lessonId })
          .from(schema.lessonProgress)
          .where(eq(schema.lessonProgress.studentId, args.studentId));
        for (const p of pRows) doneIds.add(p.lessonId);
      }
      const fileCounts = new Map<number, number>();
      if (lessonRows.length > 0) {
        const aRows = await db
          .select({
            lessonId: schema.lessonAttachments.lessonId,
            n: sql<number>`count(*)`,
          })
          .from(schema.lessonAttachments)
          .where(
            inArray(
              schema.lessonAttachments.lessonId,
              lessonRows.map((l) => l.id),
            ),
          )
          .groupBy(schema.lessonAttachments.lessonId);
        for (const r of aRows) fileCounts.set(r.lessonId, r.n);
      }
      return {
        course: await toCourse(ctx, c),
        enrolled,
        enrollmentStatus,
        lessons: lessonRows.map((l) => ({
          id: l.id,
          title: l.title,
          kind: l.kind,
          freePreview: l.freePreview === 1,
          completed: doneIds.has(l.id),
          hasVideo: l.videoUrl.trim() !== "" || l.videoBlobKey !== "",
          fileCount: fileCounts.get(l.id) ?? 0,
          sortOrder: l.sortOrder,
        })),
      };
    },
  }),

  getCourseLesson: defineAction({
    description:
      "Returns one course lesson's full content (video, text and attached files) when the student is enrolled (approved), the lesson is a free preview, or the course is switched free-for-all; otherwise returns it locked without content.",
    request: z.object({
      lessonId: z.number().int().positive(),
      studentId: z.number().int().positive().nullable(),
    }),
    response: z.object({
      locked: z.boolean(),
      completed: z.boolean(),
      lesson: z
        .object({
          id: z.number(),
          courseId: z.number(),
          title: z.string(),
          kind: z.string(),
          videoUrl: z.string(),
          videoSrc: z.string(),
          body: z.string(),
          freePreview: z.boolean(),
          attachments: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              mimeType: z.string(),
              sizeBytes: z.number(),
              url: z.string(),
            }),
          ),
        })
        .nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const lRows = await db
        .select()
        .from(schema.courseLessons)
        .where(eq(schema.courseLessons.id, args.lessonId));
      const lesson = lRows[0];
      if (!lesson) return { locked: true, completed: false, lesson: null };

      let enrolled = false;
      if (args.studentId) {
        const sRows = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.id, args.studentId));
        const student = sRows[0];
        if (student) {
          const eRows = await db
            .select()
            .from(schema.enrollments)
            .where(
              and(
                eq(schema.enrollments.phone, student.phone),
                eq(schema.enrollments.courseId, lesson.courseId),
                eq(schema.enrollments.status, "approved"),
              ),
            )
            .limit(1);
          enrolled = eRows.length > 0;
        }
      }
      const accessible =
        enrolled ||
        lesson.freePreview === 1 ||
        (await courseIsFree(db, lesson.courseId));
      let completed = false;
      if (args.studentId) {
        const pRows = await db
          .select()
          .from(schema.lessonProgress)
          .where(
            and(
              eq(schema.lessonProgress.studentId, args.studentId),
              eq(schema.lessonProgress.lessonId, args.lessonId),
            ),
          )
          .limit(1);
        completed = pRows.length > 0;
      }
      if (!accessible) {
        return { locked: true, completed, lesson: null };
      }
      // Uploaded videos play from the artifact's own blob storage; linked
      // (YouTube etc.) videos keep their external URL. Upload wins when
      // both are set, matching what the admin sees in the lesson form.
      const videoSrc = lesson.videoBlobKey
        ? await ctx.blobs.getUrl(lesson.videoBlobKey, { public: true })
        : lesson.videoUrl;
      // Attached study files (PDFs, notes, worksheets) ride along only
      // for accessible lessons — a locked lesson leaks no file URLs.
      const attRows = await db
        .select()
        .from(schema.lessonAttachments)
        .where(eq(schema.lessonAttachments.lessonId, lesson.id))
        .orderBy(asc(schema.lessonAttachments.sortOrder));
      const attachments = await Promise.all(
        attRows.map(async (a) => ({
          id: a.id,
          name: a.name,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          url: await ctx.blobs.getUrl(a.blobKey, { public: true }),
        })),
      );
      return {
        locked: false,
        completed,
        lesson: {
          id: lesson.id,
          courseId: lesson.courseId,
          title: lesson.title,
          kind: lesson.kind,
          videoUrl: lesson.videoUrl,
          videoSrc,
          body: lesson.body,
          freePreview: lesson.freePreview === 1,
          attachments,
        },
      };
    },
  }),

  completeCourseLesson: defineAction({
    description:
      "Marks a course lesson complete for an enrolled student (+10 XP the first time).",
    request: z.object({
      studentId: z.number().int().positive(),
      lessonId: z.number().int().positive(),
    }),
    response: z.object({ completed: z.boolean(), xp: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const sRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, args.studentId));
      const student = sRows[0];
      if (!student) throw new Error("Student not found");
      const lRows = await db
        .select()
        .from(schema.courseLessons)
        .where(eq(schema.courseLessons.id, args.lessonId));
      const lesson = lRows[0];
      if (!lesson) throw new Error("Lesson not found");
      // Access rule mirrors getCourseLesson: enrolled, free preview,
      // or a course the admin switched to free-for-all.
      let allowed =
        lesson.freePreview === 1 ||
        (await courseIsFree(db, lesson.courseId));
      if (!allowed) {
        const eRows = await db
          .select()
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.phone, student.phone),
              eq(schema.enrollments.courseId, lesson.courseId),
              eq(schema.enrollments.status, "approved"),
            ),
          )
          .limit(1);
        allowed = eRows.length > 0;
      }
      if (!allowed) throw new Error("Not enrolled in this course");
      const existing = await db
        .select()
        .from(schema.lessonProgress)
        .where(
          and(
            eq(schema.lessonProgress.studentId, args.studentId),
            eq(schema.lessonProgress.lessonId, args.lessonId),
          ),
        )
        .limit(1);
      if (existing[0]) return { completed: true, xp: student.xp };
      await db.insert(schema.lessonProgress).values({
        studentId: args.studentId,
        lessonId: args.lessonId,
        createdAt: new Date(),
      });
      const xp = student.xp + 10;
      await db
        .update(schema.students)
        .set({ xp })
        .where(eq(schema.students.id, args.studentId));
      ctx.invalidateQueries();
      return { completed: true, xp };
    },
  }),

  createStudent: defineAction({
    description:
      "Creates a student profile by name + phone, or returns the existing profile for that phone (sign-in).",
    request: z.object({
      name: z.string().min(2).max(60),
      phone: z.string().min(6).max(20),
    }),
    response: z.object({ student: studentOut }),
    async handler(ctx, args) {
      const db = ctx.db();
      const phone = args.phone.trim();
      const existing = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.phone, phone));
      if (existing[0])
        return { student: await studentWithGrants(db, existing[0]) };
      const inserted = await db
        .insert(schema.students)
        .values({ name: args.name.trim(), phone, createdAt: new Date() })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("createStudent: insert returned no rows");
      ctx.invalidateQueries();
      return { student: toStudent(row) };
    },
  }),

  signupStudent: defineAction({
    description:
      "Signs up a new student account with name, mobile number and a strong password (min 8 chars, letter + digit). Fails if the number already has an account or the password is too weak.",
    request: z.object({
      name: z.string().min(2).max(60),
      phone: z.string().min(6).max(20),
      password: z.string().min(1).max(64),
    }),
    response: authResponse,
    async handler(ctx, args): Promise<AuthResult> {
      const db = ctx.db();
      const weak = passwordProblem(args.password);
      if (weak) return { ok: false, error: weak, student: null };
      const phone = args.phone.trim();
      const existing = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.phone, phone));
      if (existing[0]) {
        return {
          ok: false,
          error:
            "এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট খোলা আছে — লগইন পেজ থেকে প্রবেশ করুন।",
          student: null,
        };
      }
      const inserted = await db
        .insert(schema.students)
        .values({
          name: args.name.trim(),
          phone,
          passwordHash: await hashSecret(args.password),
          createdAt: new Date(),
        })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("signupStudent: insert returned no rows");
      ctx.invalidateQueries();
      return { ok: true, error: null, student: toStudent(row) };
    },
  }),

  loginStudent: defineAction({
    description:
      "Logs a student in with mobile number + password. Accounts created before passwords existed claim their account by setting a password on first login.",
    request: z.object({
      phone: z.string().min(6).max(20),
      password: z.string().min(1).max(64),
    }),
    response: authResponse,
    async handler(ctx, args): Promise<AuthResult> {
      const db = ctx.db();
      const phone = args.phone.trim();
      const rows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.phone, phone));
      const student = rows[0];
      if (!student) {
        return {
          ok: false,
          error:
            "এই নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি — আগে সাইন আপ করুন।",
          student: null,
        };
      }
      const hash = await hashSecret(args.password);
      if (!student.passwordHash) {
        // Legacy account without a password: this first password claims it.
        // The claim password must meet the same strong-password policy.
        const weak = passwordProblem(args.password);
        if (weak) {
          return {
            ok: false,
            error: `নতুন পাসওয়ার্ড সেট করুন — ${weak}`,
            student: null,
          };
        }
        await db
          .update(schema.students)
          .set({ passwordHash: hash })
          .where(eq(schema.students.id, student.id));
        ctx.invalidateQueries();
        return {
          ok: true,
          error: null,
          student: await studentWithGrants(db, student),
        };
      }
      if (student.passwordHash !== hash) {
        return {
          ok: false,
          error: "পাসওয়ার্ড মেলেনি — আবার চেষ্টা করুন।",
          student: null,
        };
      }
      return {
        ok: true,
        error: null,
        student: await studentWithGrants(db, student),
      };
    },
  }),

  adminLogin: defineAction({
    description:
      "Verifies the site owner's admin email + password (stored hashed in settings). Reports mustChangePassword while the bootstrap password is still in use, so the client can force a change before opening the panel.",
    request: z.object({
      email: z.string().min(3).max(120),
      password: z.string().min(1).max(64),
    }),
    response: z.object({
      ok: z.boolean(),
      error: z.string().nullable(),
      mustChangePassword: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const creds = await adminCredentials(db);
      const emailOk =
        args.email.trim().toLowerCase() === creds.email.toLowerCase();
      const hash = await hashSecret(args.password);
      if (emailOk && hash === creds.hash) {
        return {
          ok: true,
          error: null,
          mustChangePassword: creds.mustChangePassword,
        };
      }
      return {
        ok: false,
        error: "ইমেইল বা পাসওয়ার্ড মেলেনি — আবার চেষ্টা করুন।",
        mustChangePassword: false,
      };
    },
  }),

  adminChangePassword: defineAction({
    description: "Admin: changes the admin login email and/or password after verifying the current password.",
    request: z.object({
      currentPassword: z.string().min(1).max(64),
      newEmail: z.string().min(3).max(120),
      newPassword: z.string().max(64),
    }),
    response: z.object({ ok: z.boolean(), error: z.string().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const creds = await adminCredentials(db);
      const currentHash = await hashSecret(args.currentPassword);
      if (currentHash !== creds.hash) {
        return { ok: false, error: "বর্তমান পাসওয়ার্ড মেলেনি।" };
      }
      await setSetting(db, "admin_email", args.newEmail.trim());
      if (args.newPassword) {
        const weak = passwordProblem(args.newPassword);
        if (weak) {
          return { ok: false, error: weak };
        }
        await setSetting(
          db,
          "admin_password_hash",
          await hashSecret(args.newPassword),
        );
      }
      ctx.invalidateQueries();
      return { ok: true, error: null };
    },
  }),

  getStudentState: defineAction({
    description:
      "Returns a student's profile, bookmarked/learned word ids, recent quiz results, and enrolments.",
    request: z.object({ studentId: z.number().int().positive() }),
    response: z.object({
      student: studentOut.nullable(),
      bookmarkIds: z.array(z.number()),
      learnedIds: z.array(z.number()),
      learnedByLevel: z.array(
        z.object({ level: z.string(), count: z.number() }),
      ),
      results: z.array(
        z.object({
          id: z.number(),
          kind: z.string(),
          correct: z.number(),
          total: z.number(),
          createdAt: z.string(),
        }),
      ),
      enrollments: z.array(
        z.object({
          id: z.number(),
          courseId: z.number().nullable(),
          courseTitle: z.string(),
          status: z.string(),
          createdAt: z.string(),
        }),
      ),
      courseProgress: z.array(
        z.object({
          courseId: z.number(),
          courseTitle: z.string(),
          totalLessons: z.number(),
          completedLessons: z.number(),
        }),
      ),
      activity: z.array(
        z.object({
          month: z.string(),
          words: z.number(),
          lessons: z.number(),
        }),
      ),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const sRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, args.studentId));
      const student = sRows[0];
      if (!student) {
        return {
          student: null,
          bookmarkIds: [],
          learnedIds: [],
          learnedByLevel: [],
          results: [],
          enrollments: [],
          courseProgress: [],
          activity: emptyActivity(),
        };
      }
      const b = await db
        .select({ wordId: schema.bookmarks.wordId })
        .from(schema.bookmarks)
        .where(eq(schema.bookmarks.studentId, args.studentId));
      const l = await db
        .select({
          wordId: schema.learned.wordId,
          createdAt: schema.learned.createdAt,
        })
        .from(schema.learned)
        .where(eq(schema.learned.studentId, args.studentId));
      const lp = await db
        .select({ createdAt: schema.lessonProgress.createdAt })
        .from(schema.lessonProgress)
        .where(eq(schema.lessonProgress.studentId, args.studentId));
      // Monthly learning activity for the dashboard chart: words learned
      // and course lessons completed, bucketed by Dhaka calendar month.
      const activity = emptyActivity();
      const bucket = new Map(activity.map((a) => [a.month, a]));
      for (const r of l) {
        const b = bucket.get(monthKeyOf(r.createdAt));
        if (b) b.words += 1;
      }
      for (const r of lp) {
        const b = bucket.get(monthKeyOf(r.createdAt));
        if (b) b.lessons += 1;
      }
      const learnedByLevel = await db
        .select({
          level: schema.words.level,
          count: sql<number>`count(*)`,
        })
        .from(schema.learned)
        .innerJoin(schema.words, eq(schema.learned.wordId, schema.words.id))
        .where(eq(schema.learned.studentId, args.studentId))
        .groupBy(schema.words.level);
      const results = await db
        .select()
        .from(schema.quizResults)
        .where(eq(schema.quizResults.studentId, args.studentId))
        .orderBy(desc(schema.quizResults.id))
        .limit(20);
      const enr = await db
        .select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.phone, student.phone))
        .orderBy(desc(schema.enrollments.id));
      // Progress for each approved course enrolment.
      const courseProgress: {
        courseId: number;
        courseTitle: string;
        totalLessons: number;
        completedLessons: number;
      }[] = [];
      const seenCourses = new Set<number>();
      for (const e of enr) {
        if (e.status !== "approved" || e.courseId == null) continue;
        if (seenCourses.has(e.courseId)) continue;
        seenCourses.add(e.courseId);
        const totalRows = await db
          .select({ n: sql<number>`count(*)` })
          .from(schema.courseLessons)
          .where(eq(schema.courseLessons.courseId, e.courseId));
        const doneRows = await db
          .select({ n: sql<number>`count(*)` })
          .from(schema.lessonProgress)
          .innerJoin(
            schema.courseLessons,
            eq(schema.lessonProgress.lessonId, schema.courseLessons.id),
          )
          .where(
            and(
              eq(schema.lessonProgress.studentId, args.studentId),
              eq(schema.courseLessons.courseId, e.courseId),
            ),
          );
        courseProgress.push({
          courseId: e.courseId,
          courseTitle: e.courseTitle,
          totalLessons: totalRows[0]?.n ?? 0,
          completedLessons: doneRows[0]?.n ?? 0,
        });
      }
      // Courses the admin switched to free-for-all belong on every
      // student's dashboard too — they can take them without enrolling.
      const freeCourses = await db
        .select()
        .from(schema.courses)
        .where(
          and(
            eq(schema.courses.published, 1),
            eq(schema.courses.accessMode, "free"),
          ),
        )
        .orderBy(asc(schema.courses.sortOrder));
      for (const fc of freeCourses) {
        if (seenCourses.has(fc.id)) continue;
        seenCourses.add(fc.id);
        const totalRows = await db
          .select({ n: sql<number>`count(*)` })
          .from(schema.courseLessons)
          .where(eq(schema.courseLessons.courseId, fc.id));
        const doneRows = await db
          .select({ n: sql<number>`count(*)` })
          .from(schema.lessonProgress)
          .innerJoin(
            schema.courseLessons,
            eq(schema.lessonProgress.lessonId, schema.courseLessons.id),
          )
          .where(
            and(
              eq(schema.lessonProgress.studentId, args.studentId),
              eq(schema.courseLessons.courseId, fc.id),
            ),
          );
        courseProgress.push({
          courseId: fc.id,
          courseTitle: fc.title,
          totalLessons: totalRows[0]?.n ?? 0,
          completedLessons: doneRows[0]?.n ?? 0,
        });
      }
      return {
        student: await studentWithGrants(db, student),
        bookmarkIds: b.map((r) => r.wordId),
        learnedIds: l.map((r) => r.wordId),
        learnedByLevel,
        results: results.map((r) => ({
          id: r.id,
          kind: r.kind,
          correct: r.correct,
          total: r.total,
          createdAt: r.createdAt.toISOString(),
        })),
        enrollments: enr.map((r) => ({
          id: r.id,
          courseId: r.courseId,
          courseTitle: r.courseTitle,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
        courseProgress,
        activity,
      };
    },
  }),

  toggleBookmark: defineAction({
    description: "Bookmarks a word for a student, or removes the bookmark.",
    request: z.object({
      studentId: z.number().int().positive(),
      wordId: z.number().int().positive(),
    }),
    response: z.object({ bookmarked: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const existing = await db
        .select()
        .from(schema.bookmarks)
        .where(
          and(
            eq(schema.bookmarks.studentId, args.studentId),
            eq(schema.bookmarks.wordId, args.wordId),
          ),
        );
      if (existing[0]) {
        await db
          .delete(schema.bookmarks)
          .where(eq(schema.bookmarks.id, existing[0].id));
        ctx.invalidateQueries();
        return { bookmarked: false };
      }
      await db.insert(schema.bookmarks).values({
        studentId: args.studentId,
        wordId: args.wordId,
        createdAt: new Date(),
      });
      ctx.invalidateQueries();
      return { bookmarked: true };
    },
  }),

  toggleLearned: defineAction({
    description: "Marks a word learned for a student (+2 XP first time), or unmarks it.",
    request: z.object({
      studentId: z.number().int().positive(),
      wordId: z.number().int().positive(),
    }),
    response: z.object({ learned: z.boolean(), xp: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const sRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, args.studentId));
      const student = sRows[0];
      if (!student) throw new Error("Student not found");
      const existing = await db
        .select()
        .from(schema.learned)
        .where(
          and(
            eq(schema.learned.studentId, args.studentId),
            eq(schema.learned.wordId, args.wordId),
          ),
        );
      if (existing[0]) {
        await db.delete(schema.learned).where(eq(schema.learned.id, existing[0].id));
        ctx.invalidateQueries();
        return { learned: false, xp: student.xp };
      }
      await db.insert(schema.learned).values({
        studentId: args.studentId,
        wordId: args.wordId,
        createdAt: new Date(),
      });
      const newXp = student.xp + 2;
      await db
        .update(schema.students)
        .set({ xp: newXp })
        .where(eq(schema.students.id, args.studentId));
      ctx.invalidateQueries();
      return { learned: true, xp: newXp };
    },
  }),

  getBookmarkedWords: defineAction({
    description:
      "Returns the full word rows a student has bookmarked. Premium-level words are filtered out while the student is not premium.",
    request: z.object({ studentId: z.number().int().positive() }),
    response: z.object({ words: z.array(wordOut) }),
    async handler(ctx, args) {
      const db = ctx.db();
      const b = await db
        .select({ wordId: schema.bookmarks.wordId })
        .from(schema.bookmarks)
        .where(eq(schema.bookmarks.studentId, args.studentId));
      if (b.length === 0) return { words: [] };
      const rows = await db
        .select()
        .from(schema.words)
        .where(
          inArray(
            schema.words.id,
            b.map((r) => r.wordId),
          ),
        )
        .orderBy(asc(schema.words.word));
      const access = await accessibleLevels(db, args.studentId);
      const visible = rows.filter((r) => access.has(r.level));
      return { words: visible.map(toWord) };
    },
  }),

  submitQuizResult: defineAction({
    description: "Records a quiz/mock/level-test result and awards XP (10 per correct answer).",
    request: z.object({
      studentId: z.number().int().positive().nullable(),
      kind: z.string().min(1).max(20),
      correct: z.number().int().min(0),
      total: z.number().int().positive(),
    }),
    response: z.object({ xpAwarded: z.number(), newXp: z.number().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.insert(schema.quizResults).values({
        studentId: args.studentId,
        kind: args.kind,
        correct: args.correct,
        total: args.total,
        createdAt: new Date(),
      });
      const xpAwarded = args.correct * 10;
      let newXp: number | null = null;
      if (args.studentId) {
        const sRows = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.id, args.studentId));
        if (sRows[0]) {
          newXp = sRows[0].xp + xpAwarded;
          await db
            .update(schema.students)
            .set({ xp: newXp })
            .where(eq(schema.students.id, args.studentId));
        }
      }
      ctx.invalidateQueries();
      return { xpAwarded, newXp };
    },
  }),

  completeDailyTask: defineAction({
    description: "Marks today's daily task done: +50 XP and streak update (Asia/Dhaka days).",
    request: z.object({ studentId: z.number().int().positive() }),
    response: z.object({
      alreadyDone: z.boolean(),
      xp: z.number(),
      streak: z.number(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const sRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, args.studentId));
      const student = sRows[0];
      if (!student) throw new Error("Student not found");
      const { date, dayNumber } = dhakaToday();
      if (student.lastDaily === date) {
        return { alreadyDone: true, xp: student.xp, streak: student.streak };
      }
      const yesterday = new Date((dayNumber - 1) * 86400000)
        .toISOString()
        .slice(0, 10);
      const streak = student.lastDaily === yesterday ? student.streak + 1 : 1;
      const xp = student.xp + 50;
      await db
        .update(schema.students)
        .set({ xp, streak, lastDaily: date })
        .where(eq(schema.students.id, args.studentId));
      ctx.invalidateQueries();
      return { alreadyDone: false, xp, streak };
    },
  }),

  requestEnrollment: defineAction({
    description: "Submits a course enrolment request with manual-payment details for admin review.",
    request: z.object({
      courseId: z.number().int().positive().nullable(),
      courseTitle: z.string().min(1).max(120),
      name: z.string().min(2).max(60),
      phone: z.string().min(6).max(20),
      method: z.string().max(20),
      txnId: z.string().max(40),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const inserted = await db
        .insert(schema.enrollments)
        .values({
          courseId: args.courseId,
          courseTitle: args.courseTitle,
          name: args.name.trim(),
          phone: args.phone.trim(),
          method: args.method,
          txnId: args.txnId.trim(),
          status: "pending",
          createdAt: new Date(),
        })
        .returning({ id: schema.enrollments.id });
      const row = inserted[0];
      if (!row) throw new Error("requestEnrollment: insert returned no rows");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  getSettings: defineAction({
    description:
      "Returns public site settings: payment note, WhatsApp number, premium price, book price/title/free-mode, which vocabulary levels are free, and the admin-editable live site texts (announcement, hero, book blurb, mentor quote).",
    request: z.object({}),
    response: z.object({
      paymentNote: z.string(),
      whatsapp: z.string(),
      premiumPrice: z.number().nullable(),
      bookPrice: z.number(),
      bookTitle: z.string(),
      bookFree: z.boolean(),
      freeLevels: z.array(z.string()),
      announcement: z.string(),
      heroTitle: z.string(),
      heroSubtitle: z.string(),
      bookBlurb: z.string(),
      mentorQuote: z.string(),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db.select().from(schema.settings);
      const map = new Map(rows.map((r) => [r.key, r.value]));
      const rawPrice = Number(map.get("premium_price") ?? "");
      const rawBook = Number(map.get("book_price") ?? "");
      const freeParsed = parseFreeLevels(map.get("free_levels"));
      return {
        paymentNote: map.get("payment_note") ?? "",
        whatsapp: map.get("whatsapp_number") ?? "",
        premiumPrice:
          Number.isFinite(rawPrice) && rawPrice > 0 ? Math.floor(rawPrice) : null,
        bookPrice:
          Number.isFinite(rawBook) && rawBook > 0
            ? Math.floor(rawBook)
            : BOOK_DEFAULT_PRICE,
        bookTitle: (map.get("book_title") ?? "").trim() || BOOK_DEFAULT_TITLE,
        bookFree: map.get("book_free") === "1",
        freeLevels: freeParsed
          ? ALL_LEVELS.filter((l) => freeParsed.has(l))
          : [...DEFAULT_FREE_LEVELS],
        announcement: map.get("site_announcement") ?? "",
        heroTitle: map.get("hero_title") ?? "",
        heroSubtitle: map.get("hero_subtitle") ?? "",
        bookBlurb: map.get("book_blurb") ?? "",
        mentorQuote: map.get("mentor_quote") ?? "",
      };
    },
  }),

  getBookAccess: defineAction({
    description:
      "Returns a student's book state: whether they own in-site reading access, the book price, whether the PDF has been uploaded, total pages, their saved reading page, and the payment note.",
    request: z.object({
      studentId: z.number().int().positive().nullable(),
    }),
    response: z.object({
      hasAccess: z.boolean(),
      price: z.number(),
      title: z.string(),
      freeForAll: z.boolean(),
      uploaded: z.boolean(),
      totalPages: z.number(),
      lastPage: z.number(),
      paymentNote: z.string(),
      whatsapp: z.string(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const cfg = await bookSettings(db);
      const head = await ctx.blobs.head(BOOK_BLOB_KEY);
      let lastPage = 1;
      if (args.studentId) {
        const rows = await db
          .select({ page: schema.bookProgress.page })
          .from(schema.bookProgress)
          .where(eq(schema.bookProgress.studentId, args.studentId))
          .limit(1);
        if (rows[0]) lastPage = Math.min(Math.max(1, rows[0].page), cfg.totalPages);
      }
      return {
        hasAccess: await studentHasBookAccess(db, args.studentId),
        price: cfg.price,
        title: cfg.title,
        freeForAll: cfg.freeForAll,
        uploaded: head != null,
        totalPages: cfg.totalPages,
        lastPage,
        paymentNote: await getSetting(db, "payment_note"),
        whatsapp: await getSetting(db, "whatsapp_number"),
      };
    },
  }),

  getBookReader: defineAction({
    description:
      "Returns a short-lived (10 minute) signed URL for the book PDF — ONLY for students whose book purchase was approved (book_access). Non-buyers get url=null; the PDF is never public and never downloadable from the reader. The short lifetime plus the reader's periodic re-checks make an admin revocation take effect within minutes.",
    request: z.object({ studentId: z.number().int().positive() }),
    response: z.object({
      url: z.string().nullable(),
      totalPages: z.number(),
      lastPage: z.number(),
      studentName: z.string(),
      studentPhone: z.string(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const cfg = await bookSettings(db);
      const sRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, args.studentId));
      const student = sRows[0];
      // Access = bought the book OR the admin switched the book free
      // for everyone (studentHasBookAccess covers both).
      if (!student || !(await studentHasBookAccess(db, student.id))) {
        return {
          url: null,
          totalPages: cfg.totalPages,
          lastPage: 1,
          studentName: student?.name ?? "",
          studentPhone: student?.phone ?? "",
        };
      }
      const head = await ctx.blobs.head(BOOK_BLOB_KEY);
      if (!head) {
        return {
          url: null,
          totalPages: cfg.totalPages,
          lastPage: 1,
          studentName: student.name,
          studentPhone: student.phone,
        };
      }
      const pRows = await db
        .select({ page: schema.bookProgress.page })
        .from(schema.bookProgress)
        .where(eq(schema.bookProgress.studentId, args.studentId))
        .limit(1);
      const lastPage = pRows[0]
        ? Math.min(Math.max(1, pRows[0].page), cfg.totalPages)
        : 1;
      const url = await ctx.blobs.getUrl(BOOK_BLOB_KEY, {
        expiresInSeconds: 600,
        // Standalone only: DiskBlobs signs a private download URL
        // only when studentId is passed (the artifact runtime signs
        // private blobs by default). Without it the reader gets a
        // plain /api/files/... path that the book route rejects.
        studentId: args.studentId,
      });
      return {
        url,
        totalPages: cfg.totalPages,
        lastPage,
        studentName: student.name,
        studentPhone: student.phone,
      };
    },
  }),

  saveBookProgress: defineAction({
    description:
      "Saves the page a book owner last opened, so reading resumes where they left off.",
    request: z.object({
      studentId: z.number().int().positive(),
      page: z.number().int().min(1).max(5000),
    }),
    response: z.object({ ok: z.boolean(), page: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const cfg = await bookSettings(db);
      const page = Math.min(Math.max(1, args.page), cfg.totalPages);
      // Reading progress belongs to book owners only — a student whose
      // access was removed cannot keep writing resume points.
      if (!(await studentHasBookAccess(db, args.studentId))) {
        return { ok: false, page };
      }
      const existing = await db
        .select({ id: schema.bookProgress.id })
        .from(schema.bookProgress)
        .where(eq(schema.bookProgress.studentId, args.studentId))
        .limit(1);
      if (existing[0]) {
        await db
          .update(schema.bookProgress)
          .set({ page, updatedAt: new Date() })
          .where(eq(schema.bookProgress.id, existing[0].id));
      } else {
        await db.insert(schema.bookProgress).values({
          studentId: args.studentId,
          page,
          updatedAt: new Date(),
        });
      }
      return { ok: true, page };
    },
  }),

  getBookBookmarks: defineAction({
    description:
      "Returns the page numbers a book owner has bookmarked in the reader, so the reader can mark them and jump back to them.",
    request: z.object({ studentId: z.number().int().positive() }),
    response: z.object({ pages: z.array(z.number()) }),
    async handler(ctx, args) {
      const db = ctx.db();
      if (!(await studentHasBookAccess(db, args.studentId))) {
        return { pages: [] };
      }
      const rows = await db
        .select({ page: schema.bookBookmarks.page })
        .from(schema.bookBookmarks)
        .where(eq(schema.bookBookmarks.studentId, args.studentId))
        .orderBy(asc(schema.bookBookmarks.page));
      return { pages: rows.map((r) => r.page) };
    },
  }),

  toggleBookBookmark: defineAction({
    description:
      "Bookmarks the given reader page for a book owner, or removes the bookmark when the page is already bookmarked. Returns the full updated bookmark list.",
    request: z.object({
      studentId: z.number().int().positive(),
      page: z.number().int().min(1).max(5000),
    }),
    response: z.object({ pages: z.array(z.number()), bookmarked: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const cfg = await bookSettings(db);
      const page = Math.min(Math.max(1, args.page), cfg.totalPages);
      if (!(await studentHasBookAccess(db, args.studentId))) {
        return { pages: [], bookmarked: false };
      }
      const existing = await db
        .select({ id: schema.bookBookmarks.id })
        .from(schema.bookBookmarks)
        .where(
          and(
            eq(schema.bookBookmarks.studentId, args.studentId),
            eq(schema.bookBookmarks.page, page),
          ),
        )
        .limit(1);
      let bookmarked: boolean;
      if (existing[0]) {
        await db
          .delete(schema.bookBookmarks)
          .where(eq(schema.bookBookmarks.id, existing[0].id));
        bookmarked = false;
      } else {
        await db.insert(schema.bookBookmarks).values({
          studentId: args.studentId,
          page,
          createdAt: new Date(),
        });
        bookmarked = true;
      }
      const rows = await db
        .select({ page: schema.bookBookmarks.page })
        .from(schema.bookBookmarks)
        .where(eq(schema.bookBookmarks.studentId, args.studentId))
        .orderBy(asc(schema.bookBookmarks.page));
      return { pages: rows.map((r) => r.page), bookmarked };
    },
  }),

  // ---------- admin ----------

  adminListCourses: defineAction({
    description: "Admin: lists all courses including unpublished ones.",
    request: z.object({}),
    response: z.object({ courses: z.array(courseOut) }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.courses)
        .orderBy(asc(schema.courses.sortOrder));
      return {
        courses: await Promise.all(rows.map((r) => toCourse(ctx, r))),
      };
    },
  }),

  adminSaveCourse: defineAction({
    description: "Admin: creates or updates a course.",
    request: z.object({
      id: z.number().int().positive().nullable(),
      title: z.string().min(1).max(120),
      subtitle: z.string().max(200),
      price: z.number().int().min(0).nullable(),
      oldPrice: z.number().int().min(0).nullable(),
      lessons: z.number().int().min(0).nullable(),
      features: z.string().max(2000),
      badge: z.string().max(60),
      accessMode: z.enum(["paid", "free"]).default("paid"),
      imageBlobKey: z.string().max(300),
      published: z.number().int().min(0).max(1),
      sortOrder: z.number().int().min(0),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const values = {
        title: args.title,
        subtitle: args.subtitle,
        price: args.price,
        oldPrice: args.oldPrice,
        lessons: args.lessons,
        features: args.features,
        badge: args.badge,
        accessMode: args.accessMode,
        imageBlobKey: args.imageBlobKey,
        published: args.published,
        sortOrder: args.sortOrder,
      };
      if (args.id) {
        await db
          .update(schema.courses)
          .set(values)
          .where(eq(schema.courses.id, args.id));
        ctx.invalidateQueries();
        return { id: args.id };
      }
      const inserted = await db
        .insert(schema.courses)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: schema.courses.id });
      const row = inserted[0];
      if (!row) throw new Error("adminSaveCourse: insert returned no rows");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  adminDeleteCourse: defineAction({
    description: "Admin: deletes a course.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.delete(schema.courses).where(eq(schema.courses.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminListCourseLessons: defineAction({
    description:
      "Admin: lists all lessons of one course with full content, including each lesson's attached study files.",
    request: z.object({ courseId: z.number().int().positive() }),
    response: z.object({
      lessons: z.array(
        z.object({
          id: z.number(),
          courseId: z.number(),
          title: z.string(),
          kind: z.string(),
          videoUrl: z.string(),
          videoBlobKey: z.string(),
          videoName: z.string(),
          videoSrc: z.string(),
          body: z.string(),
          freePreview: z.number(),
          sortOrder: z.number(),
          attachments: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              mimeType: z.string(),
              sizeBytes: z.number(),
              url: z.string(),
            }),
          ),
        }),
      ),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.courseLessons)
        .where(eq(schema.courseLessons.courseId, args.courseId))
        .orderBy(asc(schema.courseLessons.sortOrder));
      const attRows =
        rows.length > 0
          ? await db
              .select()
              .from(schema.lessonAttachments)
              .where(
                inArray(
                  schema.lessonAttachments.lessonId,
                  rows.map((r) => r.id),
                ),
              )
              .orderBy(asc(schema.lessonAttachments.sortOrder))
          : [];
      const attByLesson = new Map<number, typeof attRows>();
      for (const a of attRows) {
        const list = attByLesson.get(a.lessonId) ?? [];
        list.push(a);
        attByLesson.set(a.lessonId, list);
      }
      return {
        lessons: await Promise.all(
          rows.map(async (r) => ({
            id: r.id,
            courseId: r.courseId,
            title: r.title,
            kind: r.kind,
            videoUrl: r.videoUrl,
            videoBlobKey: r.videoBlobKey,
            videoName: r.videoName,
            videoSrc: r.videoBlobKey
              ? await ctx.blobs.getUrl(r.videoBlobKey, { public: true })
              : r.videoUrl,
            body: r.body,
            freePreview: r.freePreview,
            sortOrder: r.sortOrder,
            attachments: await Promise.all(
              (attByLesson.get(r.id) ?? []).map(async (a) => ({
                id: a.id,
                name: a.name,
                mimeType: a.mimeType,
                sizeBytes: a.sizeBytes,
                url: await ctx.blobs.getUrl(a.blobKey, { public: true }),
              })),
            ),
          })),
        ),
      };
    },
  }),

  adminSaveCourseLesson: defineAction({
    description: "Admin: creates or updates a course lesson.",
    request: z.object({
      id: z.number().int().positive().nullable(),
      courseId: z.number().int().positive(),
      title: z.string().min(1).max(200),
      kind: z.enum(["text", "video"]),
      videoUrl: z.string().max(500),
      videoBlobKey: z.string().max(300),
      videoName: z.string().max(200),
      body: z.string().max(20000),
      freePreview: z.number().int().min(0).max(1),
      sortOrder: z.number().int().min(0),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const values = {
        courseId: args.courseId,
        title: args.title,
        kind: args.kind,
        videoUrl: args.videoUrl,
        videoBlobKey: args.videoBlobKey,
        videoName: args.videoName,
        body: args.body,
        freePreview: args.freePreview,
        sortOrder: args.sortOrder,
      };
      if (args.id) {
        await db
          .update(schema.courseLessons)
          .set(values)
          .where(eq(schema.courseLessons.id, args.id));
        ctx.invalidateQueries();
        return { id: args.id };
      }
      const inserted = await db
        .insert(schema.courseLessons)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: schema.courseLessons.id });
      const row = inserted[0];
      if (!row) throw new Error("adminSaveCourseLesson: insert returned no rows");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  adminUploadCourseVideo: defineAction({
    description:
      "Admin: uploads a course-lesson video file into the artifact's own blob storage and returns its blob key and playable URL.",
    request: z.object({
      filename: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      dataBase64: z.string().min(1).max(64_000_000),
    }),
    response: z.object({
      ok: z.boolean(),
      error: z.string().nullable(),
      blobKey: z.string().nullable(),
      url: z.string().nullable(),
    }),
    async handler(ctx, args) {
      if (!args.mimeType.startsWith("video/")) {
        return {
          ok: false,
          error: "শুধু ভিডিও ফাইল (MP4/WebM) আপলোড করা যাবে।",
          blobKey: null,
          url: null,
        };
      }
      const bytes = Buffer.from(args.dataBase64, "base64");
      // ~45 MB decoded cap keeps uploads reliable on mobile connections.
      if (bytes.length === 0 || bytes.length > 45_000_000) {
        return {
          ok: false,
          error: "ভিডিও ফাইলটি খুব বড় — সর্বোচ্চ ৪৫ MB-এর মধ্যে রাখুন।",
          blobKey: null,
          url: null,
        };
      }
      const ext =
        args.filename
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "mp4";
      const key = `course-videos/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${ext}`;
      await ctx.blobs.put(key, bytes, {
        contentType: args.mimeType,
        public: true,
      });
      const url = await ctx.blobs.getUrl(key, { public: true });
      return { ok: true, error: null, blobKey: key, url };
    },
  }),

  adminDeleteCourseVideo: defineAction({
    description:
      "Admin: deletes an uploaded course-lesson video from blob storage.",
    request: z.object({ blobKey: z.string().min(1).max(300) }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      if (args.blobKey.startsWith("course-videos/")) {
        await ctx.blobs.delete(args.blobKey);
      }
      return { ok: true };
    },
  }),

  adminUploadLessonFile: defineAction({
    description:
      "Admin: uploads a study file (PDF, image, audio, document) for a course lesson into the artifact's blob storage and returns its blob key and URL.",
    request: z.object({
      filename: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      dataBase64: z.string().min(1).max(32_000_000),
    }),
    response: z.object({
      ok: z.boolean(),
      error: z.string().nullable(),
      blobKey: z.string().nullable(),
      url: z.string().nullable(),
      sizeBytes: z.number(),
    }),
    async handler(ctx, args) {
      const mt = args.mimeType.toLowerCase();
      const allowed =
        mt === "application/pdf" ||
        mt.startsWith("image/") ||
        mt.startsWith("audio/") ||
        mt === "text/plain" ||
        mt === "application/msword" ||
        mt ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mt === "application/vnd.ms-powerpoint" ||
        mt ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mt === "application/vnd.ms-excel" ||
        mt ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mt === "application/zip";
      if (!allowed) {
        return {
          ok: false,
          error:
            "এই ধরনের ফাইল দেওয়া যাবে না — PDF, ছবি, অডিও, Word/PowerPoint/Excel ডকুমেন্ট বা ZIP ফাইল দিন।",
          blobKey: null,
          url: null,
          sizeBytes: 0,
        };
      }
      const bytes = Buffer.from(args.dataBase64, "base64");
      // ~20 MB decoded cap keeps uploads reliable on mobile connections.
      if (bytes.length === 0 || bytes.length > 20_000_000) {
        return {
          ok: false,
          error: "ফাইলটি খুব বড় — সর্বোচ্চ ২০ MB-এর মধ্যে রাখুন।",
          blobKey: null,
          url: null,
          sizeBytes: 0,
        };
      }
      const ext =
        args.filename
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "bin";
      const key = `lesson-files/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${ext}`;
      await ctx.blobs.put(key, bytes, {
        contentType: args.mimeType,
        public: true,
      });
      const url = await ctx.blobs.getUrl(key, { public: true });
      return { ok: true, error: null, blobKey: key, url, sizeBytes: bytes.length };
    },
  }),

  adminAddLessonAttachment: defineAction({
    description:
      "Admin: attaches an already-uploaded study file to a course lesson.",
    request: z.object({
      lessonId: z.number().int().positive(),
      name: z.string().min(1).max(200),
      blobKey: z.string().min(1).max(300),
      mimeType: z.string().max(100),
      sizeBytes: z.number().int().min(0),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      if (!args.blobKey.startsWith("lesson-files/")) {
        throw new Error("Invalid attachment file");
      }
      const countRows = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.lessonAttachments)
        .where(eq(schema.lessonAttachments.lessonId, args.lessonId));
      const inserted = await db
        .insert(schema.lessonAttachments)
        .values({
          lessonId: args.lessonId,
          name: args.name,
          blobKey: args.blobKey,
          mimeType: args.mimeType,
          sizeBytes: args.sizeBytes,
          sortOrder: countRows[0]?.n ?? 0,
          createdAt: new Date(),
        })
        .returning({ id: schema.lessonAttachments.id });
      const row = inserted[0];
      if (!row) throw new Error("adminAddLessonAttachment: insert returned no rows");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  adminDeleteLessonAttachment: defineAction({
    description:
      "Admin: removes a study file from a course lesson and deletes its blob.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.lessonAttachments)
        .where(eq(schema.lessonAttachments.id, args.id));
      const row = rows[0];
      if (row) {
        await db
          .delete(schema.lessonAttachments)
          .where(eq(schema.lessonAttachments.id, args.id));
        if (row.blobKey.startsWith("lesson-files/")) {
          await ctx.blobs.delete(row.blobKey);
        }
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminUploadCourseImage: defineAction({
    description:
      "Admin: uploads a course cover image into the artifact's own blob storage and returns its blob key and display URL.",
    request: z.object({
      filename: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      dataBase64: z.string().min(1).max(16_000_000),
    }),
    response: z.object({
      ok: z.boolean(),
      error: z.string().nullable(),
      blobKey: z.string().nullable(),
      url: z.string().nullable(),
    }),
    async handler(ctx, args) {
      if (!args.mimeType.startsWith("image/")) {
        return {
          ok: false,
          error: "শুধু ছবি ফাইল (JPG/PNG/WebP) আপলোড করা যাবে।",
          blobKey: null,
          url: null,
        };
      }
      const bytes = Buffer.from(args.dataBase64, "base64");
      // ~8 MB decoded cap is plenty for a cover image.
      if (bytes.length === 0 || bytes.length > 8_000_000) {
        return {
          ok: false,
          error: "ছবির ফাইলটি খুব বড় — সর্বোচ্চ ৮ MB-এর মধ্যে রাখুন।",
          blobKey: null,
          url: null,
        };
      }
      const ext =
        args.filename
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const key = `course-images/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${ext}`;
      await ctx.blobs.put(key, bytes, {
        contentType: args.mimeType,
        public: true,
      });
      const url = await ctx.blobs.getUrl(key, { public: true });
      return { ok: true, error: null, blobKey: key, url };
    },
  }),

  adminDeleteCourseImage: defineAction({
    description:
      "Admin: deletes an uploaded course cover image from blob storage.",
    request: z.object({ blobKey: z.string().min(1).max(300) }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      if (args.blobKey.startsWith("course-images/")) {
        await ctx.blobs.delete(args.blobKey);
      }
      return { ok: true };
    },
  }),

  adminDeleteCourseLesson: defineAction({
    description:
      "Admin: deletes a course lesson together with its attached study files.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const atts = await db
        .select()
        .from(schema.lessonAttachments)
        .where(eq(schema.lessonAttachments.lessonId, args.id));
      await db
        .delete(schema.lessonAttachments)
        .where(eq(schema.lessonAttachments.lessonId, args.id));
      await db
        .delete(schema.courseLessons)
        .where(eq(schema.courseLessons.id, args.id));
      for (const a of atts) {
        if (a.blobKey.startsWith("lesson-files/")) {
          await ctx.blobs.delete(a.blobKey);
        }
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminSaveLesson: defineAction({
    description: "Admin: creates or updates a grammar lesson.",
    request: z.object({
      id: z.number().int().positive().nullable(),
      titleBn: z.string().min(1).max(160),
      titleEn: z.string().max(120),
      category: z.string().max(60),
      level: z.string().max(10),
      summary: z.string().max(500),
      body: z.string().max(20000),
      sortOrder: z.number().int().min(0),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const values = {
        titleBn: args.titleBn,
        titleEn: args.titleEn,
        category: args.category,
        level: args.level,
        summary: args.summary,
        body: args.body,
        sortOrder: args.sortOrder,
      };
      if (args.id) {
        await db
          .update(schema.grammarLessons)
          .set(values)
          .where(eq(schema.grammarLessons.id, args.id));
        ctx.invalidateQueries();
        return { id: args.id };
      }
      const inserted = await db
        .insert(schema.grammarLessons)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: schema.grammarLessons.id });
      const row = inserted[0];
      if (!row) throw new Error("adminSaveLesson: insert returned no rows");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  adminDeleteLesson: defineAction({
    description: "Admin: deletes a grammar lesson.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db
        .delete(schema.grammarLessons)
        .where(eq(schema.grammarLessons.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminSaveWord: defineAction({
    description: "Admin: creates or updates a vocabulary word.",
    request: z.object({
      id: z.number().int().positive().nullable(),
      word: z.string().min(1).max(80),
      pos: z.string().max(40),
      level: z.string().min(1).max(10),
      bn: z.string().max(300),
      bnPron: z.string().max(120),
      respUs: z.string().max(120),
      respUk: z.string().max(120),
      syn: z.string().max(200),
      ant: z.string().max(200),
      ex: z.string().max(400),
      exBn: z.string().max(400),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const values = {
        word: args.word,
        pos: args.pos,
        level: args.level,
        bn: args.bn,
        bnPron: args.bnPron,
        respUs: args.respUs,
        respUk: args.respUk,
        syn: args.syn,
        ant: args.ant,
        ex: args.ex,
        exBn: args.exBn,
      };
      if (args.id) {
        await db
          .update(schema.words)
          .set(values)
          .where(eq(schema.words.id, args.id));
        ctx.invalidateQueries();
        return { id: args.id };
      }
      const countRows = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.words);
      const inserted = await db
        .insert(schema.words)
        .values({ ...values, sort: (countRows[0]?.n ?? 0) + 1 })
        .returning({ id: schema.words.id });
      const row = inserted[0];
      if (!row) throw new Error("adminSaveWord: insert returned no rows");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  adminDeleteWord: defineAction({
    description: "Admin: deletes a vocabulary word.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.delete(schema.words).where(eq(schema.words.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminListEnrollments: defineAction({
    description: "Admin: lists enrolment requests, newest first.",
    request: z.object({}),
    response: z.object({
      enrollments: z.array(
        z.object({
          id: z.number(),
          courseId: z.number().nullable(),
          courseTitle: z.string(),
          name: z.string(),
          phone: z.string(),
          method: z.string(),
          txnId: z.string(),
          status: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.enrollments)
        .orderBy(desc(schema.enrollments.id))
        .limit(200);
      return {
        enrollments: rows.map((r) => ({
          id: r.id,
          courseId: r.courseId,
          courseTitle: r.courseTitle,
          name: r.name,
          phone: r.phone,
          method: r.method,
          txnId: r.txnId,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
  }),

  adminSetEnrollmentStatus: defineAction({
    description:
      "Admin: approves or rejects an enrolment request. Approving a premium application also switches premium ON, and approving a book application switches book reading access ON, for the student account with that mobile number. Moving a premium/book application AWAY from approved (back to pending, or rejected) switches the matching access OFF again — unless another approved application of the same kind exists for that number — so removing a student from a purchase really locks it.",
    request: z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "approved", "rejected"]),
    }),
    response: z.object({
      ok: z.boolean(),
      premiumGranted: z.boolean(),
      bookGranted: z.boolean(),
      premiumRevoked: z.boolean(),
      bookRevoked: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rowsBefore = await db
        .select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.id, args.id));
      const enr = rowsBefore[0];
      await db
        .update(schema.enrollments)
        .set({ status: args.status })
        .where(eq(schema.enrollments.id, args.id));
      let premiumGranted = false;
      let bookGranted = false;
      let premiumRevoked = false;
      let bookRevoked = false;
      if (enr && enr.courseId == null) {
        if (args.status === "approved") {
          const sRows = await db
            .select()
            .from(schema.students)
            .where(eq(schema.students.phone, enr.phone));
          const student = sRows[0];
          if (student && enr.courseTitle === PREMIUM_APPLICATION_TITLE) {
            if (student.premium !== 1) {
              await db
                .update(schema.students)
                .set({ premium: 1 })
                .where(eq(schema.students.id, student.id));
            }
            premiumGranted = true;
          }
          if (student && enr.courseTitle === BOOK_APPLICATION_TITLE) {
            if (student.bookAccess !== 1) {
              await db
                .update(schema.students)
                .set({ bookAccess: 1 })
                .where(eq(schema.students.id, student.id));
            }
            bookGranted = true;
          }
        } else {
          const revoked = await revokeApplicationAccessIfOrphaned(
            db,
            enr.phone,
            enr.courseTitle,
            enr.id,
          );
          premiumRevoked = revoked.premiumRevoked;
          bookRevoked = revoked.bookRevoked;
        }
      }
      ctx.invalidateQueries();
      return { ok: true, premiumGranted, bookGranted, premiumRevoked, bookRevoked };
    },
  }),

  adminSetStudentBookAccess: defineAction({
    description:
      "Admin: grants or revokes a student's in-site book reading access (Oxford 7000 Words) directly from the student list.",
    request: z.object({
      studentId: z.number().int().positive(),
      bookAccess: z.boolean(),
    }),
    response: z.object({ ok: z.boolean(), bookAccess: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db
        .update(schema.students)
        .set({ bookAccess: args.bookAccess ? 1 : 0 })
        .where(eq(schema.students.id, args.studentId));
      ctx.invalidateQueries();
      return { ok: true, bookAccess: args.bookAccess };
    },
  }),

  adminBookStatus: defineAction({
    description:
      "Admin: reports whether the book PDF is uploaded (file name, size, total pages, price, title, free-for-all mode) and how many students hold book access.",
    request: z.object({}),
    response: z.object({
      uploaded: z.boolean(),
      fileName: z.string(),
      sizeBytes: z.number(),
      totalPages: z.number(),
      price: z.number(),
      title: z.string(),
      freeForAll: z.boolean(),
      accessCount: z.number(),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const cfg = await bookSettings(db);
      const head = await ctx.blobs.head(BOOK_BLOB_KEY);
      const cnt = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.students)
        .where(eq(schema.students.bookAccess, 1));
      return {
        uploaded: head != null,
        fileName: cfg.fileName,
        sizeBytes: head?.sizeBytes ?? 0,
        totalPages: cfg.totalPages,
        price: cfg.price,
        title: cfg.title,
        freeForAll: cfg.freeForAll,
        accessCount: cnt[0]?.n ?? 0,
      };
    },
  }),

  adminSaveBookSettings: defineAction({
    description:
      "Admin: saves the book's display name, price and free/premium mode. Applies site-wide immediately; switching the book free opens the reader to every logged-in student, switching it back to paid restores buyer-only access.",
    request: z.object({
      bookTitle: z.string().min(1).max(120),
      bookPrice: z.number().int().min(0),
      bookFree: z.boolean(),
    }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const pairs: [string, string][] = [
        ["book_title", args.bookTitle.trim()],
        ["book_price", String(Math.max(0, Math.floor(args.bookPrice || 0)))],
        ["book_free", args.bookFree ? "1" : "0"],
      ];
      for (const [key, value] of pairs) {
        await db
          .insert(schema.settings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: schema.settings.key,
            set: { value },
          });
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminUploadBookPdf: defineAction({
    description:
      "Admin: uploads the book PDF (up to ~45 MB, same proven path as course videos) into PRIVATE blob storage — it is never public and never bundled with the site. Only verified buyers ever receive a short-lived signed URL for it.",
    request: z.object({
      filename: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      dataBase64: z.string().min(1).max(64_000_000),
      totalPages: z.number().int().min(1).max(5000),
    }),
    response: z.object({
      ok: z.boolean(),
      error: z.string().nullable(),
      sizeBytes: z.number(),
    }),
    async handler(ctx, args) {
      if (args.mimeType !== "application/pdf") {
        return { ok: false, error: "শুধু PDF ফাইল আপলোড করা যাবে।", sizeBytes: 0 };
      }
      const bytes = Buffer.from(args.dataBase64, "base64");
      if (bytes.length === 0 || bytes.length > 45_000_000) {
        return {
          ok: false,
          error: "ফাইলটি খুব বড় — সর্বোচ্চ ৪৫ MB-এর মধ্যে রাখুন।",
          sizeBytes: 0,
        };
      }
      // A real PDF starts with the %PDF- magic header.
      if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
        return {
          ok: false,
          error: "ফাইলটি সঠিক PDF মনে হচ্ছে না — আসল PDF ফাইলটি বেছে নিন।",
          sizeBytes: 0,
        };
      }
      const db = ctx.db();
      await ctx.blobs.put(BOOK_BLOB_KEY, bytes, {
        contentType: "application/pdf",
        public: false,
      });
      await setSetting(db, "book_file_name", args.filename);
      await setSetting(db, "book_total_pages", String(args.totalPages));
      ctx.invalidateQueries();
      return { ok: true, error: null, sizeBytes: bytes.length };
    },
  }),

  adminDeleteBook: defineAction({
    description:
      "Admin: removes the uploaded book PDF from private storage (students keep their access flag; the reader shows a not-available note until a new PDF is uploaded).",
    request: z.object({}),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx) {
      await ctx.blobs.delete(BOOK_BLOB_KEY);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminSetStudentPremium: defineAction({
    description:
      "Admin: grants or revokes a student's premium access (unlocks/locks the B1–IELTS levels for that account).",
    request: z.object({
      studentId: z.number().int().positive(),
      premium: z.boolean(),
    }),
    response: z.object({ ok: z.boolean(), premium: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db
        .update(schema.students)
        .set({ premium: args.premium ? 1 : 0 })
        .where(eq(schema.students.id, args.studentId));
      ctx.invalidateQueries();
      return { ok: true, premium: args.premium };
    },
  }),

  adminSetStudentLevelGrant: defineAction({
    description:
      "Admin: frees ONE vocabulary level for ONE student (or takes it back) — the student can open that level's words, flashcards and quizzes without full premium and without the level becoming free for everyone.",
    request: z.object({
      studentId: z.number().int().positive(),
      level: z.string().min(1).max(10),
      granted: z.boolean(),
    }),
    response: z.object({
      ok: z.boolean(),
      error: z.string().nullable(),
      levelGrants: z.array(z.string()),
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const level = args.level.trim().toUpperCase();
      if (!ALL_LEVELS.includes(level)) {
        return {
          ok: false,
          error: "অজানা লেভেল।",
          levelGrants: [] as string[],
        };
      }
      const existing = await db
        .select({ id: schema.studentLevelGrants.id })
        .from(schema.studentLevelGrants)
        .where(
          and(
            eq(schema.studentLevelGrants.studentId, args.studentId),
            eq(schema.studentLevelGrants.level, level),
          ),
        );
      if (args.granted && !existing[0]) {
        await db.insert(schema.studentLevelGrants).values({
          studentId: args.studentId,
          level,
          createdAt: new Date(),
        });
      } else if (!args.granted && existing[0]) {
        await db
          .delete(schema.studentLevelGrants)
          .where(eq(schema.studentLevelGrants.id, existing[0].id));
      }
      const grants = await getStudentLevelGrants(db, args.studentId);
      ctx.invalidateQueries();
      return {
        ok: true,
        error: null,
        levelGrants: ALL_LEVELS.filter((l) => grants.has(l)),
      };
    },
  }),

  seedBookFile: defineAction({
    description:
      "Installs the author's real book PDF (Oxford 7000 Words v3.4, stored on this machine) into the reader's private blob storage — ONLY when no book file is uploaded yet, so it never overwrites a file the admin uploaded manually. Fixes a fresh site where book access is on but there is no file to read.",
    request: z.object({}),
    response: z.object({
      ok: z.boolean(),
      seeded: z.boolean(),
      alreadyPresent: z.boolean(),
      error: z.string().nullable(),
      sizeBytes: z.number(),
      totalPages: z.number(),
    }),
    async handler(ctx) {
      const fail = (error: string) => ({
        ok: false,
        seeded: false,
        alreadyPresent: false,
        error,
        sizeBytes: 0,
        totalPages: 0,
      });
      const head = await ctx.blobs.head(BOOK_BLOB_KEY);
      if (head) {
        return {
          ok: true,
          seeded: false,
          alreadyPresent: true,
          error: null,
          sizeBytes: head.sizeBytes,
          totalPages: 0,
        };
      }
      // Standalone: this backend runs on Node with real filesystem
      // access, so read the author's finished book straight off the
      // operator's disk (the same path the artifact's privileged
      // handler reads). The 31 MB PDF is NEVER bundled in the zip —
      // if the file is not on this machine, the admin uploads it
      // from the book tab instead.
      let bytes: Buffer;
      let fileName: string;
      try {
        bytes = await readFile(BOOK_PDF_PATH);
        fileName = basename(BOOK_PDF_PATH);
      } catch {
        return fail(
          "সার্ভারে বইয়ের ফাইলটি পড়া যায়নি — অ্যাডমিন প্যানেলের বই ট্যাব থেকে PDF আপলোড করে দিন।",
        );
      }
      if (
        bytes.length === 0 ||
        bytes.subarray(0, 5).toString("latin1") !== "%PDF-"
      ) {
        return fail("বইয়ের ফাইলটি সঠিক PDF হিসেবে যাচাই করা যায়নি।");
      }
      // Page count: count page objects in the file; fall back to the
      // v3.4 book's known 762 pages when the PDF uses object streams.
      const text = bytes.toString("latin1");
      const counted = (text.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? [])
        .length;
      const totalPages = counted >= 100 ? counted : BOOK_DEFAULT_PAGES;
      const db = ctx.db();
      await ctx.blobs.put(BOOK_BLOB_KEY, bytes, {
        contentType: "application/pdf",
        public: false,
      });
      await setSetting(db, "book_file_name", fileName);
      await setSetting(db, "book_total_pages", String(totalPages));
      ctx.invalidateQueries();
      return {
        ok: true,
        seeded: true,
        alreadyPresent: false,
        error: null,
        sizeBytes: bytes.length,
        totalPages,
      };
    },
  }),

  adminDeleteEnrollment: defineAction({
    description:
      "Admin: permanently deletes an enrolment application. Deleting an APPROVED premium/book application also removes that access from the student's account (unless another approved application of the same kind remains), so a deleted purchase never leaves the content unlocked.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.id, args.id));
      const enr = rows[0];
      await db
        .delete(schema.enrollments)
        .where(eq(schema.enrollments.id, args.id));
      if (enr && enr.courseId == null && enr.status === "approved") {
        await revokeApplicationAccessIfOrphaned(
          db,
          enr.phone,
          enr.courseTitle,
          enr.id,
        );
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminListStudents: defineAction({
    description: "Admin: lists students with XP, streak, and activity counts.",
    request: z.object({}),
    response: z.object({
      students: z.array(
        studentOut.extend({
          learnedCount: z.number(),
          bookmarkCount: z.number(),
          createdAt: z.string(),
        }),
      ),
    }),
    async handler(ctx) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.students)
        .orderBy(desc(schema.students.xp))
        .limit(200);
      const result: {
        id: number;
        name: string;
        phone: string;
        premium: boolean;
        bookAccess: boolean;
        xp: number;
        streak: number;
        lastDaily: string | null;
        levelGrants: string[];
        learnedCount: number;
        bookmarkCount: number;
        createdAt: string;
      }[] = [];
      for (const s of rows) {
        const lc = await db
          .select({ n: sql<number>`count(*)` })
          .from(schema.learned)
          .where(eq(schema.learned.studentId, s.id));
        const bc = await db
          .select({ n: sql<number>`count(*)` })
          .from(schema.bookmarks)
          .where(eq(schema.bookmarks.studentId, s.id));
        result.push({
          ...(await studentWithGrants(db, s)),
          learnedCount: lc[0]?.n ?? 0,
          bookmarkCount: bc[0]?.n ?? 0,
          createdAt: s.createdAt.toISOString(),
        });
      }
      return { students: result };
    },
  }),

  adminCreateStudent: defineAction({
    description:
      "Admin: creates a student account manually (name, mobile, strong password). Fails if the number already has an account or the password is too weak.",
    request: z.object({
      name: z.string().min(2).max(60),
      phone: z.string().min(6).max(20),
      password: z.string().min(1).max(64),
    }),
    response: authResponse,
    async handler(ctx, args): Promise<AuthResult> {
      const db = ctx.db();
      const weak = passwordProblem(args.password);
      if (weak) return { ok: false, error: weak, student: null };
      const phone = args.phone.trim();
      const existing = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.phone, phone));
      if (existing[0]) {
        return {
          ok: false,
          error: "এই মোবাইল নম্বর দিয়ে আগেই একটি অ্যাকাউন্ট আছে।",
          student: null,
        };
      }
      const inserted = await db
        .insert(schema.students)
        .values({
          name: args.name.trim(),
          phone,
          passwordHash: await hashSecret(args.password),
          createdAt: new Date(),
        })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("adminCreateStudent: insert returned no rows");
      ctx.invalidateQueries();
      return { ok: true, error: null, student: toStudent(row) };
    },
  }),

  adminUpdateStudent: defineAction({
    description:
      "Admin: edits a student's name, mobile number, XP and streak, and optionally resets their password (empty newPassword keeps the current one).",
    request: z.object({
      id: z.number().int().positive(),
      name: z.string().min(2).max(60),
      phone: z.string().min(6).max(20),
      xp: z.number().int().min(0).max(1000000),
      streak: z.number().int().min(0).max(10000),
      newPassword: z.string().max(64),
    }),
    response: z.object({ ok: z.boolean(), error: z.string().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, args.id));
      const student = rows[0];
      if (!student) return { ok: false, error: "ছাত্রছাত্রী পাওয়া যায়নি।" };
      const phone = args.phone.trim();
      if (phone !== student.phone) {
        const clash = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.phone, phone));
        if (clash[0]) {
          return {
            ok: false,
            error: "এই মোবাইল নম্বর অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।",
          };
        }
      }
      const patch: {
        name: string;
        phone: string;
        xp: number;
        streak: number;
        passwordHash?: string;
      } = {
        name: args.name.trim(),
        phone,
        xp: args.xp,
        streak: args.streak,
      };
      if (args.newPassword) {
        const weak = passwordProblem(args.newPassword);
        if (weak) return { ok: false, error: weak };
        patch.passwordHash = await hashSecret(args.newPassword);
      }
      await db
        .update(schema.students)
        .set(patch)
        .where(eq(schema.students.id, args.id));
      ctx.invalidateQueries();
      return { ok: true, error: null };
    },
  }),

  adminDeleteStudent: defineAction({
    description:
      "Admin: permanently deletes a student account together with their bookmarks, learned words, lesson progress and quiz results.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const stmts: BatchItem<"sqlite">[] = [
        db
          .delete(schema.bookmarks)
          .where(eq(schema.bookmarks.studentId, args.id)),
        db.delete(schema.learned).where(eq(schema.learned.studentId, args.id)),
        db
          .delete(schema.lessonProgress)
          .where(eq(schema.lessonProgress.studentId, args.id)),
        db
          .delete(schema.quizResults)
          .where(eq(schema.quizResults.studentId, args.id)),
        db
          .delete(schema.studentLevelGrants)
          .where(eq(schema.studentLevelGrants.studentId, args.id)),
        db.delete(schema.students).where(eq(schema.students.id, args.id)),
      ];
      const [first, ...rest] = stmts;
      if (first) await db.batch([first, ...rest]);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  adminSaveSettings: defineAction({
    description:
      "Admin: saves site settings — payment note, WhatsApp number, premium price, book name/price/free-mode, which vocabulary levels are free, and the live site texts (announcement banner, hero title/subtitle, book blurb, mentor quote). Changes apply site-wide immediately.",
    request: z.object({
      paymentNote: z.string().max(1000),
      whatsapp: z.string().max(30),
      premiumPrice: z.number().int().min(0).nullable().default(null),
      bookPrice: z.number().int().min(0).default(BOOK_DEFAULT_PRICE),
      bookTitle: z.string().max(120).default(""),
      bookFree: z.boolean().default(false),
      freeLevels: z.array(z.string().max(10)).max(7).default(["A1", "A2"]),
      announcement: z.string().max(300).default(""),
      heroTitle: z.string().max(200).default(""),
      heroSubtitle: z.string().max(600).default(""),
      bookBlurb: z.string().max(1000).default(""),
      mentorQuote: z.string().max(1500).default(""),
    }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const cleanFree = ALL_LEVELS.filter((l) => args.freeLevels.includes(l));
      const pairs: [string, string][] = [
        ["payment_note", args.paymentNote],
        ["whatsapp_number", args.whatsapp],
        [
          "premium_price",
          args.premiumPrice != null ? String(args.premiumPrice) : "",
        ],
        ["book_price", String(Math.max(0, Math.floor(args.bookPrice || 0)))],
        ["book_title", args.bookTitle.trim()],
        ["book_free", args.bookFree ? "1" : "0"],
        // An empty selection is stored as the "NONE" sentinel so it can
        // never be confused with "never saved" (blank = defaults).
        ["free_levels", cleanFree.length > 0 ? cleanFree.join(",") : "NONE"],
        ["site_announcement", args.announcement],
        ["hero_title", args.heroTitle],
        ["hero_subtitle", args.heroSubtitle],
        ["book_blurb", args.bookBlurb],
        ["mentor_quote", args.mentorQuote],
      ];
      for (const [key, value] of pairs) {
        await db
          .insert(schema.settings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: schema.settings.key,
            set: { value },
          });
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),
} satisfies ActionsModule;
