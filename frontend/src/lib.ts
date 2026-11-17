import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "./api";
import { api } from "./api";

export type Word = ApiResponse<typeof api, "searchWords">["words"][number];
export type Student = ApiResponse<typeof api, "createStudent">["student"];
export type Course = ApiResponse<typeof api, "listCourses">["courses"][number];
export type LessonSummary = ApiResponse<
  typeof api,
  "listGrammarLessons"
>["lessons"][number];
export type QuizQuestion = ApiResponse<
  typeof api,
  "getVocabQuiz"
>["questions"][number];

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "IELTS"] as const;

/** Free for everyone (owner's model); everything else is premium. */
export const FREE_LEVELS: readonly string[] = ["A1", "A2"];
export const PREMIUM_LEVELS: readonly string[] = [
  "B1",
  "B2",
  "C1",
  "C2",
  "IELTS",
];

export function isPremiumLevel(level: string): boolean {
  return !FREE_LEVELS.includes(level);
}

/**
 * Live access settings from the server (the same ["settings"] query the
 * header uses): which vocabulary levels the admin currently keeps FREE,
 * the book's current name and whether the book is free for everyone.
 * The static FREE_LEVELS above is only the fallback while the query
 * loads or if it fails — the admin's saved choice always wins, so
 * flipping a level free/premium in the panel updates every lock badge
 * and gate on the site without a code change.
 */
export function useAccessSettings(
  student?: {
    premium: boolean;
    levelGrants?: readonly string[];
  } | null,
) {
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });
  const freeLevels: readonly string[] = q.data?.freeLevels ?? FREE_LEVELS;
  const grantedLevels: readonly string[] = student?.levelGrants ?? [];
  // A level opens for this student through any of three doors: it is
  // free for everyone (admin setting), the admin personally freed it
  // for this student (level grant), or the student is premium. The
  // server enforces exactly the same three doors.
  const canOpenLevel = (level: string) =>
    freeLevels.includes(level) ||
    student?.premium === true ||
    grantedLevels.includes(level);
  return {
    settings: q.data,
    freeLevels,
    grantedLevels,
    premiumLevels: LEVELS.filter((l) => !canOpenLevel(l)),
    isPremiumLevel: (level: string) => !freeLevels.includes(level),
    canOpenLevel,
    bookTitle: q.data?.bookTitle ?? "Oxford 7000 Words",
    bookFree: q.data?.bookFree ?? false,
  };
}

/**
 * Enrolment title that marks a premium application (submitted with a null
 * courseId from the premium page; the admin আবেদন page recognises it, and
 * approving it switches premium on for that account server-side).
 */
export const PREMIUM_APPLICATION_TITLE = "VocabMaster Premium";

/**
 * Enrolment title that marks a book purchase application (submitted with
 * a null courseId from the book page; approving it in the admin আবেদন
 * page switches in-site book reading access on for that account).
 */
export const BOOK_APPLICATION_TITLE = "Oxford 7000 Words — বই";

export const LEVEL_BLURB: Record<string, string> = {
  A1: "একদম শুরু — প্রতিদিনের সবচেয়ে দরকারি শব্দ",
  A2: "প্রাথমিক — ছোট ছোট বাক্যে কথা বলার শব্দ",
  B1: "মাঝারি — ভ্রমণ, কাজ আর আড্ডার শব্দ",
  B2: "উচ্চ-মাঝারি — আত্মবিশ্বাসী কথোপকথনের শব্দ",
  C1: "উন্নত — পড়াশোনা ও পেশাগত শব্দ",
  C2: "দক্ষতা — প্রায় native-দের মতো শব্দভান্ডার",
  IELTS: "IELTS পরীক্ষার জন্য বাছাই করা ৬০০ শব্দ",
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function bnNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function bnDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Speaks an English word aloud with the device's US or UK voice. */
export function speak(word: string, accent: "US" | "GB") {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(word);
    const lang = accent === "US" ? "en-US" : "en-GB";
    u.lang = lang;
    const voice = synth
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (voice) u.voice = voice;
    u.rate = 0.92;
    synth.speak(u);
  } catch {
    // Speech is a progressive enhancement; ignore failures.
  }
}

// ---------- sessionStorage hand-off (hero search / level cards) ----------
// The artifact runs inside a sandboxed iframe; in some webviews and
// privacy modes ANY storage access throws a SecurityError. An unguarded
// throw inside a page effect unmounts the whole React tree (blank site),
// so every access goes through these safe wrappers.

export function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // hand-off is a convenience; navigation still works without it
  }
}

export function clearSession(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // nothing to clear if storage is unavailable
  }
}

// ---------- student session (localStorage) ----------

const STUDENT_KEY = "vocabmaster-student";

export function loadStudent(): Student | null {
  try {
    const raw = localStorage.getItem(STUDENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Student;
    if (typeof parsed.id !== "number" || typeof parsed.phone !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStudent(s: Student | null) {
  try {
    if (s) localStorage.setItem(STUDENT_KEY, JSON.stringify(s));
    else localStorage.removeItem(STUDENT_KEY);
  } catch {
    // storage unavailable — session simply won't persist
  }
}

// ---------- admin session (localStorage flag, set only after the server
// verifies the admin password via the adminLogin action) ----------

const ADMIN_KEY = "vocabmaster-admin";

export function loadAdminAuthed(): boolean {
  try {
    return localStorage.getItem(ADMIN_KEY) === "yes";
  } catch {
    return false;
  }
}

export function saveAdminAuthed(on: boolean) {
  try {
    if (on) localStorage.setItem(ADMIN_KEY, "yes");
    else localStorage.removeItem(ADMIN_KEY);
  } catch {
    // storage unavailable — admin will just log in again next visit
  }
}

const ADMIN_MUST_CHANGE_KEY = "vocabmaster-admin-must-change";
const ADMIN_EMAIL_KEY = "vocabmaster-admin-email";

export function loadAdminMustChange(): boolean {
  try {
    return localStorage.getItem(ADMIN_MUST_CHANGE_KEY) === "yes";
  } catch {
    return false;
  }
}

export function saveAdminMustChange(on: boolean) {
  try {
    if (on) localStorage.setItem(ADMIN_MUST_CHANGE_KEY, "yes");
    else localStorage.removeItem(ADMIN_MUST_CHANGE_KEY);
  } catch {
    // non-fatal
  }
}

export function loadAdminEmail(): string {
  try {
    return localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveAdminEmail(email: string) {
  try {
    if (email) localStorage.setItem(ADMIN_EMAIL_KEY, email);
    else localStorage.removeItem(ADMIN_EMAIL_KEY);
  } catch {
    // non-fatal
  }
}

export interface AppCtx {
  student: Student | null;
  setStudent: (s: Student | null) => void;
  go: (page: Page) => void;
  /** The course currently open in the player / details page. Held in React
   *  state (App) — NOT only in sessionStorage, which some webviews block:
   *  a storage-only hand-off silently lost the id and the details page
   *  rendered its "no course selected" state. */
  courseId: number | null;
  openCourse: (courseId: number) => void;
  openCourseDetail: (courseId: number) => void;
  /** The course the dedicated ভর্তির আবেদন page is enrolling into. Same
   *  React-state hand-off pattern as courseId. */
  enrollCourseId: number | null;
  openEnroll: (courseId: number) => void;
  /** Go to the Book page AND open the PDF reader straight away — the
   *  dashboard's "পড়ুন / পড়া চালিয়ে যান" button uses this so one tap
   *  lands the student inside the book, not on the sales page first.
   *  The intent travels via sessionStorage (the Book page consumes and
   *  clears it once access is verified), mirroring the vocab hand-offs. */
  openBookReader: () => void;
}

export type Page =
  | "home"
  | "vocab"
  | "grammar"
  | "courses"
  | "courseDetail"
  | "course"
  | "enroll"
  | "premium"
  | "book"
  | "tests"
  | "dashboard"
  | "admin"
  | "login"
  | "signup";

/** Public student ID shown on the dashboard and in the admin list: VM-0007. */
export function studentCode(id: number): string {
  return `VM-${String(id).padStart(4, "0")}`;
}

/**
 * Strong-password rules, mirrored from the server policy (signup, legacy
 * claim, admin changes): at least 8 characters, at least one letter and
 * one digit. The signup form renders these as a live checklist + meter;
 * the server re-checks the same rules, so a weak password can never slip
 * through even if the client check is bypassed.
 */
export interface PasswordChecks {
  length: boolean;
  letter: boolean;
  digit: boolean;
}

export function passwordChecks(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    digit: /\d/.test(pw),
  };
}

export function isStrongPassword(pw: string): boolean {
  const c = passwordChecks(pw);
  return c.length && c.letter && c.digit;
}

/** 0–4 strength score for the meter (length, letter, digit, length 12+ / mixed case bonus). */
export function passwordScore(pw: string): number {
  if (!pw) return 0;
  const c = passwordChecks(pw);
  let score = 0;
  if (c.length) score++;
  if (c.letter) score++;
  if (c.digit) score++;
  if (pw.length >= 12 || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score++;
  return Math.min(4, score);
}

export const AppContext = createContext<AppCtx>({
  student: null,
  setStudent: () => undefined,
  go: () => undefined,
  courseId: null,
  openCourse: () => undefined,
  openCourseDetail: () => undefined,
  enrollCourseId: null,
  openEnroll: () => undefined,
  openBookReader: () => undefined,
});

export function useApp(): AppCtx {
  return useContext(AppContext);
}

/** Reads a File into base64 (data URL split) for the JSON upload actions
 * (course video / cover image / book PDF). Returns the base64 payload and
 * the file's MIME type. */
export async function fileToBase64(
  file: File,
): Promise<{ dataBase64: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
  const comma = dataUrl.indexOf(",");
  return {
    dataBase64: comma >= 0 ? dataUrl.slice(comma + 1) : "",
    mimeType: file.type,
  };
}
