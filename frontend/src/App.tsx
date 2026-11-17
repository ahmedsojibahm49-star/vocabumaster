import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import {
AppContext,
loadStudent,
readSession,
saveStudent,
writeSession,
type Page,
type Student,
} from "./lib";
import {
IconBook,
IconClipboard,
IconFacebook,
IconFlame,
IconGrammar,
IconGrid,
IconHome,
IconInstagram,
IconMail,
IconMedal,
IconMoon,
IconSliders,
IconStar,
IconSun,
IconVideo,
IconYoutube,
} from "./icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { HomePage } from "./pages/Home";
import { VocabPage } from "./pages/Vocab";
import { GrammarPage } from "./pages/Grammar";
import { CoursesPage } from "./pages/Courses";
import { CourseDetailPage } from "./pages/CourseDetail";
import { CoursePlayerPage } from "./pages/CoursePlayer";
import { EnrollPage } from "./pages/Enroll";
import { PremiumPage } from "./pages/Premium";
import { BookPage } from "./pages/Book";
import { TestsPage } from "./pages/Tests";
import { DashboardPage } from "./pages/Dashboard";
import { AdminPage } from "./pages/Admin";
import { LoginPage, SignupPage } from "./pages/Auth";

type Theme = "light" | "dark";

/**
 * Top safe-area scrim (phone notch / gesture-bar offset): a strip exactly
 * `safe-area-inset-top` tall in the page background colour. Local
 * replacement for the artifact SDK's SafeAreaTopScrim.
 */
function SafeAreaTopScrim({ backgroundColor }: { backgroundColor: string }) {
  return (
    <div
      aria-hidden
      style={{ height: "env(safe-area-inset-top, 0px)", backgroundColor }}
    />
  );
}


/**
 * Catches any render/runtime error inside a page so one bad page can never
 * blank the whole site: the header and nav stay alive and the student gets
 * a recoverable message with a way back home. Keyed by page in App, so
 * navigating to another page clears the error state automatically.
 */
class PageErrorBoundary extends Component<
  { onHome: () => void; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    // Keep a trace in the console for debugging; the UI stays recoverable.
    console.error("VocabMaster page error:", error);
  }

  override render() {
    if (this.state.failed) {
      return (
        <div className="fade-in mx-auto max-w-xl px-4 pt-16 text-center">
          <h1 className="text-2xl font-bold">দুঃখিত — পেজটা খুলতে সমস্যা হয়েছে</h1>
          <p className="mt-2 text-[var(--dim)]">
            একটা অপ্রত্যাশিত ত্রুটি ঘটেছে। হোম পেজে ফিরে আবার চেষ্টা করুন —
            আপনার প্রোফাইল আর অগ্রগতি সেভই আছে।
          </p>
          <button
            type="button"
            onClick={this.props.onHome}
            className="btn-primary mt-6"
          >
            হোমে ফিরে যান
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Bottom tab bar on phones: the four most-used destinations, always
 * fully visible. Everything else lives in the "আরও" sheet. */
const MOBILE_TABS: { page: Page; label: string; Icon: (p: { size?: number; className?: string; strokeWidth?: number }) => React.ReactNode }[] = [
  { page: "home", label: "হোম", Icon: IconHome },
  { page: "vocab", label: "শব্দভান্ডার", Icon: IconBook },
  { page: "grammar", label: "গ্রামার", Icon: IconGrammar },
  { page: "courses", label: "কোর্স", Icon: IconVideo },
];

/** Destinations inside the mobile "আরও" (more) sheet. */
const MOBILE_MORE: { page: Page; label: string; Icon: (p: { size?: number; className?: string; strokeWidth?: number }) => React.ReactNode }[] = [
  { page: "book", label: "বই", Icon: IconBook },
  { page: "tests", label: "টেস্ট", Icon: IconClipboard },
  { page: "premium", label: "প্রিমিয়াম", Icon: IconMedal },
  { page: "dashboard", label: "ড্যাশবোর্ড", Icon: IconGrid },
];

const NAV: { page: Page; label: string; Icon: (p: { size?: number; className?: string; strokeWidth?: number }) => React.ReactNode }[] = [
  { page: "home", label: "হোম", Icon: IconHome },
  { page: "vocab", label: "শব্দভান্ডার", Icon: IconBook },
  { page: "grammar", label: "গ্রামার", Icon: IconGrammar },
  { page: "courses", label: "কোর্স", Icon: IconVideo },
  { page: "book", label: "বই", Icon: IconBook },
  { page: "tests", label: "টেস্ট", Icon: IconClipboard },
  { page: "premium", label: "প্রিমিয়াম", Icon: IconMedal },
  { page: "dashboard", label: "ড্যাশবোর্ড", Icon: IconGrid },
];

function initialTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem("vocabmaster-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // fall through to the default
  }
  // Default is light (owner's request); the header toggle still switches
  // to dark and that choice is remembered.
  return "light";
}

function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[13px] text-white shadow-[var(--shadow-pop)]"
      style={{
        width: size,
        height: size,
        background: "var(--accent-grad)",
      }}
    >
      <IconBook size={Math.round(size * 0.55)} />
    </span>
  );
}

export function App() {
  const [page, setPage] = useState<Page>("home");
  // The open course lives in React state so the player and the details page
  // always receive it. sessionStorage is only a refresh-persistence mirror:
  // in webviews where storage access throws, a storage-only hand-off lost
  // the id and the details page showed "no course selected".
  const [courseId, setCourseId] = useState<number | null>(() => {
    const raw = readSession("vm-open-course");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  // Same hand-off pattern for the dedicated enrolment page.
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(() => {
    const raw = readSession("vm-enroll-course");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const [student, setStudentState] = useState<Student | null>(() => loadStudent());
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Live site texts the owner edits from the admin panel (announcement
  // banner etc.) — read through the normal settings query, so an admin
  // save shows up across the site without any code change.
  const siteSettings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });
  const announcement = (siteSettings.data?.announcement ?? "").trim();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("vocabmaster-theme", theme);
    } catch {
      // theme simply won't persist
    }
  }, [theme]);

  useEffect(() => {
    // Instant jump: theme.css sets `scroll-behavior: smooth` on <html>,
    // which otherwise ANIMATES this scroll — switching to the login /
    // signup page from deep in a long page made the new page visibly
    // slide/glide instead of opening still (the "page moves" complaint).
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    setMoreOpen(false);
  }, [page]);

  // Content protection (owner's request): casual copying of the learning
  // content is blocked — no right-click menu outside form fields, no
  // copy/cut of selections inside [data-protect] regions (word cards,
  // lesson bodies), and no dragging images out. Form fields keep their
  // normal menus so students can paste passwords etc. This deters casual
  // theft; the shipped JS bundle is also minified build output, and the
  // server code/data never reaches the browser.
  useEffect(() => {
    const inField = (t: EventTarget | null) =>
      t instanceof Element &&
      t.closest("input, textarea, select, [contenteditable='true']") != null;
    const inProtected = (t: EventTarget | null) =>
      t instanceof Element && t.closest("[data-protect]") != null;
    const onContextMenu = (e: MouseEvent) => {
      if (!inField(e.target)) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      const sel = window.getSelection();
      const anchor = sel?.anchorNode;
      const anchorEl =
        anchor instanceof Element ? anchor : (anchor?.parentElement ?? null);
      if (inProtected(anchorEl) || inProtected(e.target)) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  // The sticky bar stays flat at the very top and gains a soft shadow once
  // the page scrolls, so content sliding underneath reads as depth.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctx = useMemo(
    () => ({
      student,
      setStudent: (s: Student | null) => {
        setStudentState(s);
        saveStudent(s);
      },
      go: (p: Page) => setPage(p),
      courseId,
      openCourse: (id: number) => {
        setCourseId(id);
        writeSession("vm-open-course", String(id));
        setPage("course");
      },
      openCourseDetail: (id: number) => {
        setCourseId(id);
        writeSession("vm-open-course", String(id));
        setPage("courseDetail");
      },
      enrollCourseId,
      openEnroll: (id: number) => {
        setEnrollCourseId(id);
        writeSession("vm-enroll-course", String(id));
        setPage("enroll");
      },
      openBookReader: () => {
        writeSession("vm-open-reader", "1");
        setPage("book");
      },
    }),
    [student, courseId, enrollCourseId],
  );

  // Login, signup, admin and the student dashboard are dedicated
  // full-screen app shells (their own sidebar navigation): the site
  // header/nav and footer must NOT render on them.
  const bare: boolean = (
    ["login", "signup", "admin", "dashboard"] as Page[]
  ).includes(page);

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
        <SafeAreaTopScrim backgroundColor="var(--bg)" />

        {!bare && announcement && (
          <div
            className="px-4 py-2.5 pt-safe text-center text-[14px] font-semibold text-white"
            style={{ background: "var(--accent-grad)" }}
            role="status"
          >
            {announcement}
          </div>
        )}

        {!bare && (
        <header
          className={`sticky top-0 z-30 border-b pt-safe backdrop-blur-xl transition-shadow duration-300 ${
            scrolled
              ? "border-[var(--border)] shadow-[0_12px_32px_-16px_rgba(13,19,15,0.25)]"
              : "border-transparent"
          }`}
          style={{ background: "var(--nav-bg)" }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setPage("home")}
              className="flex shrink-0 items-center gap-2.5 text-left"
              aria-label="VocabMaster — হোমে যান"
            >
              <LogoMark />
              <span className="leading-none">
                <span className="block text-[20px] font-extrabold tracking-tight">
                  Vocab<span className="text-[var(--accent)]">Master</span>
                </span>
                <span className="mt-1 hidden text-[11px] font-medium tracking-wide text-[var(--dim)] sm:block">
                  বাংলায় ইংরেজি শিখুন
                </span>
              </span>
            </button>

            <nav
              className="mx-auto hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] p-1 lg:flex"
              aria-label="প্রধান মেনু"
            >
              {NAV.map(({ page: p, label, Icon }) => {
                const active =
                  page === p ||
                  (p === "courses" && (page === "course" || page === "courseDetail"));
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-[14px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[var(--surface)] text-[var(--accent-strong)] shadow-[0_1px_3px_rgba(13,19,15,0.10),0_4px_12px_-6px_rgba(13,19,15,0.20)]"
                        : "text-[var(--dim)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                        active
                          ? "text-white shadow-[var(--shadow-pop)]"
                          : "bg-[var(--surface)] text-[var(--dim)] shadow-[inset_0_0_0_1px_var(--border)]"
                      }`}
                      style={active ? { background: "var(--accent-grad)" } : undefined}
                    >
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    {label}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
              {student && (
                <button
                  type="button"
                  onClick={() => setPage("dashboard")}
                  className="hidden items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-3.5 pr-2 text-sm font-semibold shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] sm:flex"
                  aria-label={`আপনার অগ্রগতি: ${student.xp} XP, ${student.streak} দিনের স্ট্রিক — ড্যাশবোর্ডে যান`}
                >
                  <span className="flex items-center gap-1 text-[var(--gold)]">
                    <IconStar size={16} />
                    {student.xp} XP
                  </span>
                  <span className="h-4 w-px bg-[var(--border)]" aria-hidden />
                  <span className="flex items-center gap-1 text-[var(--peach)]">
                    <IconFlame size={16} />
                    {student.streak}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent-strong)]" aria-hidden>
                    {student.name.trim().charAt(0).toUpperCase() || "S"}
                  </span>
                </button>
              )}
              {!student && (
                <>
                  <button
                    type="button"
                    onClick={() => setPage("login")}
                    aria-current={page === "login" ? "page" : undefined}
                    className="hidden rounded-full px-4 py-2 text-sm font-bold text-[var(--dim)] transition-colors hover:text-[var(--text)] sm:block"
                  >
                    লগইন
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage("signup")}
                    aria-current={page === "signup" ? "page" : undefined}
                    className="btn-primary hidden px-5 py-2.5 text-sm sm:inline-flex"
                  >
                    ফ্রি সাইন আপ
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={
                  theme === "dark"
                    ? "লাইট থিমে বদলান"
                    : "ডার্ক থিমে বদলান"
                }
                aria-pressed={theme === "dark"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] shadow-[var(--shadow-card)] transition-all hover:rotate-12 hover:text-[var(--text)]"
              >
                {theme === "dark" ? <IconSun size={19} /> : <IconMoon size={19} />}
              </button>
            </div>
          </div>

          {/* No second nav row on phones: the app-style bottom tab
              bar below replaces the old horizontally scrolling pill
              row, which hid half its items off-screen and read as a
              broken nav bar. */}
        </header>
        )}

        {!bare && (
          <>
            {/* Mobile bottom tab bar */}
            <nav
              aria-label="প্রধান মেনু (মোবাইল)"
              className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] pb-safe backdrop-blur-xl lg:hidden"
              style={{ background: "var(--nav-bg)" }}
            >
              <div className="grid grid-cols-5">
                {MOBILE_TABS.map(({ page: p, label, Icon }) => {
                  const active =
                    page === p ||
                    (p === "courses" &&
                      (page === "course" || page === "courseDetail" || page === "enroll"));
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={active ? "page" : undefined}
                      className={`flex flex-col items-center gap-1 px-1 pb-1.5 pt-2 text-[11.5px] font-semibold transition-colors ${
                        active ? "text-[var(--accent-strong)]" : "text-[var(--dim)]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
                          active ? "text-white shadow-[var(--shadow-pop)]" : ""
                        }`}
                        style={active ? { background: "var(--accent-grad)" } : undefined}
                      >
                        <Icon size={19} strokeWidth={1.9} />
                      </span>
                      {label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={moreOpen}
                  className={`flex flex-col items-center gap-1 px-1 pb-1.5 pt-2 text-[11.5px] font-semibold transition-colors ${
                    MOBILE_MORE.some((m) => m.page === page)
                      ? "text-[var(--accent-strong)]"
                      : "text-[var(--dim)]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
                      MOBILE_MORE.some((m) => m.page === page)
                        ? "text-white shadow-[var(--shadow-pop)]"
                        : ""
                    }`}
                    style={
                      MOBILE_MORE.some((m) => m.page === page)
                        ? { background: "var(--accent-grad)" }
                        : undefined
                    }
                  >
                    <IconGrid size={19} strokeWidth={1.9} />
                  </span>
                  আরও
                </button>
              </div>
            </nav>

            {/* "আরও" sheet: the remaining destinations + account entry */}
            {moreOpen && (
              <div
                className="fixed inset-0 z-50 lg:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="আরও পেজ"
              >
                <button
                  type="button"
                  aria-label="মেনু বন্ধ করুন"
                  onClick={() => setMoreOpen(false)}
                  className="absolute inset-0 h-full w-full bg-black/45"
                />
                <div className="fade-in absolute inset-x-0 bottom-0 rounded-t-[26px] border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-safe pt-3 shadow-[var(--shadow-lift)]">
                  <div
                    aria-hidden
                    className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[var(--border-strong)]"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {MOBILE_MORE.map(({ page: p, label, Icon }) => {
                      const active = page === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          aria-current={active ? "page" : undefined}
                          className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-3.5 text-[13px] font-bold text-[var(--text)]"
                        >
                          <span
                            aria-hidden
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              active
                                ? "text-white shadow-[var(--shadow-pop)]"
                                : "bg-[var(--surface)] text-[var(--accent-strong)] shadow-[inset_0_0_0_1px_var(--border)]"
                            }`}
                            style={active ? { background: "var(--accent-grad)" } : undefined}
                          >
                            <Icon size={19} strokeWidth={1.9} />
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {student ? (
                    <button
                      type="button"
                      onClick={() => setPage("dashboard")}
                      className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-left"
                    >
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-strong)]"
                      >
                        {student.name.trim().charAt(0).toUpperCase() || "S"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {student.name}
                        </span>
                        <span className="block text-[12.5px] text-[var(--dim)]">
                          ড্যাশবোর্ডে আপনার অগ্রগতি দেখুন
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--gold)]">
                        <IconStar size={15} /> {student.xp} XP
                      </span>
                    </button>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
                      <button
                        type="button"
                        onClick={() => setPage("login")}
                        className="btn-outline w-full"
                      >
                        লগইন
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage("signup")}
                        className="btn-primary w-full"
                      >
                        ফ্রি সাইন আপ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <main className={bare ? undefined : "pb-24"}>
          <PageErrorBoundary key={page} onHome={() => setPage("home")}>
            {page === "home" && <HomePage />}
            {page === "vocab" && <VocabPage />}
            {page === "grammar" && <GrammarPage />}
            {page === "courses" && <CoursesPage />}
            {page === "courseDetail" && <CourseDetailPage />}
            {page === "course" && <CoursePlayerPage />}
            {page === "enroll" && <EnrollPage />}
            {page === "premium" && <PremiumPage />}
            {page === "book" && <BookPage />}
            {page === "login" && <LoginPage />}
            {page === "signup" && <SignupPage />}
            {page === "tests" && <TestsPage />}
            {page === "dashboard" && <DashboardPage />}
            {page === "admin" && <AdminPage />}
          </PageErrorBoundary>
        </main>

        {!bare && (
        <footer className="border-t border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.3fr_1fr_1.2fr]">
            <div>
              <p className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
                <LogoMark size={34} />
                <span>
                  Vocab<span className="text-[var(--accent)]">Master</span>
                </span>
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--dim)]">
                English-এ দুর্বল ছাত্রদের জন্য — বাংলায় বুঝে ইংরেজি শেখার
                জায়গা। শব্দভান্ডার: Oxford 7000 Words (A1–C2) + IELTS 600,
                লেখক Jarif Ahmed।
              </p>
              <div className="mt-4 flex gap-2">
                {[
                  { href: "https://www.youtube.com/@Ahmed_Sojib49", label: "YouTube — @Ahmed_Sojib49", Icon: IconYoutube },
                  { href: "https://www.facebook.com/profile.php?id=61592780512649", label: "Facebook", Icon: IconFacebook },
                  { href: "https://www.instagram.com/ahmjarif49/", label: "Instagram — @ahmjarif49", Icon: IconInstagram },
                  { href: "mailto:ahmedsojibahmso@gmail.com", label: "ইমেইল করুন", Icon: IconMail },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    {...(href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            <nav aria-label="ফুটার মেনু">
              <p className="text-[13px] font-bold uppercase tracking-wider text-[var(--dim)]">শিখুন</p>
              <ul className="mt-3.5 grid gap-0.5 text-[15px]">
                {NAV.slice(1).map(({ page: p, label }) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className="py-1.5 font-medium text-[var(--dim)] transition-colors hover:text-[var(--accent-strong)]"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-[var(--dim)]">যোগাযোগ</p>
              <ul className="mt-3.5 grid gap-0.5 text-[15px]">
                <li>
                  <a
                    className="flex items-center gap-2 py-1.5 font-medium text-[var(--dim)] transition-colors hover:text-[var(--text)]"
                    href="mailto:ahmedsojibahmso@gmail.com"
                  >
                    <IconMail size={16} /> ahmedsojibahmso@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-2 py-1.5 font-medium text-[var(--dim)] transition-colors hover:text-[var(--text)]"
                    href="https://www.youtube.com/@Ahmed_Sojib49"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconYoutube size={16} /> YouTube — @Ahmed_Sojib49
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-2 py-1.5 font-medium text-[var(--dim)] transition-colors hover:text-[var(--text)]"
                    href="https://www.facebook.com/profile.php?id=61592780512649"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconFacebook size={16} /> Facebook
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-2 py-1.5 font-medium text-[var(--dim)] transition-colors hover:text-[var(--text)]"
                    href="https://www.instagram.com/ahmjarif49/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconInstagram size={16} /> Instagram — @ahmjarif49
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-[var(--border)] px-4 py-5 text-center text-[13px] text-[var(--dim)]">
            <p>
              © ২০২৬ VocabMaster · Jarif Ahmed — ভালোবাসা দিয়ে বাংলাদেশি
              শিক্ষার্থীদের জন্য
            </p>
            <button
              type="button"
              onClick={() => setPage("admin")}
              aria-current={page === "admin" ? "page" : undefined}
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[var(--accent-strong)]"
            >
              <IconSliders size={14} />
              অ্যাডমিন লগইন / প্যানেল
            </button>
          </div>
        </footer>
        )}

        {/* Spacer so the fixed mobile tab bar never covers the footer. */}
        {!bare && <div aria-hidden className="h-[74px] lg:hidden" />}
      </div>
    </AppContext.Provider>
  );
}
