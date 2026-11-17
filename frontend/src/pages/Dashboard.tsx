import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import {
  bnDate,
  bnNum,
  LEVEL_BLURB,
  LEVELS,
  studentCode,
  useAccessSettings,
  useApp,
  writeSession,
} from "../lib";
import { AuthPrompt, courseCoverSrc, EmptyNote, Spinner, WordCard } from "../components";
import {
  IconArrowRight,
  IconBook,
  IconBookmark,
  IconChart,
  IconCheckCircle,
  IconClipboard,
  IconFlag,
  IconFlame,
  IconGrid,
  IconHome,
  IconIdCard,
  IconLayers,
  IconLock,
  IconLogout,
  IconMedal,
  IconRoute,
  IconStar,
  IconTarget,
  IconTrophy,
  IconVideo,
} from "../icons";

const KIND_LABEL: Record<string, string> = {
  level: "লেভেল টেস্ট",
  mock: "IELTS মক টেস্ট",
};

function kindLabel(kind: string): string {
  if (KIND_LABEL[kind]) return KIND_LABEL[kind];
  if (kind.startsWith("vocab-")) return `${kind.slice(6)} শব্দ কুইজ`;
  return kind;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "যাচাই চলছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-[var(--peach)]",
  approved: "bg-[var(--accent)]",
  rejected: "bg-[var(--danger)]",
};

/** "2026-11" → short Bangla month name ("নভে") for the chart axis. */
function monthLabel(key: string): string {
  const d = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("bn-BD", { month: "short" });
}

/** "2026-11" → full Bangla month + year ("নভেম্বর ২০২৬"). */
function monthFullLabel(key: string): string {
  const d = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
}

/**
 * The dashboard is a small app of its own: every sidebar item is a
 * SEPARATE page (only that page's content renders), not a scroll anchor
 * on one long page.
 */
type DashPage =
  | "overview"
  | "courses"
  | "book"
  | "activity"
  | "levels"
  | "badges"
  | "results"
  | "bookmarks";

const PAGES: {
  id: DashPage;
  label: string;
  title: string;
  sub: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactNode;
}[] = [
  {
    id: "overview",
    label: "ওভারভিউ",
    title: "ওভারভিউ",
    sub: "আপনার শেখার সব হিসাব এক নজরে — XP, স্ট্রিক, আজকের লক্ষ্য আর পরবর্তী ধাপ।",
    Icon: IconGrid,
  },
  {
    id: "courses",
    label: "আমার কোর্স",
    title: "আমার কোর্স",
    sub: "ভর্তি হওয়া কোর্সগুলোর অগ্রগতি আর আপনার ভর্তির আবেদনের অবস্থা।",
    Icon: IconVideo,
  },
  {
    id: "book",
    label: "আমার বই",
    title: "আমার বই — Oxford 7000 Words",
    sub: "কেনা বইটি ওয়েবসাইটের ভিতরেই পড়ুন — যেখানে থেমেছিলেন, সেখান থেকেই আবার শুরু হবে।",
    Icon: IconBook,
  },
  {
    id: "activity",
    label: "শেখার অগ্রগতি",
    title: "শেখার অগ্রগতি",
    sub: "গত ৬ মাসে মাস অনুযায়ী কত শব্দ শিখেছেন আর কত লেসন শেষ করেছেন।",
    Icon: IconChart,
  },
  {
    id: "levels",
    label: "লেভেল অগ্রগতি",
    title: "লেভেল অগ্রগতি",
    sub: "A1 থেকে C2 আর IELTS — প্রতিটি লেভেলে কতটা এগিয়েছেন।",
    Icon: IconLayers,
  },
  {
    id: "badges",
    label: "আমার অর্জন",
    title: "আমার অর্জন",
    sub: "শিখতে শিখতে জেতা ব্যাজগুলো — বাকিগুলোও জিততে চালিয়ে যান।",
    Icon: IconMedal,
  },
  {
    id: "results",
    label: "টেস্টের ফল",
    title: "টেস্টের ফল",
    sub: "লেভেল টেস্ট, মক টেস্ট আর কুইজের সব ফলাফল এক জায়গায়।",
    Icon: IconClipboard,
  },
  {
    id: "bookmarks",
    label: "বুকমার্ক",
    title: "বুকমার্ক করা শব্দ",
    sub: "কঠিন শব্দগুলো জমিয়ে রেখেছেন এখানে — অবসরে আবার ঝালিয়ে নিন।",
    Icon: IconBookmark,
  },
];

function PageHead({ page }: { page: (typeof PAGES)[number] }) {
  const { Icon } = page;
  return (
    <div className="flex items-start gap-3.5">
      <span className="icon-chip h-12 w-12 shrink-0 rounded-2xl">
        <Icon size={23} />
      </span>
      <div className="min-w-0">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
          {page.title}
        </h1>
        <p className="bn-read-sm mt-0.5 text-[var(--dim)]">{page.sub}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { student, setStudent, go, openCourse, openBookReader } = useApp();
  const [page, setPage] = useState<DashPage>("overview");

  const state = useQuery({
    queryKey: ["student-state", student?.id],
    queryFn: () => api.getStudentState({ studentId: student?.id ?? 0 }),
    enabled: student != null,
  });
  // Free/premium levels + the book's name follow the admin's live
  // settings, and this student's personal level grants come from the
  // fresh server row — so the locks and titles below are never stale.
  const {
    freeLevels,
    premiumLevels,
    isPremiumLevel,
    canOpenLevel,
    grantedLevels,
    bookTitle,
    bookFree,
  } = useAccessSettings(state.data?.student ?? student);
  const bookmarks = useQuery({
    queryKey: ["bookmarked-words", student?.id],
    queryFn: () => api.getBookmarkedWords({ studentId: student?.id ?? 0 }),
    enabled: student != null,
  });
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.getStats({}) });
  const daily = useQuery({
    queryKey: ["daily-words", student?.id, student?.premium ? 1 : 0],
    queryFn: () => api.getDailyWords({ studentId: student?.id ?? null }),
    enabled: student != null,
  });
  const bookAccess = useQuery({
    queryKey: ["book-access", student?.id ?? null],
    queryFn: () => api.getBookAccess({ studentId: student?.id ?? null }),
    enabled: student != null,
  });

  // Each dashboard section is its own page: switching starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  // Mobile menu bar: keep the active section chip visible in the
  // horizontally scrolling row whenever the page changes. (Declared
  // with the other hooks, before any early return.)
  const mobileNavRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mobileNavRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [page]);

  if (!student) {
    return (
      <div className="fade-in min-h-screen">
        <div className="px-4 pt-5 pt-safe sm:px-6">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex items-center gap-2.5 text-left"
            aria-label="VocabMaster — হোমে যান"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white shadow-[var(--shadow-pop)]"
              style={{ background: "var(--accent-grad)" }}
            >
              <IconBook size={20} />
            </span>
            <span className="text-[19px] font-extrabold tracking-tight">
              Vocab<span className="text-[var(--accent)]">Master</span>
            </span>
          </button>
        </div>
        <div className="mx-auto max-w-xl px-4 pt-8 sm:pt-12">
          <div className="text-center">
            <h1 className="text-[32px] font-extrabold tracking-tight sm:text-4xl">আমার ড্যাশবোর্ড</h1>
            <p className="bn-read mt-2 text-[var(--dim)]">
              XP, স্ট্রিক, বুকমার্ক, কোর্স আর অগ্রগতি — সব এক জায়গায় দেখতে
              লগইন করুন।
            </p>
          </div>
          <div className="mt-7">
            <AuthPrompt />
          </div>
        </div>
      </div>
    );
  }

  const s = state.data?.student ?? student;
  const learnedIds = state.data?.learnedIds ?? [];
  const learnedByLevel = state.data?.learnedByLevel ?? [];
  const results = state.data?.results ?? [];
  const enrollments = state.data?.enrollments ?? [];
  const courseProgress = state.data?.courseProgress ?? [];
  const activity = state.data?.activity ?? [];
  const bookmarkCount = bookmarks.data?.words.length ?? state.data?.bookmarkIds.length ?? 0;
  const totalQuizzes = results.length;
  const totalCorrect = results.reduce((a, r) => a + r.correct, 0);
  const totalQs = results.reduce((a, r) => a + r.total, 0);
  const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

  // Course trio, the reference dashboard's headline stats — all derived
  // from the student's own approved-course progress rows.
  const coursesDone = courseProgress.filter(
    (cp) => cp.totalLessons > 0 && cp.completedLessons >= cp.totalLessons,
  ).length;
  const coursesRunning = courseProgress.length - coursesDone;

  const chartData = activity.map((a) => ({
    month: monthLabel(a.month),
    words: a.words,
    lessons: a.lessons,
  }));
  const activityWords = activity.reduce((n, a) => n + a.words, 0);
  const activityLessons = activity.reduce((n, a) => n + a.lessons, 0);
  const activityMax = Math.max(1, ...activity.map((a) => a.words + a.lessons));
  const bestMonth = activity.reduce<(typeof activity)[number] | null>(
    (best, a) =>
      best == null || a.words + a.lessons > best.words + best.lessons ? a : best,
    null,
  );

  const totalOf = (lvl: string) =>
    stats.data?.byLevel.find((b) => b.level === lvl)?.count ?? 0;
  const learnedOf = (lvl: string) =>
    learnedByLevel.find((b) => b.level === lvl)?.count ?? 0;
  const totalWordsAll = LEVELS.reduce((n, l) => n + totalOf(l), 0);
  const overallPct =
    totalWordsAll > 0
      ? Math.min(100, Math.round((learnedIds.length / totalWordsAll) * 100))
      : 0;

  const dailyDone = daily.data != null && s.lastDaily === daily.data.date;
  const learnedToday = (daily.data?.words ?? []).filter((w) =>
    learnedIds.includes(w.id),
  ).length;

  // Next-step recommendation, derived from the student's real state.
  // For a non-premium student the "current level" skips premium levels —
  // recommending a locked level as the next step would strand them.
  const currentLevel = LEVELS.find(
    (l) => totalOf(l) > 0 && learnedOf(l) < totalOf(l) && canOpenLevel(l),
  );
  const premiumRemaining =
    !s.premium &&
    premiumLevels.some((l) => learnedOf(l) < totalOf(l));
  const nextStep =
    results.length === 0
      ? {
          title: "প্রথমে লেভেল টেস্টটা দিন",
          text: "২০টি প্রশ্নে জানা যাবে আপনি কোন লেভেল থেকে শুরু করলে সবচেয়ে ভালো শিখবেন।",
          cta: "ফ্রি লেভেল টেস্ট দিন",
          run: () => go("tests"),
        }
      : !dailyDone
        ? {
            title: "আজকের ডেইলি টাস্কটা শেষ করুন",
            text: "আজকের ১০টি শব্দ শিখলেই +৫০ XP আর স্ট্রিকটা বেঁচে থাকবে।",
            cta: "হোমে গিয়ে টাস্ক করুন",
            run: () => go("home"),
          }
        : currentLevel
          ? {
              title: `এবার ${currentLevel} লেভেলের শব্দ শিখুন`,
              text: `${currentLevel} লেভেলে এখনো ${bnNum(totalOf(currentLevel) - learnedOf(currentLevel))}টি শব্দ বাকি — একটু একটু করে এগিয়ে যান।`,
              cta: `${currentLevel} শুরু করুন`,
              run: () => {
                writeSession("vm-pending-level", currentLevel);
                go("vocab");
              },
            }
          : premiumRemaining
            ? {
                title: "ফ্রি লেভেল শেষ — এবার প্রিমিয়াম!",
                text: `${freeLevels.join("/")} লেভেলের সব শব্দ শিখে ফেলেছেন। ${premiumLevels.join(", ")} — বাকি লেভেলগুলো খুলতে প্রিমিয়াম নিন।`,
                cta: "প্রিমিয়াম সম্পর্কে জানুন",
                run: () => go("premium"),
              }
            : {
              title: "সব লেভেল শেষ — এবার রিভিশন!",
              text: "বুকমার্ক করা কঠিন শব্দগুলো আবার দেখুন, আর কুইজ দিয়ে নিজেকে যাচাই করুন।",
              cta: "কুইজ দিন",
              run: () => go("tests"),
            };

  const hasPerfect = results.some((r) => r.total > 0 && r.correct === r.total);
  const achievements = [
    { Icon: IconFlag, title: "প্রথম ধাপ", desc: "প্রথম শব্দ শেখা", earned: learnedIds.length >= 1 },
    { Icon: IconBook, title: "শব্দ সংগ্রাহক", desc: "৫০টি শব্দ শেখা", earned: learnedIds.length >= 50 },
    { Icon: IconMedal, title: "শতকের ঘরে", desc: "১০০টি শব্দ শেখা", earned: learnedIds.length >= 100 },
    { Icon: IconFlame, title: "স্ট্রিক স্টার", desc: "৩ দিনের স্ট্রিক", earned: s.streak >= 3 },
    { Icon: IconTrophy, title: "সপ্তাহের যোদ্ধা", desc: "৭ দিনের স্ট্রিক", earned: s.streak >= 7 },
    { Icon: IconClipboard, title: "টেস্ট যোদ্ধা", desc: "প্রথম টেস্ট সম্পন্ন", earned: results.length >= 1 },
    { Icon: IconTarget, title: "নিখুঁত স্কোর", desc: "যেকোনো টেস্টে পূর্ণ নম্বর", earned: hasPerfect },
    { Icon: IconStar, title: "XP তারকা", desc: "৫০০ XP অর্জন", earned: s.xp >= 500 },
  ];
  const earnedCount = achievements.filter((a) => a.earned).length;

  const initial = s.name.trim().charAt(0).toUpperCase() || "S";
  const activePage = PAGES.find((p) => p.id === page) ?? PAGES[0]!;

  return (
    <div className="fade-in flex min-h-screen flex-col lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
      {/* Mobile menu bar (phone/tablet only): STICKY at the top, so the
          section menu is always one tap away while scrolling — brand +
          logout on the first row, all eight section chips in a
          scrollable row below (the active chip auto-scrolls into view).
          The old layout buried the chips under the whole profile block
          in a non-sticky header, which is what made the menu feel
          broken on mobile. Desktop uses the sidebar nav instead. */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] pt-safe backdrop-blur-xl lg:hidden" style={{ background: "var(--nav-bg)" }}>
        <div className="flex items-center gap-2.5 px-4 pt-2.5">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            aria-label="VocabMaster — হোমে যান"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-white shadow-[var(--shadow-pop)]"
              style={{ background: "var(--accent-grad)" }}
            >
              <IconBook size={18} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[16px] font-extrabold tracking-tight">
                Vocab<span className="text-[var(--accent)]">Master</span>
              </span>
              <span className="block text-[11.5px] font-semibold text-[var(--dim)]">
                {s.name} · {studentCode(s.id)}
              </span>
            </span>
          </button>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--gold-soft)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--gold)]">
            <IconStar size={13} /> {bnNum(s.xp)} XP
          </span>
          <button
            type="button"
            onClick={() => setStudent(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)]"
            aria-label="লগআউট"
          >
            <IconLogout size={17} />
          </button>
        </div>
        <nav
          ref={mobileNavRef}
          className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-4 pb-2.5"
          aria-label="ড্যাশবোর্ডের পেজসমূহ"
        >
          {PAGES.map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                type="button"
                data-active={active ? "true" : undefined}
                onClick={() => setPage(id)}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-bold transition-colors ${
                  active
                    ? "text-white shadow-[var(--shadow-pop)]"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)]"
                }`}
                style={active ? { background: "var(--accent-grad)" } : undefined}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Full-side app shell: desktopে full-height side panel (edge to
          edge, কোনো card নয়), phone/tablet-এ profile header block।
          এই পেজে site-এর nav bar/header/footer থাকে না — sidebar আর
          মোবাইল sticky bar-ই একমাত্র navigation। */}
      <aside
        className="border-b border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pt-safe"
        aria-label="ড্যাশবোর্ড মেনু"
      >
        <div className="p-4 lg:p-5">
          <button
            type="button"
            onClick={() => go("home")}
            className="mb-4 hidden items-center gap-2.5 text-left lg:flex"
            aria-label="VocabMaster — হোমে যান"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white shadow-[var(--shadow-pop)]"
              style={{ background: "var(--accent-grad)" }}
            >
              <IconBook size={20} />
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight">
                Vocab<span className="text-[var(--accent)]">Master</span>
              </span>
              <span className="mt-0.5 block text-[12px] font-semibold tracking-wide text-[var(--dim)]">
                স্টুডেন্ট ড্যাশবোর্ড
              </span>
            </span>
            <IconHome size={18} className="ml-auto text-[var(--dim)]" />
          </button>
          <div className="flex items-center gap-3 px-1">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-[var(--shadow-pop)]"
              style={{ background: "var(--accent-grad)" }}
            >
              {initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[16px] font-extrabold leading-snug">
                {s.name}
              </span>
              <span className="block truncate text-[13px] text-[var(--dim)]">
                {s.phone}
              </span>
            </span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[var(--dim)]">
            <IconIdCard size={15} className="text-[var(--accent)]" />
            স্টুডেন্ট আইডি:
            <span className="font-mono font-bold text-[var(--accent-strong)]">
              {studentCode(s.id)}
            </span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 px-1">
            <span className="rounded-xl bg-[var(--gold-soft)] px-3 py-2 text-center text-[13px] font-bold text-[var(--gold)]">
              <IconStar size={14} className="mr-1 inline" />
              {bnNum(s.xp)} XP
            </span>
            <span className="rounded-xl bg-[var(--peach-soft)] px-3 py-2 text-center text-[13px] font-bold text-[var(--peach-strong)]">
              <IconFlame size={14} className="mr-1 inline" />
              {bnNum(s.streak)} দিন স্ট্রিক
            </span>
          </div>

          {/* Premium status: active badge, or the path to unlock the
              premium levels (whichever levels those currently are) */}
          {s.premium ? (
            <div
              className="mt-3 rounded-2xl px-3.5 py-3"
              style={{
                background:
                  "linear-gradient(135deg, var(--gold-soft) 0%, var(--peach-soft) 100%)",
              }}
            >
              <p className="flex items-center gap-1.5 text-[14px] font-extrabold text-[var(--gold)]">
                <IconMedal size={16} /> Premium সক্রিয় আছে
              </p>
              <p className="mt-0.5 text-[12.5px] font-medium leading-relaxed text-[var(--dim)]">
                সব লেভেল আপনার জন্য খোলা।
              </p>
            </div>
          ) : premiumLevels.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[14px] font-extrabold">
                <IconCheckCircle size={15} className="text-[var(--accent)]" />
                সব লেভেল এখন ফ্রি
              </p>
              <p className="mt-0.5 text-[12.5px] font-medium leading-relaxed text-[var(--dim)]">
                A1 থেকে IELTS — পুরো শব্দভান্ডার এখন সবার জন্য খোলা।
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[14px] font-extrabold">
                <IconLock size={15} className="text-[var(--peach)]" />
                {premiumLevels.join(" · ")} লক করা
              </p>
              <p className="mt-0.5 text-[12.5px] font-medium leading-relaxed text-[var(--dim)]">
                {freeLevels.join("/")} ফ্রি — প্রিমিয়াম নিলে বাকি সব লেভেল
                খুলবে।
              </p>
              <button
                type="button"
                onClick={() => go("premium")}
                className="btn-warm mt-2.5 w-full px-4 py-2 text-[13.5px]"
              >
                <IconMedal size={15} /> প্রিমিয়াম নিন
              </button>
            </div>
          )}

          {/* Desktop sidebar nav — mobile uses the sticky bar above. */}
          <nav
            className="mt-4 hidden gap-1 lg:grid"
            aria-label="ড্যাশবোর্ডের পেজসমূহ"
          >
            {PAGES.map(({ id, label, Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPage(id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[14.5px] font-semibold transition-colors lg:shrink ${
                    active
                      ? "text-white shadow-[var(--shadow-pop)]"
                      : "text-[var(--dim)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
                  }`}
                  style={active ? { background: "var(--accent-grad)" } : undefined}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setStudent(null)}
            className="btn-outline mt-4 w-full px-4 py-2 text-sm"
          >
            <IconLogout size={16} /> লগআউট
          </button>
        </div>
      </aside>

      {/* ---------- Main column: one page at a time ---------- */}
      <div className="min-w-0 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:py-8">
        <div key={page} className="fade-in mx-auto w-full max-w-5xl">
          {page === "overview" && (
            <>
              {/* Greeting */}
              <section
                className="card flex flex-wrap items-center gap-4 p-5 sm:p-6"
                aria-label="স্বাগতম"
              >
                <span
                  aria-hidden
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[26px] font-extrabold text-white shadow-[var(--shadow-pop)]"
                  style={{ background: "var(--accent-grad)" }}
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <h1 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
                    হাই, {s.name}
                  </h1>
                  <p className="mt-0.5 text-[14.5px] text-[var(--dim)]">
                    {s.phone} · স্টুডেন্ট আইডি{" "}
                    <span className="font-mono font-bold text-[var(--accent-strong)]">
                      {studentCode(s.id)}
                    </span>{" "}
                    · আজও শেখা চালিয়ে যান!
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-soft)] px-3.5 py-2 text-sm font-bold text-[var(--gold)]">
                    <IconStar size={16} /> {bnNum(s.xp)} XP
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--peach-soft)] px-3.5 py-2 text-sm font-bold text-[var(--peach-strong)]">
                    <IconFlame size={16} /> {bnNum(s.streak)} দিন
                  </span>
                </div>
              </section>

              {/* Course trio — reference headline stats */}
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "মোট কোর্স", tag: "ENROLLED", value: courseProgress.length, Icon: IconBook },
                  { label: "চলমান", tag: "IN PROGRESS", value: coursesRunning, Icon: IconRoute },
                  { label: "সম্পন্ন", tag: "COMPLETED", value: coursesDone, Icon: IconTrophy },
                ].map((c) => (
                  <button
                    key={c.tag}
                    type="button"
                    onClick={() => setPage("courses")}
                    className="card card-hover p-5 text-left"
                    aria-label={`${c.label}: ${bnNum(c.value)} — আমার কোর্স পেজে যান`}
                  >
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dim)]">
                      {c.label}
                      <span className="rounded-md bg-[var(--surface-alt)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--dim)]">
                        {c.tag}
                      </span>
                    </p>
                    <p className="mt-2.5 flex items-center gap-2.5 text-[34px] font-extrabold leading-none tracking-tight">
                      {bnNum(c.value)}
                      <c.Icon size={22} className="text-[var(--accent)]" />
                    </p>
                  </button>
                ))}
              </div>

              {/* Personal stat cards */}
              <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  {
                    Icon: IconStar,
                    tint: "var(--gold-soft)",
                    tintText: "var(--gold)",
                    label: "মোট XP",
                    value: bnNum(s.xp),
                    note: null as string | null,
                    target: null as DashPage | null,
                  },
                  {
                    Icon: IconFlame,
                    tint: "var(--peach-soft)",
                    tintText: "var(--peach)",
                    label: "ডেইলি স্ট্রিক",
                    value: `${bnNum(s.streak)} দিন`,
                    note: null,
                    target: null,
                  },
                  {
                    Icon: IconBook,
                    tint: "var(--accent-soft)",
                    tintText: "var(--accent-strong)",
                    label: "শেখা শব্দ",
                    value: `${bnNum(learnedIds.length)}টি`,
                    note: null,
                    target: "levels" as DashPage | null,
                  },
                  {
                    Icon: IconBookmark,
                    tint: "var(--accent-soft)",
                    tintText: "var(--accent-strong)",
                    label: "বুকমার্ক",
                    value: `${bnNum(bookmarkCount)}টি`,
                    note: `কুইজে সঠিক: ${totalQs > 0 ? `${bnNum(totalCorrect)}/${bnNum(totalQs)}` : "—"} (${bnNum(totalQuizzes)}টি টেস্ট)`,
                    target: "bookmarks" as DashPage | null,
                  },
                ].map((stat) => {
                  const inner = (
                    <>
                      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--dim)]">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                          style={{ background: stat.tint, color: stat.tintText }}
                        >
                          <stat.Icon size={17} />
                        </span>
                        {stat.label}
                      </p>
                      <p className="mt-3 text-[32px] font-extrabold leading-none tracking-tight">{stat.value}</p>
                      {stat.note && <p className="mt-1.5 text-xs text-[var(--dim)]">{stat.note}</p>}
                    </>
                  );
                  return stat.target ? (
                    <button
                      key={stat.label}
                      type="button"
                      onClick={() => setPage(stat.target!)}
                      className="card card-hover p-5 text-left sm:p-6"
                      aria-label={`${stat.label}: ${stat.value} — বিস্তারিত পেজে যান`}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div key={stat.label} className="card p-5 sm:p-6">
                      {inner}
                    </div>
                  );
                })}
              </div>

              {/* Today's goal + next step */}
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <section
                  className="rounded-[var(--radius)] border p-6 shadow-[var(--shadow-card)]"
                  style={{
                    background: "linear-gradient(135deg, var(--peach-soft) 0%, var(--surface) 80%)",
                    borderColor: "color-mix(in srgb, var(--peach) 30%, transparent)",
                  }}
                  aria-label="আজকের লক্ষ্য"
                >
                  <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                      style={{ background: "var(--peach-grad)" }}
                    >
                      <IconFlame size={18} />
                    </span>
                    আজকের লক্ষ্য — ১০টি শব্দ
                  </h2>
                  {daily.isPending ? (
                    <Spinner label="লোড হচ্ছে…" />
                  ) : dailyDone ? (
                    <p className="bn-read mt-3 text-[var(--dim)]">
                      আজকের টাস্ক শেষ — দারুণ! স্ট্রিক এখন {bnNum(s.streak)} দিন। কাল
                      আবার নতুন ১০টি শব্দ আসবে।
                    </p>
                  ) : (
                    <>
                      <div className="mt-4 flex items-center justify-between text-[13px] font-semibold">
                        <span>আজ শেখা হয়েছে</span>
                        <span className="text-[var(--peach-strong)]">
                          {bnNum(learnedToday)}/{bnNum(10)}
                        </span>
                      </div>
                      <div
                        className="progress-track mt-1.5 h-2.5"
                        role="progressbar"
                        aria-valuenow={learnedToday}
                        aria-valuemin={0}
                        aria-valuemax={10}
                        aria-label="আজকের টাস্কের অগ্রগতি"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, learnedToday * 10)}%`,
                            background: "var(--peach-grad)",
                          }}
                        />
                      </div>
                      <p className="bn-read-sm mt-3 text-[var(--dim)]">
                        হোম পেজের "আজকের টাস্ক" থেকে শব্দগুলো শিখে "শেখা হয়েছে"
                        চিহ্নিত করুন — শেষ হলে +৫০ XP।
                      </p>
                    </>
                  )}
                  <button type="button" onClick={() => go("home")} className="btn-warm mt-4 px-5 py-2.5">
                    আজকের টাস্কে যান <IconArrowRight size={16} />
                  </button>
                </section>

                <section className="card p-6" aria-label="পরবর্তী ধাপ">
                  <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
                    <span className="icon-chip h-9 w-9 rounded-xl">
                      <IconRoute size={18} />
                    </span>
                    আপনার পরবর্তী ধাপ
                  </h2>
                  <p className="mt-3 text-[19px] font-bold leading-snug">{nextStep.title}</p>
                  <p className="bn-read mt-1.5 text-[var(--dim)]">{nextStep.text}</p>
                  <button type="button" onClick={nextStep.run} className="btn-primary mt-4 px-5 py-2.5">
                    {nextStep.cta} <IconArrowRight size={16} />
                  </button>
                </section>
              </div>

              {/* Mini activity preview → full page */}
              <section className="card mt-6 p-5 sm:p-6" aria-label="শেখার অগ্রগতির সারাংশ">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[20px] font-extrabold tracking-tight">শেখার অগ্রগতি</h2>
                  <button
                    type="button"
                    onClick={() => setPage("activity")}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
                  >
                    পুরো রিপোর্ট দেখুন <IconArrowRight size={15} />
                  </button>
                </div>
                <p className="bn-read-sm mt-1 text-[var(--dim)]">
                  গত ৬ মাসে {bnNum(activityWords)}টি শব্দ শিখেছেন আর{" "}
                  {bnNum(activityLessons)}টি কোর্স লেসন শেষ করেছেন। লেভেল অনুযায়ী
                  অগ্রগতি {bnNum(overallPct)}% — {bnNum(learnedIds.length)}/
                  {bnNum(totalWordsAll)} শব্দ।
                </p>
                <div
                  className="progress-track mt-3 h-2.5"
                  role="progressbar"
                  aria-valuenow={overallPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="সব লেভেল মিলিয়ে শব্দ শেখার অগ্রগতি"
                >
                  <div className="progress-fill" style={{ width: `${overallPct}%` }} />
                </div>
              </section>
            </>
          )}

          {page === "courses" && (
            <>
              <PageHead page={activePage} />
              {state.isPending ? (
                <Spinner label="কোর্স লোড হচ্ছে…" />
              ) : courseProgress.length === 0 ? (
                <div className="mt-5">
                  <EmptyNote>
                    এখনো কোনো কোর্সে ভর্তি হননি। কোর্স পেজ থেকে পছন্দের কোর্সে
                    আবেদন করুন — অনুমোদন হলেই এখানে অগ্রগতিসহ দেখা যাবে।
                    <div className="mt-4">
                      <button type="button" onClick={() => go("courses")} className="btn-primary px-5 py-2.5">
                        কোর্স দেখুন <IconArrowRight size={16} />
                      </button>
                    </div>
                  </EmptyNote>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {courseProgress.map((cp) => {
                    const pct =
                      cp.totalLessons > 0
                        ? Math.round((cp.completedLessons / cp.totalLessons) * 100)
                        : 0;
                    return (
                      <article key={cp.courseId} className="card card-hover overflow-hidden">
                        <img
                          src={courseCoverSrc({ id: cp.courseId, title: cp.courseTitle, imageSrc: "" })}
                          alt=""
                          loading="lazy"
                          className="h-36 w-full object-cover"
                        />
                        <div className="p-5 sm:p-6">
                          <h2 className="text-[18px] font-bold leading-snug">{cp.courseTitle}</h2>
                          <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
                            <span>
                              {bnNum(cp.completedLessons)}/{bnNum(cp.totalLessons)} লেসন শেষ
                            </span>
                            <span className="text-[var(--accent-strong)]">{bnNum(pct)}%</span>
                          </div>
                          <div
                            className="progress-track mt-1.5 h-2.5"
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${cp.courseTitle} — অগ্রগতি`}
                          >
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <button
                            type="button"
                            onClick={() => openCourse(cp.courseId)}
                            className="btn-primary mt-4 px-5 py-2.5"
                          >
                            {cp.completedLessons > 0 ? "কোর্স চালিয়ে যান" : "কোর্স শুরু করুন"}
                            <IconArrowRight size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <section className="mt-10" aria-label="আমার ভর্তির আবেদন">
                <h2 className="text-[22px] font-extrabold tracking-tight">আমার ভর্তির আবেদন</h2>
                {enrollments.length === 0 ? (
                  <div className="mt-3">
                    <EmptyNote>
                      কোনো আবেদন নেই। কোর্স পেজ থেকে পছন্দের কোর্সে আবেদন করুন।
                    </EmptyNote>
                  </div>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {enrollments.map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)]"
                      >
                        <span className="font-medium">{e.courseTitle}</span>
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[e.status] ?? "bg-[var(--dim)]"}`} aria-hidden />
                          {STATUS_LABEL[e.status] ?? e.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {page === "book" && (
            <>
              <PageHead
                page={
                  activePage.id === "book"
                    ? { ...activePage, title: `আমার বই — ${bookTitle}` }
                    : activePage
                }
              />
              <section className="card mt-5 overflow-hidden" aria-label="আমার বই">
                <div
                  className="relative p-6 text-white sm:p-8"
                  style={{ background: "linear-gradient(135deg, #0c453c 0%, #083028 100%)" }}
                >
                  <div className="flex flex-wrap items-center gap-5">
                    <span className="icon-chip flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-white/10 text-white" style={{ boxShadow: "none" }}>
                      <IconBook size={30} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[22px] font-extrabold tracking-tight">
                        {bookTitle}
                      </h2>
                      <p className="mt-1 text-[14.5px] leading-relaxed text-white/80">
                        লেখক: Jarif Ahmed · মোট{" "}
                        {bnNum(bookAccess.data?.totalPages ?? 762)} পৃষ্ঠা ·
                        ওয়েবসাইটের ভিতরেই পড়ার জন্য
                      </p>
                    </div>
                    {(bookAccess.data?.hasAccess ?? s.bookAccess) ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#083028]">
                        <IconCheckCircle size={16} />{" "}
                        {bookFree ? "সবার জন্য ফ্রি" : "আপনার বই"}
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/40 px-4 py-2 text-sm font-bold text-white">
                        <IconLock size={15} /> কেনা হয়নি
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  {bookAccess.isPending ? (
                    <Spinner label="বইয়ের তথ্য লোড হচ্ছে…" />
                  ) : (bookAccess.data?.hasAccess ?? s.bookAccess) ? (
                    <>
                      {(bookAccess.data?.lastPage ?? 1) > 1 && (
                        <div className="max-w-md">
                          <div className="flex items-center justify-between text-[13.5px] font-semibold">
                            <span>পড়ার অগ্রগতি</span>
                            <span className="text-[var(--accent-strong)]">
                              পৃষ্ঠা {bnNum(bookAccess.data?.lastPage ?? 1)} /{" "}
                              {bnNum(bookAccess.data?.totalPages ?? 762)}
                            </span>
                          </div>
                          <div
                            className="progress-track mt-1.5 h-2.5"
                            role="progressbar"
                            aria-valuenow={bookAccess.data?.lastPage ?? 1}
                            aria-valuemin={1}
                            aria-valuemax={bookAccess.data?.totalPages ?? 762}
                            aria-label="বই পড়ার অগ্রগতি"
                          >
                            <div
                              className="progress-fill"
                              style={{
                                width: `${Math.min(100, (((bookAccess.data?.lastPage ?? 1) - 1) / Math.max(1, (bookAccess.data?.totalPages ?? 762) - 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <p className="bn-read mt-3 max-w-xl text-[var(--dim)]">
                        {bookAccess.data?.uploaded
                          ? (bookAccess.data?.lastPage ?? 1) > 1
                            ? `শেষবার পৃষ্ঠা ${bnNum(bookAccess.data?.lastPage ?? 1)} পর্যন্ত পড়েছিলেন — বই খুললেই সেখান থেকে শুরু হবে।`
                            : "আপনার বই তৈরি — পড়া শুরু করুন!"
                          : "আপনার অ্যাক্সেস চালু আছে — বইয়ের ফাইলটি রিডারে যোগ হলেই এখান থেকে পড়তে পারবেন।"}
                      </p>
                      {bookAccess.data?.uploaded && (
                        <button
                          type="button"
                          onClick={() => openBookReader()}
                          className="btn-primary mt-5 px-7"
                        >
                          <IconBook size={17} />
                          {(bookAccess.data?.lastPage ?? 1) > 1
                            ? "পড়া চালিয়ে যান"
                            : "বইটি পড়ুন"}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="bn-read max-w-xl text-[var(--dim)]">
                        বইটি কিনলেই পুরো {bnNum(bookAccess.data?.totalPages ?? 762)}{" "}
                        পৃষ্ঠা এই ওয়েবসাইটের ভিতরেই পড়তে পারবেন — ডাউনলোড
                        ছাড়াই, নিরাপদে। দাম মাত্র ৳
                        {bnNum(bookAccess.data?.price ?? 990)}।
                      </p>
                      <button
                        type="button"
                        onClick={() => go("book")}
                        className="btn-primary mt-5 px-7"
                      >
                        <IconBook size={17} /> বইটি কিনুন ও পড়ুন
                      </button>
                    </>
                  )}
                </div>
              </section>
            </>
          )}

          {page === "activity" && (
            <>
              <PageHead page={activePage} />
              <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  { label: "৬ মাসে শেখা শব্দ", value: `${bnNum(activityWords)}টি`, Icon: IconBook },
                  { label: "৬ মাসে শেষ লেসন", value: `${bnNum(activityLessons)}টি`, Icon: IconVideo },
                  {
                    label: "সবচেয়ে সক্রিয় মাস",
                    value: bestMonth ? monthLabel(bestMonth.month) : "—",
                    Icon: IconFlame,
                  },
                  {
                    label: "মোট শেখা শব্দ",
                    value: `${bnNum(learnedIds.length)}টি`,
                    Icon: IconStar,
                  },
                ].map((t) => (
                  <div key={t.label} className="card p-5">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dim)]">
                      <span className="icon-chip h-8 w-8 rounded-[10px]">
                        <t.Icon size={16} />
                      </span>
                      {t.label}
                    </p>
                    <p className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight">
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>

              <section className="card mt-5 p-5 sm:p-6" aria-label="মাস অনুযায়ী শেখার চার্ট">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[20px] font-extrabold tracking-tight">
                      মাস অনুযায়ী শেখা
                    </h2>
                    <p className="bn-read-sm mt-1 text-[var(--dim)]">
                      প্রতিদিন একটু একটু করে শিখলেই গ্রাফটা উপরে উঠবে।
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold tracking-wider text-[var(--accent-strong)]">
                    LIVE
                  </span>
                </div>
                {state.isPending ? (
                  <Spinner label="অগ্রগতি লোড হচ্ছে…" />
                ) : (
                  <div
                    className="mt-4 h-[280px]"
                    role="img"
                    aria-label={`গত ৬ মাসের শেখার অগ্রগতির চার্ট: মোট ${bnNum(activityWords)}টি শব্দ ও ${bnNum(activityLessons)}টি লেসন`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "var(--dim)", fontSize: 12.5 }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={false}
                          dy={6}
                        />
                        <YAxis
                          allowDecimals={false}
                          domain={[0, "auto"]}
                          tick={{ fill: "var(--dim)", fontSize: 12.5 }}
                          tickFormatter={(v: number) => bnNum(v)}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value: unknown) => bnNum(Number(value ?? 0))}
                          contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 14,
                            color: "var(--text)",
                            fontSize: 13.5,
                            boxShadow: "var(--shadow-lift)",
                          }}
                          labelStyle={{ color: "var(--dim)", fontWeight: 700 }}
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span style={{ color: "var(--dim)", fontSize: 13.5, fontWeight: 600 }}>
                              {value}
                            </span>
                          )}
                        />
                        <Area
                          type="monotone"
                          dataKey="words"
                          name="শেখা শব্দ"
                          stroke="var(--accent)"
                          strokeWidth={2.5}
                          fill="var(--accent)"
                          fillOpacity={0.13}
                          dot={{ r: 3 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="lessons"
                          name="শেষ করা লেসন"
                          stroke="var(--peach)"
                          strokeWidth={2.5}
                          fill="var(--peach)"
                          fillOpacity={0.1}
                          dot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <section className="card mt-5 p-5 sm:p-6" aria-label="মাস অনুযায়ী বিবরণ">
                <h2 className="text-[20px] font-extrabold tracking-tight">মাস অনুযায়ী বিবরণ</h2>
                <ul className="mt-3 grid gap-2.5">
                  {[...activity].reverse().map((a) => {
                    const tot = a.words + a.lessons;
                    return (
                      <li
                        key={a.month}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold">{monthFullLabel(a.month)}</span>
                          <span className="text-sm font-medium text-[var(--dim)]">
                            {bnNum(a.words)}টি শব্দ · {bnNum(a.lessons)}টি লেসন
                          </span>
                        </div>
                        <div
                          className="progress-track mt-2 h-2 bg-[var(--surface)]"
                          role="progressbar"
                          aria-valuenow={tot}
                          aria-valuemin={0}
                          aria-valuemax={activityMax}
                          aria-label={`${monthFullLabel(a.month)} — মোট কার্যকলাপ`}
                        >
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.round((tot / activityMax) * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {activity.length === 0 && !state.isPending && (
                  <p className="bn-read-sm mt-2 text-[var(--dim)]">
                    এখনো কোনো কার্যকলাপ নেই — আজকের টাস্ক দিয়ে শুরু করুন।
                  </p>
                )}
              </section>
            </>
          )}

          {page === "levels" && (
            <>
              <PageHead page={activePage} />
              <section className="card mt-5 p-5 sm:p-6" aria-label="সামগ্রিক অগ্রগতি">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--dim)]">সব লেভেল মিলিয়ে</p>
                    <p className="mt-1 text-[30px] font-extrabold leading-none tracking-tight">
                      {bnNum(learnedIds.length)}
                      <span className="text-[18px] font-bold text-[var(--dim)]">
                        /{bnNum(totalWordsAll)} শব্দ
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3.5 py-1.5 text-sm font-extrabold text-[var(--accent-strong)]">
                    {bnNum(overallPct)}% সম্পন্ন
                  </span>
                </div>
                <div
                  className="progress-track mt-3 h-3"
                  role="progressbar"
                  aria-valuenow={overallPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="সব লেভেল মিলিয়ে অগ্রগতি"
                >
                  <div className="progress-fill" style={{ width: `${overallPct}%` }} />
                </div>
                <p className="bn-read-sm mt-2.5 text-[var(--dim)]">
                  প্রতিটি শব্দ কার্ডে "শেখা হয়েছে" চিহ্নিত করলেই এখানে অগ্রগতি
                  বাড়বে (+২ XP/শব্দ)।
                </p>
              </section>

              <div className="mt-4 grid gap-3">
                {LEVELS.map((lvl) => {
                  const total = totalOf(lvl);
                  const done = learnedOf(lvl);
                  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
                  const doneAll = total > 0 && done >= total;
                  const lvlLocked = !canOpenLevel(lvl);
                  const lvlGifted =
                    isPremiumLevel(lvl) &&
                    !s.premium &&
                    grantedLevels.includes(lvl);
                  return (
                    <section
                      key={lvl}
                      className="card flex flex-wrap items-center gap-4 p-5"
                      aria-label={`${lvl} লেভেলের অগ্রগতি`}
                    >
                      <span
                        aria-hidden
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[17px] font-extrabold text-white shadow-[var(--shadow-pop)]"
                        style={{ background: "var(--accent-grad)" }}
                      >
                        {lvl}
                      </span>
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[17px] font-extrabold">{lvl} লেভেল</span>
                          {lvlLocked ? (
                            <span
                              className="inline-flex items-center justify-center rounded-full bg-[var(--gold-soft)] p-1.5 text-[var(--gold)]"
                              aria-label="প্রিমিয়াম লেভেল"
                              title="প্রিমিয়াম লেভেল"
                            >
                              <IconLock size={12} />
                            </span>
                          ) : lvlGifted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--gold)]">
                              <IconMedal size={12} /> ফ্রি দেওয়া হয়েছে
                            </span>
                          ) : isPremiumLevel(lvl) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--accent-strong)]">
                              <IconMedal size={12} /> প্রিমিয়ামে খোলা
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--accent-strong)]">
                              ফ্রি
                            </span>
                          )}
                          <span className="text-[13px] font-medium text-[var(--dim)]">
                            {LEVEL_BLURB[lvl]}
                          </span>
                        </p>
                        <div
                          className="progress-track mt-2 h-2.5"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${lvl} লেভেলের অগ্রগতি`}
                        >
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[20px] font-extrabold leading-none text-[var(--accent-strong)]">
                          {bnNum(pct)}%
                        </p>
                        <p className="mt-1 text-[12.5px] font-medium text-[var(--dim)]">
                          {bnNum(done)}/{bnNum(total)} শব্দ
                        </p>
                      </div>
                      {lvlLocked ? (
                        <button
                          type="button"
                          onClick={() => go("premium")}
                          className="btn-warm px-4 py-2 text-sm"
                        >
                          <IconLock size={14} /> প্রিমিয়াম নিন
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            writeSession("vm-pending-level", lvl);
                            go("vocab");
                          }}
                          className={doneAll ? "btn-outline px-4 py-2 text-sm" : "btn-primary px-4 py-2 text-sm"}
                        >
                          {doneAll ? "আবার দেখুন" : done > 0 ? "চালিয়ে যান" : "শুরু করুন"}
                        </button>
                      )}
                    </section>
                  );
                })}
              </div>
            </>
          )}

          {page === "badges" && (
            <>
              <PageHead page={activePage} />
              <section className="card mt-5 p-5 sm:p-6" aria-label="অর্জনের সারাংশ">
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--gold-soft)", color: "var(--gold)" }}
                  >
                    <IconTrophy size={27} />
                  </span>
                  <div>
                    <p className="text-[24px] font-extrabold leading-tight tracking-tight">
                      {bnNum(earnedCount)}/{bnNum(achievements.length)}টি ব্যাজ জিতেছেন
                    </p>
                    <p className="bn-read-sm text-[var(--dim)]">
                      {earnedCount >= achievements.length
                        ? "সব ব্যাজ আপনার — অসাধারণ!"
                        : `আরও ${bnNum(achievements.length - earnedCount)}টি ব্যাজ বাকি — প্রতিদিন শিখলেই একে একে খুলবে।`}
                    </p>
                  </div>
                </div>
                <div
                  className="progress-track mt-4 h-2.5"
                  role="progressbar"
                  aria-valuenow={earnedCount}
                  aria-valuemin={0}
                  aria-valuemax={achievements.length}
                  aria-label="ব্যাজ অর্জনের অগ্রগতি"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${achievements.length > 0 ? Math.round((earnedCount / achievements.length) * 100) : 0}%`,
                      background: "linear-gradient(135deg, var(--gold) 0%, var(--peach) 100%)",
                    }}
                  />
                </div>
              </section>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {achievements.map((a) => (
                  <div
                    key={a.title}
                    className={`rounded-[var(--radius)] border p-5 text-center ${
                      a.earned
                        ? "border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
                        : "border-dashed border-[var(--border)] bg-[var(--surface-alt)] opacity-60"
                    }`}
                  >
                    <span
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                      style={
                        a.earned
                          ? { background: "var(--gold-soft)", color: "var(--gold)" }
                          : { background: "var(--surface-hover)", color: "var(--dim)" }
                      }
                    >
                      <a.Icon size={26} />
                    </span>
                    <p className="mt-3 text-[16px] font-bold leading-snug">{a.title}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-[var(--dim)]">{a.desc}</p>
                    <p
                      className={`mt-2 text-[12px] font-bold ${a.earned ? "text-[var(--accent-strong)]" : "text-[var(--dim)]"}`}
                    >
                      {a.earned ? "অর্জিত ✓" : "এখনো বাকি"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === "results" && (
            <>
              <PageHead page={activePage} />
              <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  { label: "মোট টেস্ট", value: `${bnNum(totalQuizzes)}টি`, Icon: IconClipboard },
                  { label: "মোট প্রশ্ন", value: `${bnNum(totalQs)}টি`, Icon: IconTarget },
                  { label: "সঠিক উত্তর", value: `${bnNum(totalCorrect)}টি`, Icon: IconCheckCircle },
                  { label: "সাফল্যের হার", value: `${bnNum(accuracy)}%`, Icon: IconChart },
                ].map((t) => (
                  <div key={t.label} className="card p-5">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dim)]">
                      <span className="icon-chip h-8 w-8 rounded-[10px]">
                        <t.Icon size={16} />
                      </span>
                      {t.label}
                    </p>
                    <p className="mt-2.5 text-[28px] font-extrabold leading-none tracking-tight">
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>

              {state.isPending ? (
                <Spinner label="ফলাফল লোড হচ্ছে…" />
              ) : results.length === 0 ? (
                <div className="mt-5">
                  <EmptyNote>
                    এখনো কোনো টেস্ট দেননি। টেস্ট পেজ থেকে লেভেল টেস্ট বা কুইজ
                    দিয়ে শুরু করুন — ফল এখানে জমা হবে।
                    <div className="mt-4">
                      <button type="button" onClick={() => go("tests")} className="btn-primary px-5 py-2.5">
                        টেস্ট দিতে যান <IconArrowRight size={16} />
                      </button>
                    </div>
                  </EmptyNote>
                </div>
              ) : (
                <ul className="mt-5 grid gap-2.5">
                  {results.map((r) => {
                    const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                    return (
                      <li
                        key={r.id}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)] sm:px-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold">{kindLabel(r.kind)}</span>
                          <span className="text-sm text-[var(--dim)]">
                            {bnNum(r.correct)}/{bnNum(r.total)} সঠিক · {bnNum(pct)}% · {bnDate(r.createdAt)}
                          </span>
                        </div>
                        <div
                          className="progress-track mt-2 h-2"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${kindLabel(r.kind)} — স্কোর ${bnNum(pct)} শতাংশ`}
                        >
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {page === "bookmarks" && (
            <>
              <PageHead page={activePage} />
              <section className="card mt-5 p-5 sm:p-6" aria-label="বুকমার্কের সারাংশ">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="icon-chip h-14 w-14 shrink-0 rounded-full">
                    <IconBookmark size={26} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[24px] font-extrabold leading-tight tracking-tight">
                      {bnNum(bookmarkCount)}টি শব্দ জমিয়ে রেখেছেন
                    </p>
                    <p className="bn-read-sm text-[var(--dim)]">
                      কঠিন শব্দগুলো এখানে থাকে — মাঝে মাঝে ঝালিয়ে নিলেই মনে
                      থেকে যাবে।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("vocab")}
                    className="btn-primary ml-auto px-5 py-2.5"
                  >
                    আরও শব্দ শিখুন <IconArrowRight size={16} />
                  </button>
                </div>
              </section>
              {bookmarks.isPending ? (
                <Spinner label="বুকমার্ক লোড হচ্ছে…" />
              ) : (bookmarks.data?.words.length ?? 0) === 0 ? (
                <div className="mt-3">
                  <EmptyNote>
                    কোনো শব্দ বুকমার্ক করেননি। শব্দভান্ডার পেজে কঠিন শব্দগুলোতে
                    "বুকমার্ক" বোতাম চাপ দিন — পরে এখানে এসে আবার পড়তে পারবেন।
                    <div className="mt-4">
                      <button type="button" onClick={() => go("vocab")} className="btn-primary px-5 py-2.5">
                        শব্দভান্ডারে যান <IconArrowRight size={16} />
                      </button>
                    </div>
                  </EmptyNote>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {bookmarks.data?.words.map((w) => (
                    <WordCard key={w.id} word={w} bookmarked learned={learnedIds.includes(w.id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
