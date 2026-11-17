import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "../api";
import {
  bnDate,
  bnNum,
  BOOK_APPLICATION_TITLE,
  isStrongPassword,
  LEVELS,
  loadAdminAuthed,
  loadAdminEmail,
  loadAdminMustChange,
  passwordChecks,
  PREMIUM_APPLICATION_TITLE,
  saveAdminAuthed,
  saveAdminMustChange,
  studentCode,
  useApp,
  type Word,
  fileToBase64,
} from "../lib";
import { courseCoverSrc, EmptyNote, Spinner } from "../components";
import { AdminLoginForm, PasswordStrengthMeter } from "./Auth";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCalendar,
  IconChart,
  IconCheck,
  IconClipboard,
  IconClock,
  IconEye,
  IconEyeSlash,
  IconFile,
  IconGrammar,
  IconHome,
  IconLock,
  IconLogout,
  IconMedal,
  IconPen,
  IconPhone,
  IconPlayCircle,
  IconPlus,
  IconSearch,
  IconSliders,
  IconTrash,
  IconUpload,
  IconUsers,
  IconVideo,
  IconWallet,
  IconX,
} from "../icons";

type Tab = "overview" | "courses" | "lessons" | "words" | "book" | "enrollments" | "students" | "settings";
type AdminCourse = ApiResponse<typeof api, "adminListCourses">["courses"][number];
type AdminLesson = ApiResponse<typeof api, "listGrammarLessons">["lessons"][number];

const inputCls = "input mt-1";
const labelCls = "text-sm font-medium";

type TabIcon = (p: { size?: number; className?: string }) => React.ReactNode;

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [authed, setAuthed] = useState<boolean>(() => loadAdminAuthed());
  const [mustChange, setMustChange] = useState<boolean>(() =>
    loadAdminMustChange(),
  );
  // Mobile tab bar: keep the active tab chip visible in the scrolling
  // row whenever the tab changes.
  const mobileNavRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mobileNavRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [tab]);

  const tabs: [Tab, string, TabIcon][] = [
    ["overview", "ওভারভিউ", IconChart],
    ["courses", "কোর্স", IconVideo],
    ["lessons", "গ্রামার লেসন", IconGrammar],
    ["words", "শব্দ", IconBook],
    ["book", "বই (PDF রিডার)", IconBook],
    ["enrollments", "ভর্তির আবেদন", IconClipboard],
    ["students", "ছাত্রছাত্রী", IconUsers],
    ["settings", "সেটিংস", IconSliders],
  ];

  if (!authed) {
    // Dedicated full-screen admin login (split-screen, no site chrome).
    return (
      <AdminLoginForm
        onDone={() => {
          setAuthed(true);
          setMustChange(loadAdminMustChange());
        }}
      />
    );
  }

  if (mustChange) {
    return (
      <div className="auth-side fade-in flex min-h-dvh items-center justify-center px-4 py-10 pt-safe">
        <AdminForceChangePassword
          onDone={() => {
            saveAdminMustChange(false);
            setMustChange(false);
          }}
        />
      </div>
    );
  }

  const logout = () => {
    saveAdminAuthed(false);
    saveAdminMustChange(false);
    setAuthed(false);
  };

  return (
    <div className="fade-in flex min-h-screen flex-col lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
      {/* Mobile menu bar (phone/tablet only): STICKY at the top so all
          eight admin tabs stay one tap away while scrolling long tab
          content — brand + home/logout on the first row, tab chips in a
          scrollable row below with the active chip auto-scrolled into
          view. Desktop uses the sidebar nav instead. */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] pt-safe backdrop-blur-xl lg:hidden" style={{ background: "var(--nav-bg)" }}>
        <div className="flex items-center gap-2.5 px-4 pt-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-white shadow-[var(--shadow-pop)]"
            style={{ background: "var(--accent-grad)" }}
          >
            <IconBook size={18} />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[16px] font-extrabold tracking-tight">
              Vocab<span className="text-[var(--accent)]">Master</span>
            </span>
            <span className="block text-[11.5px] font-semibold text-[var(--dim)]">
              অ্যাডমিন প্যানেল
            </span>
          </span>
          <AdminHomeIconButton />
          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)]"
            aria-label="অ্যাডমিন লগআউট"
          >
            <IconLogout size={17} />
          </button>
        </div>
        <nav
          ref={mobileNavRef}
          className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-4 pb-2.5"
          role="tablist"
          aria-label="অ্যাডমিন বিভাগ"
        >
          {tabs.map(([t, label, Icon]) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? "true" : undefined}
                onClick={() => setTab(t)}
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

      {/* Full-side app shell: on desktop the sidebar is a full-height
          fixed side panel (edge to edge, no card). The panel has no
          site chrome. */}
      <aside
        className="hidden border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:border-r lg:pt-safe"
        aria-label="অ্যাডমিন মেনু"
      >
        <div className="p-4 lg:flex lg:flex-1 lg:flex-col lg:p-5">
          <div className="flex items-center gap-3 px-1">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-white shadow-[var(--shadow-pop)]"
              style={{ background: "var(--accent-grad)" }}
            >
              <IconBook size={22} />
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight">
                Vocab<span className="text-[var(--accent)]">Master</span>
              </span>
              <span className="mt-0.5 block text-[12px] font-semibold tracking-wide text-[var(--dim)]">
                অ্যাডমিন প্যানেল
              </span>
            </span>
          </div>

          <nav
            className="mt-4 grid gap-1"
            role="tablist"
            aria-label="অ্যাডমিন বিভাগ"
          >
            {tabs.map(([t, label, Icon]) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-left text-[14.5px] font-semibold transition-colors ${
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

          <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 lg:mt-auto">
            <AdminHomeButton />
            <button
              type="button"
              onClick={logout}
              className="btn-outline w-full px-4 py-2 text-sm"
            >
              <IconLogout size={16} /> অ্যাডমিন লগআউট
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="sr-only">অ্যাডমিন প্যানেল</h1>
        {tab === "overview" && <OverviewAdmin goTab={setTab} />}
        {tab === "courses" && <CoursesAdmin />}
        {tab === "lessons" && <LessonsAdmin />}
        {tab === "words" && <WordsAdmin />}
        {tab === "book" && <BookAdmin />}
        {tab === "enrollments" && <EnrollmentsAdmin />}
        {tab === "students" && <StudentsAdmin />}
        {tab === "settings" && <SettingsAdmin />}
      </div>
    </div>
  );
}

function AdminHomeButton() {
  const { go } = useApp();
  return (
    <button
      type="button"
      onClick={() => go("home")}
      className="btn-outline w-full px-4 py-2 text-sm"
    >
      <IconHome size={16} /> সাইটে ফিরুন
    </button>
  );
}

function AdminHomeIconButton() {
  const { go } = useApp();
  return (
    <button
      type="button"
      onClick={() => go("home")}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)]"
      aria-label="সাইটে ফিরুন"
    >
      <IconHome size={17} />
    </button>
  );
}

/** Password input with a show/hide eye toggle (admin forms). */
function PwInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field-shell mt-1.5">
      <IconLock size={16} className="shrink-0 text-[var(--dim)]" />
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
        aria-pressed={show}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--dim)] transition-colors hover:text-[var(--text)]"
      >
        {show ? <IconEyeSlash size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}

// ---------------- Forced first-login password change ----------------

function AdminForceChangePassword({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.adminChangePassword({
        currentPassword: current,
        newEmail: loadAdminEmail(),
        newPassword: next,
      }),
    onSuccess: (r) => {
      if (r.ok) onDone();
      else setError(r.error ?? "পাসওয়ার্ড বদলানো যায়নি।");
    },
    onError: () => setError("পাসওয়ার্ড বদলানো যায়নি — আবার চেষ্টা করুন।"),
  });

  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <span className="icon-chip mx-auto h-14 w-14 rounded-[18px]">
          <IconLock size={26} />
        </span>
        <h1 className="mt-4 text-[32px] font-extrabold tracking-tight">
          নতুন পাসওয়ার্ড বসান
        </h1>
        <p className="bn-read mt-2 text-[var(--dim)]">
          নিরাপত্তার জন্য প্রথম লগইনেই অস্থায়ী পাসওয়ার্ডটা বদলে নিজের
          পাসওয়ার্ড বসাতে হবে — তারপরেই প্যানেল খুলবে।
        </p>
      </div>
      <form
        className="card mt-7 grid gap-4 p-6 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!current) return setError("বর্তমান (অস্থায়ী) পাসওয়ার্ড লিখুন।");
          const checks = passwordChecks(next);
          if (!checks.length)
            return setError("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
          if (!checks.letter)
            return setError("নতুন পাসওয়ার্ডে অন্তত একটি ইংরেজি অক্ষর থাকতে হবে।");
          if (!checks.digit)
            return setError("নতুন পাসওয়ার্ডে অন্তত একটি সংখ্যা থাকতে হবে।");
          if (next !== confirm)
            return setError("দুইবার দেওয়া নতুন পাসওয়ার্ড মেলেনি।");
          if (next === current)
            return setError("নতুন পাসওয়ার্ড অস্থায়ীটার থেকে আলাদা হতে হবে।");
          mut.mutate();
        }}
      >
        <div>
          <label htmlFor="force-current" className={labelCls}>বর্তমান (অস্থায়ী) পাসওয়ার্ড</label>
          <PwInput id="force-current" label="বর্তমান (অস্থায়ী) পাসওয়ার্ড" value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
        <div>
          <label htmlFor="force-next" className={labelCls}>নতুন শক্তিশালী পাসওয়ার্ড</label>
          <PwInput id="force-next" label="নতুন শক্তিশালী পাসওয়ার্ড" value={next} onChange={setNext} autoComplete="new-password" />
        </div>
        <PasswordStrengthMeter password={next} />
        <div>
          <label htmlFor="force-confirm" className={labelCls}>নতুন পাসওয়ার্ড আবার লিখুন</label>
          <PwInput id="force-confirm" label="নতুন পাসওয়ার্ড আবার লিখুন" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-[var(--danger)]">{error}</p>
        )}
        <button type="submit" disabled={mut.isPending} className="btn-primary w-full py-3">
          {mut.isPending ? "সেভ হচ্ছে…" : "পাসওয়ার্ড বদলে প্যানেলে যান"}
        </button>
      </form>
    </div>
  );
}

// ---------------- Overview ----------------

function OverviewAdmin({ goTab }: { goTab: (t: Tab) => void }) {
  const { go } = useApp();
  const queryClient = useQueryClient();
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.getStats({}) });
  const enr = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: () => api.adminListEnrollments({}),
  });
  const stu = useQuery({
    queryKey: ["admin-students"],
    queryFn: () => api.adminListStudents({}),
  });
  const setMut = useMutation({
    mutationFn: (args: { id: number; status: "pending" | "approved" | "rejected" }) =>
      api.adminSetEnrollmentStatus(args),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] }),
  });

  const rows = enr.data?.enrollments ?? [];
  const pending = rows.filter((e) => e.status === "pending");
  const approved = rows.filter((e) => e.status === "approved");
  const students = stu.data?.students ?? [];
  const totalXp = students.reduce((a, s) => a + s.xp, 0);
  const totalLearned = students.reduce((a, s) => a + s.learnedCount, 0);

  const cards = [
    { Icon: IconBook, label: "মোট শব্দ", value: stats.data ? bnNum(stats.data.totalWords) : "—", tab: "words" as Tab },
    { Icon: IconGrammar, label: "গ্রামার লেসন", value: stats.data ? bnNum(stats.data.lessonCount) : "—", tab: "lessons" as Tab },
    { Icon: IconVideo, label: "প্রকাশিত কোর্স", value: stats.data ? bnNum(stats.data.courseCount) : "—", tab: "courses" as Tab },
    { Icon: IconUsers, label: "ছাত্রছাত্রী", value: stats.data ? bnNum(stats.data.studentCount) : "—", tab: "students" as Tab },
    { Icon: IconClipboard, label: "অপেক্ষমাণ আবেদন", value: bnNum(pending.length), tab: "enrollments" as Tab },
    { Icon: IconCheck, label: "অনুমোদিত ভর্তি", value: bnNum(approved.length), tab: "enrollments" as Tab },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => goTab(c.tab)}
            className="card card-hover p-5 text-left sm:p-6"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--dim)]">
              <span className="icon-chip h-8 w-8 rounded-[10px]">
                <c.Icon size={17} />
              </span>
              {c.label}
            </p>
            <p className="mt-3 text-[32px] font-extrabold leading-none tracking-tight">{c.value}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-label="অপেক্ষমাণ ভর্তির আবেদন">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight">অপেক্ষমাণ আবেদন</h2>
            <button
              type="button"
              onClick={() => goTab("enrollments")}
              className="inline-flex items-center gap-1 text-sm font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
            >
              সব দেখুন <IconArrowRight size={15} />
            </button>
          </div>
          {enr.isPending ? (
            <Spinner label="লোড হচ্ছে…" />
          ) : pending.length === 0 ? (
            <p className="bn-read-sm mt-3 text-[var(--dim)]">
              কোনো অপেক্ষমাণ আবেদন নেই — সব যাচাই হয়ে গেছে।
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {pending.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--surface-alt)] px-4 py-3"
                >
                  <span className="min-w-0">
                    <strong>{e.name}</strong>{" "}
                    <span className="text-sm text-[var(--dim)]">
                      · {e.phone} · {e.courseTitle} · TrxID: {e.txnId || "—"}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMut.mutate({ id: e.id, status: "approved" })}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-sm font-semibold text-[var(--accent-ink)]"
                    >
                      <IconCheck size={15} /> অনুমোদন
                    </button>
                    <button
                      type="button"
                      onClick={() => setMut.mutate({ id: e.id, status: "rejected" })}
                      className="rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-sm font-semibold text-[var(--danger)]"
                    >
                      বাতিল
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 sm:p-6" aria-label="সেরা ছাত্রছাত্রী">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight">সক্রিয় ছাত্রছাত্রী</h2>
            <button
              type="button"
              onClick={() => goTab("students")}
              className="inline-flex items-center gap-1 text-sm font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
            >
              সব দেখুন <IconArrowRight size={15} />
            </button>
          </div>
          <p className="bn-read-sm mt-2 text-[var(--dim)]">
            সব ছাত্র মিলিয়ে মোট {bnNum(totalXp)} XP অর্জিত, {bnNum(totalLearned)}টি
            শব্দ শেখা হয়েছে।
          </p>
          {stu.isPending ? (
            <Spinner label="লোড হচ্ছে…" />
          ) : students.length === 0 ? (
            <p className="bn-read-sm mt-3 text-[var(--dim)]">এখনো কেউ প্রোফাইল খোলেনি।</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {[...students]
                .sort((a, b) => b.xp - a.xp)
                .slice(0, 5)
                .map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-[var(--surface-alt)] px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[13px] font-extrabold text-[var(--accent-strong)]">
                        {bnNum(i + 1)}
                      </span>
                      <span className="min-w-0 truncate font-medium">{s.name}</span>
                    </span>
                    <span className="shrink-0 text-sm text-[var(--dim)]">
                      {bnNum(s.xp)} XP · {bnNum(s.streak)} দিন স্ট্রিক · {bnNum(s.learnedCount)} শব্দ
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <button type="button" onClick={() => go("courses")} className="btn-outline mt-4 px-5 py-2.5">
            সাইটে কোর্স পেজ দেখুন <IconArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
}

// ---------------- Courses ----------------

const emptyCourse = {
  title: "",
  subtitle: "",
  price: "",
  oldPrice: "",
  lessons: "",
  features: "",
  badge: "",
  accessMode: "paid" as "paid" | "free",
  imageBlobKey: "",
  imageSrc: "",
  published: 1,
  sortOrder: 0,
};

function CoursesAdmin() {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => api.adminListCourses({}),
  });
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState(emptyCourse);
  const [showForm, setShowForm] = useState(false);
  const [lessonsFor, setLessonsFor] = useState<AdminCourse | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    void queryClient.invalidateQueries({ queryKey: ["courses"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMut = useMutation({
    mutationFn: () =>
      api.adminSaveCourse({
        id: editing?.id ?? null,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        price: form.price === "" ? null : Number(form.price),
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        lessons: form.lessons === "" ? null : Number(form.lessons),
        features: form.features,
        badge: form.badge.trim(),
        accessMode: form.accessMode,
        imageBlobKey: form.imageBlobKey,
        published: form.published,
        sortOrder: form.sortOrder,
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditing(null);
      setForm(emptyCourse);
    },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteCourse({ id }),
    onSuccess: invalidate,
  });
  // One-tap free/premium flip from the list — the owner can open a
  // course to everyone (or close it back to paid) without opening the
  // full edit form.
  const accessMut = useMutation({
    mutationFn: (c: AdminCourse) =>
      api.adminSaveCourse({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        price: c.price,
        oldPrice: c.oldPrice,
        lessons: c.lessons,
        features: c.features,
        badge: c.badge,
        accessMode: c.accessMode === "free" ? "paid" : "free",
        imageBlobKey: c.imageBlobKey,
        published: c.published,
        sortOrder: c.sortOrder,
      }),
    onSuccess: invalidate,
  });

  // ---- Course cover image upload (same pattern as lesson videos) ----
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const delImageMut = useMutation({
    mutationFn: (blobKey: string) => api.adminDeleteCourseImage({ blobKey }),
  });

  const onPickCourseImage = async (file: File | undefined) => {
    if (!file) return;
    setImgError(null);
    if (!file.type.startsWith("image/")) {
      setImgError("শুধু ছবি ফাইল (JPG/PNG/WebP) বেছে নিন।");
      return;
    }
    if (file.size > 8_000_000) {
      setImgError("ছবির ফাইলটি খুব বড় — সর্বোচ্চ ৮ MB-এর মধ্যে রাখুন।");
      return;
    }
    setImgUploading(true);
    try {
      const { dataBase64, mimeType } = await fileToBase64(file);
      const r = await api.adminUploadCourseImage({
        filename: file.name,
        mimeType: mimeType || file.type,
        dataBase64,
      });
      if (!r.ok || !r.blobKey) {
        setImgError(r.error ?? "আপলোড করা যায়নি — আবার চেষ্টা করুন।");
        return;
      }
      if (form.imageBlobKey && form.imageBlobKey !== r.blobKey) {
        delImageMut.mutate(form.imageBlobKey);
      }
      setForm((f) => ({ ...f, imageBlobKey: r.blobKey ?? "", imageSrc: r.url ?? "" }));
    } catch {
      setImgError("আপলোড করা যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
    } finally {
      setImgUploading(false);
      if (imgFileRef.current) imgFileRef.current.value = "";
    }
  };

  const removeCourseImage = () => {
    if (form.imageBlobKey) delImageMut.mutate(form.imageBlobKey);
    setForm((f) => ({ ...f, imageBlobKey: "", imageSrc: "" }));
    setImgError(null);
  };

  const startEdit = (c: AdminCourse) => {
    setEditing(c);
    setForm({
      title: c.title,
      subtitle: c.subtitle,
      price: c.price != null ? String(c.price) : "",
      oldPrice: c.oldPrice != null ? String(c.oldPrice) : "",
      lessons: c.lessons != null ? String(c.lessons) : "",
      features: c.features,
      badge: c.badge,
      accessMode: c.accessMode === "free" ? "free" : "paid",
      imageBlobKey: c.imageBlobKey,
      imageSrc: c.imageSrc,
      published: c.published,
      sortOrder: c.sortOrder,
    });
    setShowForm(true);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setEditing(null);
          setForm(emptyCourse);
          setShowForm((v) => !v);
        }}
        className="btn-primary"
      >
        + নতুন কোর্স যোগ করুন
      </button>
      {showForm && (
        <form
          className="card mt-4 grid gap-3 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim()) saveMut.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <label htmlFor="ac-title" className={labelCls}>কোর্সের নাম *</label>
            <input id="ac-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ac-sub" className={labelCls}>ছোট বর্ণনা</label>
            <input id="ac-sub" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <span className={labelCls} id="ac-image-label">কোর্সের কভার ছবি</span>
            <div className="mt-1.5 flex flex-wrap items-start gap-3">
              <img
                src={form.imageSrc || courseCoverSrc({ id: editing?.id ?? 0, title: form.title, imageSrc: "" })}
                alt="কোর্সের কভার ছবির প্রিভিউ"
                className="h-24 w-40 shrink-0 rounded-xl object-cover ring-1 ring-[var(--border)]"
              />
              <div className="min-w-0">
                <input
                  ref={imgFileRef}
                  id="ac-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-labelledby="ac-image-label"
                  onChange={(e) => void onPickCourseImage(e.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={imgUploading}
                    onClick={() => imgFileRef.current?.click()}
                    className="btn-soft"
                  >
                    <IconUpload size={16} />
                    {imgUploading ? "আপলোড হচ্ছে…" : form.imageBlobKey ? "ছবি বদলান" : "ছবি আপলোড করুন"}
                  </button>
                  {form.imageBlobKey && (
                    <button
                      type="button"
                      onClick={removeCourseImage}
                      className="btn-soft text-[var(--danger)]"
                    >
                      <IconTrash size={16} /> ছবি সরান
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] text-[var(--dim)]">
                  {form.imageBlobKey
                    ? "আপনার আপলোড করা ছবি কোর্স কার্ডে দেখাবে।"
                    : "ছবি না দিলে কোর্সের নাম অনুযায়ী ডিফল্ট কভার ছবি দেখাবে।"} JPG/PNG/WebP, সর্বোচ্চ ৮ MB।
                </p>
                {imgError && (
                  <p role="alert" className="mt-1 text-sm font-medium text-[var(--danger)]">{imgError}</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="ac-price" className={labelCls}>মূল্য (টাকা)</label>
            <input id="ac-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ac-oldprice" className={labelCls}>আগের মূল্য (ছাড় দেখাতে)</label>
            <input id="ac-oldprice" type="number" min={0} value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ac-lessons" className={labelCls}>লেসন সংখ্যা</label>
            <input id="ac-lessons" type="number" min={0} value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ac-badge" className={labelCls}>ব্যাজ (যেমন: জনপ্রিয়)</label>
            <input id="ac-badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ac-features" className={labelCls}>ফিচারসমূহ (প্রতি লাইনে একটা)</label>
            <textarea id="ac-features" rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className={inputCls} />
          </div>
          <fieldset className="rounded-2xl border border-[var(--border)] p-3.5 sm:col-span-2">
            <legend className="px-1.5 text-sm font-bold">কোর্সের অ্যাক্সেস — ফ্রি না পেইড?</legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="কোর্সের অ্যাক্সেস">
              <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors ${form.accessMode === "paid" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}>
                <input
                  type="radio"
                  name="ac-access"
                  checked={form.accessMode === "paid"}
                  onChange={() => setForm({ ...form, accessMode: "paid" })}
                  className="mt-0.5 h-4.5 w-4.5 shrink-0"
                />
                <span>
                  <span className="block font-bold">পেইড (ভর্তি লাগবে)</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--dim)]">
                    পেমেন্ট + আবেদন অনুমোদনের পরেই লেসন খুলবে (ফ্রি প্রিভিউ লেসন ছাড়া)।
                  </span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors ${form.accessMode === "free" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}>
                <input
                  type="radio"
                  name="ac-access"
                  checked={form.accessMode === "free"}
                  onChange={() => setForm({ ...form, accessMode: "free" })}
                  className="mt-0.5 h-4.5 w-4.5 shrink-0"
                />
                <span>
                  <span className="block font-bold">সবার জন্য ফ্রি</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--dim)]">
                    ভর্তি ছাড়াই সব লেসন সবার জন্য খোলা থাকবে। যেকোনো সময় বদলাতে পারবেন।
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.published === 1}
              onChange={(e) => setForm({ ...form, published: e.target.checked ? 1 : 0 })}
              className="h-5 w-5"
            />
            সাইটে প্রকাশিত
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saveMut.isPending} className="btn-primary">
              {saveMut.isPending ? "সেভ হচ্ছে…" : editing ? "আপডেট করুন" : "কোর্স যোগ করুন"}
            </button>
          </div>
        </form>
      )}
      {q.isPending ? (
        <Spinner label="কোর্স লোড হচ্ছে…" />
      ) : (q.data?.courses.length ?? 0) === 0 ? (
        <div className="mt-4"><EmptyNote>কোনো কোর্স নেই — উপরের বোতামে প্রথম কোর্স যোগ করুন।</EmptyNote></div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {q.data?.courses.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
              <span className="flex min-w-0 items-center gap-3">
                <img
                  src={courseCoverSrc(c)}
                  alt=""
                  className="h-12 w-[76px] shrink-0 rounded-lg object-cover ring-1 ring-[var(--border)]"
                />
                <span className="min-w-0">
                <strong>{c.title}</strong>{" "}
                <span className="text-sm text-[var(--dim)]">
                  {c.price != null ? `· ৳${bnNum(c.price)}` : ""} {c.published ? "· প্রকাশিত" : "· অপ্রকাশিত"}
                </span>{" "}
                {c.accessMode === "free" ? (
                  <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--accent-strong)]">
                    সবার জন্য ফ্রি
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[var(--gold-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--gold)]">
                    পেইড
                  </span>
                )}
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={accessMut.isPending}
                  onClick={() => accessMut.mutate(c)}
                  className="rounded-full bg-[var(--surface-alt)] px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label={`${c.title} — ${c.accessMode === "free" ? "পেইড করুন" : "সবার জন্য ফ্রি করুন"}`}
                >
                  {c.accessMode === "free" ? "পেইড করুন" : "ফ্রি করুন"}
                </button>
                <button type="button" onClick={() => setLessonsFor(lessonsFor?.id === c.id ? null : c)} className="rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--surface-hover)]">লেসন ম্যানেজ</button>
                <button type="button" onClick={() => startEdit(c)} className="rounded-full bg-[var(--surface-alt)] px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]">এডিট</button>
                <button type="button" onClick={() => delMut.mutate(c.id)} className="rounded-full bg-[var(--surface-alt)] px-4 py-1.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]">মুছুন</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {lessonsFor && (
        <CourseLessonsAdmin
          key={lessonsFor.id}
          courseId={lessonsFor.id}
          courseTitle={lessonsFor.title}
        />
      )}
    </div>
  );
}

// ---------------- Course lessons ----------------

type AdminCourseLesson = ApiResponse<
  typeof api,
  "adminListCourseLessons"
>["lessons"][number];

const emptyCourseLesson = {
  title: "",
  kind: "text" as "text" | "video",
  videoUrl: "",
  videoBlobKey: "",
  videoName: "",
  videoSrc: "",
  body: "",
  freePreview: 0,
  sortOrder: 0,
};

const MAX_VIDEO_MB = 45;

function CourseLessonsAdmin({
  courseId,
  courseTitle,
}: {
  courseId: number;
  courseTitle: string;
}) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-course-lessons", courseId],
    queryFn: () => api.adminListCourseLessons({ courseId }),
  });
  const [editing, setEditing] = useState<AdminCourseLesson | null>(null);
  const [form, setForm] = useState(emptyCourseLesson);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin-course-lessons", courseId],
    });
    void queryClient.invalidateQueries({ queryKey: ["course-detail"] });
  };
  const saveMut = useMutation({
    mutationFn: () =>
      api.adminSaveCourseLesson({
        id: editing?.id ?? null,
        courseId,
        title: form.title.trim(),
        kind: form.kind,
        videoUrl: form.videoUrl.trim(),
        videoBlobKey: form.videoBlobKey,
        videoName: form.videoName,
        body: form.body,
        freePreview: form.freePreview,
        sortOrder: form.sortOrder,
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditing(null);
      setForm(emptyCourseLesson);
      setUploadError(null);
    },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteCourseLesson({ id }),
    onSuccess: invalidate,
  });
  const delVideoMut = useMutation({
    mutationFn: (blobKey: string) => api.adminDeleteCourseVideo({ blobKey }),
  });

  const onPickVideo = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("video/")) {
      setUploadError("শুধু ভিডিও ফাইল (MP4/WebM) বেছে নিন।");
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1_000_000) {
      setUploadError(
        `ভিডিও ফাইলটি খুব বড় — সর্বোচ্চ ${MAX_VIDEO_MB} MB-এর মধ্যে রাখুন।`,
      );
      return;
    }
    setUploading(true);
    try {
      const { dataBase64, mimeType } = await fileToBase64(file);
      const r = await api.adminUploadCourseVideo({
        filename: file.name,
        mimeType: mimeType || file.type,
        dataBase64,
      });
      if (!r.ok || !r.blobKey) {
        setUploadError(r.error ?? "আপলোড করা যায়নি — আবার চেষ্টা করুন।");
        return;
      }
      // Replacing an earlier upload: clean up the orphaned file.
      if (form.videoBlobKey && form.videoBlobKey !== r.blobKey) {
        delVideoMut.mutate(form.videoBlobKey);
      }
      setForm((f) => ({
        ...f,
        kind: "video",
        videoBlobKey: r.blobKey ?? "",
        videoName: file.name,
        videoSrc: r.url ?? "",
      }));
    } catch {
      setUploadError("আপলোড করা যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeUploadedVideo = () => {
    if (form.videoBlobKey) delVideoMut.mutate(form.videoBlobKey);
    setForm((f) => ({ ...f, videoBlobKey: "", videoName: "", videoSrc: "" }));
  };

  const lessons = q.data?.lessons ?? [];
  const hasVideo = form.videoBlobKey !== "" || form.videoUrl.trim() !== "";

  return (
    <section className="card mt-5 p-5 sm:p-6" aria-label={`${courseTitle} — লেসনসমূহ`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="icon-chip h-10 w-10 rounded-xl">
            <IconVideo size={19} />
          </span>
          "{courseTitle}" — লেসনসমূহ ({bnNum(lessons.length)})
        </h3>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm({ ...emptyCourseLesson, sortOrder: lessons.length });
            setUploadError(null);
            setShowForm((v) => !v);
          }}
          className="btn-primary px-5 py-2.5"
        >
          + লেসন যোগ করুন
        </button>
      </div>
      <p className="bn-read-sm mt-2 text-[var(--dim)]">
        ভর্তি (অনুমোদিত) শিক্ষার্থীরাই লেসন খুলতে পারবে — "ফ্রি প্রিভিউ"
        লেসন সবাই দেখতে পারে। ভিডিও দুইভাবে দেওয়া যায়: নিজের ডিভাইস থেকে
        সরাসরি আপলোড (সর্বোচ্চ {bnNum(MAX_VIDEO_MB)} MB), অথবা YouTube লিংক —
        দুটোই কোর্স প্লেয়ারেই চলবে। প্রতিটি লেসনে PDF/নোট/ওয়ার্কশিট
        ফাইলও যোগ করা যায় (লেসন এডিটে "লেসনের ফাইল" অংশে) — ছাত্ররা
        প্লেয়ারেই PDF খুলে পড়তে পারবে।
      </p>
      {showForm && (
        <form
          className="mt-4 grid gap-3 rounded-2xl bg-[var(--surface-alt)] p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim()) saveMut.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <label htmlFor="acl-title" className={labelCls}>লেসনের শিরোনাম *</label>
            <input id="acl-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="acl-kind" className={labelCls}>ধরন</label>
            <select id="acl-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "text" | "video" })} className={inputCls}>
              <option value="text">পড়ার লেসন</option>
              <option value="video">ভিডিও লেসন</option>
            </select>
          </div>
          <div>
            <label htmlFor="acl-sort" className={labelCls}>ক্রম (ছোট আগে)</label>
            <input id="acl-sort" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputCls} />
          </div>

          {/* ---- Video: upload or link ---- */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-bold">
              <IconPlayCircle size={17} className="text-[var(--accent)]" />
              লেসনের ভিডিও
            </p>
            {form.videoBlobKey ? (
              <div className="mt-3">
                {form.videoSrc && (
                  <video
                    src={form.videoSrc}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-xl bg-black"
                    aria-label="আপলোড করা ভিডিওর প্রিভিউ"
                  />
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">
                    আপলোড করা ভিডিও: {form.videoName || "video"}
                  </p>
                  <button
                    type="button"
                    onClick={removeUploadedVideo}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--danger-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:brightness-95"
                  >
                    <IconTrash size={15} /> ভিডিও সরান
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <input
                  ref={fileRef}
                  id="acl-upload"
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(e) => void onPickVideo(e.target.files?.[0])}
                />
                <label
                  htmlFor="acl-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] px-4 py-7 text-center transition-colors hover:border-[var(--accent)]"
                >
                  <span className="icon-chip h-11 w-11 rounded-2xl">
                    <IconUpload size={20} />
                  </span>
                  <span className="text-sm font-bold">
                    {uploading ? "আপলোড হচ্ছে… একটু অপেক্ষা করুন" : "ভিডিও আপলোড করতে এখানে চাপ দিন"}
                  </span>
                  <span className="text-[13px] text-[var(--dim)]">
                    MP4 / WebM — সর্বোচ্চ {bnNum(MAX_VIDEO_MB)} MB
                  </span>
                </label>
              </div>
            )}
            {uploadError && (
              <p role="alert" className="mt-2.5 text-sm font-medium text-[var(--danger)]">
                {uploadError}
              </p>
            )}
            <div className="mt-4">
              <label htmlFor="acl-video" className={labelCls}>
                অথবা ভিডিও লিংক (YouTube)
                {form.videoBlobKey ? " — আপলোড করা ভিডিও থাকলে সেটাই চলবে" : ""}
              </label>
              <input id="acl-video" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className={inputCls} />
            </div>
            {hasVideo && form.kind === "text" && (
              <p className="mt-2 text-[13px] font-medium text-[var(--peach-strong)]">
                ভিডিও দেওয়া হয়েছে — ধরন "ভিডিও লেসন" রাখলে শিক্ষার্থীরা সহজে বুঝবে।
              </p>
            )}
          </div>

          {/* ---- Attachments: PDFs & study files for this lesson ---- */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-bold">
              <IconFile size={17} className="text-[var(--accent)]" />
              লেসনের ফাইল — PDF, নোট, ওয়ার্কশিট
            </p>
            {editing ? (
              <LessonAttachmentsAdmin
                courseId={courseId}
                lesson={lessons.find((l) => l.id === editing.id) ?? editing}
              />
            ) : (
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--dim)]">
                ফাইল যোগ করতে আগে লেসনটি সেভ করুন — তারপর এডিট খুললেই এখানে
                PDF/ফাইল আপলোডের অপশন পাবেন।
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="acl-body" className={labelCls}>লেসনের লেখা ("## " উপশিরোনাম, "- " বুলেট)</label>
            <textarea id="acl-body" rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.freePreview === 1}
              onChange={(e) => setForm({ ...form, freePreview: e.target.checked ? 1 : 0 })}
              className="h-5 w-5"
            />
            ফ্রি প্রিভিউ (ভর্তি ছাড়াই সবাই দেখতে পারবে)
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saveMut.isPending || uploading} className="btn-primary">
              {saveMut.isPending ? "সেভ হচ্ছে…" : editing ? "আপডেট করুন" : "লেসন যোগ করুন"}
            </button>
          </div>
        </form>
      )}
      {q.isPending ? (
        <Spinner label="লেসন লোড হচ্ছে…" />
      ) : lessons.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>এই কোর্সে এখনো লেসন নেই — উপরের বোতামে প্রথম লেসন যোগ করুন।</EmptyNote>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {lessons.map((l, i) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--surface-alt)] px-4 py-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="icon-chip h-9 w-9 shrink-0 rounded-xl">
                  {l.kind === "video" || l.videoBlobKey || l.videoUrl ? (
                    <IconPlayCircle size={17} />
                  ) : (
                    <IconBook size={16} />
                  )}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate">{bnNum(i + 1)}. {l.title}</strong>
                  <span className="block text-[13px] text-[var(--dim)]">
                    {l.videoBlobKey
                      ? `আপলোড করা ভিডিও${l.videoName ? `: ${l.videoName}` : ""}`
                      : l.kind === "video"
                        ? "ভিডিও লেসন (লিংক)"
                        : "পড়ার লেসন"}
                    {l.freePreview ? " · ফ্রি প্রিভিউ" : ""}
                    {l.attachments.length > 0
                      ? ` · ${bnNum(l.attachments.length)}টি ফাইল`
                      : ""}
                  </span>
                </span>
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(l);
                    setForm({
                      title: l.title,
                      kind: l.kind === "video" ? "video" : "text",
                      videoUrl: l.videoUrl,
                      videoBlobKey: l.videoBlobKey,
                      videoName: l.videoName,
                      videoSrc: l.videoSrc,
                      body: l.body,
                      freePreview: l.freePreview,
                      sortOrder: l.sortOrder,
                    });
                    setUploadError(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <IconPen size={14} /> এডিট
                </button>
                <button type="button" onClick={() => delMut.mutate(l.id)} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-4 py-1.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]">
                  <IconTrash size={14} /> মুছুন
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------- Lesson attachments (PDFs & study files) ----------------

const MAX_FILE_MB = 20;

function attachmentSizeLabel(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1000) return `${bnNum(bytes)} B`;
  if (bytes < 1_000_000) return `${bnNum(Math.round(bytes / 1000))} KB`;
  return `${bnNum((bytes / 1_000_000).toFixed(1))} MB`;
}

function LessonAttachmentsAdmin({
  courseId,
  lesson,
}: {
  courseId: number;
  lesson: AdminCourseLesson;
}) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin-course-lessons", courseId],
    });
    void queryClient.invalidateQueries({ queryKey: ["course-detail"] });
    void queryClient.invalidateQueries({ queryKey: ["course-lesson"] });
  };

  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteLessonAttachment({ id }),
    onSuccess: invalidate,
  });

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE_MB * 1_000_000) {
      setError(
        `ফাইলটি খুব বড় — সর্বোচ্চ ${bnNum(MAX_FILE_MB)} MB-এর মধ্যে রাখুন।`,
      );
      return;
    }
    setUploading(true);
    try {
      const { dataBase64, mimeType } = await fileToBase64(file);
      const up = await api.adminUploadLessonFile({
        filename: file.name,
        mimeType: mimeType || file.type || "application/octet-stream",
        dataBase64,
      });
      if (!up.ok || !up.blobKey) {
        setError(up.error ?? "আপলোড করা যায়নি — আবার চেষ্টা করুন।");
        return;
      }
      await api.adminAddLessonAttachment({
        lessonId: lesson.id,
        name: file.name,
        blobKey: up.blobKey,
        mimeType: mimeType || file.type,
        sizeBytes: up.sizeBytes,
      });
      invalidate();
    } catch {
      setError("আপলোড করা যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-3">
      {lesson.attachments.length > 0 && (
        <ul className="grid gap-2">
          {lesson.attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-alt)] px-3.5 py-2.5"
            >
              <span className="icon-chip h-9 w-9 shrink-0 rounded-[10px]">
                <IconFile size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[14px] font-bold hover:text-[var(--accent-strong)]"
                >
                  {a.name}
                </a>
                <span className="block text-[12.5px] text-[var(--dim)]">
                  {a.mimeType === "application/pdf"
                    ? "PDF — ছাত্ররা প্লেয়ারেই খুলে পড়বে"
                    : "ফাইল"}
                  {a.sizeBytes > 0 ? ` · ${attachmentSizeLabel(a.sizeBytes)}` : ""}
                </span>
              </span>
              <button
                type="button"
                disabled={delMut.isPending}
                onClick={() => delMut.mutate(a.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                aria-label={`${a.name} — ফাইলটি সরান`}
              >
                <IconTrash size={13} /> সরান
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={fileRef}
        id={`att-upload-${lesson.id}`}
        type="file"
        accept=".pdf,image/*,audio/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
        className="sr-only"
        onChange={(e) => void onPickFile(e.target.files?.[0])}
      />
      <label
        htmlFor={`att-upload-${lesson.id}`}
        className="mt-2.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] px-4 py-5 text-center transition-colors hover:border-[var(--accent)]"
      >
        <span className="icon-chip h-10 w-10 rounded-xl">
          <IconUpload size={18} />
        </span>
        <span className="text-sm font-bold">
          {uploading ? "আপলোড হচ্ছে… একটু অপেক্ষা করুন" : "PDF / ফাইল আপলোড করতে এখানে চাপ দিন"}
        </span>
        <span className="text-[12.5px] text-[var(--dim)]">
          PDF, ছবি, অডিও, Word/PowerPoint/Excel, ZIP — সর্বোচ্চ {bnNum(MAX_FILE_MB)} MB
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--dim)]">
        ফাইলগুলো শুধু এই লেসনের ছাত্ররাই পাবে — লক করা লেসনের ফাইল কারো
        কাছে যাবে না।
      </p>
    </div>
  );
}

// ---------------- Grammar lessons ----------------

function LessonsAdmin() {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["grammar-lessons"],
    queryFn: () => api.listGrammarLessons({}),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titleBn: "", titleEn: "", category: "", level: "A1", summary: "", body: "", sortOrder: 0,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["grammar-lessons"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  };
  const saveMut = useMutation({
    mutationFn: () => api.adminSaveLesson({ id: editingId, ...form }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditingId(null);
    },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteLesson({ id }),
    onSuccess: invalidate,
  });

  const startEdit = async (l: AdminLesson) => {
    const full = await api.getGrammarLesson({ id: l.id });
    setEditingId(l.id);
    setForm({
      titleBn: l.titleBn,
      titleEn: l.titleEn,
      category: l.category,
      level: l.level,
      summary: l.summary,
      body: full.lesson?.body ?? "",
      sortOrder: l.sortOrder,
    });
    setShowForm(true);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setEditingId(null);
          setForm({ titleBn: "", titleEn: "", category: "", level: "A1", summary: "", body: "", sortOrder: (q.data?.lessons.length ?? 0) });
          setShowForm((v) => !v);
        }}
        className="btn-primary"
      >
        + নতুন লেসন যোগ করুন
      </button>
      {showForm && (
        <form
          className="card mt-4 grid gap-3 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.titleBn.trim()) saveMut.mutate();
          }}
        >
          <div>
            <label htmlFor="al-titlebn" className={labelCls}>শিরোনাম (বাংলা) *</label>
            <input id="al-titlebn" value={form.titleBn} onChange={(e) => setForm({ ...form, titleBn: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="al-titleen" className={labelCls}>শিরোনাম (English)</label>
            <input id="al-titleen" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="al-cat" className={labelCls}>বিভাগ</label>
            <input id="al-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="al-level" className={labelCls}>লেভেল</label>
            <select id="al-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls}>
              {LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="al-summary" className={labelCls}>সারসংক্ষেপ</label>
            <input id="al-summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="al-body" className={labelCls}>লেসনের মূল লেখা ("## " দিয়ে উপশিরোনাম, "- " দিয়ে বুলেট)</label>
            <textarea id="al-body" rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputCls} />
          </div>
          <div>
            <button type="submit" disabled={saveMut.isPending} className="btn-primary">
              {saveMut.isPending ? "সেভ হচ্ছে…" : editingId ? "আপডেট করুন" : "লেসন যোগ করুন"}
            </button>
          </div>
        </form>
      )}
      {q.isPending ? (
        <Spinner label="লেসন লোড হচ্ছে…" />
      ) : (
        <ul className="mt-4 grid gap-2">
          {q.data?.lessons.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
              <span>
                <strong>{l.titleBn}</strong>{" "}
                <span className="text-sm text-[var(--dim)]">· {l.category} · {l.level}</span>
              </span>
              <span className="flex gap-2">
                <button type="button" onClick={() => void startEdit(l)} className="rounded-full bg-[var(--surface-alt)] px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]">এডিট</button>
                <button type="button" onClick={() => delMut.mutate(l.id)} className="rounded-full bg-[var(--surface-alt)] px-4 py-1.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]">মুছুন</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------- Words ----------------

const emptyWord = {
  word: "", pos: "", level: "A1", bn: "", bnPron: "", respUs: "", respUk: "",
  syn: "", ant: "", ex: "", exBn: "",
};

const WORD_PAGE_SIZE = 25;

function WordsAdmin() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [level, setLevel] = useState("");
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Word | null>(null);
  const [form, setForm] = useState(emptyWord);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  // The list is ALWAYS populated: it pages through the whole book dataset
  // (7,600 words), optionally filtered by level and/or the search text.
  // The old version rendered nothing until a search was submitted, which
  // made the tab look like all the words had disappeared.
  const list = useQuery({
    queryKey: ["admin-words", level, submitted, offset],
    queryFn: () =>
      api.adminListWords({
        level,
        query: submitted,
        offset,
        limit: WORD_PAGE_SIZE,
      }),
  });
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats({}),
  });

  const total = list.data?.total ?? 0;
  const page = Math.floor(offset / WORD_PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / WORD_PAGE_SIZE));
  const levelCount = (lvl: string) =>
    stats.data?.byLevel.find((b) => b.level === lvl)?.count ?? 0;

  const saveMut = useMutation({
    mutationFn: () => api.adminSaveWord({ id: editing?.id ?? null, ...form }),
    onSuccess: () => {
      setSaved(true);
      setShowForm(false);
      setEditing(null);
      setForm(emptyWord);
      void queryClient.invalidateQueries({ queryKey: ["admin-words"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteWord({ id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-words"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const fields: [keyof typeof emptyWord, string][] = [
    ["word", "শব্দ (English) *"],
    ["pos", "Parts of speech"],
    ["bn", "বাংলা অর্থ"],
    ["bnPron", "বাংলা উচ্চারণ"],
    ["respUs", "USA উচ্চারণ (respelling)"],
    ["respUk", "UK উচ্চারণ (respelling)"],
    ["syn", "সমার্থক শব্দ"],
    ["ant", "বিপরীত শব্দ"],
    ["ex", "উদাহরণ বাক্য (English)"],
    ["exBn", "উদাহরণের বাংলা"],
  ];

  const pickLevel = (lvl: string) => {
    setLevel(lvl);
    setOffset(0);
  };

  const startEdit = (w: Word) => {
    setEditing(w);
    setForm({
      word: w.word, pos: w.pos, level: w.level, bn: w.bn,
      bnPron: w.bnPron, respUs: w.respUs, respUk: w.respUk,
      syn: w.syn, ant: w.ant, ex: w.ex, exBn: w.exBn,
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-extrabold tracking-tight">শব্দভান্ডার</h2>
          <p className="bn-read-sm mt-0.5 text-[var(--dim)]">
            মোট {bnNum(stats.data?.totalWords ?? 0)}টি শব্দ — Oxford 7000 Words
            (A1–C2) + IELTS 600। লেভেল বেছে বা খুঁজে যেকোনো শব্দ এডিট/মুছতে
            পারবেন।
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(emptyWord);
            setShowForm((v) => !v);
          }}
          className="btn-primary shrink-0"
          aria-expanded={showForm}
        >
          <IconPlus size={17} /> নতুন শব্দ
        </button>
      </div>

      <form
        className="search-pill mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
          setOffset(0);
        }}
      >
        <IconSearch size={18} className="ml-2 shrink-0 text-[var(--dim)]" />
        <input
          aria-label="শব্দ খুঁজুন"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="শব্দ বা বাংলা অর্থ দিয়ে খুঁজুন — যেমন: water, পানি"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-[var(--dim)]"
        />
        {submitted && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSubmitted("");
              setOffset(0);
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[var(--dim)] transition-colors hover:text-[var(--text)]"
          >
            মুছুন
          </button>
        )}
        <button type="submit" className="btn-primary shrink-0 px-5 py-2 text-sm">
          খুঁজুন
        </button>
      </form>

      <div
        className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="লেভেল অনুযায়ী শব্দ ছাঁকুন"
      >
        {[{ key: "", label: "সব লেভেল", count: stats.data?.totalWords ?? 0 }]
          .concat(
            LEVELS.map((l) => ({ key: l, label: l, count: levelCount(l) })),
          )
          .map((chip) => {
            const active = level === chip.key;
            return (
              <button
                key={chip.key || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pickLevel(chip.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-all ${
                  active
                    ? "text-white shadow-[var(--shadow-pop)]"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] hover:text-[var(--text)]"
                }`}
                style={active ? { background: "var(--accent-grad)" } : undefined}
              >
                {chip.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-alt)] text-[var(--dim)]"
                  }`}
                >
                  {bnNum(chip.count)}
                </span>
              </button>
            );
          })}
      </div>

      {saved && (
        <p className="mt-3 text-sm font-medium text-[var(--accent-strong)]">
          ✓ শব্দ সেভ হয়েছে
        </p>
      )}
      {showForm && (
        <form
          className="card mt-4 grid gap-3 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.word.trim()) saveMut.mutate();
          }}
        >
          <div>
            <label htmlFor="aw-level" className={labelCls}>লেভেল</label>
            <select id="aw-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls}>
              {LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
            </select>
          </div>
          {fields.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`aw-${key}`} className={labelCls}>{label}</label>
              <input
                id={`aw-${key}`}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputCls}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saveMut.isPending} className="btn-primary">
              {saveMut.isPending ? "সেভ হচ্ছে…" : editing ? "আপডেট করুন" : "শব্দ যোগ করুন"}
            </button>
          </div>
        </form>
      )}

      {list.isPending ? (
        <Spinner label="শব্দ লোড হচ্ছে…" />
      ) : list.isError ? (
        <div className="mt-4">
          <EmptyNote>
            শব্দ লোড করা যায়নি।
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void list.refetch()}
                className="btn-outline px-4 py-2 text-sm"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          </EmptyNote>
        </div>
      ) : total === 0 ? (
        <div className="mt-4">
          <EmptyNote>
            {submitted
              ? `"${submitted}" দিয়ে কোনো শব্দ পাওয়া যায়নি। বানান ঠিক করে আবার খুঁজুন।`
              : "এই লেভেলে এখনো কোনো শব্দ নেই — উপরের ‘নতুন শব্দ’ বোতামে যোগ করুন।"}
          </EmptyNote>
        </div>
      ) : (
        <>
          <p className="mt-4 text-[13px] font-semibold text-[var(--dim)]" aria-live="polite">
            {bnNum(total)}টি শব্দ · পৃষ্ঠা {bnNum(page)}/{bnNum(pageCount)}
          </p>
          <ul className="mt-2 grid gap-2">
            {(list.data?.words ?? []).map((w) => (
              <li
                key={w.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)] sm:px-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="text-[17px] font-extrabold tracking-tight">
                        {w.word}
                      </strong>
                      {w.pos && (
                        <span className="text-[13px] italic text-[var(--dim)]">
                          {w.pos}
                        </span>
                      )}
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[var(--accent-strong)]">
                        {w.level}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold leading-snug">
                      {w.bn}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--dim)]">
                      বাংলা উচ্চারণ: {w.bnPron} · USA: {w.respUs} · UK: {w.respUk}
                    </p>
                    {(w.syn || w.ant) && (
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--dim)]">
                        {w.syn && (
                          <>
                            সমার্থক: <span className="font-medium text-[var(--text)]">{w.syn}</span>
                          </>
                        )}
                        {w.syn && w.ant && " · "}
                        {w.ant && (
                          <>
                            বিপরীত: <span className="font-medium text-[var(--text)]">{w.ant}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(w)}
                      aria-label={`${w.word} — এডিট করুন`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <IconPen size={14} /> এডিট
                    </button>
                    <button
                      type="button"
                      onClick={() => delMut.mutate(w.id)}
                      aria-label={`${w.word} — মুছে ফেলুন`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                    >
                      <IconTrash size={14} /> মুছুন
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={offset === 0 || list.isFetching}
              onClick={() => setOffset(Math.max(0, offset - WORD_PAGE_SIZE))}
              className="btn-outline px-4 py-2 text-sm"
            >
              <IconArrowLeft size={15} /> আগের পৃষ্ঠা
            </button>
            <span className="text-[13px] font-semibold text-[var(--dim)]">
              পৃষ্ঠা {bnNum(page)} / {bnNum(pageCount)}
            </span>
            <button
              type="button"
              disabled={page >= pageCount || list.isFetching}
              onClick={() => setOffset(offset + WORD_PAGE_SIZE)}
              className="btn-outline px-4 py-2 text-sm"
            >
              পরের পৃষ্ঠা <IconArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
// ---------------- Enrolments (আবেদন page) ----------------
// Dedicated applications page: summary stats, status filters, search,
// and one rich card per application with approve / reject / back-to-
// pending / delete — everything the owner needs to process the manual
// bKash/Nagad enrolments students submit from the course pages.

const ENR_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "সব" },
  { key: "pending", label: "অপেক্ষমাণ" },
  { key: "approved", label: "অনুমোদিত" },
  { key: "rejected", label: "বাতিল" },
];

function enrollmentStatusMeta(status: string): {
  label: string;
  cls: string;
} {
  if (status === "approved")
    return {
      label: "অনুমোদিত",
      cls: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
    };
  if (status === "rejected")
    return { label: "বাতিল", cls: "bg-[var(--danger-soft)] text-[var(--danger)]" };
  return {
    label: "অপেক্ষমাণ",
    cls: "bg-[var(--gold-soft)] text-[var(--gold)]",
  };
}

function EnrollmentsAdmin() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: () => api.adminListEnrollments({}),
  });
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
  const setMut = useMutation({
    mutationFn: (args: { id: number; status: "pending" | "approved" | "rejected" }) =>
      api.adminSetEnrollmentStatus(args),
    onSuccess: invalidate,
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteEnrollment({ id }),
    onSuccess: () => {
      setConfirmDeleteId(null);
      invalidate();
    },
  });

  const allRows = q.data?.enrollments ?? [];
  const counts = {
    total: allRows.length,
    pending: allRows.filter((e) => e.status === "pending").length,
    approved: allRows.filter((e) => e.status === "approved").length,
    rejected: allRows.filter((e) => e.status === "rejected").length,
  };
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allRows.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        e.phone.includes(needle) ||
        e.txnId.toLowerCase().includes(needle) ||
        e.courseTitle.toLowerCase().includes(needle)
      );
    });
  }, [allRows, filter, search]);

  const statCards = [
    { Icon: IconClipboard, label: "মোট আবেদন", value: counts.total, tone: "accent" },
    { Icon: IconClock, label: "অপেক্ষমাণ", value: counts.pending, tone: "gold" },
    { Icon: IconCheck, label: "অনুমোদিত", value: counts.approved, tone: "accent" },
    { Icon: IconX, label: "বাতিল", value: counts.rejected, tone: "danger" },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-extrabold tracking-tight">ভর্তির আবেদন</h2>
          <p className="bn-read-sm mt-1 max-w-xl text-[var(--dim)]">
            ছাত্রছাত্রীরা কোর্স ও প্রিমিয়াম পেজ থেকে পেমেন্টের তথ্যসহ আবেদন
            করে — এখানে যাচাই করে অনুমোদন দিলেই তাদের অ্যাক্সেস চালু হবে।
            কোর্সের আবেদনে কোর্সের লেসন খুলবে;{" "}
            <strong className="text-[var(--text)]">প্রিমিয়াম আবেদন</strong>{" "}
            অনুমোদন দিলে B1–IELTS সব প্রিমিয়াম লেভেল, আর{" "}
            <strong className="text-[var(--text)]">বই কেনার আবেদন</strong>{" "}
            অনুমোদন দিলে ওই নম্বরের অ্যাকাউন্টে বই পড়ার অ্যাক্সেস চালু
            হয়ে যাবে।
          </p>
        </div>
        {counts.pending > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-soft)] px-4 py-2 text-sm font-bold text-[var(--gold)]">
            <IconClock size={16} />
            {bnNum(counts.pending)}টি আবেদন যাচাই বাকি
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="card p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--dim)]">
              <span
                className="icon-chip h-8 w-8 rounded-[10px]"
                style={
                  c.tone === "gold"
                    ? { background: "var(--gold-soft)", color: "var(--gold)" }
                    : c.tone === "danger"
                      ? { background: "var(--danger-soft)", color: "var(--danger)" }
                      : undefined
                }
              >
                <c.Icon size={17} />
              </span>
              {c.label}
            </p>
            <p className="mt-2.5 text-[30px] font-extrabold leading-none tracking-tight">
              {bnNum(c.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="seg" role="tablist" aria-label="আবেদনের অবস্থা অনুযায়ী ছাঁকুন">
          {ENR_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className="seg-btn whitespace-nowrap"
            >
              {f.label} (
              {bnNum(
                f.key === "all"
                  ? counts.total
                  : f.key === "pending"
                    ? counts.pending
                    : f.key === "approved"
                      ? counts.approved
                      : counts.rejected,
              )}
              )
            </button>
          ))}
        </div>
        <label className="search-pill min-w-0 flex-1 sm:max-w-xs">
          <IconSearch size={17} className="ml-3 shrink-0 text-[var(--dim)]" />
          <span className="sr-only">আবেদন খুঁজুন</span>
          <input
            aria-label="নাম, ফোন বা ট্রানজ্যাকশন আইডি দিয়ে আবেদন খুঁজুন"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম / ফোন / TrxID খুঁজুন"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-[var(--dim)]"
          />
        </label>
      </div>

      {q.isPending ? (
        <Spinner label="আবেদন লোড হচ্ছে…" />
      ) : allRows.length === 0 ? (
        <div className="mt-5">
          <EmptyNote>
            এখনো কোনো ভর্তির আবেদন আসেনি। ছাত্রছাত্রীরা কোর্স পেজ থেকে
            আবেদন করলেই এখানে দেখা যাবে।
          </EmptyNote>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5">
          <EmptyNote>এই ছাঁকনিতে কোনো আবেদন নেই।</EmptyNote>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3">
          {rows.map((e) => {
            const meta = enrollmentStatusMeta(e.status);
            const busy = setMut.isPending || delMut.isPending;
            const isPremiumApp =
              e.courseId == null && e.courseTitle === PREMIUM_APPLICATION_TITLE;
            const isBookApp =
              e.courseId == null && e.courseTitle === BOOK_APPLICATION_TITLE;
            return (
              <li key={e.id} className="card card-hover p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3.5">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-white shadow-[var(--shadow-pop)]"
                    style={{ background: "var(--accent-grad)" }}
                  >
                    {e.name.trim().charAt(0).toUpperCase() || "S"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <strong className="text-[16.5px]">{e.name}</strong>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[12px] font-extrabold ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                      {isPremiumApp && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--gold)]">
                          <IconMedal size={13} /> Premium আবেদন
                        </span>
                      )}
                      {isBookApp && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[12px] font-extrabold text-[var(--accent-strong)]">
                          <IconBook size={13} /> বই কেনার আবেদন
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--dim)]">
                      <a
                        href={`tel:${e.phone}`}
                        className="inline-flex items-center gap-1 font-semibold text-[var(--text)] hover:text-[var(--accent-strong)]"
                      >
                        <IconPhone size={14} /> {e.phone}
                      </a>
                      <span className="inline-flex items-center gap-1">
                        <IconCalendar size={14} /> {bnDate(e.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2 text-[13.5px]">
                  {isPremiumApp ? (
                    <span
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-1.5 font-bold text-[var(--gold)]"
                      style={{ background: "var(--gold-soft)" }}
                    >
                      <IconMedal size={15} className="shrink-0" />
                      <span className="truncate">
                        VocabMaster Premium — সব প্রিমিয়াম লেভেল
                      </span>
                    </span>
                  ) : isBookApp ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3.5 py-1.5 font-bold text-[var(--accent-strong)]">
                      <IconBook size={15} className="shrink-0" />
                      <span className="truncate">
                        Oxford 7000 Words — বই (ওয়েবসাইটে পড়ার অ্যাক্সেস)
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5 font-semibold">
                      <IconVideo size={15} className="shrink-0 text-[var(--accent-strong)]" />
                      <span className="truncate">{e.courseTitle}</span>
                    </span>
                  )}
                  {e.method && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5 font-semibold">
                      <IconWallet size={15} className="text-[var(--accent-strong)]" />
                      {e.method}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5 font-semibold">
                    TrxID:{" "}
                    <span className="font-mono font-bold tracking-wide">
                      {e.txnId || "—"}
                    </span>
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3.5">
                  {e.status !== "approved" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setMut.mutate({ id: e.id, status: "approved" })}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-px disabled:opacity-50"
                      style={{ background: "var(--accent-grad)" }}
                    >
                      <IconCheck size={16} /> অনুমোদন করুন
                    </button>
                  )}
                  {e.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setMut.mutate({ id: e.id, status: "rejected" })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger-soft)] px-4 py-2 text-sm font-bold text-[var(--danger)] transition-colors hover:brightness-95 disabled:opacity-50"
                    >
                      <IconX size={15} /> বাতিল
                    </button>
                  )}
                  {e.status !== "pending" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setMut.mutate({ id: e.id, status: "pending" })}
                      className="btn-soft px-4 py-2 text-sm"
                    >
                      <IconClock size={15} /> অপেক্ষমাণে ফেরান
                    </button>
                  )}
                  <span className="ml-auto">
                    {confirmDeleteId === e.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-[var(--danger)]">
                          সত্যিই মুছবেন?
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => delMut.mutate(e.id)}
                          className="rounded-full bg-[var(--danger)] px-3.5 py-1.5 text-[13px] font-bold text-white disabled:opacity-50"
                        >
                          হ্যাঁ, মুছুন
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn-soft px-3.5 py-1.5 text-[13px]"
                        >
                          না
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(e.id)}
                        aria-label={`${e.name}-এর আবেদন মুছুন`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-[var(--dim)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
                      >
                        <IconTrash size={15} /> মুছুন
                      </button>
                    )}
                  </span>
                </div>
                {isPremiumApp && (
                  <p className="mt-3 flex items-start gap-1.5 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
                    <IconMedal size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                    {e.status === "approved"
                      ? "এই আবেদন অনুমোদিত — ওই নম্বরের অ্যাকাউন্টে প্রিমিয়াম চালু আছে। প্রিমিয়াম সরাতে চাইলে ছাত্রছাত্রী তালিকা থেকে সরান।"
                      : "অনুমোদন দিলেই এই নম্বরের অ্যাকাউন্টে প্রিমিয়াম (B1–IELTS) স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।"}
                  </p>
                )}
                {isBookApp && (
                  <p className="mt-3 flex items-start gap-1.5 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
                    <IconBook size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                    {e.status === "approved"
                      ? "এই আবেদন অনুমোদিত — ওই নম্বরের অ্যাকাউন্টে বই পড়ার অ্যাক্সেস চালু আছে। অ্যাক্সেস সরাতে চাইলে ছাত্রছাত্রী তালিকা থেকে সরান।"
                      : "অনুমোদন দিলেই এই নম্বরের অ্যাকাউন্টে বই পড়ার অ্যাক্সেস স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------- Students ----------------
// Full student management: the admin can add a student manually, edit
// name / phone / XP / streak, reset a student's password, and delete an
// account (with its progress rows) after an in-place confirmation.

type AdminStudentRow = ApiResponse<
  typeof api,
  "adminListStudents"
>["students"][number];

function StudentsAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminStudentRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ["admin-students"],
    queryFn: () => api.adminListStudents({}),
  });
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
  const delMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteStudent({ id }),
    onSuccess: () => {
      setConfirmDeleteId(null);
      invalidate();
    },
  });
  const premiumMut = useMutation({
    mutationFn: (args: { studentId: number; premium: boolean }) =>
      api.adminSetStudentPremium(args),
    onSuccess: invalidate,
  });
  const bookMut = useMutation({
    mutationFn: (args: { studentId: number; bookAccess: boolean }) =>
      api.adminSetStudentBookAccess(args),
    onSuccess: invalidate,
  });
  // Per-student level grants: free ONE level for ONE student. The
  // site-wide free list comes from the same settings query the rest of
  // the site reads, so a chip never disagrees with the live gates.
  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });
  const globalFreeLevels: readonly string[] =
    settingsQ.data?.freeLevels ?? ["A1", "A2"];
  const [grantOpenId, setGrantOpenId] = useState<number | null>(null);
  const grantMut = useMutation({
    mutationFn: (args: {
      studentId: number;
      level: string;
      granted: boolean;
    }) => api.adminSetStudentLevelGrant(args),
    onSuccess: invalidate,
  });

  const allRows = q.data?.students ?? [];
  const needle = search.trim().toLowerCase();
  const rows = needle
    ? allRows.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.phone.includes(needle) ||
          studentCode(s.id).toLowerCase().includes(needle),
      )
    : allRows;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-extrabold tracking-tight">ছাত্রছাত্রী</h2>
          <p className="bn-read-sm mt-1 max-w-xl text-[var(--dim)]">
            নতুন ছাত্র যোগ করুন, তথ্য সম্পাদনা করুন, পাসওয়ার্ড রিসেট করুন
            বা অ্যাকাউন্ট মুছে ফেলুন — সব এখান থেকে। যেকোনো ছাত্রকে এখান
            থেকেই <strong className="text-[var(--text)]">প্রিমিয়াম</strong>{" "}
            (B1–IELTS লেভেল) ও{" "}
            <strong className="text-[var(--text)]">বইয়ের অ্যাক্সেস</strong>{" "}
            দিতে বা সরিয়ে নিতে পারবেন। আর "লেভেল" বোতামে চাপ দিলে যেকোনো
            ছাত্রকে <strong className="text-[var(--text)]">আলাদা করে যেকোনো একটি লেভেল ফ্রি</strong>{" "}
            করে দিতে পারবেন — পুরো প্রিমিয়াম না দিয়েই।
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((a) => !a);
            setEditing(null);
          }}
          aria-expanded={adding}
          className="btn-primary px-5 py-2.5"
        >
          <IconPlus size={17} /> নতুন ছাত্র যোগ করুন
        </button>
      </div>

      {adding && (
        <StudentAddForm
          onDone={() => {
            setAdding(false);
            invalidate();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {editing && (
        <StudentEditForm
          student={editing}
          onDone={() => {
            setEditing(null);
            invalidate();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="search-pill min-w-0 flex-1 sm:max-w-md">
          <IconSearch size={17} className="ml-3 shrink-0 text-[var(--dim)]" />
          <span className="sr-only">ছাত্রছাত্রী খুঁজুন</span>
          <input
            aria-label="নাম, মোবাইল নম্বর বা স্টুডেন্ট আইডি দিয়ে ছাত্রছাত্রী খুঁজুন"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, মোবাইল বা স্টুডেন্ট আইডি (VM-0001) দিয়ে খুঁজুন"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-[var(--dim)]"
          />
        </label>
        <p className="text-sm font-medium text-[var(--dim)]">
          মোট {bnNum(allRows.length)}জন · প্রিমিয়াম{" "}
          {bnNum(allRows.filter((s) => s.premium).length)}জন · বই{" "}
          {bnNum(allRows.filter((s) => s.bookAccess).length)}জন
          {needle ? ` · পাওয়া গেছে ${bnNum(rows.length)}জন` : ""}
        </p>
      </div>

      {q.isPending ? (
        <Spinner label="ছাত্রছাত্রী লোড হচ্ছে…" />
      ) : allRows.length === 0 ? (
        <div className="mt-5">
          <EmptyNote>
            এখনো কেউ অ্যাকাউন্ট খোলেনি। উপরের বোতাম দিয়ে নিজে একজন ছাত্র
            যোগ করে দিতে পারেন।
          </EmptyNote>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5">
          <EmptyNote>"{search}" দিয়ে কোনো ছাত্রছাত্রী পাওয়া যায়নি।</EmptyNote>
        </div>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--dim)]">
                <th className="px-4 py-3 font-semibold">স্টুডেন্ট আইডি</th>
                <th className="px-4 py-3 font-semibold">নাম</th>
                <th className="px-4 py-3 font-semibold">মোবাইল</th>
                <th className="px-4 py-3 font-semibold">প্রিমিয়াম</th>
                <th className="px-4 py-3 font-semibold">XP</th>
                <th className="px-4 py-3 font-semibold">স্ট্রিক</th>
                <th className="px-4 py-3 font-semibold">শেখা শব্দ</th>
                <th className="px-4 py-3 font-semibold">যোগ দিয়েছেন</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <Fragment key={s.id}>
                <tr
                  className={`border-b border-[var(--border)] last:border-0 ${
                    editing?.id === s.id ? "bg-[var(--accent-soft)]" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[12.5px] font-bold text-[var(--accent-strong)]">
                      {studentCode(s.id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.phone}</td>
                  <td className="px-4 py-3">
                    {s.premium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-soft)] px-2.5 py-1 text-[12.5px] font-extrabold text-[var(--gold)]">
                        <IconMedal size={13} /> Premium
                      </span>
                    ) : (
                      <span className="text-[var(--dim)]">ফ্রি</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{bnNum(s.xp)}</td>
                  <td className="px-4 py-3">{bnNum(s.streak)} দিন</td>
                  <td className="px-4 py-3">{bnNum(s.learnedCount)}টি</td>
                  <td className="px-4 py-3 text-[var(--dim)]">{bnDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    {confirmDeleteId === s.id ? (
                      <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <span className="text-[12.5px] font-semibold text-[var(--danger)]">
                          মুছবেন?
                        </span>
                        <button
                          type="button"
                          disabled={delMut.isPending}
                          onClick={() => delMut.mutate(s.id)}
                          className="rounded-full bg-[var(--danger)] px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-50"
                        >
                          হ্যাঁ
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn-soft px-3 py-1.5 text-[12.5px]"
                        >
                          না
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={premiumMut.isPending}
                          onClick={() =>
                            premiumMut.mutate({
                              studentId: s.id,
                              premium: !s.premium,
                            })
                          }
                          aria-label={
                            s.premium
                              ? `${s.name}-এর প্রিমিয়াম সরিয়ে নিন`
                              : `${s.name}-কে প্রিমিয়াম দিন`
                          }
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-all disabled:opacity-50 ${
                            s.premium
                              ? "bg-[var(--gold-soft)] text-[var(--gold)] hover:brightness-95"
                              : "text-white shadow-[var(--shadow-pop)] hover:-translate-y-px"
                          }`}
                          style={
                            s.premium
                              ? undefined
                              : { background: "var(--peach-grad)" }
                          }
                        >
                          <IconMedal size={14} />
                          {s.premium ? "প্রিমিয়াম সরান" : "প্রিমিয়াম দিন"}
                        </button>
                        <button
                          type="button"
                          disabled={bookMut.isPending}
                          onClick={() =>
                            bookMut.mutate({
                              studentId: s.id,
                              bookAccess: !s.bookAccess,
                            })
                          }
                          aria-label={
                            s.bookAccess
                              ? `${s.name}-এর বইয়ের অ্যাক্সেস সরিয়ে নিন`
                              : `${s.name}-কে বইয়ের অ্যাক্সেস দিন`
                          }
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-all disabled:opacity-50 ${
                            s.bookAccess
                              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] hover:brightness-95"
                              : "bg-[var(--surface-alt)] text-[var(--dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                          }`}
                        >
                          <IconBook size={14} />
                          {s.bookAccess ? "বই চালু আছে" : "বই দিন"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGrantOpenId(grantOpenId === s.id ? null : s.id)
                          }
                          aria-expanded={grantOpenId === s.id}
                          aria-label={`${s.name}-এর জন্য আলাদা করে লেভেল ফ্রি করুন বা সরান`}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                            grantOpenId === s.id
                              ? "text-white shadow-[var(--shadow-pop)]"
                              : "bg-[var(--gold-soft)] text-[var(--gold)] hover:brightness-95"
                          }`}
                          style={
                            grantOpenId === s.id
                              ? { background: "var(--accent-grad)" }
                              : undefined
                          }
                        >
                          <IconSliders size={14} />
                          লেভেল
                          {s.levelGrants.length > 0 && (
                            <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-extrabold">
                              {bnNum(s.levelGrants.length)}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s);
                            setAdding(false);
                          }}
                          aria-label={`${s.name}-এর তথ্য সম্পাদনা করুন`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-[var(--surface-hover)]"
                        >
                          <IconPen size={14} /> সম্পাদনা
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(s.id)}
                          aria-label={`${s.name}-এর অ্যাকাউন্ট মুছুন`}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[var(--dim)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        >
                          <IconTrash size={14} /> মুছুন
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
                {grantOpenId === s.id && (
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                    <td colSpan={9} className="px-4 py-4">
                      <p className="text-sm font-bold">
                        {s.name}-এর জন্য আলাদা লেভেল ফ্রি করুন
                      </p>
                      <p className="bn-read-sm mt-0.5 max-w-2xl text-[var(--dim)]">
                        যে লেভেলে চাপ দেবেন, শুধু এই ছাত্রের জন্যই সেই
                        লেভেলের শব্দ, ফ্ল্যাশকার্ড আর কুইজ ফ্রি হয়ে যাবে
                        — অন্য কারো জন্য নয়, পুরো প্রিমিয়ামও নয়। আবার
                        চাপ দিলে ফ্রি সুবিধা সরে যাবে।
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {LEVELS.map((l) => {
                          const globalFree = globalFreeLevels.includes(l);
                          const granted = s.levelGrants.includes(l);
                          const openViaPremium = s.premium && !globalFree;
                          const isOpen = globalFree || granted || openViaPremium;
                          return (
                            <button
                              key={l}
                              type="button"
                              disabled={
                                globalFree || openViaPremium || grantMut.isPending
                              }
                              onClick={() =>
                                grantMut.mutate({
                                  studentId: s.id,
                                  level: l,
                                  granted: !granted,
                                })
                              }
                              aria-pressed={isOpen}
                              aria-label={
                                globalFree
                                  ? `${l} — সবার জন্য ফ্রি`
                                  : openViaPremium
                                    ? `${l} — প্রিমিয়ামে খোলা`
                                    : granted
                                      ? `${l} — ${s.name}-এর জন্য ফ্রি দেওয়া আছে, চাপ দিলে সরে যাবে`
                                      : `${l} — ${s.name}-এর জন্য ফ্রি করুন`
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold transition-all disabled:cursor-default ${
                                granted
                                  ? "text-white shadow-[var(--shadow-pop)]"
                                  : isOpen
                                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                                    : "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--dim)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                              }`}
                              style={
                                granted
                                  ? {
                                      background:
                                        "linear-gradient(135deg, #d9a83f 0%, #b8912f 100%)",
                                    }
                                  : undefined
                              }
                            >
                              {isOpen ? (
                                <IconCheck size={14} />
                              ) : (
                                <IconLock size={13} />
                              )}
                              {l}
                              <span className="text-[11px] font-bold opacity-80">
                                {globalFree
                                  ? "সবার ফ্রি"
                                  : openViaPremium
                                    ? "প্রিমিয়ামে খোলা"
                                    : granted
                                      ? "ফ্রি দেওয়া"
                                      : "ফ্রি করুন"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StudentAddForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () =>
      api.adminCreateStudent({
        name: name.trim(),
        phone: phone.trim(),
        password,
      }),
    onSuccess: (r) => {
      if (r.ok) onDone();
      else setError(r.error ?? "ছাত্র যোগ করা যায়নি।");
    },
    onError: () => setError("ছাত্র যোগ করা যায়নি — আবার চেষ্টা করুন।"),
  });
  return (
    <form
      className="card mt-5 grid gap-4 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (name.trim().length < 2) return setError("ছাত্রের নাম লিখুন।");
        if (phone.trim().length < 6) return setError("সঠিক মোবাইল নম্বর লিখুন।");
        if (!isStrongPassword(password))
          return setError(
            "শক্তিশালী পাসওয়ার্ড দিন — কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা মিলিয়ে।",
          );
        mut.mutate();
      }}
    >
      <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <span className="icon-chip h-9 w-9 rounded-[11px]">
          <IconPlus size={18} />
        </span>
        নতুন ছাত্র যোগ করুন
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="stu-add-name" className={labelCls}>নাম</label>
          <input id="stu-add-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ছাত্রের পুরো নাম" className={inputCls} />
        </div>
        <div>
          <label htmlFor="stu-add-phone" className={labelCls}>মোবাইল নম্বর</label>
          <input id="stu-add-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className={inputCls} />
        </div>
        <div>
          <label htmlFor="stu-add-pass" className={labelCls}>পাসওয়ার্ড (শক্তিশালী)</label>
          <input id="stu-add-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর, অক্ষর+সংখ্যা" autoComplete="new-password" className={inputCls} />
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--dim)]">
        ছাত্র এই মোবাইল নম্বর আর পাসওয়ার্ড দিয়ে নিজে লগইন করতে পারবে —
        পাসওয়ার্ডটা তাকে জানিয়ে দিন।
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--danger)]">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={mut.isPending} className="btn-primary px-5 py-2.5">
          {mut.isPending ? "যোগ হচ্ছে…" : "ছাত্র যোগ করুন"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline px-5 py-2.5">
          বাতিল
        </button>
      </div>
    </form>
  );
}

function StudentEditForm({
  student,
  onDone,
  onCancel,
}: {
  student: AdminStudentRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone);
  const [xp, setXp] = useState(String(student.xp));
  const [streak, setStreak] = useState(String(student.streak));
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () =>
      api.adminUpdateStudent({
        id: student.id,
        name: name.trim(),
        phone: phone.trim(),
        xp: Math.max(0, Math.floor(Number(xp) || 0)),
        streak: Math.max(0, Math.floor(Number(streak) || 0)),
        newPassword,
      }),
    onSuccess: (r) => {
      if (r.ok) onDone();
      else setError(r.error ?? "সেভ করা যায়নি।");
    },
    onError: () => setError("সেভ করা যায়নি — আবার চেষ্টা করুন।"),
  });
  return (
    <form
      className="card mt-5 grid gap-4 border-[var(--accent)] p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (name.trim().length < 2) return setError("নাম লিখুন।");
        if (phone.trim().length < 6) return setError("সঠিক মোবাইল নম্বর লিখুন।");
        if (newPassword && !isStrongPassword(newPassword))
          return setError(
            "নতুন পাসওয়ার্ড শক্তিশালী হতে হবে — কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা মিলিয়ে।",
          );
        mut.mutate();
      }}
    >
      <h3 className="flex flex-wrap items-center gap-2 text-lg font-extrabold tracking-tight">
        <span className="icon-chip h-9 w-9 rounded-[11px]">
          <IconPen size={17} />
        </span>
        সম্পাদনা — {student.name}
        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[12.5px] font-bold text-[var(--accent-strong)]">
          {studentCode(student.id)}
        </span>
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="stu-edit-name" className={labelCls}>নাম</label>
          <input id="stu-edit-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="stu-edit-phone" className={labelCls}>মোবাইল নম্বর</label>
          <input id="stu-edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputCls} />
        </div>
        <div>
          <label htmlFor="stu-edit-pass" className={labelCls}>নতুন পাসওয়ার্ড (রিসেট — খালি রাখলে আগেরটাই)</label>
          <input id="stu-edit-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর, অক্ষর+সংখ্যা" autoComplete="new-password" className={inputCls} />
        </div>
        <div>
          <label htmlFor="stu-edit-xp" className={labelCls}>XP</label>
          <input id="stu-edit-xp" type="number" min={0} value={xp} onChange={(e) => setXp(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="stu-edit-streak" className={labelCls}>স্ট্রিক (দিন)</label>
          <input id="stu-edit-streak" type="number" min={0} value={streak} onChange={(e) => setStreak(e.target.value)} className={inputCls} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--danger)]">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={mut.isPending} className="btn-primary px-5 py-2.5">
          {mut.isPending ? "সেভ হচ্ছে…" : "সেভ করুন"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline px-5 py-2.5">
          বাতিল
        </button>
      </div>
    </form>
  );
}

// ---------------- Book (secure PDF reader) ----------------

function BookAdmin() {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["admin-book-status"],
    queryFn: () => api.adminBookStatus({}),
  });
  // Book name / price / free-mode quick settings (same settings rows the
  // Settings tab edits — one source of truth, two doors).
  const [bkTitle, setBkTitle] = useState("");
  const [bkPrice, setBkPrice] = useState("");
  const [bkFree, setBkFree] = useState(false);
  const [bkLoaded, setBkLoaded] = useState(false);
  const [bkSaved, setBkSaved] = useState(false);
  useEffect(() => {
    if (status.data && !bkLoaded) {
      setBkTitle(status.data.title);
      setBkPrice(String(status.data.price));
      setBkFree(status.data.freeForAll);
      setBkLoaded(true);
    }
  }, [status.data, bkLoaded]);
  const bkSaveMut = useMutation({
    mutationFn: () =>
      api.adminSaveBookSettings({
        bookTitle: bkTitle.trim() || "Oxford 7000 Words",
        bookPrice: Math.max(0, Math.floor(Number(bkPrice) || 0)),
        bookFree: bkFree,
      }),
    onSuccess: () => {
      setBkSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["admin-book-status"] });
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["book-access"] });
    },
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState("762");
  const [progress, setProgress] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = progress != null;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-book-status"] });
    void queryClient.invalidateQueries({ queryKey: ["book-access"] });
  };

  const delMut = useMutation({
    mutationFn: () => api.adminDeleteBook({}),
    onSuccess: () => {
      setConfirmDelete(false);
      invalidate();
    },
  });

  // One-tap install of the author's real v3.4 book file, which already
  // lives on this server — no 31 MB upload through the browser needed.
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [seedErr, setSeedErr] = useState<string | null>(null);
  const seedMut = useMutation({
    mutationFn: () => api.seedBookFile({}),
    onSuccess: (r) => {
      if (r.ok) {
        setSeedErr(null);
        setSeedMsg(
          r.seeded
            ? `✓ বইয়ের ফাইল বসানো হয়েছে (${(r.sizeBytes / 1_000_000).toFixed(1)} MB · ${bnNum(r.totalPages)} পৃষ্ঠা) — এখন অ্যাক্সেস পাওয়া ছাত্ররা বই পেজ থেকে পড়তে পারবে।`
            : "বইয়ের ফাইল আগেই বসানো আছে।",
        );
        invalidate();
      } else {
        setSeedMsg(null);
        setSeedErr(r.error ?? "বই বসানো যায়নি।");
      }
    },
    onError: () =>
      setSeedErr(
        "বই বসানো যায়নি — আবার চেষ্টা করুন, অথবা নিচে থেকে PDF ফাইলটি আপলোড করে দিন।",
      ),
  });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setDoneMsg(null);
    const totalPages = Math.max(1, Math.floor(Number(pages) || 762));
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("শুধু PDF ফাইল বেছে নিন — বইয়ের আসল PDF ফাইলটি দিন।");
      return;
    }
    if (file.size > 45_000_000) {
      setError("ফাইলটি খুব বড় (সর্বোচ্চ ৪৫ MB)।");
      return;
    }
    try {
      // One-shot upload (same proven path as the course videos): the
      // whole file goes to private storage in a single request. A ~31 MB
      // book can take a few minutes on a slow connection — the progress
      // note stays up until the server confirms.
      setProgress(
        "ফাইল আপলোড হচ্ছে… বড় ফাইল হলে কয়েক মিনিট লাগতে পারে — পেজটা বন্ধ করবেন না।",
      );
      setPct(50);
      const { dataBase64, mimeType } = await fileToBase64(file);
      const r = await api.adminUploadBookPdf({
        filename: file.name,
        mimeType: mimeType || "application/pdf",
        dataBase64,
        totalPages,
      });
      if (!r.ok) throw new Error(r.error ?? "আপলোড করা যায়নি।");
      setPct(100);
      setDoneMsg(
        "✓ বইয়ের PDF আপলোড হয়ে গেছে — যারা বই কিনেছে (অ্যাক্সেস পেয়েছে), তারা এখন বই পেজ থেকে পড়তে পারবে।",
      );
      invalidate();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "আপলোড করা যায়নি — সংযোগ দেখে আবার চেষ্টা করুন।",
      );
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const d = status.data;
  const sizeMb = d ? (d.sizeBytes / 1_000_000).toFixed(1) : "0";

  return (
    <div className="grid max-w-3xl gap-5">
      <div>
        <h2 className="text-[26px] font-extrabold tracking-tight">বই — {d?.title ?? "Oxford 7000 Words"}</h2>
        <p className="bn-read-sm mt-1 max-w-2xl text-[var(--dim)]">
          বইয়ের PDF এখানে একবার আপলোড করলেই, যারা বই কিনেছে তারা
          ওয়েবসাইটের ভিতরের নিরাপদ রিডারে পুরো বইটি পড়তে পারবে —
          ডাউনলোড করা যাবে না। ফাইলটি সাইটের গোপন (প্রাইভেট) স্টোরেজে
          থাকে; কেনা ছাত্রের জন্য মাত্র ১০ মিনিটের মেয়াদের সই করা লিংক
          তৈরি হয়, আর প্রতিটি পৃষ্ঠায় তার নিজের নাম-নম্বরের ওয়াটারমার্ক
          থাকে।
        </p>
      </div>

      <form
        className="card grid gap-4 p-5 sm:p-6"
        aria-label="বইয়ের নাম, দাম ও ফ্রি/প্রিমিয়াম"
        onSubmit={(e) => {
          e.preventDefault();
          setBkSaved(false);
          bkSaveMut.mutate();
        }}
      >
        <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="icon-chip h-9 w-9 rounded-[11px]">
            <IconPen size={16} />
          </span>
          বইয়ের নাম, দাম ও ফ্রি/প্রিমিয়াম
        </h3>
        <div>
          <label htmlFor="bk-title" className={labelCls}>
            বইয়ের নাম (সাইটে যেভাবে দেখাবে)
          </label>
          <input
            id="bk-title"
            value={bkTitle}
            onChange={(e) => setBkTitle(e.target.value)}
            placeholder="Oxford 7000 Words"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="bk-price" className={labelCls}>
            বইয়ের দাম (৳)
          </label>
          <input
            id="bk-price"
            type="number"
            min={0}
            inputMode="numeric"
            value={bkPrice}
            onChange={(e) => setBkPrice(e.target.value)}
            placeholder="990"
            className={`${inputCls} max-w-[200px]`}
          />
        </div>
        <fieldset className="rounded-2xl border border-[var(--border)] p-3.5">
          <legend className="px-1.5 text-sm font-bold">বইয়ের অ্যাক্সেস</legend>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="বইয়ের অ্যাক্সেস">
            <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors ${!bkFree ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}>
              <input
                type="radio"
                name="bk-access"
                checked={!bkFree}
                onChange={() => setBkFree(false)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                <span className="block font-bold">পেইড — কিনলে পড়া যাবে</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--dim)]">
                  শুধু যাদের বইয়ের অ্যাক্সেস দিয়েছেন বা যাদের কেনার আবেদন
                  অনুমোদন করেছেন, তারাই পড়তে পারবে।
                </span>
              </span>
            </label>
            <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors ${bkFree ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}>
              <input
                type="radio"
                name="bk-access"
                checked={bkFree}
                onChange={() => setBkFree(true)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                <span className="block font-bold">সবার জন্য ফ্রি</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--dim)]">
                  লগইন করা সব ছাত্রই ফ্রিতে পড়তে পারবে। যেকোনো সময় আবার
                  পেইড করে দিতে পারবেন।
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        {bkSaved && (
          <p className="text-sm font-medium text-[var(--accent-strong)]">
            ✓ সেভ হয়েছে — সাইটে এখনই নতুন নাম/দাম/অ্যাক্সেস দেখা যাবে
          </p>
        )}
        <div>
          <button type="submit" disabled={bkSaveMut.isPending || !bkLoaded} className="btn-primary">
            {bkSaveMut.isPending ? "সেভ হচ্ছে…" : "সেভ করুন"}
          </button>
        </div>
      </form>

      <section className="card p-5 sm:p-6" aria-label="বইয়ের ফাইলের অবস্থা">
        {status.isPending ? (
          <Spinner label="বইয়ের তথ্য লোড হচ্ছে…" />
        ) : d?.uploaded ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="icon-chip h-14 w-14 rounded-[18px]">
              <IconBook size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">{d.fileName || "বইয়ের PDF"}</p>
              <p className="mt-0.5 text-sm text-[var(--dim)]">
                আকার {sizeMb} MB · মোট {bnNum(d.totalPages)} পৃষ্ঠা · বইয়ের
                দাম ৳{bnNum(d.price)} · এখন পর্যন্ত {bnNum(d.accessCount)}জন
                ছাত্রের বইয়ের অ্যাক্সেস আছে
              </p>
            </div>
            {confirmDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[var(--danger)]">
                  ফাইল মুছবেন?
                </span>
                <button
                  type="button"
                  disabled={delMut.isPending}
                  onClick={() => delMut.mutate()}
                  className="rounded-full bg-[var(--danger)] px-3.5 py-1.5 text-[13px] font-bold text-white disabled:opacity-50"
                >
                  হ্যাঁ, মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="btn-soft px-3.5 py-1.5 text-[13px]"
                >
                  না
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--dim)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
              >
                <IconTrash size={15} /> PDF সরান
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3.5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "var(--peach-soft)", color: "var(--peach-strong)" }}
            >
              <IconBook size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">বইয়ের PDF এখনো বসানো হয়নি — তাই কেউ বই পড়তে পারছে না</p>
              <p className="bn-read-sm mt-1 text-[var(--dim)]">
                আসল বইয়ের ফাইলটি (Oxford 7000 Words v3.4) এই সার্ভারেই
                আছে — এক চাপেই রিডারে বসিয়ে দিন। তারপরেই অ্যাক্সেস
                পাওয়া ছাত্ররা বইটি পড়তে পারবে। চাইলে নিচে থেকে নিজে
                PDF আপলোডও করতে পারবেন।
              </p>
              <button
                type="button"
                disabled={seedMut.isPending}
                onClick={() => {
                  setSeedMsg(null);
                  setSeedErr(null);
                  seedMut.mutate();
                }}
                className="btn-primary mt-3.5 px-5 py-2.5 disabled:opacity-60"
              >
                <IconBook size={16} />
                {seedMut.isPending
                  ? "বই বসানো হচ্ছে… (একটু সময় লাগতে পারে)"
                  : "সার্ভার থেকে আসল বইটি বসান"}
              </button>
              {seedMsg && (
                <p className="mt-2.5 text-sm font-medium text-[var(--accent-strong)]">
                  {seedMsg}
                </p>
              )}
              {seedErr && (
                <p role="alert" className="mt-2.5 text-sm font-medium text-[var(--danger)]">
                  {seedErr}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="card grid gap-4 p-5 sm:p-6" aria-label="বইয়ের PDF আপলোড">
        <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="icon-chip h-9 w-9 rounded-[11px]">
            <IconUpload size={17} />
          </span>
          {d?.uploaded ? "নতুন সংস্করণের PDF দিন" : "বইয়ের PDF আপলোড করুন"}
        </h3>
        <div>
          <label htmlFor="book-pages" className={labelCls}>
            বইয়ের মোট পৃষ্ঠা সংখ্যা (v3.4 বইয়ে ৭৬২)
          </label>
          <input
            id="book-pages"
            type="number"
            min={1}
            max={5000}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            className={`${inputCls} max-w-[200px]`}
          />
        </div>
        <input
          ref={fileRef}
          id="book-pdf-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <label
          htmlFor="book-pdf-file"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-alt)] px-4 py-8 text-center transition-colors hover:border-[var(--accent)] ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="icon-chip h-12 w-12 rounded-2xl">
            <IconUpload size={22} />
          </span>
          <span className="font-bold">
            {busy ? "আপলোড চলছে…" : "PDF ফাইল বেছে নিতে এখানে চাপ দিন"}
          </span>
          <span className="text-[13px] text-[var(--dim)]">
            শুধু PDF · সর্বোচ্চ ৪৫ MB · আপলোডের সময় পেজটা খোলা রাখুন
          </span>
        </label>
        {progress && (
          <div>
            <div
              className="progress-track h-2.5"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="আপলোডের অগ্রগতি"
            >
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm font-medium text-[var(--dim)]">{progress}</p>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-[var(--danger)]">{error}</p>
        )}
        {doneMsg && (
          <p className="text-sm font-medium text-[var(--accent-strong)]">{doneMsg}</p>
        )}
        <div className="rounded-2xl bg-[var(--surface-alt)] px-4 py-3.5">
          <p className="bn-read-sm text-[var(--dim)]">
            <strong className="text-[var(--text)]">বইয়ের অ্যাক্সেস যেভাবে চলে:</strong>{" "}
            ছাত্র বই পেজ থেকে ৳দামে কেনার আবেদন করে → আপনি "ভর্তির আবেদন"
            পেজে যাচাই করে অনুমোদন দিলেই তার অ্যাকাউন্টে বই পড়ার অ্যাক্সেস
            চালু হয়। চাইলে "ছাত্রছাত্রী" তালিকা থেকেও যেকোনো ছাত্রকে
            সরাসরি বইয়ের অ্যাক্সেস দিতে/সরাতে পারবেন। সত্যি কথা: কোনো
            ওয়েবসাইটই স্ক্রিনশট পুরোপুরি ঠেকাতে পারে না — তবে ডাউনলোড,
            লিংক শেয়ার আর কপি — সব সহজ চুরির পথ বন্ধ, আর স্ক্রিনশটেও
            ছাত্রের নাম-নম্বরের ওয়াটারমার্ক থেকে যাবে।
          </p>
        </div>
      </section>
    </div>
  );
}

// ---------------- Settings ----------------

function SettingsAdmin() {
  const q = useQuery({ queryKey: ["settings"], queryFn: () => api.getSettings({}) });
  const [note, setNote] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [premiumPrice, setPremiumPrice] = useState("");
  const [bookPrice, setBookPrice] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookFree, setBookFree] = useState(false);
  const [freeLevels, setFreeLevels] = useState<string[]>(["A1", "A2"]);
  const [announcement, setAnnouncement] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [bookBlurb, setBookBlurb] = useState("");
  const [mentorQuote, setMentorQuote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (q.data && !loaded) {
      setNote(q.data.paymentNote);
      setWhatsapp(q.data.whatsapp);
      setPremiumPrice(
        q.data.premiumPrice != null ? String(q.data.premiumPrice) : "",
      );
      setBookPrice(String(q.data.bookPrice));
      setBookTitle(q.data.bookTitle);
      setBookFree(q.data.bookFree);
      setFreeLevels(q.data.freeLevels);
      setAnnouncement(q.data.announcement);
      setHeroTitle(q.data.heroTitle);
      setHeroSubtitle(q.data.heroSubtitle);
      setBookBlurb(q.data.bookBlurb);
      setMentorQuote(q.data.mentorQuote);
      setLoaded(true);
    }
  }, [q.data, loaded]);

  const saveMut = useMutation({
    mutationFn: () =>
      api.adminSaveSettings({
        paymentNote: note,
        whatsapp,
        premiumPrice:
          premiumPrice.trim() === ""
            ? null
            : Math.max(0, Math.floor(Number(premiumPrice) || 0)),
        bookPrice: Math.max(0, Math.floor(Number(bookPrice) || 0)),
        bookTitle,
        bookFree,
        freeLevels,
        announcement,
        heroTitle,
        heroSubtitle,
        bookBlurb,
        mentorQuote,
      }),
    onSuccess: () => setSaved(true),
  });

  if (q.isPending) return <Spinner label="সেটিংস লোড হচ্ছে…" />;
  return (
    <div className="grid max-w-2xl gap-6">
    <form
      className="card grid gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        saveMut.mutate();
      }}
    >
      <div>
        <label htmlFor="set-note" className={labelCls}>
          পেমেন্ট নির্দেশনা (কোর্স পেজে ও FAQ-তে দেখাবে)
        </label>
        <textarea id="set-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="set-wa" className={labelCls}>
          WhatsApp নম্বর (খালি রাখলে দেখাবে না)
        </label>
        <input id="set-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+880 1XXX-XXXXXX" className={inputCls} />
      </div>
      <div>
        <label htmlFor="set-premium-price" className={labelCls}>
          প্রিমিয়াম মূল্য (৳) — প্রিমিয়াম পেজে দেখাবে; খালি রাখলে মূল্য
          দেখাবে না
        </label>
        <input
          id="set-premium-price"
          type="number"
          min={0}
          inputMode="numeric"
          value={premiumPrice}
          onChange={(e) => setPremiumPrice(e.target.value)}
          placeholder="যেমন: 499"
          className={inputCls}
        />
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--dim)]">
          প্রিমিয়াম নিলে ছাত্রের সব প্রিমিয়াম লেভেল খুলে যায় (কোন
          লেভেল প্রিমিয়াম, তা ঠিক নিচের অংশে ঠিক করা যায়)। কাউকে
          সরাসরি প্রিমিয়াম দিতে চাইলে ছাত্রছাত্রী তালিকা থেকে
          "প্রিমিয়াম দিন" চাপুন।
        </p>
      </div>
      <div>
        <label htmlFor="set-book-title" className={labelCls}>
          বইয়ের নাম — বই পেজে, রিডারে ও হোমের বই সেকশনে দেখাবে
        </label>
        <input
          id="set-book-title"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          placeholder="Oxford 7000 Words"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="set-book-price" className={labelCls}>
          বইয়ের মূল্য (৳) — বই পেজে ও হোম পেজের বই সেকশনে দেখাবে
        </label>
        <input
          id="set-book-price"
          type="number"
          min={0}
          inputMode="numeric"
          value={bookPrice}
          onChange={(e) => setBookPrice(e.target.value)}
          placeholder="990"
          className={inputCls}
        />
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--dim)]">
          বইয়ের PDF আপলোড ও অ্যাক্সেস ব্যবস্থাপনা "বই (PDF রিডার)" ট্যাবে।
        </p>
      </div>
      <label className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] px-4 py-3.5">
        <input
          type="checkbox"
          checked={bookFree}
          onChange={(e) => setBookFree(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span className="text-sm">
          <span className="block font-bold">বইটি সবার জন্য ফ্রি করুন</span>
          <span className="mt-0.5 block leading-relaxed text-[var(--dim)]">
            চালু থাকলে লগইন করা সব ছাত্রই বইটি ফ্রিতে পড়তে পারবে —
            কেনার দরকার হবে না। যেকোনো সময় বন্ধ করে আবার পেইড করা যাবে।
          </span>
        </span>
      </label>

      <fieldset className="grid gap-3 rounded-2xl border border-[var(--border)] p-4">
        <legend className="px-1.5 text-sm font-extrabold">
          শব্দভান্ডার — কোন লেভেল ফ্রি, কোনটা প্রিমিয়াম
        </legend>
        <p className="text-[13px] leading-relaxed text-[var(--dim)]">
          প্রতিটি লেভেলের পাশে ফ্রি/প্রিমিয়াম বেছে নিন — সেভ করলেই পুরো
          সাইটে (শব্দ, ফ্ল্যাশকার্ড, কুইজ, সার্চ, মক টেস্ট) সাথে সাথে
          বদলে যাবে। প্রিমিয়াম লেভেলের শব্দ শুধু প্রিমিয়াম ছাত্ররাই
          পাবে; কাউকে সরাসরি প্রিমিয়াম দিতে ছাত্রছাত্রী তালিকা ব্যবহার
          করুন।
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEVELS.map((l) => {
            const isFree = freeLevels.includes(l);
            return (
              <div
                key={l}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-alt)] px-3.5 py-2.5"
              >
                <span className="text-[16px] font-extrabold">{l}</span>
                <span
                  className="flex overflow-hidden rounded-full border border-[var(--border)]"
                  role="group"
                  aria-label={`${l} লেভেল — ফ্রি না প্রিমিয়াম`}
                >
                  <button
                    type="button"
                    aria-pressed={isFree}
                    onClick={() =>
                      setFreeLevels((prev) =>
                        prev.includes(l) ? prev : [...prev, l],
                      )
                    }
                    className={`px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                      isFree
                        ? "text-white"
                        : "bg-[var(--surface)] text-[var(--dim)]"
                    }`}
                    style={isFree ? { background: "var(--accent-grad)" } : undefined}
                  >
                    ফ্রি
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isFree}
                    onClick={() =>
                      setFreeLevels((prev) => prev.filter((x) => x !== l))
                    }
                    className={`px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                      !isFree
                        ? "bg-[var(--gold)] text-white"
                        : "bg-[var(--surface)] text-[var(--dim)]"
                    }`}
                  >
                    প্রিমিয়াম
                  </button>
                </span>
              </div>
            );
          })}
        </div>
        {freeLevels.length === 0 && (
          <p className="text-[13px] font-medium text-[var(--peach-strong)]">
            সতর্কতা: সব লেভেল প্রিমিয়াম করা হয়েছে — ফ্রি ছাত্ররা কোনো
            শব্দই পড়তে পারবে না (ডেইলি টাস্কও খালি থাকবে)।
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-[var(--border)] p-4">
        <legend className="px-1.5 text-sm font-extrabold">
          সাইটের লেখা — সেভ করলেই লাইভ বদলে যাবে
        </legend>
        <div>
          <label htmlFor="set-announcement" className={labelCls}>
            ঘোষণা ব্যানার (সব পেজের একদম উপরে দেখাবে; খালি রাখলে দেখাবে না)
          </label>
          <input
            id="set-announcement"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="যেমন: নতুন ব্যাচে ভর্তি চলছে — আজই আবেদন করুন!"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="set-hero-title" className={labelCls}>
            হোম পেজের বড় শিরোনাম (খালি রাখলে আগের শিরোনামটাই থাকবে)
          </label>
          <input
            id="set-hero-title"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="ইংরেজি শব্দ শিখুন, নিজের ভাষায় বুঝে"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="set-hero-sub" className={labelCls}>
            হোম পেজের শিরোনামের নিচের লেখা (খালি রাখলে আগেরটাই থাকবে)
          </label>
          <textarea id="set-hero-sub" rows={3} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="set-book-blurb" className={labelCls}>
            বইয়ের বর্ণনা (বই পেজে ও হোমের বই সেকশনে দেখাবে; খালি রাখলে আগেরটাই)
          </label>
          <textarea id="set-book-blurb" rows={3} value={bookBlurb} onChange={(e) => setBookBlurb(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="set-mentor-quote" className={labelCls}>
            মেন্টর সেকশনের উক্তি (হোম পেজে Jarif Ahmed-এর কথার জায়গায়; খালি রাখলে আগেরটাই)
          </label>
          <textarea id="set-mentor-quote" rows={4} value={mentorQuote} onChange={(e) => setMentorQuote(e.target.value)} className={inputCls} />
        </div>
      </fieldset>
      {saved && <p className="text-sm font-medium text-[var(--accent-strong)]">✓ সেটিংস সেভ হয়েছে — সাইটে এখনই দেখা যাবে</p>}
      <div>
        <button type="submit" disabled={saveMut.isPending} className="btn-primary">
          {saveMut.isPending ? "সেভ হচ্ছে…" : "সেভ করুন"}
        </button>
      </div>
    </form>
    <AdminAccountForm />
    </div>
  );
}

// ---------------- Admin account (login credentials) ----------------

function AdminAccountForm() {
  const [current, setCurrent] = useState("");
  const [email, setEmail] = useState(() => loadAdminEmail());
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.adminChangePassword({
        currentPassword: current,
        newEmail: email.trim(),
        newPassword: next,
      }),
    onSuccess: (r) => {
      if (r.ok) {
        setMsg("✓ অ্যাডমিন লগইন তথ্য আপডেট হয়েছে — পরের লগইনে নতুন তথ্য লাগবে।");
        setError(null);
        setCurrent("");
        setNext("");
      } else {
        setError(r.error ?? "আপডেট করা যায়নি।");
        setMsg(null);
      }
    },
    onError: () => setError("আপডেট করা যায়নি — আবার চেষ্টা করুন।"),
  });

  return (
    <form
      className="card grid gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        setError(null);
        if (!current) return setError("বর্তমান পাসওয়ার্ড লিখুন।");
        if (email.trim().length < 3) return setError("অ্যাডমিন ইমেইল লিখুন।");
        if (next && !isStrongPassword(next))
          return setError(
            "নতুন পাসওয়ার্ড শক্তিশালী হতে হবে — কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা মিলিয়ে।",
          );
        mut.mutate();
      }}
    >
      <h3 className="text-lg font-extrabold tracking-tight">অ্যাডমিন লগইন তথ্য</h3>
      <p className="bn-read-sm -mt-2 text-[var(--dim)]">
        নিজের ইমেইল ও নতুন পাসওয়ার্ড বসিয়ে নিন। নতুন পাসওয়ার্ড খালি
        রাখলে আগেরটাই থাকবে।
      </p>
      <div>
        <label htmlFor="acc-email" className={labelCls}>অ্যাডমিন ইমেইল</label>
        <input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="আপনার অ্যাডমিন ইমেইল" className={inputCls} />
      </div>
      <div>
        <label htmlFor="acc-new" className={labelCls}>নতুন পাসওয়ার্ড (বদলাতে না চাইলে খালি)</label>
        <input id="acc-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর — অক্ষর ও সংখ্যা মিলিয়ে" className={inputCls} />
      </div>
      <div>
        <label htmlFor="acc-current" className={labelCls}>বর্তমান পাসওয়ার্ড (নিশ্চিত করতে) *</label>
        <input id="acc-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-[var(--danger)]">{error}</p>}
      {msg && <p className="text-sm font-medium text-[var(--accent-strong)]">{msg}</p>}
      <div>
        <button type="submit" disabled={mut.isPending} className="btn-primary">
          {mut.isPending ? "আপডেট হচ্ছে…" : "লগইন তথ্য আপডেট করুন"}
        </button>
      </div>
    </form>
  );
}
