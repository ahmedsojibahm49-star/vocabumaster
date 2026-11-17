import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import {
bnNum,
LEVEL_BLURB,
LEVELS,
useAccessSettings,
useApp,
writeSession,
type Course,
} from "../lib";
import { CourseCover, EmptyNote, Spinner, useStudentSets, WordCard } from "../components";
import {
IconArrowRight,
IconBook,
IconCalendar,
IconCheck,
IconClipboard,
IconDownload,
IconFacebook,
IconFlame,
IconGrammar,
IconInstagram,
IconLayers,
IconLock,
IconMail,
IconMedal,
IconMessage,
IconPlus,
IconQuote,
IconRoute,
IconSearch,
IconSparkle,
IconStar,
IconTarget,
IconVideo,
IconVolume,
IconYoutube,
} from "../icons";
import { speak } from "../lib";
import heroImg from "../assets/hero.webp";
import coverImg from "../assets/book-cover.png";
import authorImg from "../assets/author-photo.jpg";
import samplePdf from "../assets/free-sample.pdf";

const YOUTUBE = "https://www.youtube.com/@Ahmed_Sojib49";
const INSTAGRAM = "https://www.instagram.com/ahmjarif49/";
const FACEBOOK = "https://www.facebook.com/profile.php?id=61592780512649";
const EMAIL = "ahmedsojibahmso@gmail.com";

export function HomePage() {
  const { go, student, openBookReader } = useApp();
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.getStats({}) });
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.listCourses({}),
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });
  // Free/premium levels follow the admin's live setting, plus this
  // student's personal level grants.
  const { isPremiumLevel, canOpenLevel, grantedLevels, bookTitle, bookFree } =
    useAccessSettings(student);
  const [heroQuery, setHeroQuery] = useState("");

  const levelCount = (lvl: string) =>
    stats.data?.byLevel.find((b) => b.level === lvl)?.count ?? 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    writeSession("vm-pending-search", heroQuery);
    go("vocab");
  };

  return (
    <div className="fade-in">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="hero-dots pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-4 pt-8 sm:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div>
              <p className="eyebrow">
                <IconSparkle size={15} className="text-[var(--peach)]" />
                English-এ দুর্বলদের জন্য, বাংলায় শেখা
              </p>
              {settings.data?.heroTitle ? (
                <h1 className="mt-6 text-[42px] font-extrabold leading-[1.12] tracking-tight sm:text-6xl sm:leading-[1.08]">
                  {settings.data.heroTitle}
                </h1>
              ) : (
              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05]">
                ইংরেজি শব্দ শিখুন,
                <br />
                <span className="relative inline-block text-[var(--accent)]">
                  নিজের ভাষায় বুঝে
                  <svg
                    className="absolute -bottom-2.5 left-0 w-full"
                    viewBox="0 0 220 10"
                    fill="none"
                    aria-hidden
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3 8C70 3 150 3 217 7"
                      stroke="var(--peach)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              )}
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--dim)]">
                {settings.data?.heroSubtitle ||
                  "৭,০০০ অক্সফোর্ড শব্দ + IELTS-এর ৬০০ শব্দ — প্রতিটির বাংলা অর্থ, বাংলা উচ্চারণ, USA ও UK উচ্চারণের পার্থক্য, সমার্থক-বিপরীত শব্দ আর উদাহরণ। সাথে সাজানো গ্রামার লেসন, কুইজ আর প্রতিদিনের টাস্ক।"}
              </p>
              <form onSubmit={submitSearch} className="search-pill mt-8 max-w-lg">
                <IconSearch size={20} className="ml-3 shrink-0 text-[var(--dim)]" />
                <input
                  aria-label="শব্দ খুঁজুন"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="যেকোনো শব্দ খুঁজুন — যেমন: abandon"
                  className="min-w-0 flex-1 bg-transparent py-2 text-[15.5px] outline-none placeholder:text-[var(--dim)]"
                />
                <button
                  type="submit"
                  className="btn-primary shrink-0 px-6 py-2.5"
                >
                  খুঁজুন
                </button>
              </form>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => go("tests")}
                  className="btn-warm"
                >
                  <IconTarget size={18} />
                  ফ্রি লেভেল টেস্ট দিন
                </button>
                <button
                  type="button"
                  onClick={() => go("vocab")}
                  className="btn-outline"
                >
                  শব্দভান্ডার ঘুরে দেখুন
                  <IconArrowRight size={18} />
                </button>
              </div>
              {stats.data && (
                <dl className="mt-10 flex flex-wrap items-stretch gap-x-8 gap-y-4">
                  <div>
                    <dt className="text-[13px] font-medium text-[var(--dim)]">মোট শব্দ</dt>
                    <dd className="mt-0.5 text-[26px] font-extrabold tracking-tight">{bnNum(stats.data.totalWords)}+</dd>
                  </div>
                  <div className="border-l border-[var(--border)] pl-8">
                    <dt className="text-[13px] font-medium text-[var(--dim)]">গ্রামার লেসন</dt>
                    <dd className="mt-0.5 text-[26px] font-extrabold tracking-tight">{bnNum(stats.data.lessonCount)}টি</dd>
                  </div>
                  <div className="border-l border-[var(--border)] pl-8">
                    <dt className="text-[13px] font-medium text-[var(--dim)]">লেভেল</dt>
                    <dd className="mt-0.5 text-[26px] font-extrabold tracking-tight">A1 – C2 + IELTS</dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
              <img
                src={heroImg}
                alt="বাংলাদেশি শিক্ষার্থীরা একসাথে বসে ইংরেজি শব্দ শিখছে — বই, নোটবুক আর ল্যাপটপ ঘিরে"
                className="w-full rounded-[32px] border border-[var(--border)] object-cover shadow-[var(--shadow-lift)]"
              />
              {/* Floating word-of-the-day glass card (a real word from the book) */}
              <div className="glass-chip float-slow absolute -left-2 top-5 flex items-center gap-3 px-4 py-3 sm:left-5">
                <span className="icon-chip h-10 w-10 rounded-xl">
                  <IconBook size={20} />
                </span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--dim)]">
                    বইয়ের শব্দ
                  </span>
                  <span className="block text-[15px] font-bold leading-tight">
                    abandon{" "}
                    <span className="font-semibold text-[var(--accent-strong)]">— পরিত্যাগ করা</span>
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="abandon — উচ্চারণ শুনুন"
                  onClick={() => speak("abandon", "US")}
                  className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] transition-transform hover:scale-105"
                >
                  <IconVolume size={17} />
                </button>
              </div>
              {/* Floating daily-XP chip */}
              <div className="glass-chip float-slower absolute -right-2 bottom-16 flex items-center gap-2.5 px-4 py-3 sm:right-5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{ background: "var(--peach-grad)" }}
                >
                  <IconFlame size={18} />
                </span>
                <span className="text-[13.5px] font-bold leading-tight">
                  ডেইলি টাস্কে +৫০ XP
                  <span className="block text-[12px] font-medium text-[var(--dim)]">প্রতিদিন ১০টি নতুন শব্দ</span>
                </span>
              </div>
              <img
                src={coverImg}
                alt="Oxford 7000 Words বইয়ের কভার"
                className="absolute -bottom-6 left-4 w-24 rotate-[-5deg] rounded-lg shadow-[var(--shadow-lift)] ring-4 ring-[var(--surface)] sm:w-28"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Daily task ---------- */}
      <DailyTaskCard />

      {/* ---------- Step-by-step spoken path ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="icon-chip h-11 w-11 rounded-2xl">
              <IconRoute size={22} />
            </span>
            একা একা স্পোকেন শেখার পথ
          </h2>
          <p className="bn-read mt-3 text-[var(--dim)]">
            শিক্ষক ছাড়াই শেখা যায় — যদি ক্রমটা ঠিক থাকে। এই ৫ ধাপে এগোন:
            শব্দ দিয়ে ভিত্তি, বাক্য দিয়ে গাঁথুনি, তারপর মুখে বলার অভ্যাস।
          </p>
        </div>
        <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              Icon: IconBook,
              title: "শব্দ শেখো",
              text: "প্রতিদিন ১০টি শব্দ, বাংলা অর্থ ও উচ্চারণসহ",
              page: "vocab" as const,
            },
            {
              Icon: IconLayers,
              title: "বাক্য বানাও",
              text: "Sentence Builder দিয়ে নিজে বাক্য গড়ো",
              page: "grammar" as const,
            },
            {
              Icon: IconGrammar,
              title: "নিয়ম বুঝো",
              text: "বাংলায় ব্যাখ্যা করা গ্রামার লেসন একে একে",
              page: "grammar" as const,
            },
            {
              Icon: IconMessage,
              title: "মুখে বলো",
              text: "প্যাটার্ন বাক্যগুলো শুনে জোরে জোরে বলো",
              page: "grammar" as const,
            },
            {
              Icon: IconClipboard,
              title: "যাচাই করো",
              text: "কুইজ আর টেস্টে নিজের অগ্রগতি মাপো",
              page: "tests" as const,
            },
          ].map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => go(s.page)}
                className="card card-hover group relative h-full w-full p-5 text-left"
              >
                <span
                  aria-hidden
                  className="absolute right-4 top-3.5 text-[24px] font-extrabold leading-none text-[var(--surface-hover)]"
                >
                  {bnNum(i + 1)}
                </span>
                <span className="icon-chip h-11 w-11 rounded-2xl">
                  <s.Icon size={21} />
                </span>
                <span className="mt-3 block text-[16px] font-bold">{s.title}</span>
                <span className="bn-read-sm mt-1 block text-[var(--dim)]">{s.text}</span>
                <span className="mt-3 flex items-center gap-1 text-sm font-bold text-[var(--accent-strong)]">
                  শুরু করুন
                  <IconArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Learning paths ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">লেভেল অনুযায়ী শিখুন</h2>
          <p className="mt-2 text-[17px] leading-relaxed text-[var(--dim)]">
            আপনার লেভেল যেটাই হোক, সেখান থেকেই শুরু করুন — প্রতিটি শব্দের বাংলা
            অর্থ ও দুই উচ্চারণসহ।
          </p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lvl) => {
            const lvlLocked = !canOpenLevel(lvl);
            const lvlGifted =
              isPremiumLevel(lvl) &&
              !(student?.premium ?? false) &&
              grantedLevels.includes(lvl);
            return (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                writeSession("vm-pending-level", lvl);
                go("vocab");
              }}
              aria-label={
                lvlLocked
                  ? `${lvl} — প্রিমিয়াম লেভেল, বিস্তারিত দেখুন`
                  : `${lvl} লেভেল শুরু করুন`
              }
              className="card card-hover group p-6 text-left"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-[34px] font-extrabold leading-none tracking-tight text-[var(--accent)]">{lvl}</span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[13px] font-bold">
                    {stats.data ? `${bnNum(levelCount(lvl))} শব্দ` : ""}
                  </span>
                  {isPremiumLevel(lvl) &&
                    (lvlLocked ? (
                      <span
                        className="inline-flex items-center justify-center rounded-full bg-[var(--gold-soft)] p-1.5 text-[var(--gold)]"
                        aria-label="প্রিমিয়াম লেভেল"
                        title="প্রিমিয়াম লেভেল"
                      >
                        <IconLock size={12} />
                      </span>
                    ) : lvlGifted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-soft)] px-2.5 py-1 text-[12px] font-extrabold text-[var(--gold)]">
                        <IconMedal size={12} /> ফ্রি দেওয়া
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[12px] font-extrabold text-[var(--accent-strong)]">
                        <IconMedal size={12} /> প্রিমিয়ামে খোলা
                      </span>
                    ))}
                  {!isPremiumLevel(lvl) && (
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[12px] font-extrabold text-[var(--accent-strong)]">
                      ফ্রি
                    </span>
                  )}
                </span>
              </span>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--dim)]">{LEVEL_BLURB[lvl]}</p>
              <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[var(--accent-strong)]">
                {lvlLocked ? "প্রিমিয়ামে এই লেভেল খুলুন" : "এই লেভেল শুরু করুন"}
                <IconArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>
            );
          })}
          <button
            type="button"
            onClick={() => go("grammar")}
            className="card card-hover group p-6 text-left"
            style={{ background: "var(--peach-soft)", borderColor: "transparent" }}
          >
            <span className="flex items-start justify-between">
              <span className="flex items-center gap-2.5 text-[26px] font-extrabold leading-none tracking-tight">
                <IconGrammar size={30} className="text-[var(--peach)]" />
                গ্রামার
              </span>
              <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[13px] font-bold">
                {stats.data ? `${bnNum(stats.data.lessonCount)} লেসন` : ""}
              </span>
            </span>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--dim)]">
              Tense, Article, Preposition, Conditional — বাংলায় সহজ করে, ভুলের
              উদাহরণসহ
            </p>
            <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[var(--peach-strong)]">
              গ্রামার শিখুন
              <IconArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => go("premium")}
            className="card card-hover group p-6 text-left"
            style={{
              background:
                "linear-gradient(150deg, var(--gold-soft) 0%, var(--surface) 60%)",
              borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)",
            }}
          >
            <span className="flex items-start justify-between">
              <span className="flex items-center gap-2.5 text-[26px] font-extrabold leading-none tracking-tight">
                <IconMedal size={30} className="text-[var(--gold)]" />
                Premium
              </span>
              <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[13px] font-bold">
                B1 – IELTS
              </span>
            </span>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--dim)]">
              A1/A2 ফ্রি — প্রিমিয়াম নিলে B1, B2, C1, C2 ও IELTS-এর সব শব্দ,
              ফ্ল্যাশকার্ড, কুইজ আর মক টেস্ট খুলে যাবে
            </p>
            <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[var(--gold)]">
              {student?.premium ? "আপনার প্রিমিয়াম সক্রিয়" : "প্রিমিয়াম সম্পর্কে জানুন"}
              <IconArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">শেখার সব টুল, এক জায়গায়</h2>
          <p className="mt-2 text-[17px] leading-relaxed text-[var(--dim)]">
            টেস্ট দিয়ে লেভেল জানুন, প্রতিদিনের টাস্কে অভ্যাস গড়ুন, আর ফ্রি
            ভিডিও ক্লাসে বুঝে নিন কঠিন জায়গাগুলো।
          </p>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: IconTarget,
              tint: "var(--accent-soft)",
              tintText: "var(--accent-strong)",
              title: "ফ্রি লেভেল টেস্ট",
              text: "২০টি প্রশ্নে জেনে নিন আপনি A1 নাকি B2 — কোন লেভেল থেকে শুরু করবেন।",
              page: "tests" as const,
            },
            {
              Icon: IconClipboard,
              tint: "var(--gold-soft)",
              tintText: "var(--gold)",
              title: "IELTS মক টেস্ট",
              text: "IELTS ও উন্নত লেভেলের শব্দ দিয়ে সময়-ধরা প্র্যাকটিস টেস্ট।",
              page: "tests" as const,
            },
            {
              Icon: IconFlame,
              tint: "var(--peach-soft)",
              tintText: "var(--peach)",
              title: "ডেইলি টাস্ক ও স্ট্রিক",
              text: "প্রতিদিন ১০টি নতুন শব্দ শিখলেই XP আর স্ট্রিক — অভ্যাসটাই আসল।",
              page: "dashboard" as const,
            },
            {
              Icon: IconVideo,
              tint: "var(--accent-soft)",
              tintText: "var(--accent-strong)",
              title: "ফ্রি ভিডিও ক্লাস",
              text: "YouTube চ্যানেলে ফ্রি ক্লাস — বেসিক থেকে স্পোকেন পর্যন্ত।",
              page: "courses" as const,
            },
          ].map((f) => (
            <button
              key={f.title}
              type="button"
              onClick={() => go(f.page)}
              className="card card-hover group p-6 text-left"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: f.tint, color: f.tintText }}
              >
                <f.Icon size={24} />
              </span>
              <h3 className="mt-4 text-[17px] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--dim)]">{f.text}</p>
              <span className="mt-3.5 flex items-center gap-1 text-sm font-bold text-[var(--accent-strong)]">
                শুরু করুন
                <IconArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Courses ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">কোর্সসমূহ</h2>
            <p className="mt-2 text-[17px] text-[var(--dim)]">
              পেমেন্ট bKash/Nagad-এ — যাচাই শেষে অ্যাক্সেস চালু হয়।
            </p>
          </div>
          <button
            type="button"
            onClick={() => go("courses")}
            className="flex shrink-0 items-center gap-1.5 font-bold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
          >
            সব দেখুন
            <IconArrowRight size={17} />
          </button>
        </div>
        <div className="mt-7">
          {courses.isPending ? (
            <Spinner label="কোর্স লোড হচ্ছে…" />
          ) : (courses.data?.courses.length ?? 0) === 0 ? (
            <EmptyNote>
              নতুন কোর্স শীঘ্রই আসছে। ততদিন ফ্রি শব্দভান্ডার, গ্রামার লেসন আর
              লেভেল টেস্ট দিয়ে শেখা চালিয়ে যান।
            </EmptyNote>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.data?.courses.slice(0, 3).map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Book ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div
          className="relative grid items-center gap-8 overflow-hidden rounded-[32px] p-7 text-white shadow-[var(--shadow-lift)] sm:p-10 lg:grid-cols-[auto_1fr_auto]"
          style={{ background: "linear-gradient(135deg, #0c453c 0%, #083028 100%)" }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-white/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full border-[24px] border-white/5"
            aria-hidden
          />
          <img
            src={coverImg}
            alt="Oxford 7000 Words — A1 to C2 Level বইয়ের কভার"
            className="relative mx-auto w-44 -rotate-3 rounded-lg shadow-[0_24px_44px_rgba(0,0,0,0.45)] ring-1 ring-white/20 sm:w-52"
          />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {bookTitle} — বইটি
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-white/85">
              {settings.data?.bookBlurb ||
                "এই ওয়েবসাইটের শব্দভান্ডার এসেছে এই বই থেকেই। বইটি কিনলেই পুরো বইটি ওয়েবসাইটের ভিতরেই পড়তে পারবেন — প্রতিটি শব্দের বাংলা অর্থ, সহজ উচ্চারণ (USA ও UK আলাদা), সমার্থক ও বিপরীত শব্দ, আর উদাহরণ বাক্য — A1 থেকে C2, সাথে IELTS-এর ৬০০ শব্দ।"}
            </p>
            <ul className="mt-5 grid max-w-xl gap-2.5 text-[15px] text-white/90 sm:grid-cols-2">
              <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />মোট ৭,৬০০ শব্দ (৭,০০০ + IELTS ৬০০)</li>
              <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />USA ও UK — দুই উচ্চারণ আলাদা করে</li>
              <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />প্রতিটি শব্দে উদাহরণ বাক্য + বাংলা</li>
              <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />লেখক: Jarif Ahmed</li>
            </ul>
            {bookFree ? (
              <p className="mt-6 text-4xl font-extrabold tracking-tight">
                এখন সবার জন্য ফ্রি{" "}
                <span className="text-base font-medium text-white/70">
                  — লগইন করলেই ওয়েবসাইটে পড়ুন
                </span>
              </p>
            ) : (
              <p className="mt-6 text-4xl font-extrabold tracking-tight">
                ৳{bnNum(settings.data?.bookPrice ?? 990)}{" "}
                <span className="text-base font-medium text-white/70">
                  — কিনলেই ওয়েবসাইটে পড়ুন
                </span>
              </p>
            )}
          </div>
          <div className="relative flex flex-col gap-3">
            <button
              type="button"
              onClick={() =>
                student && (student.bookAccess || bookFree)
                  ? openBookReader()
                  : go("book")
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-center font-bold text-[#083028] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <IconBook size={18} />
              {student?.bookAccess || bookFree ? "আপনার বইটি পড়ুন" : "বইটি কিনুন ও পড়ুন"}
            </button>
            <a
              href={samplePdf}
              download="VocabMaster-Oxford-7000-Words-Sample.pdf"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 px-6 py-3.5 text-center font-bold text-white transition-colors hover:bg-white/10"
            >
              <IconDownload size={18} />
              ফ্রি স্যাম্পল (PDF) — ১৫ পৃষ্ঠা
            </a>
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent("Oxford 7000 Words বইটি কিনতে চাই")}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 px-6 py-3.5 text-center font-bold text-white transition-colors hover:bg-white/10"
            >
              <IconMail size={18} />
              ইমেইলে অর্ডার করুন
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Mentor ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div
          className="relative overflow-hidden rounded-[32px] border border-[var(--border)] shadow-[var(--shadow-card)]"
          style={{
            background:
              "linear-gradient(120deg, var(--accent-soft) 0%, var(--surface) 55%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[26px] border-[var(--accent)] opacity-[0.07]"
            aria-hidden
          />
          <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr]">
            <div className="relative mx-auto lg:mx-0">
              <img
                src={authorImg}
                alt="Jarif Ahmed — লেখক ও মেন্টর"
                className="h-52 w-52 rounded-[28px] object-cover shadow-[var(--shadow-lift)] ring-1 ring-[var(--border)] sm:h-60 sm:w-60"
              />
              <span
                className="glass-chip absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap px-4 py-2 text-[13px] font-bold"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--accent-grad)" }}
                  aria-hidden
                >
                  <IconStar size={13} />
                </span>
                Oxford 7000 Words-এর লেখক
              </span>
            </div>
            <div>
              <p className="eyebrow">
                <IconQuote size={14} className="text-[var(--accent)]" />
                আপনার মেন্টর
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Jarif Ahmed
              </h2>
              <blockquote className="bn-read mt-4 max-w-2xl text-[var(--text)]">
                {settings.data?.mentorQuote ||
                  "\"আমি নিজে জানি English-এ দুর্বল হওয়ার কষ্টটা কেমন — ক্লাসে উত্তর জানা থাকলেও মুখে আসে না। তাই এই বই আর এই ওয়েবসাইট বানিয়েছি ঠিক সেই ছাত্রদের জন্য: যারা ইংরেজিতে দুর্বল, কিন্তু সত্যিই শিখতে চায়। কঠিন নিয়ম মুখস্থ নয় — বাংলায় বুঝে, প্রতিদিন একটু একটু করে।\""}
              </blockquote>
              <ul className="mt-5 flex flex-wrap gap-2 text-[13.5px] font-semibold">
                <li className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 shadow-[var(--shadow-card)]">
                  ৭,৬০০ শব্দের বইয়ের লেখক
                </li>
                <li className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 shadow-[var(--shadow-card)]">
                  YouTube-এ ফ্রি ক্লাস
                </li>
                <li className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 shadow-[var(--shadow-card)]">
                  বাংলায় সহজ ব্যাখ্যা
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <a
                  href={YOUTUBE}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary px-5 py-2.5"
                >
                  <IconYoutube size={17} /> ফ্রি ক্লাস দেখুন
                </a>
                <a
                  href={FACEBOOK}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-soft shadow-[var(--shadow-card)]"
                  style={{ background: "var(--surface)" }}
                >
                  <IconFacebook size={17} /> Facebook
                </a>
                <a
                  href={INSTAGRAM}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-soft shadow-[var(--shadow-card)]"
                  style={{ background: "var(--surface)" }}
                >
                  <IconInstagram size={17} /> Instagram
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="btn-soft shadow-[var(--shadow-card)]"
                  style={{ background: "var(--surface)" }}
                >
                  <IconMail size={17} /> ইমেইল
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">সাধারণ প্রশ্ন</h2>
          <p className="mt-2 text-[17px] text-[var(--dim)]">
            শুরু করার আগে যা যা জানতে চাইতে পারেন।
          </p>
        </div>
        <div className="mt-7 grid gap-3 lg:grid-cols-2">
          {[
            {
              q: "আমি একদম শুরু থেকে শিখতে চাই — পারব?",
              a: "অবশ্যই। A1 লেভেলটা একদম শূন্য থেকে শুরু — প্রতিটি শব্দের বাংলা অর্থ আর বাংলা উচ্চারণ দেওয়া আছে, যাতে না বুঝে মুখস্থ করতে না হয়। আগে ফ্রি লেভেল টেস্ট দিয়ে দেখুন আপনি কোথায় আছেন।",
            },
            {
              q: "USA আর UK উচ্চারণ আলাদা কেন?",
              a: "কারণ দুটো আসলেই আলাদা শোনায় — যেমন water: আমেরিকানরা বলে waw·tuhr, ব্রিটিশরা waw·tuh। বই আর সাইটে দুটোই আলাদা করে দেওয়া, সাথে যন্ত্রের উচ্চারণ শোনার বোতামও আছে।",
            },
            {
              q: "কোর্সে ভর্তি হব কীভাবে?",
              a:
                settings.data?.paymentNote ||
                "ইমেইল বা সোশ্যাল মিডিয়ায় যোগাযোগ করে bKash/Nagad নম্বর নিন। পেমেন্টের পর ট্রানজ্যাকশন আইডিসহ আবেদন করুন — যাচাই শেষে অ্যাক্সেস চালু করা হবে।",
            },
            {
              q: "IELTS-এর জন্য কী আছে?",
              a: "IELTS-এর বাছাই করা ৬০০ শব্দের আলাদা সেকশন, সেই শব্দ দিয়ে মক টেস্ট, আর C1–C2 লেভেলের উন্নত শব্দভান্ডার — সবই বাংলা অর্থসহ।",
            },
            {
              q: "প্রতিদিন কতক্ষণ পড়ব?",
              a: "ডেইলি টাস্কের ১০টি শব্দ মন দিয়ে শিখতে ১৫–২০ মিনিটই যথেষ্ট। একদিনে অনেক না পড়ে প্রতিদিন অল্প — স্ট্রিকটাই ধরে রাখুন।",
            },
          ].map((f) => (
            <details
              key={f.q}
              className="card group px-6 py-5"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-[16.5px] font-bold">
                {f.q}
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--dim)] transition-transform duration-300 group-open:rotate-45"
                >
                  <IconPlus size={16} />
                </span>
              </summary>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--dim)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div
          className="relative overflow-hidden rounded-[32px] px-7 py-10 text-center text-white shadow-[var(--shadow-lift)] sm:px-10 sm:py-14"
          style={{ background: "var(--accent-grad)" }}
        >
          <div
            className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full border-[24px] border-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-28 -right-14 h-72 w-72 rounded-full border-[28px] border-white/10"
            aria-hidden
          />
          <h2 className="relative mx-auto max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            আজ থেকেই শুরু করুন — প্রথম ধাপটা ফ্রি
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/85">
            লেভেল টেস্ট দিয়ে জেনে নিন কোথা থেকে শুরু করবেন, তারপর প্রতিদিন
            ১০টি করে শব্দ — কয়েক সপ্তাহেই নিজেই ফারাকটা বুঝবেন।
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => go("tests")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-[var(--accent-strong)] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <IconTarget size={18} />
              ফ্রি লেভেল টেস্ট দিন
            </button>
            <button
              type="button"
              onClick={() => go("vocab")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-7 py-3.5 font-bold text-white transition-colors hover:bg-white/10"
            >
              শব্দ শেখা শুরু করুন
              <IconArrowRight size={18} />
            </button>
          </div>
        </div>
        {!student && (
          <div className="card mx-auto mt-8 flex max-w-2xl flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold tracking-tight">
                অগ্রগতি সেভ রাখতে অ্যাকাউন্ট খুলুন
              </h3>
              <p className="bn-read-sm mt-1 text-[var(--dim)]">
                লগইন থাকলে XP, স্ট্রিক, বুকমার্ক আর কোর্সের অগ্রগতি সব সেভ
                থাকে — যেকোনো সময় ফিরে এসে যেখানে ছিলেন সেখান থেকে শুরু।
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-center gap-2.5">
              <button type="button" onClick={() => go("login")} className="btn-primary px-6">
                লগইন
              </button>
              <button type="button" onClick={() => go("signup")} className="btn-outline px-6">
                ফ্রি সাইন আপ
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function CourseCard({ course }: { course: Course }) {
  const { openCourse, openCourseDetail } = useApp();
  const features = course.features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => openCourseDetail(course.id)}
          aria-label={`${course.title} — কোর্সের বিস্তারিত দেখুন`}
          className="block w-full"
        >
          <CourseCover course={course} className="h-44" />
        </button>
        {course.badge && (
          <span
            className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white shadow-[var(--shadow-pop)]"
            style={{ background: "var(--peach-grad)" }}
          >
            {course.badge}
          </span>
        )}
        {course.accessMode === "free" && (
          <span
            className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow-[var(--shadow-pop)]"
            style={{ background: "var(--accent-grad)" }}
          >
            সম্পূর্ণ ফ্রি
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
      <h3 className="text-lg font-bold leading-snug">
        <button
          type="button"
          onClick={() => openCourseDetail(course.id)}
          aria-label={`${course.title} — কোর্সের বিস্তারিত দেখুন`}
          className="text-left transition-colors hover:text-[var(--accent-strong)]"
        >
          {course.title}
        </button>
      </h3>
      {course.subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">{course.subtitle}</p>
      )}
      {course.lessons != null && (
        <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[var(--dim)]">
          <IconVideo size={16} /> {bnNum(course.lessons)}টি লেসন
        </p>
      )}
      {features.length > 0 && (
        <ul className="mt-3 grid gap-1.5 text-sm text-[var(--dim)]">
          {features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <IconCheck size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              {f}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-5">
        {course.accessMode === "free" ? (
          <>
            <p className="text-[26px] font-extrabold tracking-tight text-[var(--accent-strong)]">
              ফ্রি{" "}
              <span className="align-middle text-base font-medium text-[var(--dim)]">
                — ভর্তি ছাড়াই সব লেসন
              </span>
            </p>
            <button
              type="button"
              onClick={() => openCourse(course.id)}
              className="btn-primary mt-3 w-full"
            >
              ফ্রি কোর্সটি শুরু করুন
            </button>
            <button
              type="button"
              onClick={() => openCourseDetail(course.id)}
              className="btn-outline mt-2 w-full"
            >
              কোর্সের বিস্তারিত দেখুন
            </button>
          </>
        ) : (
          <>
            {course.price != null && (
              <p className="text-[26px] font-extrabold tracking-tight">
                ৳{bnNum(course.price)}
                {course.oldPrice != null && (
                  <span className="ml-2 align-middle text-base font-normal text-[var(--dim)] line-through">
                    ৳{bnNum(course.oldPrice)}
                  </span>
                )}
              </p>
            )}
            <button
              type="button"
              onClick={() => openCourseDetail(course.id)}
              className="btn-primary mt-3 w-full"
            >
              কোর্সটি দেখুন ও ভর্তি হোন
            </button>
            <button
              type="button"
              onClick={() => openCourse(course.id)}
              className="btn-outline mt-2 w-full"
            >
              ফ্রি প্রিভিউ লেসন করুন
            </button>
          </>
        )}
      </div>
      </div>
    </article>
  );
}

function DailyTaskCard() {
  const { student, setStudent } = useApp();
  const queryClient = useQueryClient();
  const daily = useQuery({
    queryKey: ["daily-words", student?.id ?? null, student?.premium ? 1 : 0],
    queryFn: () => api.getDailyWords({ studentId: student?.id ?? null }),
  });
  const { bookmarkSet, learnedSet } = useStudentSets(student?.id ?? null);
  const [expanded, setExpanded] = useState(false);
  const doneToday = student?.lastDaily != null && daily.data?.date === student.lastDaily;

  const completeMut = useMutation({
    mutationFn: () => api.completeDailyTask({ studentId: student?.id ?? 0 }),
    onSuccess: (r) => {
      if (student) {
        setStudent({
          ...student,
          xp: r.xp,
          streak: r.streak,
          lastDaily: daily.data?.date ?? student.lastDaily,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
  });

  const learnedToday = (daily.data?.words ?? []).filter((w) =>
    learnedSet.has(w.id),
  ).length;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-14">
      <div
        className="rounded-[28px] border p-6 shadow-[var(--shadow-card)] sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, var(--peach-soft) 0%, var(--surface) 78%)",
          borderColor: "color-mix(in srgb, var(--peach) 30%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-[28px]">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_22px_-8px_var(--peach)]"
                style={{ background: "var(--peach-grad)" }}
              >
                <IconFlame size={21} />
              </span>
              আজকের টাস্ক — ১০টি শব্দ
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--dim)]">
              প্রতিদিন নতুন ১০টি শব্দ। সবগুলো "শেখা হয়েছে" চিহ্নিত করে টাস্ক
              শেষ করুন — পাবেন +৫০ XP আর স্ট্রিক।
            </p>
            {student && (
              <div className="mt-4 max-w-sm">
                <div className="flex items-center justify-between text-[13px] font-semibold">
                  <span>আজ শেখা হয়েছে</span>
                  <span className="text-[var(--peach-strong)]">{bnNum(learnedToday)}/{bnNum(10)}</span>
                </div>
                <div className="progress-track mt-1.5 h-2.5" role="progressbar" aria-valuenow={learnedToday} aria-valuemin={0} aria-valuemax={10} aria-label="আজকের টাস্কের অগ্রগতি">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, learnedToday * 10)}%`,
                      background: "var(--peach-grad)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="btn-soft shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface)" }}
            >
              <IconCalendar size={17} />
              {expanded ? "লুকান" : "শব্দগুলো দেখুন"}
            </button>
            {student &&
              (doneToday ? (
                <span className="btn-primary pointer-events-none">
                  <IconCheck size={17} /> আজকের টাস্ক শেষ
                </span>
              ) : (
                <button
                  type="button"
                  disabled={completeMut.isPending}
                  onClick={() => completeMut.mutate()}
                  className="btn-primary"
                >
                  টাস্ক শেষ করুন (+৫০ XP)
                </button>
              ))}
          </div>
        </div>
        {!student && (
          <p className="mt-3 text-sm text-[var(--dim)]">
            XP আর স্ট্রিক সেভ রাখতে উপরের মেনু থেকে ফ্রি সাইন আপ করুন —
            শব্দগুলো অ্যাকাউন্ট ছাড়াও পড়তে পারবেন।
          </p>
        )}
        {expanded &&
          (daily.isPending ? (
            <Spinner label="আজকের শব্দ লোড হচ্ছে…" />
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {daily.data?.words.map((w) => (
                <WordCard
                  key={w.id}
                  word={w}
                  bookmarked={bookmarkSet.has(w.id)}
                  learned={learnedSet.has(w.id)}
                />
              ))}
            </div>
          ))}
      </div>
    </section>
  );
}
