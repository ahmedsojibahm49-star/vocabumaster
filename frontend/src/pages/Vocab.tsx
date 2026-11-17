import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { bnNum, clearSession, LEVEL_BLURB, LEVELS, readSession, speak, useAccessSettings, useApp, type Word } from "../lib";
import { EmptyNote, PageHead, PremiumLock, QuizRunner, Spinner, useStudentSets, WordCard } from "../components";
import {
IconArrowLeft,
IconArrowRight,
IconBook,
IconBookmark,
IconCards,
IconCheck,
IconClipboard,
IconLock,
IconSearch,
IconShuffle,
IconSparkle,
IconVolume,
IconX,
} from "../icons";

type Mode = "browse" | "flashcards" | "quiz";
const PAGE = 40;

export function VocabPage() {
  const { student, go } = useApp();
  const [mode, setMode] = useState<Mode>("browse");
  const [level, setLevel] = useState<string>("A1");
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const { state: studentState, bookmarkSet, learnedSet } = useStudentSets(student?.id ?? null);
  // Prefer the server's fresh student row: right after the admin grants
  // premium — or frees a single level for this student — the locally
  // stored profile can still show the old access.
  const freshStudent = studentState.data?.student ?? student;
  const isPremium = freshStudent?.premium ?? false;
  // Which levels are free/premium is the admin's live setting, not a
  // hard-coded list — the chips and locks below follow it, together
  // with this student's personal level grants.
  const { freeLevels, isPremiumLevel, grantedLevels } =
    useAccessSettings(freshStudent);
  // Part of every vocab query key: when the admin changes this
  // student's access, the very next render refetches instead of
  // showing a stale lock.
  const accessKey = `${isPremium ? 1 : 0}:${grantedLevels.join(",")}`;

  // Hand-offs from the homepage hero search / level cards. Storage access
  // goes through the safe wrappers in lib.ts: in webviews where storage is
  // blocked, a raw sessionStorage call throws and blanks the whole app.
  useEffect(() => {
    const q = readSession("vm-pending-search");
    if (q) {
      clearSession("vm-pending-search");
      setQuery(q);
      setSubmittedQuery(q);
    }
    const l = readSession("vm-pending-level");
    if (l) {
      clearSession("vm-pending-level");
      setLevel(l);
      setOffset(0);
    }
  }, []);

  const searching = submittedQuery.trim().length > 0;
  const searchQ = useQuery({
    queryKey: ["word-search", submittedQuery, student?.id ?? 0, accessKey],
    queryFn: () =>
      api.searchWords({
        query: submittedQuery.trim(),
        studentId: student?.id ?? null,
      }),
    enabled: searching,
  });
  const levelQ = useQuery({
    queryKey: ["words-level", level, offset, student?.id ?? 0, accessKey],
    queryFn: () =>
      api.getWordsByLevel({
        level,
        offset,
        limit: PAGE,
        studentId: student?.id ?? null,
      }),
    enabled: !searching && mode === "browse",
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
    setMode("browse");
  };

  const totalPages = Math.max(1, Math.ceil((levelQ.data?.total ?? 0) / PAGE));
  const pageNum = Math.floor(offset / PAGE) + 1;

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <PageHead
        title="শব্দভান্ডার"
        sub="Oxford 7000 Words বইয়ের পুরো শব্দভান্ডার — বাংলা অর্থ, বাংলা উচ্চারণ, USA/UK উচ্চারণ আর উদাহরণসহ। যেকোনো শব্দ খুঁজুন বা লেভেল ধরে পড়ুন।"
      />

      <form onSubmit={submitSearch} className="mt-7 flex max-w-xl items-center gap-2.5">
        <div className="search-pill min-w-0 flex-1">
          <IconSearch size={20} className="ml-3 shrink-0 text-[var(--dim)]" />
          <input
            aria-label="শব্দ খুঁজুন — ইংরেজি বা বাংলা"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="শব্দ খুঁজুন — ইংরেজি বা বাংলায়"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15.5px] outline-none placeholder:text-[var(--dim)]"
          />
          <button
            type="submit"
            className="btn-primary shrink-0 px-6 py-2.5"
          >
            খুঁজুন
          </button>
        </div>
        {searching && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSubmittedQuery("");
            }}
            className="btn-outline shrink-0 px-4 py-2.5"
          >
            <IconX size={16} /> মুছুন
          </button>
        )}
      </form>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="seg" role="tablist" aria-label="শেখার ধরন">
          {(
            [
              ["browse", "পড়ুন", IconBook],
              ["flashcards", "ফ্ল্যাশকার্ড", IconCards],
              ["quiz", "কুইজ", IconClipboard],
            ] as [Mode, string, (p: { size?: number }) => React.ReactNode][]
          ).map(([m, label, TabIcon]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setQuery("");
                setSubmittedQuery("");
              }}
              className="seg-btn"
            >
              <TabIcon size={17} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {!searching && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="লেভেল বেছে নিন">
          {LEVELS.map((l) => {
            const giftedLvl =
              isPremiumLevel(l) && !isPremium && grantedLevels.includes(l);
            return (
            <button
              key={l}
              type="button"
              aria-pressed={level === l}
              aria-label={isPremiumLevel(l) ? `${l} — প্রিমিয়াম লেভেল` : l}
              onClick={() => {
                setLevel(l);
                setOffset(0);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold transition-all ${
                level === l
                  ? "text-[var(--accent-ink)] shadow-[var(--shadow-pop)]"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
              }`}
              style={level === l ? { background: "var(--accent-grad)" } : undefined}
            >
              {/* A premium level ALWAYS carries the lock icon — for
                  every viewer, and with NO "PREMIUM" word beside it
                  (owner's explicit rule: lock icon only). Previously
                  the lock only rendered when the level was locked for
                  this viewer, so the owner's own (premium) view showed
                  chips with no lock at all. */}
              {isPremiumLevel(l) && !giftedLvl && <IconLock size={13} />}
              {l}
              {giftedLvl && (
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--gold)]">
                  ফ্রি দেওয়া
                </span>
              )}
            </button>
            );
          })}
          <span className="ml-1 text-sm text-[var(--dim)]">{LEVEL_BLURB[level]}</span>
        </div>
      )}

      {mode === "flashcards" && !searching && (
        <Flashcards
          key={level}
          level={level}
          accessKey={accessKey}
          bookmarkSet={bookmarkSet}
          learnedSet={learnedSet}
        />
      )}
      {mode === "quiz" && !searching && (
        <LevelQuiz key={level} level={level} accessKey={accessKey} />
      )}

      {mode === "browse" &&
        (searching ? (
          searchQ.isPending ? (
            <Spinner label="খোঁজা হচ্ছে…" />
          ) : (searchQ.data?.words.length ?? 0) === 0 ? (
            <div className="mt-7">
              {(searchQ.data?.hiddenPremium ?? 0) > 0 ? (
                <PremiumLock
                  title="এই শব্দটি প্রিমিয়াম লেভেলে আছে"
                  text={`"${submittedQuery}" মিলেছে শুধু প্রিমিয়াম লেভেলের শব্দের সাথে — সেগুলো দেখতে প্রিমিয়াম লাগবে। ফ্রি ${freeLevels.join("/")} লেভেলের শব্দ সার্চে সবসময়ই পাওয়া যায়।`}
                />
              ) : (
                <EmptyNote>
                  "{submittedQuery}" দিয়ে কোনো শব্দ পাওয়া যায়নি। বানান ঠিক
                  আছে কিনা দেখুন, অথবা লেভেল ধরে ঘুরে দেখুন।
                </EmptyNote>
              )}
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm font-medium text-[var(--dim)]">
                {bnNum(searchQ.data?.words.length ?? 0)}টি শব্দ পাওয়া গেছে
              </p>
              {(searchQ.data?.hiddenPremium ?? 0) > 0 && (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--dim)]">
                  <IconLock size={14} className="text-[var(--peach)]" />
                  আরও {bnNum(searchQ.data?.hiddenPremium ?? 0)}টি মিল প্রিমিয়াম
                  লেভেলে লুকানো আছে।
                  <button
                    type="button"
                    onClick={() => go("premium")}
                    className="font-bold text-[var(--accent-strong)] underline"
                  >
                    প্রিমিয়াম নিয়ে সব দেখুন
                  </button>
                </p>
              )}
              <WordGrid
                words={searchQ.data?.words ?? []}
                bookmarkSet={bookmarkSet}
                learnedSet={learnedSet}
              />
            </>
          )
        ) : levelQ.isPending ? (
          <Spinner label="শব্দ লোড হচ্ছে…" />
        ) : levelQ.data?.locked ? (
          <div className="mt-7">
            <PremiumLock
              title={`${level} একটি প্রিমিয়াম লেভেল`}
              text={`${level} লেভেলে মোট ${bnNum(levelQ.data?.total ?? 0)}টি শব্দ আছে — অর্থ, USA/UK উচ্চারণ, উদাহরণ, ফ্ল্যাশকার্ড ও কুইজসহ। প্রিমিয়াম নিলেই এই লেভেলসহ B1–IELTS সব লেভেল খুলে যাবে। অ্যাডমিন চাইলে এই লেভেলটি শুধু আপনার জন্যও ফ্রি করে দিতে পারেন।`}
            />
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm font-medium text-[var(--dim)]">
              {level} লেভেলে মোট {bnNum(levelQ.data?.total ?? 0)}টি শব্দ — পৃষ্ঠা{" "}
              {bnNum(pageNum)} / {bnNum(totalPages)}
            </p>
            <WordGrid
              words={levelQ.data?.words ?? []}
              bookmarkSet={bookmarkSet}
              learnedSet={learnedSet}
            />
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE))}
                className="btn-outline"
              >
                <IconArrowLeft size={17} /> আগের পৃষ্ঠা
              </button>
              <span className="hidden text-sm font-semibold text-[var(--dim)] sm:block" aria-hidden>
                {bnNum(pageNum)} / {bnNum(totalPages)}
              </span>
              <button
                type="button"
                disabled={offset + PAGE >= (levelQ.data?.total ?? 0)}
                onClick={() => setOffset(offset + PAGE)}
                className="btn-outline"
              >
                পরের পৃষ্ঠা <IconArrowRight size={17} />
              </button>
            </div>
          </>
        ))}
    </div>
  );
}

function WordGrid({
  words,
  bookmarkSet,
  learnedSet,
}: {
  words: Word[];
  bookmarkSet: Set<number>;
  learnedSet: Set<number>;
}) {
  return (
    <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2">
      {words.map((w) => (
        <WordCard
          key={w.id}
          word={w}
          bookmarked={bookmarkSet.has(w.id)}
          learned={learnedSet.has(w.id)}
        />
      ))}
    </div>
  );
}

function Flashcards({
  level,
  accessKey,
  bookmarkSet,
  learnedSet,
}: {
  level: string;
  accessKey: string;
  bookmarkSet: Set<number>;
  learnedSet: Set<number>;
}) {
  const { student, setStudent } = useApp();
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["flash-pool", level, student?.id ?? 0, accessKey],
    queryFn: () =>
      api.getWordsByLevel({
        level,
        offset: 0,
        limit: 100,
        studentId: student?.id ?? null,
      }),
  });
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Local overrides so bookmark/learned toggles feel instant, mirroring
  // WordCard's pattern; the server sets remain the source of truth.
  const [bmOverride, setBmOverride] = useState<Record<number, boolean>>({});
  const [lnOverride, setLnOverride] = useState<Record<number, boolean>>({});

  const pool = q.data?.words ?? [];
  // Rotate the 100-word pool by a per-session seed so repeats feel fresh.
  const rotated =
    pool.length > 0
      ? [...pool.slice(seed % pool.length), ...pool.slice(0, seed % pool.length)]
      : pool;
  const total = rotated.length;
  const card = rotated[idx % Math.max(1, total)];

  const bmMut = useMutation({
    mutationFn: (wordId: number) =>
      api.toggleBookmark({ studentId: student?.id ?? 0, wordId }),
    onSuccess: (r, wordId) => {
      setBmOverride((m) => ({ ...m, [wordId]: r.bookmarked }));
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
      void queryClient.invalidateQueries({ queryKey: ["bookmarked-words"] });
    },
  });
  const lnMut = useMutation({
    mutationFn: (wordId: number) =>
      api.toggleLearned({ studentId: student?.id ?? 0, wordId }),
    onSuccess: (r, wordId) => {
      setLnOverride((m) => ({ ...m, [wordId]: r.learned }));
      if (student) setStudent({ ...student, xp: r.xp });
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
  });

  if (q.isPending) return <Spinner label="ফ্ল্যাশকার্ড তৈরি হচ্ছে…" />;
  if (q.data?.locked)
    return (
      <div className="mt-7">
        <PremiumLock
          title={`${level} ফ্ল্যাশকার্ড প্রিমিয়ামে`}
          text={`${level} লেভেলের ফ্ল্যাশকার্ড প্রিমিয়াম শিক্ষার্থীদের জন্য। প্রিমিয়াম নিলে সব লেভেলের কার্ড, কুইজ আর শব্দ একসাথে খুলে যাবে।`}
        />
      </div>
    );
  if (!card) return <EmptyNote>এই লেভেলে এখনো শব্দ নেই।</EmptyNote>;

  const pos = (idx % total) + 1;
  const isBm = bmOverride[card.id] ?? bookmarkSet.has(card.id);
  const isLn = lnOverride[card.id] ?? learnedSet.has(card.id);

  const move = (dir: 1 | -1) => {
    setFlipped(false);
    setIdx((i) => (i + dir + total) % total);
  };

  const faceCls =
    "absolute inset-0 flex flex-col rounded-[30px] p-6 text-left shadow-[0_28px_56px_-20px_rgba(4,47,40,0.55)] [backface-visibility:hidden] sm:p-8 overflow-hidden";

  return (
    <div className="mx-auto mt-8 max-w-xl">
      {/* Progress header */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-extrabold text-white shadow-[var(--shadow-pop)]"
          style={{ background: "var(--accent-grad)" }}
        >
          <IconCards size={15} />
          {level} ফ্ল্যাশকার্ড
        </span>
        <div
          className="progress-track h-2.5 min-w-0 flex-1"
          role="progressbar"
          aria-valuenow={pos}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`কার্ড ${pos} / ${total}`}
        >
          <div
            className="progress-fill"
            style={{ width: `${(pos / Math.max(1, total)) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-bold text-[var(--dim)]">
          {bnNum(pos)} / {bnNum(total)}
        </span>
      </div>

      {/* The card — two offset sheets behind it give the deck-of-cards
          depth that makes the stack feel physical and premium. */}
      <div className="relative mt-4 [perspective:1400px]">
        <span
          aria-hidden
          className="absolute inset-0 translate-y-3 rotate-[1.6deg] rounded-[30px] opacity-60"
          style={{ background: "var(--accent-grad)" }}
        />
        <span
          aria-hidden
          className="absolute inset-0 translate-y-1.5 -rotate-[1.1deg] rounded-[30px] border border-[var(--border)] bg-[var(--accent-soft)]"
        />
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={
            flipped
              ? `${card.word} কার্ড — অর্থ দেখা হচ্ছে, চাপ দিলে শব্দে ফিরবে`
              : `${card.word} কার্ড — চাপ দিলে অর্থ দেখুন`
          }
          className="relative block h-[340px] w-full sm:h-[360px]"
        >
          <span
            className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            {/* Front — the site's CTA-card look (the teal banner card
                on Home): the bright accent gradient with two big soft
                white rings drifting off the corners; the word is the
                hero. */}
            <span
              className={`${faceCls} text-white`}
              style={{ background: "var(--accent-grad)" }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full border-[22px] border-white/10"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-12 h-64 w-64 rounded-full border-[26px] border-white/10"
              />
              <span
                aria-hidden
                className="flash-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 rotate-12 bg-white/10 blur-md"
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-extrabold tracking-wide text-[var(--accent-strong)] shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
                  {card.level} · {card.pos}
                </span>
                {isLn && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--accent-strong)]">
                    <IconCheck size={13} /> শেখা হয়েছে
                  </span>
                )}
              </span>
              <span className="relative mt-9 block text-center">
                <span className="block text-[46px] font-extrabold leading-[1.1] tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)] sm:text-[54px]">
                  {card.word}
                </span>
                <span
                  aria-hidden
                  className="mx-auto mt-4 block h-[3px] w-16 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
                  }}
                />
                <span className="mt-3 block text-[15px] font-medium text-white/85">
                  বাংলা উচ্চারণ: {card.bnPron}
                </span>
              </span>
              <span className="relative mt-auto flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur-sm">
                  <span className="text-white">
                    <IconVolume size={15} />
                  </span>
                  USA: {card.respUs}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur-sm">
                  <span className="text-white">
                    <IconVolume size={15} />
                  </span>
                  UK: {card.respUk}
                </span>
              </span>
              <span className="relative mt-4 block text-center text-[13.5px] font-bold text-white">
                <IconSparkle size={14} className="mr-1 inline-block align-[-2px]" />
                অর্থ দেখতে কার্ডে চাপ দিন
              </span>
            </span>

            {/* Back — clean light face in the same teal family: a soft
                teal wash, faint teal rings in the corners echoing the
                front, teal accents; meaning + example. */}
            <span
              className={`${faceCls} [transform:rotateY(180deg)]`}
              style={{
                background:
                  "linear-gradient(160deg, var(--accent-soft) 0%, var(--surface) 55%)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full border-[18px] border-[var(--accent)] opacity-[0.10]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full border-[20px] border-[var(--accent)] opacity-[0.08]"
              />
              <span
                aria-hidden
                className="absolute inset-x-8 top-0 h-[3px] rounded-full"
                style={{ background: "var(--accent-grad)" }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide text-white shadow-[var(--shadow-pop)]"
                  style={{ background: "var(--accent-grad)" }}
                >
                  {card.word}
                </span>
                <span className="text-xs font-bold tracking-wide text-[var(--accent-strong)]">
                  {card.level} · {card.pos}
                </span>
              </span>
              <span className="relative mt-5 block text-center text-[30px] font-extrabold leading-snug tracking-tight text-[var(--accent-strong)] sm:text-[34px]">
                {card.bn}
              </span>
              <span className="relative mt-4 grid grid-cols-2 gap-2 text-sm">
                <span className="flex items-center rounded-2xl bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-card)] ring-1 ring-[var(--border)]">
                  <span className="text-[11px] font-extrabold tracking-widest text-[var(--accent)]">USA</span>
                  <span className="ml-1.5 min-w-0 font-semibold leading-tight">{card.respUs}</span>
                </span>
                <span className="flex items-center rounded-2xl bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-card)] ring-1 ring-[var(--border)]">
                  <span className="text-[11px] font-extrabold tracking-widest text-[var(--accent)]">UK</span>
                  <span className="ml-1.5 min-w-0 font-semibold leading-tight">{card.respUk}</span>
                </span>
              </span>
              {card.ex && (
                <span className="relative mt-3 block rounded-2xl bg-[var(--surface)] px-4 py-3 text-left shadow-[var(--shadow-card)] ring-1 ring-[var(--border)]">
                  <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
                    উদাহরণ
                  </span>
                  <span className="block text-sm italic leading-relaxed">{card.ex}</span>
                  {card.exBn && (
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--dim)]">{card.exBn}</span>
                  )}
                </span>
              )}
              {(card.syn || card.ant) && (
                <span className="relative mt-3 flex flex-wrap justify-center gap-1.5 text-[13px] font-medium">
                  {card.syn && (
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent-strong)]">
                      সমার্থক: <strong>{card.syn}</strong>
                    </span>
                  )}
                  {card.ant && (
                    <span className="rounded-full bg-[var(--peach-soft)] px-3 py-1 text-[var(--peach-strong)]">
                      বিপরীত: <strong>{card.ant}</strong>
                    </span>
                  )}
                </span>
              )}
              <span className="relative mt-auto block pt-3 text-center text-[13px] font-bold text-[var(--accent-strong)]">
                শব্দে ফিরতে কার্ডে চাপ দিন
              </span>
            </span>
          </span>
        </button>
      </div>

      {/* Listen row */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => speak(card.word, "US")}
          aria-label={`${card.word} — আমেরিকান উচ্চারণ শুনুন`}
          className="btn-outline py-2.5"
        >
          <span className="text-[var(--accent)]">
            <IconVolume size={17} />
          </span>
          USA উচ্চারণ
        </button>
        <button
          type="button"
          onClick={() => speak(card.word, "GB")}
          aria-label={`${card.word} — ব্রিটিশ উচ্চারণ শুনুন`}
          className="btn-outline py-2.5"
        >
          <span className="text-[var(--accent)]">
            <IconVolume size={17} />
          </span>
          UK উচ্চারণ
        </button>
      </div>

      {/* Student actions */}
      {student && (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={isBm}
            disabled={bmMut.isPending}
            onClick={() => bmMut.mutate(card.id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              isBm
                ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                : "bg-[var(--surface-alt)] text-[var(--dim)] hover:text-[var(--text)]"
            }`}
          >
            <IconBookmark size={16} />
            {isBm ? "বুকমার্ক করা" : "বুকমার্ক"}
          </button>
          <button
            type="button"
            aria-pressed={isLn}
            disabled={lnMut.isPending}
            onClick={() => lnMut.mutate(card.id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
              isLn
                ? "text-[var(--accent-ink)] shadow-[var(--shadow-pop)]"
                : "bg-[var(--surface-alt)] text-[var(--dim)] hover:text-[var(--text)]"
            }`}
            style={isLn ? { background: "var(--accent-grad)" } : undefined}
          >
            <IconCheck size={16} />
            {isLn ? "শেখা হয়েছে" : "শেখা হয়েছে (+২ XP)"}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={() => move(-1)} className="btn-outline px-4">
          <IconArrowLeft size={17} /> আগের
        </button>
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 17);
            setIdx(0);
            setFlipped(false);
          }}
          className="btn-soft"
        >
          <IconShuffle size={16} /> এলোমেলো করুন
        </button>
        <button type="button" onClick={() => move(1)} className="btn-primary px-5">
          পরের কার্ড <IconArrowRight size={17} />
        </button>
      </div>
      <p className="mt-3.5 text-center text-sm font-medium text-[var(--dim)]">
        কার্ডে চাপ দিলেই উল্টে অর্থ, উদাহরণ আর উচ্চারণ দেখা যাবে
      </p>
    </div>
  );
}

function LevelQuiz({
  level,
  accessKey,
}: {
  level: string;
  accessKey: string;
}) {
  const { student } = useApp();
  const { freeLevels } = useAccessSettings();
  const [runId, setRunId] = useState(0);
  const q = useQuery({
    queryKey: ["vocab-quiz", level, runId, student?.id ?? 0, accessKey],
    queryFn: () =>
      api.getVocabQuiz({ level, studentId: student?.id ?? null }),
  });
  if (q.isPending) return <Spinner label="কুইজ তৈরি হচ্ছে…" />;
  if (q.data?.locked)
    return (
      <div className="mt-7">
        <PremiumLock
          title={`${level} কুইজ প্রিমিয়ামে`}
          text={`${level} লেভেলের শব্দ কুইজ প্রিমিয়াম শিক্ষার্থীদের জন্য। ${freeLevels.join("/")} কুইজ ফ্রিতেই দেওয়া যায় — প্রিমিয়াম নিলে বাকি সব লেভেলের কুইজও খুলবে।`}
        />
      </div>
    );
  if ((q.data?.questions.length ?? 0) === 0)
    return <EmptyNote>এই লেভেলের জন্য কুইজ তৈরি করা যায়নি।</EmptyNote>;
  return (
    <div className="mx-auto mt-7 max-w-xl">
      <QuizRunner
        questions={q.data?.questions ?? []}
        kind={`vocab-${level}`}
        title={`${level} শব্দ কুইজ`}
        onDone={() => setRunId((r) => r + 1)}
      />
    </div>
  );
}
