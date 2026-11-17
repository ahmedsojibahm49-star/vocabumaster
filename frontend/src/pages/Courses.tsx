import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { bnNum, useApp, type Course } from "../lib";
import { CourseCover, EmptyNote, PageHead, Spinner } from "../components";
import {
IconCheck,
IconCheckCircle,
IconDownload,
IconLock,
IconMail,
IconPlay,
IconVideo,
IconWallet,
IconYoutube,
} from "../icons";
import coverImg from "../assets/book-cover.png";
import samplePdf from "../assets/free-sample.pdf";

const YOUTUBE = "https://www.youtube.com/@Ahmed_Sojib49";
const EMAIL = "ahmedsojibahmso@gmail.com";

export function CoursesPage() {
  const { student } = useApp();
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.listCourses({}),
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });
  const state = useQuery({
    queryKey: ["student-state", student?.id],
    queryFn: () => api.getStudentState({ studentId: student?.id ?? 0 }),
    enabled: student != null,
  });
  const statusByCourse = new Map<number, string>();
  for (const e of state.data?.enrollments ?? []) {
    if (e.courseId != null && !statusByCourse.has(e.courseId)) {
      statusByCourse.set(e.courseId, e.status);
    }
  }

  const whatsapp = settings.data?.whatsapp ?? "";

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <PageHead
        title="কোর্স ও রিসোর্স"
        sub="ভর্তি পুরোপুরি ম্যানুয়াল ও নিরাপদ: পেমেন্টের পর ট্রানজ্যাকশন আইডি দিয়ে আবেদন করুন, যাচাই শেষে অ্যাক্সেস চালু হবে।"
      />

      {settings.data?.paymentNote && (
        <div
          className="mt-7 flex gap-3.5 rounded-[var(--radius)] border px-5 py-4.5 text-[15px] leading-relaxed shadow-[var(--shadow-card)] sm:px-6"
          style={{
            background: "linear-gradient(135deg, var(--peach-soft) 0%, var(--surface) 80%)",
            borderColor: "color-mix(in srgb, var(--peach) 30%, transparent)",
          }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--peach-grad)" }}
          >
            <IconWallet size={19} />
          </span>
          <span><strong>পেমেন্ট যেভাবে করবেন:</strong> {settings.data.paymentNote}
          {whatsapp && (
            <>
              {" "}
              WhatsApp:{" "}
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
          </span>
        </div>
      )}

      <section className="mt-9" aria-label="কোর্সসমূহ">
        {courses.isPending ? (
          <Spinner label="কোর্স লোড হচ্ছে…" />
        ) : (courses.data?.courses.length ?? 0) === 0 ? (
          <EmptyNote>
            এখন কোনো কোর্স চালু নেই। নতুন কোর্স এলে এখানেই দেখা যাবে — ততদিন
            ফ্রি শব্দভান্ডার, গ্রামার আর টেস্ট দিয়ে শেখা চালিয়ে যান।
          </EmptyNote>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.data?.courses.map((c) => (
              <CourseFullCard
                key={c.id}
                course={c}
                enrollmentStatus={statusByCourse.get(c.id) ?? null}
              />
            ))}
          </div>
        )}
      </section>

      {/* Free class */}
      <section className="mt-14" aria-label="ফ্রি ক্লাস">
        <div className="card grid items-center gap-6 p-7 sm:grid-cols-[1fr_auto] sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">ফ্রি ভিডিও ক্লাস</h2>
            <p className="mt-2 max-w-lg leading-relaxed text-[var(--dim)]">
              YouTube চ্যানেলে ফ্রি ক্লাস — বেসিক থেকে স্পোকেন ইংলিশ পর্যন্ত,
              বাংলায় বুঝিয়ে দেওয়া প্রতিটি টপিক।
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={YOUTUBE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c4302b] px-6 py-3.5 font-bold text-white shadow-[0_14px_28px_-12px_#c4302b] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
            >
              <IconYoutube size={19} /> YouTube-এ ফ্রি ক্লাস দেখুন
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="btn-outline"
            >
              <IconMail size={18} /> ইমেইলে প্রশ্ন করুন
            </a>
          </div>
        </div>
      </section>

      {/* Book */}
      <section
        className="card mt-6 grid items-center gap-7 p-7 sm:grid-cols-[auto_1fr] sm:p-9"
        aria-label="বই"
      >
        <img
          src={coverImg}
          alt="Oxford 7000 Words বইয়ের কভার"
          className="mx-auto w-40 -rotate-2 rounded-lg shadow-[0_18px_36px_rgba(12,26,24,0.30)] ring-1 ring-[var(--border)]"
        />
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Oxford 7000 Words — ছাপানো বই</h2>
          <p className="mt-2.5 max-w-xl leading-relaxed text-[var(--dim)]">
            A1 থেকে C2 পর্যন্ত ৭,০০০ শব্দ + IELTS ৬০০ — বাংলা অর্থ, সহজ
            উচ্চারণ (USA/UK আলাদা), সমার্থক-বিপরীত শব্দ আর উদাহরণসহ। লেখক:
            Jarif Ahmed।
          </p>
          <p className="mt-4 text-4xl font-extrabold tracking-tight">
            ৳৯৯০{" "}
            <span className="text-base font-medium text-[var(--dim)]">
              (অর্ডার: ইমেইল)
            </span>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={samplePdf}
              download="VocabMaster-Oxford-7000-Words-Sample.pdf"
              className="btn-primary"
            >
              <IconDownload size={18} /> ফ্রি স্যাম্পল — ১৫ পৃষ্ঠা (PDF)
            </a>
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent("Oxford 7000 Words বইটি কিনতে চাই")}`}
              className="btn-outline"
            >
              <IconMail size={18} /> ইমেইলে অর্ডার করুন
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CourseFullCard({
  course,
  enrollmentStatus,
}: {
  course: Course;
  enrollmentStatus: string | null;
}) {
  const { openCourse, openCourseDetail, openEnroll } = useApp();
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
        {course.accessMode !== "free" && enrollmentStatus !== "approved" && (
          <span
            className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-extrabold text-white shadow-[var(--shadow-pop)] backdrop-blur-sm"
            aria-label="পেইড কোর্স — ভর্তি হলেই লেসন খুলবে"
          >
            <IconLock size={12} /> পেইড
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
          {features.map((f) => (
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
              <IconPlay size={17} /> ফ্রি কোর্সটি শুরু করুন
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
        {enrollmentStatus === "approved" ? (
          <>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[var(--accent-strong)]">
              <IconCheckCircle size={16} /> আপনি এই কোর্সে ভর্তি আছেন
            </p>
            <button
              type="button"
              onClick={() => openCourse(course.id)}
              className="btn-primary mt-3 w-full"
            >
              <IconPlay size={17} /> কোর্স চালিয়ে যান
            </button>
            <button
              type="button"
              onClick={() => openCourseDetail(course.id)}
              className="btn-outline mt-2 w-full"
            >
              কোর্সের বিস্তারিত দেখুন
            </button>
          </>
        ) : enrollmentStatus === "pending" ? (
          <>
            <p className="mt-1 text-sm font-bold text-[var(--peach-strong)]">
              আবেদন যাচাই চলছে — অনুমোদন হলেই লেসন খুলবে
            </p>
            <button
              type="button"
              onClick={() => openCourseDetail(course.id)}
              className="btn-outline mt-3 w-full"
            >
              লেসন ও বিস্তারিত দেখুন
            </button>
          </>
        ) : (
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={() => openEnroll(course.id)}
              className="btn-primary w-full"
            >
              ভর্তির আবেদন করুন
            </button>
            <button
              type="button"
              onClick={() => openCourseDetail(course.id)}
              className="btn-outline w-full"
            >
              <IconPlay size={16} /> লেসন ও বিস্তারিত দেখুন
            </button>
          </div>
        )}
          </>
        )}
      </div>
      </div>
    </article>
  );
}
