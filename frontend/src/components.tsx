import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import {
bnNum,
speak,
useAccessSettings,
useApp,
type QuizQuestion,
type Word,
} from "./lib";
import {
IconArrowRight,
IconBookmark,
IconCheck,
IconLock,
IconMedal,
IconTrophy,
IconUser,
IconVolume,
IconX,
} from "./icons";
import coverSpoken from "./assets/course-cover-spoken.webp";
import coverVocab from "./assets/course-cover-vocab.webp";
import coverStudy from "./assets/course-cover-study.webp";

const COURSE_COVERS = [coverSpoken, coverVocab, coverStudy];

/**
 * Cover image for a course card / details hero. An admin-uploaded cover
 * (imageSrc) always wins; otherwise a bundled cover is picked from the
 * course title (spoken / vocabulary themes) with a stable per-course
 * fallback, so every course card shows a real image.
 */
export function courseCoverSrc(course: {
  id: number;
  title: string;
  imageSrc: string;
}): string {
  if (course.imageSrc) return course.imageSrc;
  const t = course.title.toLowerCase();
  if (t.includes("spoken") || t.includes("speaking")) return coverSpoken;
  if (t.includes("vocab") || t.includes("oxford") || t.includes("word"))
    return coverVocab;
  return COURSE_COVERS[Math.abs(course.id) % COURSE_COVERS.length] ?? coverStudy;
}

export function CourseCover({
  course,
  className = "h-44",
}: {
  course: { id: number; title: string; imageSrc: string };
  className?: string;
}) {
  return (
    <img
      src={courseCoverSrc(course)}
      alt={`${course.title} — কোর্সের কভার ছবি`}
      loading="lazy"
      className={`${className} w-full object-cover`}
    />
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
      <span className="text-sm text-[var(--dim)]">{label}</span>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] px-6 py-10 text-center text-[15px] leading-relaxed text-[var(--dim)]">
      {children}
    </div>
  );
}

/**
 * The premium lock screen shown wherever a non-premium student reaches
 * premium content (premium-level words, flashcards, quizzes, the IELTS
 * mock). The server never sends the locked content — this panel only
 * explains the model (which levels are free is the admin's live
 * setting) and routes to the premium page where the student can apply.
 */
export function PremiumLock({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const { go } = useApp();
  const { freeLevels, premiumLevels } = useAccessSettings();
  return (
    <div className="card fade-in mx-auto max-w-xl p-7 text-center sm:p-9">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] text-white shadow-[var(--shadow-pop)]"
        style={{ background: "var(--peach-grad)" }}
        aria-hidden
      >
        <IconLock size={28} />
      </span>
      <h2 className="mt-4 text-[24px] font-extrabold tracking-tight">{title}</h2>
      <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">{text}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13px] font-bold">
        {freeLevels.length > 0 && (
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent-strong)]">
            {freeLevels.join(" · ")} — সবার জন্য ফ্রি
          </span>
        )}
        {premiumLevels.length > 0 && (
          <span className="rounded-full bg-[var(--gold-soft)] px-3 py-1.5 text-[var(--gold)]">
            {premiumLevels.join(" · ")} — প্রিমিয়াম
          </span>
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => go("premium")}
          className="btn-warm px-6"
        >
          <IconMedal size={18} /> প্রিমিয়াম নিন
        </button>
        <button
          type="button"
          onClick={() => go("vocab")}
          className="btn-outline px-6"
        >
          ফ্রি লেভেলগুলো পড়ুন
        </button>
      </div>
    </div>
  );
}

/** Consistent page header: title, supporting line, optional actions. */
export function PageHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        {sub && (
          <p className="mt-2 text-[16.5px] leading-relaxed text-[var(--dim)]">{sub}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function WordCard({
  word,
  bookmarked,
  learned,
}: {
  word: Word;
  bookmarked?: boolean;
  learned?: boolean;
}) {
  const { student, setStudent } = useApp();
  const queryClient = useQueryClient();
  const [localBm, setLocalBm] = useState<boolean | null>(null);
  const [localLn, setLocalLn] = useState<boolean | null>(null);
  const isBm = localBm ?? bookmarked ?? false;
  const isLn = localLn ?? learned ?? false;

  const bmMut = useMutation({
    mutationFn: () =>
      api.toggleBookmark({ studentId: student?.id ?? 0, wordId: word.id }),
    onSuccess: (r) => {
      setLocalBm(r.bookmarked);
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
      // The dashboard's bookmarked-words list is a separate query; without
      // this it kept showing the pre-toggle list until a full reload.
      void queryClient.invalidateQueries({ queryKey: ["bookmarked-words"] });
    },
  });
  const lnMut = useMutation({
    mutationFn: () =>
      api.toggleLearned({ studentId: student?.id ?? 0, wordId: word.id }),
    onSuccess: (r) => {
      setLocalLn(r.learned);
      // Keep the header XP chip in sync with the XP the server awarded.
      if (student) setStudent({ ...student, xp: r.xp });
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
  });

  return (
    <article data-protect className="card card-hover flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[23px] font-extrabold leading-tight tracking-tight">
            {word.word}
            <span className="ml-2 align-middle text-[13px] font-medium italic text-[var(--dim)]">
              {word.pos}
            </span>
          </h3>
          <p className="mt-1 text-sm text-[var(--dim)]">
            বাংলা উচ্চারণ: <span className="font-semibold text-[var(--text)]">{word.bnPron}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-extrabold tracking-wide text-[var(--accent-strong)]">
          {word.level}
        </span>
      </div>

      <p className="mt-3 text-[18px] font-bold leading-snug">{word.bn}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center rounded-2xl bg-[var(--surface-alt)] py-1.5 pl-3 pr-1.5">
          <span className="text-[11px] font-extrabold tracking-widest text-[var(--dim)]">USA</span>
          <span className="ml-1.5 min-w-0 font-semibold leading-tight">{word.respUs}</span>
          <button
            type="button"
            aria-label={`${word.word} — আমেরিকান উচ্চারণ শুনুন`}
            onClick={() => speak(word.word, "US")}
            className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-strong)] shadow-[var(--shadow-card)] transition-transform hover:scale-105"
          >
            <IconVolume size={17} />
          </button>
        </div>
        <div className="flex items-center rounded-2xl bg-[var(--surface-alt)] py-1.5 pl-3 pr-1.5">
          <span className="text-[11px] font-extrabold tracking-widest text-[var(--dim)]">UK</span>
          <span className="ml-1.5 min-w-0 font-semibold leading-tight">{word.respUk}</span>
          <button
            type="button"
            aria-label={`${word.word} — ব্রিটিশ উচ্চারণ শুনুন`}
            onClick={() => speak(word.word, "GB")}
            className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-strong)] shadow-[var(--shadow-card)] transition-transform hover:scale-105"
          >
            <IconVolume size={17} />
          </button>
        </div>
      </div>

      {(word.syn || word.ant) && (
        <p className="mt-3.5 text-sm leading-relaxed text-[var(--dim)]">
          {word.syn && (
            <>
              সমার্থক: <span className="font-medium text-[var(--text)]">{word.syn}</span>
            </>
          )}
          {word.syn && word.ant && " · "}
          {word.ant && (
            <>
              বিপরীত: <span className="font-medium text-[var(--text)]">{word.ant}</span>
            </>
          )}
        </p>
      )}

      {word.ex && (
        <div className="mt-4 rounded-2xl bg-[var(--surface-alt)] px-4 py-3">
          <p className="text-sm italic leading-relaxed">{word.ex}</p>
          {word.exBn && <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">{word.exBn}</p>}
        </div>
      )}

      {student && (
        <div className="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            aria-pressed={isBm}
            onClick={() => bmMut.mutate()}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              isBm
                ? "bg-[var(--peach-soft)] text-[var(--peach-strong)]"
                : "bg-[var(--surface-alt)] text-[var(--dim)] hover:text-[var(--text)]"
            }`}
          >
            <IconBookmark size={16} />
            {isBm ? "বুকমার্ক করা" : "বুকমার্ক"}
          </button>
          <button
            type="button"
            aria-pressed={isLn}
            onClick={() => lnMut.mutate()}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${
              isLn
                ? "text-[var(--accent-ink)] shadow-[var(--shadow-pop)]"
                : "bg-[var(--surface-alt)] text-[var(--dim)] hover:text-[var(--text)]"
            }`}
            style={isLn ? { background: "var(--accent-grad)" } : undefined}
          >
            <IconCheck size={16} />
            {isLn ? "শেখা হয়েছে" : "শেখা হয়েছে বলে চিহ্নিত করুন"}
          </button>
        </div>
      )}
    </article>
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Shared multiple-choice quiz runner used by vocab quiz, level test, mock test. */
export function QuizRunner({
  questions,
  kind,
  title,
  onDone,
}: {
  questions: QuizQuestion[];
  kind: string;
  title: string;
  onDone: () => void;
}) {
  const { student, setStudent } = useApp();
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [savedXp, setSavedXp] = useState<number | null>(null);

  const submitMut = useMutation({
    mutationFn: (score: number) =>
      api.submitQuizResult({
        studentId: student?.id ?? null,
        kind,
        correct: score,
        total: questions.length,
      }),
    onSuccess: (r) => {
      setSavedXp(r.xpAwarded);
      if (student && r.newXp != null) {
        setStudent({ ...student, xp: r.newXp });
      }
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
  });

  const q = questions[idx];

  if (finished) {
    const pct = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    return (
      <div className="fade-in card p-7 text-center sm:p-10">
        <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
          <IconTrophy size={30} />
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{title} — ফলাফল</h3>
        <p className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--accent)]">
          {bnNum(pct)}%
        </p>
        <p className="mt-2 text-lg">
          {bnNum(questions.length)}টি প্রশ্নের মধ্যে সঠিক{" "}
          <strong>{bnNum(correctCount)}টি</strong>
        </p>
        <div className="progress-track mx-auto mt-4 h-2.5 max-w-xs" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="কুইজে সঠিক উত্তরের হার">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {savedXp != null && savedXp > 0 && (
          <p className="mt-3 text-sm font-bold text-[var(--accent-strong)]">
            +{bnNum(savedXp)} XP যোগ হয়েছে
          </p>
        )}
        {!student && (
          <p className="mt-2 text-sm text-[var(--dim)]">
            লগইন করা থাকলে ফলাফল সেভ হয়ে XP যোগ হতো — উপরের "লগইন" বোতাম
            থেকে প্রবেশ করুন।
          </p>
        )}
        <button
          type="button"
          onClick={onDone}
          className="btn-primary mt-6"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!q) return null;

  const choose = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === q.answer) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
      submitMut.mutate(correctCount);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-center justify-between text-sm font-medium text-[var(--dim)]">
        <span>
          প্রশ্ন {bnNum(idx + 1)} / {bnNum(questions.length)}
        </span>
        <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[13px] font-bold">
          সঠিক: {bnNum(correctCount)}
        </span>
      </div>
      <div
        className="progress-track mt-3 h-2"
        role="progressbar"
        aria-valuenow={idx + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label="কুইজের অগ্রগতি"
      >
        <div
          className="progress-fill"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>
      <h3 className="mt-5 text-xl font-bold leading-snug">{q.prompt}</h3>
      <p className="mt-1 text-sm text-[var(--dim)]">
        {q.pos} · লেভেল {q.level}
      </p>
      <div className="mt-5 grid gap-2.5">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const isPicked = picked === i;
          let cls =
            "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-alt)]";
          let badgeCls = "bg-[var(--surface-alt)] text-[var(--dim)]";
          if (picked != null && isAnswer) {
            cls = "border-[var(--accent)] bg-[var(--accent-soft)]";
            badgeCls = "bg-[var(--accent)] text-[var(--accent-ink)]";
          } else if (picked != null && isPicked) {
            cls = "border-[var(--danger)] bg-[var(--danger-soft)]";
            badgeCls = "bg-[var(--danger)] text-white";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              aria-label={`উত্তরের বিকল্প: ${opt}`}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-base font-semibold transition-all ${cls}`}
            >
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${badgeCls}`}
              >
                {OPTION_LETTERS[i] ?? i + 1}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
              {picked != null && isAnswer && (
                <span className="shrink-0 text-[var(--accent)]"><IconCheck size={19} /></span>
              )}
              {picked != null && isPicked && !isAnswer && (
                <span className="shrink-0 text-[var(--danger)]"><IconX size={19} /></span>
              )}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <button
          type="button"
          onClick={next}
          className="btn-primary mt-5 w-full"
        >
          {idx + 1 >= questions.length ? "ফলাফল দেখুন" : "পরের প্রশ্ন"}
          <IconArrowRight size={18} />
        </button>
      )}
    </div>
  );
}

/**
 * Shown wherever a signed-in student is required (dashboard, course
 * progress). Login and signup are their own pages — this is only the
 * signpost to them, never a form.
 */
export function AuthPrompt({
  title = "আগে লগইন করুন",
  text = "XP, স্ট্রিক, বুকমার্ক, কোর্সের অগ্রগতি — সব দেখতে আপনার অ্যাকাউন্টে প্রবেশ করুন। অ্যাকাউন্ট না থাকলে ফ্রি সাইন আপ করুন।",
}: {
  title?: string;
  text?: string;
}) {
  const { go } = useApp();
  return (
    <div className="card p-6 text-center sm:p-8">
      <span className="icon-chip mx-auto h-14 w-14 rounded-[18px]">
        <IconUser size={26} />
      </span>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => go("login")} className="btn-primary px-7">
          লগইন করুন
        </button>
        <button type="button" onClick={() => go("signup")} className="btn-outline px-7">
          ফ্রি সাইন আপ
        </button>
      </div>
    </div>
  );
}

/**
 * Renders the lesson-body format used by grammar and course lessons:
 * "## " lines are subheadings, "- " lines are bullets, the rest paragraphs.
 */
export function LessonBodyText({ body }: { body: string }) {
  return (
    <div data-protect>
      {body.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-6 text-[18px] font-extrabold tracking-tight first:mt-0">
              {t.slice(3)}
            </h3>
          );
        }
        if (t.startsWith("- ")) {
          return (
            <p key={i} className="bn-read mt-2 flex gap-2.5 pl-1">
              <span aria-hidden className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{t.slice(2)}</span>
            </p>
          );
        }
        return (
          <p key={i} className="bn-read mt-2.5 first:mt-0">
            {t}
          </p>
        );
      })}
    </div>
  );
}

/** Hook: current student's bookmark/learned id sets. */
export function useStudentSets(studentId: number | null) {
  const state = useQuery({
    queryKey: ["student-state", studentId],
    queryFn: () => api.getStudentState({ studentId: studentId ?? 0 }),
    enabled: studentId != null,
  });
  return {
    state,
    bookmarkSet: new Set(state.data?.bookmarkIds ?? []),
    learnedSet: new Set(state.data?.learnedIds ?? []),
  };
}
