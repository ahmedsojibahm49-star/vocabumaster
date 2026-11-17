import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { bnNum, readSession, useApp } from "../lib";
import { CourseCover, EmptyNote, Spinner } from "../components";
import {
  IconArrowLeft,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconLock,
  IconPlay,
  IconPlayCircle,
  IconVideo,
} from "../icons";
import authorImg from "../assets/author-photo.jpg";

/**
 * Dedicated course details page: everything a student needs before
 * enrolling — price, what's included, the full lesson list with lock /
 * free-preview state, and the mentor. "কোর্স শুরু করুন" hands off to the
 * player (which owns playback + progress).
 */
export function CourseDetailPage() {
  const { student, go, openCourse, openEnroll, courseId: ctxCourseId } = useApp();
  // Primary source: React state from App (always available). The
  // sessionStorage mirror is only a fallback for a cold load.
  const rawId = readSession("vm-open-course");
  const sessionId = rawId ? Number(rawId) : NaN;
  const courseId = ctxCourseId ?? (Number.isFinite(sessionId) ? sessionId : NaN);
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });

  const detail = useQuery({
    queryKey: ["course-detail", courseId, student?.id],
    queryFn: () =>
      api.getCourseDetail({ courseId, studentId: student?.id ?? null }),
    enabled: Number.isFinite(courseId) && courseId > 0,
  });

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return (
      <div className="fade-in mx-auto max-w-xl px-4 pt-14">
        <EmptyNote>
          কোনো কোর্স বেছে নেওয়া হয়নি। কোর্স পেজ থেকে একটি কোর্স খুলুন।
        </EmptyNote>
        <div className="mt-5 text-center">
          <button type="button" onClick={() => go("courses")} className="btn-primary">
            কোর্স পেজে যান
          </button>
        </div>
      </div>
    );
  }

  if (detail.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <Spinner label="কোর্সের বিস্তারিত লোড হচ্ছে…" />
      </div>
    );
  }

  const course = detail.data?.course ?? null;
  if (!course) {
    return (
      <div className="fade-in mx-auto max-w-xl px-4 pt-14">
        <EmptyNote>এই কোর্সটি পাওয়া যায়নি — হয়তো সরিয়ে নেওয়া হয়েছে।</EmptyNote>
        <div className="mt-5 text-center">
          <button type="button" onClick={() => go("courses")} className="btn-primary">
            সব কোর্স দেখুন
          </button>
        </div>
      </div>
    );
  }

  const lessons = detail.data?.lessons ?? [];
  const enrolled = detail.data?.enrolled ?? false;
  const status = detail.data?.enrollmentStatus ?? null;
  const features = course.features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const videoCount = lessons.filter((l) => l.kind === "video").length;
  const freeCount = lessons.filter((l) => l.freePreview).length;
  const completedCount = lessons.filter((l) => l.completed).length;
  const pct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const whatsapp = settings.data?.whatsapp ?? "";

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <button
        type="button"
        onClick={() => go("courses")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--dim)] transition-colors hover:text-[var(--text)]"
      >
        <IconArrowLeft size={16} /> সব কোর্স
      </button>

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* ---------- Main column ---------- */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border)]">
            <CourseCover course={course} className="h-52 sm:h-64" />
          </div>
          {course.badge && (
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: "var(--peach-grad)" }}
            >
              {course.badge}
            </span>
          )}
          {course.accessMode === "free" && (
            <span
              className="ml-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold text-white"
              style={{ background: "var(--accent-grad)" }}
            >
              সম্পূর্ণ ফ্রি
            </span>
          )}
          <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          {course.subtitle && (
            <p className="bn-read mt-3 max-w-2xl text-[var(--dim)]">{course.subtitle}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-2 text-[13.5px] font-semibold text-[var(--dim)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5">
              <IconPlayCircle size={16} className="text-[var(--accent)]" />
              {bnNum(lessons.length)}টি লেসন
            </span>
            {videoCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5">
                <IconVideo size={16} className="text-[var(--accent)]" />
                {bnNum(videoCount)}টি ভিডিও লেসন
              </span>
            )}
            {freeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5">
                <IconCheckCircle size={16} className="text-[var(--accent)]" />
                {bnNum(freeCount)}টি ফ্রি প্রিভিউ
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5">
              <IconClock size={16} className="text-[var(--accent)]" />
              নিজের গতিতে শিখুন
            </span>
          </div>

          {/* Mentor strip */}
          <div className="card mt-7 flex items-center gap-4 p-5">
            <img
              src={authorImg}
              alt="Jarif Ahmed — কোর্সের মেন্টর"
              className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-[var(--border)]"
            />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold uppercase tracking-wider text-[var(--dim)]">
                আপনার মেন্টর
              </p>
              <p className="truncate text-[17px] font-extrabold">Jarif Ahmed</p>
              <p className="text-sm text-[var(--dim)]">
                Oxford 7000 Words বইয়ের লেখক — বাংলায় বুঝিয়ে ইংরেজি শেখান।
              </p>
            </div>
          </div>

          {features.length > 0 && (
            <section className="mt-9" aria-label="এই কোর্সে যা যা পাবেন">
              <h2 className="text-[22px] font-extrabold tracking-tight">এই কোর্সে যা যা পাবেন</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="card flex items-start gap-3 p-4">
                    <span className="icon-chip h-9 w-9 shrink-0 rounded-xl">
                      <IconCheck size={17} />
                    </span>
                    <span className="bn-read-sm pt-1 font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Curriculum */}
          <section className="mt-9" aria-label="কোর্সের পাঠ্যক্রম">
            <h2 className="text-[22px] font-extrabold tracking-tight">
              পাঠ্যক্রম — {bnNum(lessons.length)}টি লেসন
            </h2>
            {enrolled && lessons.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-[var(--dim)]">
                  আপনার অগ্রগতি: {bnNum(completedCount)}/{bnNum(lessons.length)} লেসন শেষ · {bnNum(pct)}%
                </p>
                <div
                  className="progress-track mt-2 h-2.5 max-w-md"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="কোর্সের অগ্রগতি"
                >
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            {lessons.length === 0 ? (
              <div className="mt-4">
                <EmptyNote>এই কোর্সে এখনো লেসন যোগ হয়নি — শীঘ্রই আসছে।</EmptyNote>
              </div>
            ) : (
              <ol className="card mt-4 divide-y divide-[var(--border)] overflow-hidden">
                {lessons.map((l, i) => {
                  const accessible = enrolled || l.freePreview;
                  return (
                    <li key={l.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openCourse(course.id)}
                        aria-label={`লেসন ${bnNum(i + 1)}: ${l.title}${accessible ? "" : " (লক করা)"}`}
                        className="flex w-full max-w-full items-center gap-3.5 overflow-hidden px-5 py-4 text-left transition-colors hover:bg-[var(--surface-alt)]"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                            l.completed
                              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                              : "bg-[var(--surface-alt)] text-[var(--dim)]"
                          }`}
                          aria-hidden
                        >
                          {l.completed ? <IconCheck size={15} /> : bnNum(i + 1)}
                        </span>
                        <span className="min-w-0 flex-1 overflow-hidden">
                          <span className="block truncate text-[15px] font-semibold leading-snug">
                            {l.title}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] font-medium text-[var(--dim)]">
                            {l.kind === "video" || l.hasVideo ? "ভিডিও লেসন" : "পড়ার লেসন"}
                            {l.fileCount > 0 ? ` · ${bnNum(l.fileCount)}টি ফাইল/PDF` : ""}
                            {l.freePreview && !enrolled ? " · ফ্রি প্রিভিউ" : ""}
                            {l.completed ? " · শেষ করেছেন" : ""}
                          </span>
                        </span>
                        {accessible ? (
                          <IconPlay size={16} className="shrink-0 text-[var(--accent)]" />
                        ) : (
                          <IconLock size={16} className="shrink-0 text-[var(--dim)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* How enrolment works (paid courses only — a free course
              needs no payment or application at all) */}
          {course.accessMode !== "free" && (
          <section className="mt-9" aria-label="ভর্তি যেভাবে কাজ করে">
            <h2 className="text-[22px] font-extrabold tracking-tight">ভর্তি যেভাবে কাজ করে</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  n: "১",
                  t: "পেমেন্ট করুন",
                  d: "bKash/Nagad-এ কোর্সের মূল্য পাঠান — নম্বর ও নির্দেশনা ভর্তির ফর্মেই পাবেন।",
                },
                {
                  n: "২",
                  t: "আবেদন জমা দিন",
                  d: "ট্রানজ্যাকশন আইডি দিয়ে আলাদা ভর্তির আবেদন পেজে আবেদন করুন।",
                },
                {
                  n: "৩",
                  t: "শেখা শুরু করুন",
                  d: "যাচাই শেষে অনুমোদন হলেই সব লেসন খুলে যাবে — ড্যাশবোর্ডে অগ্রগতি দেখা যাবে।",
                },
              ].map((s) => (
                <li key={s.n} className="card p-5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                    style={{ background: "var(--accent-grad)" }}
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <p className="mt-3 font-bold">{s.t}</p>
                  <p className="bn-read-sm mt-1 text-[var(--dim)]">{s.d}</p>
                </li>
              ))}
            </ol>
            {settings.data?.paymentNote && (
              <p className="bn-read-sm mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-alt)] px-5 py-4 text-[var(--dim)]">
                <strong className="text-[var(--text)]">পেমেন্ট নির্দেশনা:</strong>{" "}
                {settings.data.paymentNote}
                {whatsapp && (
                  <>
                    {" "}WhatsApp:{" "}
                    <a
                      className="font-bold underline"
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {whatsapp}
                    </a>
                  </>
                )}
              </p>
            )}
          </section>
          )}
        </div>

        {/* ---------- Sticky buy card ---------- */}
        <aside className="min-w-0">
          <div className="card overflow-hidden lg:sticky lg:top-32">
            <CourseCover course={course} className="h-40" />
            <div className="p-6">
            {course.accessMode === "free" ? (
              <>
                <p className="text-[32px] font-extrabold tracking-tight text-[var(--accent-strong)]">
                  ফ্রি
                </p>
                <p className="bn-read-sm mt-1.5 text-[var(--dim)]">
                  এই কোর্সটি এখন সবার জন্য ফ্রি — কোনো পেমেন্ট বা ভর্তির
                  আবেদন ছাড়াই সব লেসন খোলা।
                </p>
              </>
            ) : (
              <>
            {course.price != null ? (
              <p className="text-[32px] font-extrabold tracking-tight">
                ৳{bnNum(course.price)}
                {course.oldPrice != null && (
                  <span className="ml-2 align-middle text-lg font-normal text-[var(--dim)] line-through">
                    ৳{bnNum(course.oldPrice)}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-[22px] font-extrabold tracking-tight">ভর্তি চলছে</p>
            )}
            <p className="bn-read-sm mt-1.5 text-[var(--dim)]">
              একবারের পেমেন্ট — সব লেসনে পূর্ণ অ্যাক্সেস, নিজের গতিতে শেখা।
            </p>
              </>
            )}
            <div className="mt-5">
              {enrolled ? (
                <>
                  <p className="flex items-center gap-1.5 font-bold text-[var(--accent-strong)]">
                    <IconCheckCircle size={18} />{" "}
                    {course.accessMode === "free"
                      ? "এই কোর্সটি সবার জন্য ফ্রি"
                      : "আপনি এই কোর্সে ভর্তি আছেন"}
                  </p>
                  <button
                    type="button"
                    onClick={() => openCourse(course.id)}
                    className="btn-primary mt-4 w-full"
                  >
                    <IconPlay size={17} />{" "}
                    {course.accessMode === "free" ? "কোর্স শুরু করুন" : "কোর্স চালিয়ে যান"}
                  </button>
                </>
              ) : status === "pending" ? (
                <>
                  <p className="font-bold text-[var(--peach-strong)]">
                    আপনার আবেদন যাচাই চলছে
                  </p>
                  <p className="bn-read-sm mt-1 text-[var(--dim)]">
                    অনুমোদন হলেই সব লেসন খুলবে — ততক্ষণ ফ্রি প্রিভিউ লেসনটি
                    করে ফেলুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => openCourse(course.id)}
                    className="btn-outline mt-4 w-full"
                  >
                    ফ্রি প্রিভিউ লেসন করুন
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openEnroll(course.id)}
                    className="btn-primary w-full"
                  >
                    ভর্তির আবেদন করুন
                  </button>
                  {freeCount > 0 && (
                    <button
                      type="button"
                      onClick={() => openCourse(course.id)}
                      className="btn-outline mt-2.5 w-full"
                    >
                      <IconPlay size={16} /> আগে ফ্রি প্রিভিউ দেখুন
                    </button>
                  )}
                  {!student && (
                    <p className="mt-3 text-center text-[13px] font-medium text-[var(--dim)]">
                      আগেই অ্যাকাউন্ট আছে?{" "}
                      <button
                        type="button"
                        onClick={() => go("login")}
                        className="font-bold text-[var(--accent-strong)] underline"
                      >
                        লগইন করুন
                      </button>
                    </p>
                  )}
                </>
              )}
            </div>
            <ul className="mt-6 grid gap-2 border-t border-[var(--border)] pt-5 text-sm text-[var(--dim)]">
              <li className="flex items-center gap-2">
                <IconCheck size={15} className="shrink-0 text-[var(--accent)]" />
                {bnNum(lessons.length)}টি লেসন — ভিডিও ও পড়ার লেসন
              </li>
              <li className="flex items-center gap-2">
                <IconCheck size={15} className="shrink-0 text-[var(--accent)]" />
                প্রতিটি লেসনে +১০ XP ও অগ্রগতি ট্র্যাকিং
              </li>
              <li className="flex items-center gap-2">
                <IconCheck size={15} className="shrink-0 text-[var(--accent)]" />
                মোবাইল, ট্যাবলেট ও কম্পিউটার — সব ডিভাইসে চলবে
              </li>
            </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
