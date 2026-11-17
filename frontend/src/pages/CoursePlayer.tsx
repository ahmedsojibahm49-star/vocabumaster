import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PdfViewer } from "../pdf-viewer";
import { api } from "../api";
import { bnNum, readSession, useApp } from "../lib";
import { EmptyNote, LessonBodyText, Spinner } from "../components";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconDownload,
  IconFile,
  IconLock,
  IconPlay,
  IconVideo,
  IconX,
} from "../icons";

type LessonAttachment = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

function fileSizeLabel(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1000) return `${bnNum(bytes)} B`;
  if (bytes < 1_000_000) return `${bnNum(Math.round(bytes / 1000))} KB`;
  return `${bnNum((bytes / 1_000_000).toFixed(1))} MB`;
}

/** Extracts a YouTube embed URL from a watch/share URL the admin pasted. */
function youtubeEmbed(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function CoursePlayerPage() {
  const { student, setStudent, go, openCourseDetail, openEnroll, courseId: ctxCourseId } = useApp();
  const queryClient = useQueryClient();
  // Primary source: React state from App (always available). The
  // sessionStorage mirror is only a fallback for a cold load.
  const rawId = readSession("vm-open-course");
  const sessionId = rawId ? Number(rawId) : NaN;
  const courseId = ctxCourseId ?? (Number.isFinite(sessionId) ? sessionId : NaN);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  // The lesson PDF currently open in the in-page viewer (if any).
  const [pdfView, setPdfView] = useState<LessonAttachment | null>(null);

  const detail = useQuery({
    queryKey: ["course-detail", courseId, student?.id],
    queryFn: () =>
      api.getCourseDetail({
        courseId,
        studentId: student?.id ?? null,
      }),
    enabled: Number.isFinite(courseId) && courseId > 0,
  });

  const course = detail.data?.course ?? null;
  const lessons = detail.data?.lessons ?? [];
  const enrolled = detail.data?.enrolled ?? false;
  const status = detail.data?.enrollmentStatus ?? null;
  const completedCount = lessons.filter((l) => l.completed).length;
  const pct =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  // Default selection: first incomplete accessible lesson, else the first.
  const defaultLesson =
    lessons.find((l) => !l.completed && (enrolled || l.freePreview)) ??
    lessons.find((l) => enrolled || l.freePreview) ??
    lessons[0];
  const activeId = activeLessonId ?? defaultLesson?.id ?? null;

  const lessonQ = useQuery({
    queryKey: ["course-lesson", activeId, student?.id],
    queryFn: () =>
      api.getCourseLesson({
        lessonId: activeId ?? 0,
        studentId: student?.id ?? null,
      }),
    enabled: activeId != null,
  });

  const completeMut = useMutation({
    mutationFn: () =>
      api.completeCourseLesson({
        studentId: student?.id ?? 0,
        lessonId: activeId ?? 0,
      }),
    onSuccess: (r) => {
      if (student) setStudent({ ...student, xp: r.xp });
      void queryClient.invalidateQueries({ queryKey: ["course-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["course-lesson"] });
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
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
        <Spinner label="কোর্স লোড হচ্ছে…" />
      </div>
    );
  }

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

  const features = course.features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const activeLesson = lessons.find((l) => l.id === activeId) ?? null;
  const activeIdx = lessons.findIndex((l) => l.id === activeId);
  const lessonData = lessonQ.data?.lesson ?? null;
  const embed = lessonData?.videoUrl ? youtubeEmbed(lessonData.videoUrl) : null;
  // Uploaded videos (and direct .mp4/.webm links) play in a native player;
  // YouTube links embed; anything else falls back to an open-video button.
  const videoSrc = lessonData?.videoSrc ?? "";
  const isDirectFile = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(videoSrc);
  const nativeVideo =
    videoSrc !== "" && (videoSrc !== lessonData?.videoUrl || isDirectFile)
      ? videoSrc
      : isDirectFile
        ? videoSrc
        : null;

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go("courses")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--dim)] transition-colors hover:text-[var(--text)]"
        >
          <IconArrowLeft size={16} /> সব কোর্স
        </button>
        <button
          type="button"
          onClick={() => openCourseDetail(courseId)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
        >
          কোর্সের বিস্তারিত পেজ
        </button>
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ---------- Lesson viewer ---------- */}
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          {course.subtitle && (
            <p className="bn-read mt-2 max-w-2xl text-[var(--dim)]">{course.subtitle}</p>
          )}

          {/* Status band */}
          <div className="mt-5">
            {enrolled ? (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-bold text-[var(--accent-strong)]">
                    <IconCheckCircle size={19} />{" "}
                    {course.accessMode === "free"
                      ? "এই কোর্সটি সবার জন্য ফ্রি — সব লেসন খোলা"
                      : "আপনি ভর্তি আছেন — শেখা চালিয়ে যান"}
                  </p>
                  <p className="text-sm font-semibold text-[var(--dim)]">
                    {bnNum(completedCount)}/{bnNum(lessons.length)} লেসন শেষ · {bnNum(pct)}%
                  </p>
                </div>
                <div
                  className="progress-track mt-3 h-2.5"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="কোর্সের অগ্রগতি"
                >
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ) : status === "pending" ? (
              <div
                className="rounded-[var(--radius)] border px-5 py-4 text-[15px] leading-relaxed shadow-[var(--shadow-card)]"
                style={{
                  background: "var(--peach-soft)",
                  borderColor: "color-mix(in srgb, var(--peach) 30%, transparent)",
                }}
              >
                <strong>আপনার আবেদন যাচাই চলছে।</strong> পেমেন্ট নিশ্চিত হলেই
                সব লেসন খুলে যাবে — ততক্ষণ ফ্রি প্রিভিউ লেসনটা করে ফেলুন।
              </div>
            ) : (
              <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  {course.price != null ? (
                    <p className="text-[26px] font-extrabold tracking-tight">
                      ৳{bnNum(course.price)}
                      {course.oldPrice != null && (
                        <span className="ml-2 align-middle text-base font-normal text-[var(--dim)] line-through">
                          ৳{bnNum(course.oldPrice)}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-lg font-extrabold">ভর্তি চলছে</p>
                  )}
                  <p className="mt-0.5 text-sm text-[var(--dim)]">
                    bKash/Nagad-এ পেমেন্ট করে আবেদন করুন — যাচাই শেষে সব লেসন
                    খুলবে। প্রথম লেসন ফ্রি প্রিভিউ।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEnroll(course.id)}
                  className="btn-primary shrink-0"
                >
                  ভর্তির আবেদন করুন
                </button>
              </div>
            )}
          </div>

          {/* Active lesson content */}
          <section data-protect className="card mt-6 overflow-hidden" aria-label="লেসনের বিষয়বস্তু">
            {activeLesson == null ? (
              <div className="p-6">
                <EmptyNote>
                  এই কোর্সে এখনো কোনো লেসন যোগ হয়নি — শীঘ্রই আসছে।
                </EmptyNote>
              </div>
            ) : lessonQ.isPending ? (
              <Spinner label="লেসন খুলছে…" />
            ) : lessonQ.data?.locked || !lessonData ? (
              <div className="p-7 text-center sm:p-10">
                <span className="icon-chip mx-auto h-14 w-14 rounded-[18px]">
                  <IconLock size={25} />
                </span>
                <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                  এই লেসনটি ভর্তি শিক্ষার্থীদের জন্য
                </h2>
                <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
                  "{activeLesson.title}" — ভর্তির আবেদন অনুমোদিত হলেই এই লেসন
                  খুলবে। ফ্রি প্রিভিউ লেসনটি এখনই করে দেখতে পারেন।
                </p>
                {!student ? (
                  <button
                    type="button"
                    onClick={() => go("login")}
                    className="btn-primary mt-5"
                  >
                    লগইন করে এগিয়ে যান
                  </button>
                ) : status !== "pending" ? (
                  <button
                    type="button"
                    onClick={() => openEnroll(course.id)}
                    className="btn-primary mt-5"
                  >
                    ভর্তির আবেদন করুন
                  </button>
                ) : null}
              </div>
            ) : (
              <div>
                <div className="border-b border-[var(--border)] px-6 py-5 sm:px-7">
                  <p className="text-[12.5px] font-bold uppercase tracking-wider text-[var(--dim)]">
                    লেসন {bnNum(activeIdx + 1)} / {bnNum(lessons.length)}
                    {lessonData.freePreview && !enrolled ? " · ফ্রি প্রিভিউ" : ""}
                  </p>
                  <h2 className="mt-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
                    {lessonData.title}
                  </h2>
                </div>
                {nativeVideo ? (
                  <div className="aspect-video w-full bg-black">
                    <video
                      src={nativeVideo}
                      controls
                      controlsList="nodownload"
                      disablePictureInPicture
                      playsInline
                      preload="metadata"
                      className="h-full w-full"
                      aria-label={lessonData.title}
                    />
                  </div>
                ) : embed ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={embed}
                      title={lessonData.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : lessonData.videoUrl ? (
                  <div className="border-b border-[var(--border)] px-6 py-4 sm:px-7">
                    <a
                      href={lessonData.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline"
                    >
                      <IconVideo size={17} /> ভিডিও লেসনটি দেখুন
                    </a>
                  </div>
                ) : null}
                {lessonData.body && (
                  <div className="px-6 py-6 sm:px-7">
                    <LessonBodyText body={lessonData.body} />
                  </div>
                )}
                {lessonData.attachments.length > 0 && (
                  <div className="border-t border-[var(--border)] px-6 py-6 sm:px-7">
                    <h3 className="flex items-center gap-2 text-[17px] font-extrabold tracking-tight">
                      <span className="icon-chip h-9 w-9 rounded-xl">
                        <IconFile size={17} />
                      </span>
                      লেসনের ফাইল ও PDF ({bnNum(lessonData.attachments.length)})
                    </h3>
                    <p className="bn-read-sm mt-1.5 text-[var(--dim)]">
                      শিক্ষকের দেওয়া নোট, ওয়ার্কশিট আর PDF — PDF এখানেই
                      খুলে পড়তে পারবেন।
                    </p>
                    <ul className="mt-4 grid gap-2.5">
                      {lessonData.attachments.map((a) => {
                        const isPdf =
                          a.mimeType === "application/pdf" ||
                          /\.pdf($|\?)/i.test(a.name);
                        const isImage = a.mimeType.startsWith("image/");
                        const isAudio = a.mimeType.startsWith("audio/");
                        return (
                          <li
                            key={a.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3.5"
                          >
                            <div className="flex items-center gap-3">
                              <span className="icon-chip h-10 w-10 shrink-0 rounded-xl">
                                <IconFile size={18} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14.5px] font-bold">
                                  {a.name}
                                </span>
                                <span className="block text-[12.5px] font-medium text-[var(--dim)]">
                                  {isPdf
                                    ? "PDF ফাইল"
                                    : isImage
                                      ? "ছবি"
                                      : isAudio
                                        ? "অডিও ফাইল"
                                        : "ডকুমেন্ট ফাইল"}
                                  {a.sizeBytes > 0
                                    ? ` · ${fileSizeLabel(a.sizeBytes)}`
                                    : ""}
                                </span>
                              </span>
                              {isPdf ? (
                                <button
                                  type="button"
                                  onClick={() => setPdfView(a)}
                                  className="btn-primary shrink-0 px-4 py-2 text-sm"
                                >
                                  PDF পড়ুন
                                </button>
                              ) : (
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-outline shrink-0 px-4 py-2 text-sm"
                                  aria-label={`${a.name} — ফাইলটি খুলুন`}
                                >
                                  <IconDownload size={15} /> খুলুন
                                </a>
                              )}
                            </div>
                            {isImage && (
                              <img
                                src={a.url}
                                alt={a.name}
                                className="mt-3 max-h-80 w-full rounded-xl object-contain ring-1 ring-[var(--border)]"
                                loading="lazy"
                              />
                            )}
                            {isAudio && (
                              <audio
                                src={a.url}
                                controls
                                preload="metadata"
                                className="mt-3 w-full"
                                aria-label={a.name}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4 sm:px-7">
                  {lessonQ.data?.completed ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-[var(--accent-strong)]">
                      <IconCheckCircle size={18} /> এই লেসন শেষ করেছেন (+১০ XP)
                    </span>
                  ) : student ? (
                    <button
                      type="button"
                      disabled={completeMut.isPending}
                      onClick={() => completeMut.mutate()}
                      className="btn-primary px-5 py-2.5"
                    >
                      <IconCheck size={17} />
                      {completeMut.isPending ? "সেভ হচ্ছে…" : "লেসন শেষ করলাম (+১০ XP)"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => go("login")}
                      className="btn-outline px-5 py-2.5"
                    >
                      অগ্রগতি সেভ করতে লগইন করুন
                    </button>
                  )}
                  {activeIdx >= 0 && activeIdx + 1 < lessons.length && (
                    <button
                      type="button"
                      onClick={() => setActiveLessonId(lessons[activeIdx + 1]?.id ?? null)}
                      className="inline-flex items-center gap-1.5 font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                    >
                      পরের লেসন <IconArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ---------- Curriculum sidebar ---------- */}
        <aside className="min-w-0">
          <div className="card p-5 sm:p-6 lg:sticky lg:top-32">
            <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <IconPlay size={19} className="text-[var(--accent)]" />
              কোর্সের লেসনসমূহ ({bnNum(lessons.length)})
            </h2>
            {lessons.length === 0 ? (
              <p className="bn-read-sm mt-3 text-[var(--dim)]">
                লেসন শীঘ্রই যোগ হচ্ছে।
              </p>
            ) : (
              <ol className="mt-4 flex flex-col gap-1.5">
                {lessons.map((l, i) => {
                  const accessible = enrolled || l.freePreview;
                  const isActive = l.id === activeId;
                  return (
                    <li key={l.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveLessonId(l.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full max-w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-left transition-colors ${
                          isActive
                            ? "bg-[var(--accent-soft)]"
                            : "hover:bg-[var(--surface-alt)]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                            l.completed
                              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                              : isActive
                                ? "bg-[var(--surface)] text-[var(--accent-strong)]"
                                : "bg-[var(--surface-alt)] text-[var(--dim)]"
                          }`}
                          aria-hidden
                        >
                          {l.completed ? <IconCheck size={15} /> : bnNum(i + 1)}
                        </span>
                        <span className="min-w-0 flex-1 overflow-hidden">
                          <span className="block truncate text-[14.5px] font-semibold leading-snug">
                            {l.title}
                          </span>
                          <span className="mt-0.5 block text-[12px] font-medium text-[var(--dim)]">
                            {l.kind === "video" || l.hasVideo ? "ভিডিও লেসন" : "পড়ার লেসন"}
                            {l.fileCount > 0 ? ` · ${bnNum(l.fileCount)}টি ফাইল` : ""}
                            {l.freePreview && !enrolled ? " · ফ্রি প্রিভিউ" : ""}
                            {l.completed ? " · শেষ" : ""}
                          </span>
                        </span>
                        {!accessible && (
                          <IconLock size={15} className="shrink-0 text-[var(--dim)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            {features.length > 0 && (
              <>
                <h3 className="mt-6 text-[15px] font-extrabold">কোর্সে যা যা আছে</h3>
                <ul className="mt-2.5 grid gap-1.5 text-sm text-[var(--dim)]">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <IconCheck size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* In-page PDF viewer for lesson attachments: a portal overlay
          (same pattern as the book reader) so the PDF opens right here
          without leaving the lesson. */}
      {pdfView &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col"
            style={{
              background:
                "linear-gradient(160deg, #0b2420 0%, #071512 55%, #050d0b 100%)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`PDF — ${pdfView.name}`}
          >
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 pt-safe backdrop-blur-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <IconFile size={17} />
              </span>
              <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-white">
                {pdfView.name}
              </p>
              <button
                type="button"
                onClick={() => setPdfView(null)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
                aria-label="PDF বন্ধ করুন"
              >
                <IconX size={16} /> বন্ধ করুন
              </button>
            </div>
            <div data-protect className="reader-stage min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl px-2 py-4 sm:px-4 sm:py-6">
                <div className="reader-page overflow-hidden rounded-[10px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/25">
                  <PdfViewer
                    key={pdfView.id}
                    src={pdfView.url}
                    ariaLabel={`${pdfView.name} — PDF পৃষ্ঠা`}
                    labels={{
                      loading: "PDF লোড হচ্ছে…",
                      loadError:
                        "PDFটি লোড করা যায়নি — সংযোগ দেখে আবার চেষ্টা করুন।",
                      pageError: "এই পৃষ্ঠাটি দেখানো যাচ্ছে না।",
                      previousPage: "আগের পৃষ্ঠা",
                      nextPage: "পরের পৃষ্ঠা",
                      pageIndicator: (p, t) =>
                        `পৃষ্ঠা ${bnNum(p)} / ${bnNum(t)}`,
                      navigationAriaLabel: "PDF-এর পৃষ্ঠা বদলান",
                      pageAriaLabel: (p, t) =>
                        `পৃষ্ঠা ${bnNum(p)} (মোট ${bnNum(t)})`,
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
