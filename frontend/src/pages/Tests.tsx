import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { bnNum, useApp, type QuizQuestion } from "../lib";
import { EmptyNote, PageHead, PremiumLock, QuizRunner, Spinner } from "../components";
import {
IconArrowRight,
IconClipboard,
IconClock,
IconLock,
IconTarget,
} from "../icons";

type Tab = "level" | "mock";

export function TestsPage() {
  const [tab, setTab] = useState<Tab>("level");
  return (
    <div className="fade-in mx-auto max-w-3xl px-4 pt-8 sm:pt-10">
      <PageHead
        title="টেস্ট দিন"
        sub="নিজের অবস্থান যাচাই করুন — সব প্রশ্নই আসল শব্দভান্ডার থেকে তৈরি, ফলাফলের সাথে XP-ও পাবেন।"
      />
      <div className="seg mt-7" role="tablist" aria-label="টেস্টের ধরন">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "level"}
          onClick={() => setTab("level")}
          className="seg-btn"
        >
          <IconTarget size={17} /> ফ্রি লেভেল টেস্ট
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "mock"}
          onClick={() => setTab("mock")}
          className="seg-btn"
        >
          <IconClipboard size={17} /> IELTS শব্দ মক টেস্ট
          {/* Premium feature: the lock marker always shows (owner's
              rule), not only for viewers who cannot open it yet. */}
          <IconLock size={14} aria-label="প্রিমিয়াম ফিচার" />
        </button>
      </div>
      {tab === "level" ? <LevelTest /> : <MockTest />}
    </div>
  );
}

const BAND_ORDER = ["A1", "A2", "B1", "B2", "C1"];

function estimateLevel(questions: QuizQuestion[], answers: boolean[]): string {
  // Highest band where the student got at least 3 of 4 right; fall back to
  // the first band with any correct answers, else "A1 থেকে শুরু".
  let best = "";
  for (const band of BAND_ORDER) {
    const idxs = questions
      .map((q, i) => (q.level === band ? i : -1))
      .filter((i) => i >= 0);
    const right = idxs.filter((i) => answers[i]).length;
    if (idxs.length > 0 && right >= 3) best = band;
  }
  return best;
}

function LevelTest() {
  const [runId, setRunId] = useState(0);
  const q = useQuery({
    queryKey: ["level-test", runId],
    queryFn: () => api.getLevelTest({}),
  });
  if (q.isPending) return <Spinner label="টেস্ট তৈরি হচ্ছে…" />;
  const questions = q.data?.questions ?? [];
  if (questions.length === 0)
    return (
      <div className="mt-6">
        <EmptyNote>টেস্ট তৈরি করা যায়নি — শব্দভান্ডার লোড হয়নি হয়তো।</EmptyNote>
      </div>
    );
  return (
    <div className="mt-6">
      <p className="mb-4 text-sm text-[var(--dim)]">
        ২০টি প্রশ্ন — A1 থেকে C1 পর্যন্ত ধাপে ধাপে কঠিন হবে। অনুমান না করে
        যেটা সত্যিই জানেন সেটাই বেছে নিন; শেষে জানতে পারবেন কোন লেভেল থেকে
        পড়া শুরু করা উচিত।
      </p>
      <TrackedQuiz
        key={runId}
        questions={questions}
        onRestart={() => setRunId((r) => r + 1)}
      />
    </div>
  );
}

/** Level-test runner that also computes the CEFR estimate at the end. */
function TrackedQuiz({
  questions,
  onRestart,
}: {
  questions: QuizQuestion[];
  onRestart: () => void;
}) {
  const { student, setStudent } = useApp();
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const done = idx >= questions.length;
  const level = useMemo(
    () => (done ? estimateLevel(questions, answers) : ""),
    [done, questions, answers],
  );

  // Record the result (and award XP) once, when the test finishes.
  const [recorded, setRecorded] = useState(false);
  useEffect(() => {
    if (done && !recorded) {
      setRecorded(true);
      void api
        .submitQuizResult({
          studentId: student?.id ?? null,
          kind: "level",
          correct: answers.filter(Boolean).length,
          total: questions.length,
        })
        .then((r) => {
          if (student && r.newXp != null) setStudent({ ...student, xp: r.newXp });
        })
        .catch(() => undefined);
    }
  }, [done, recorded, answers, questions.length, student, setStudent]);

  if (done) {
    const correct = answers.filter(Boolean).length;
    return (
      <div className="fade-in card p-7 text-center sm:p-10">
        <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
          <IconTarget size={30} />
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight">আপনার আনুমানিক লেভেল</h3>
        {level ? (
          <>
            <p className="mt-3 text-6xl font-extrabold tracking-tight text-[var(--accent)]">{level}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--dim)]">
              {bnNum(questions.length)}টি প্রশ্নে সঠিক {bnNum(correct)}টি।{" "}
              {level} লেভেল পর্যন্ত শব্দ আপনি ভালোই জানেন — পড়া শুরু করুন
              পরের ধাপ থেকে, আর দুর্বল জায়গাগুলো ঝালিয়ে নিন এই লেভেল থেকেই।
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-2xl font-bold text-[var(--accent)]">
              A1 থেকে শুরু করুন
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--dim)]">
              {bnNum(questions.length)}টি প্রশ্নে সঠিক {bnNum(correct)}টি।
              চিন্তা নেই — A1 লেভেলটাই বানানো হয়েছে একদম শূন্য থেকে শুরু
              করার জন্য। প্রতিদিন ১০টি করে শব্দ, কয়েক সপ্তাহেই ফারাক বুঝবেন।
            </p>
          </>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="btn-primary mt-6"
        >
          আবার টেস্ট দিন
        </button>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;
  const choose = (i: number) => {
    if (picked != null) return;
    setPicked(i);
  };
  const next = () => {
    setAnswers((a) => [...a, picked === q.answer]);
    setPicked(null);
    setIdx(idx + 1);
  };

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-center justify-between text-sm font-medium text-[var(--dim)]">
        <span>
          প্রশ্ন {bnNum(idx + 1)} / {bnNum(questions.length)}
        </span>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[13px] font-bold text-[var(--accent-strong)]">
          লেভেল {q.level}
        </span>
      </div>
      <div
        className="progress-track mt-3 h-2"
        role="progressbar"
        aria-valuenow={idx + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label="টেস্টের অগ্রগতি"
      >
        <div
          className="progress-fill"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>
      <h3 className="mt-5 text-xl font-bold leading-snug">{q.prompt}</h3>
      <div className="mt-5 grid gap-2.5">
        {q.options.map((opt, i) => {
          let cls = "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-alt)]";
          let badgeCls = "bg-[var(--surface-alt)] text-[var(--dim)]";
          if (picked != null && i === q.answer) {
            cls = "border-[var(--accent)] bg-[var(--accent-soft)]";
            badgeCls = "bg-[var(--accent)] text-[var(--accent-ink)]";
          } else if (picked === i) {
            cls = "border-[var(--danger)] bg-[var(--danger-soft)]";
            badgeCls = "bg-[var(--danger)] text-white";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              aria-label={`উত্তরের বিকল্প: ${opt}`}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left font-semibold transition-all ${cls}`}
            >
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${badgeCls}`}
              >
                {["A", "B", "C", "D", "E", "F"][i] ?? i + 1}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
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

function MockTest() {
  const { student } = useApp();
  const [runId, setRunId] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const q = useQuery({
    queryKey: ["mock-test", runId, student?.id ?? 0, student?.premium ? 1 : 0],
    queryFn: () => api.getMockTest({ studentId: student?.id ?? null }),
  });

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [startedAt]);

  if (q.isPending) return <Spinner label="মক টেস্ট তৈরি হচ্ছে…" />;
  if (q.data?.locked)
    return (
      <div className="mt-6">
        <PremiumLock
          title="IELTS মক টেস্ট প্রিমিয়ামে"
          text="মক টেস্টের প্রশ্ন আসে IELTS, C1 ও C2 — প্রিমিয়াম লেভেলের শব্দ থেকে। প্রিমিয়াম নিলে মক টেস্টসহ সব প্রিমিয়াম লেভেল খুলে যাবে। ফ্রি লেভেল টেস্টটি সবসময়ই ফ্রি।"
        />
      </div>
    );
  const questions = q.data?.questions ?? [];
  if (questions.length === 0)
    return (
      <div className="mt-6">
        <EmptyNote>মক টেস্ট তৈরি করা যায়নি।</EmptyNote>
      </div>
    );

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--dim)]">
          IELTS ও উন্নত লেভেলের (C1–C2) শব্দ থেকে ১৫টি প্রশ্ন। আসল IELTS-এ
          শব্দভান্ডারই Reading/Listening-এর অর্ধেক শক্তি।
        </p>
        <p className="flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3 py-1.5 font-mono text-sm font-semibold" aria-label="অতিবাহিত সময়">
          <IconClock size={16} /> {mm}:{ss}
        </p>
      </div>
      <div onClick={() => startedAt ?? setStartedAt(Date.now())}>
        <QuizRunner
          key={runId}
          questions={questions}
          kind="mock"
          title="IELTS শব্দ মক টেস্ট"
          onDone={() => {
            setRunId((r) => r + 1);
            setStartedAt(null);
            setElapsed(0);
          }}
        />
      </div>
    </div>
  );
}
