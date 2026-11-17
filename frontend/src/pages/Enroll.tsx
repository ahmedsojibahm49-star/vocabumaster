import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  IconVideo,
  IconWallet,
} from "../icons";

/**
 * Dedicated ভর্তির আবেদন page (replaces the old enrolment popup the owner
 * disliked). Two-column on desktop: course summary + how enrolment works
 * on the left, the application form on the right; stacked on mobile.
 * Submitting creates a pending enrolment the admin approves from the
 * আবেদন page; approval unlocks the course for the applicant's number.
 */
export function EnrollPage() {
  const { student, go, openCourse, enrollCourseId } = useApp();
  const queryClient = useQueryClient();
  // Primary source: React state from App. Session mirror is only a
  // cold-load fallback (same pattern as the course pages).
  const rawId = readSession("vm-enroll-course");
  const sessionId = rawId ? Number(rawId) : NaN;
  const courseId =
    enrollCourseId ?? (Number.isFinite(sessionId) ? sessionId : NaN);

  const [name, setName] = useState(student?.name ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [method, setMethod] = useState("bKash");
  const [txnId, setTxnId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const detail = useQuery({
    queryKey: ["course-detail", courseId, student?.id],
    queryFn: () =>
      api.getCourseDetail({ courseId, studentId: student?.id ?? null }),
    enabled: Number.isFinite(courseId) && courseId > 0,
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });

  const course = detail.data?.course ?? null;

  const mut = useMutation({
    mutationFn: () =>
      api.requestEnrollment({
        courseId: course?.id ?? null,
        courseTitle: course?.title ?? "",
        name: name.trim(),
        phone: phone.trim(),
        method,
        txnId: txnId.trim(),
      }),
    onSuccess: (r) => {
      setDoneId(r.id);
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
      void queryClient.invalidateQueries({ queryKey: ["course-detail"] });
    },
    onError: () => setError("আবেদন পাঠানো যায়নি — আবার চেষ্টা করুন।"),
  });

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return (
      <div className="fade-in mx-auto max-w-xl px-4 pt-14">
        <EmptyNote>
          কোনো কোর্স বেছে নেওয়া হয়নি। কোর্স পেজ থেকে একটি কোর্স বেছে
          "ভর্তির আবেদন করুন" বোতামে চাপ দিন।
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
        <Spinner label="কোর্সের তথ্য লোড হচ্ছে…" />
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

  // A course the admin switched to free-for-all needs no application at
  // all — send the student straight to the lessons.
  if (course.accessMode === "free") {
    return (
      <div className="fade-in mx-auto max-w-xl px-4 pt-14 text-center">
        <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
          <IconCheckCircle size={30} />
        </span>
        <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">
          এই কোর্সটি এখন সম্পূর্ণ ফ্রি!
        </h1>
        <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
          "{course.title}" — কোনো পেমেন্ট বা ভর্তির আবেদন লাগবে না। সব
          লেসন এখনই খোলা আছে, সরাসরি শেখা শুরু করুন।
        </p>
        <button
          type="button"
          onClick={() => openCourse(course.id)}
          className="btn-primary mt-6"
        >
          <IconPlay size={18} /> কোর্স শুরু করুন
        </button>
      </div>
    );
  }

  const enrolled = detail.data?.enrolled ?? false;
  const status = detail.data?.enrollmentStatus ?? null;
  const lessons = detail.data?.lessons ?? [];
  const features = course.features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const whatsapp = settings.data?.whatsapp ?? "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("আপনার নাম লিখুন।");
    if (phone.trim().length < 6) return setError("সঠিক মোবাইল নম্বর লিখুন।");
    if (txnId.trim().length < 4)
      return setError("পেমেন্টের ট্রানজ্যাকশন আইডি লিখুন।");
    mut.mutate();
  };

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <button
        type="button"
        onClick={() => go("courses")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--dim)] transition-colors hover:text-[var(--text)]"
      >
        <IconArrowLeft size={16} /> সব কোর্স
      </button>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-4xl">
          ভর্তির আবেদন
        </h1>
        <p className="mt-2 text-[16.5px] leading-relaxed text-[var(--dim)]">
          পেমেন্টের পর নিচের ফর্মটি পূরণ করুন — যাচাই শেষে অনুমোদন হলেই
          কোর্সের সব লেসন আপনার অ্যাকাউন্টে খুলে যাবে।
        </p>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_420px]">
        {/* ---------- Left: course summary + how it works ---------- */}
        <div className="min-w-0">
          <div className="card overflow-hidden">
            <CourseCover course={course} className="h-48 sm:h-56" />
            <div className="p-6">
              <h2 className="text-[22px] font-extrabold leading-snug tracking-tight">
                {course.title}
              </h2>
              {course.subtitle && (
                <p className="bn-read-sm mt-1.5 text-[var(--dim)]">{course.subtitle}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-[var(--dim)]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5">
                  <IconVideo size={15} className="text-[var(--accent)]" />
                  {bnNum(lessons.length)}টি লেসন
                </span>
                {course.price != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3.5 py-1.5">
                    <IconWallet size={15} className="text-[var(--accent)]" />
                    মূল্য ৳{bnNum(course.price)}
                    {course.oldPrice != null && (
                      <span className="font-normal line-through">
                        ৳{bnNum(course.oldPrice)}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {features.length > 0 && (
                <ul className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--dim)] sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <IconCheck size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <h2 className="mt-8 text-[22px] font-extrabold tracking-tight">
            ভর্তি যেভাবে সম্পন্ন হবে
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                n: "১",
                t: "পেমেন্ট করুন",
                d: "নিচের নির্দেশনা অনুযায়ী bKash/Nagad-এ কোর্সের মূল্য পাঠান।",
              },
              {
                n: "২",
                t: "আবেদন জমা দিন",
                d: "ডানদিকের ফর্মে নাম, মোবাইল নম্বর আর ট্রানজ্যাকশন আইডি দিন।",
              },
              {
                n: "৩",
                t: "শেখা শুরু করুন",
                d: "অ্যাডমিন যাচাই করে অনুমোদন দিলেই সব লেসন খুলে যাবে।",
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
            <div
              className="mt-5 flex gap-3.5 rounded-[var(--radius)] border px-5 py-4 text-[15px] leading-relaxed shadow-[var(--shadow-card)]"
              style={{
                background:
                  "linear-gradient(135deg, var(--peach-soft) 0%, var(--surface) 80%)",
                borderColor:
                  "color-mix(in srgb, var(--peach) 30%, transparent)",
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--peach-grad)" }}
              >
                <IconWallet size={19} />
              </span>
              <span>
                <strong>পেমেন্ট নির্দেশনা:</strong> {settings.data.paymentNote}
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
        </div>

        {/* ---------- Right: the application form ---------- */}
        <div className="card min-w-0 p-6 sm:p-7 lg:sticky lg:top-32">
          {doneId != null ? (
            <div className="py-2 text-center">
              <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
                <IconCheckCircle size={30} />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
                আবেদন পৌঁছেছে!
              </h2>
              <p className="bn-read mx-auto mt-2 max-w-sm text-[var(--dim)]">
                আবেদন নম্বর #{bnNum(doneId)} — "{course.title}"। পেমেন্ট যাচাই
                শেষে অনুমোদন হলেই সব লেসন খুলবে। আবেদনের অবস্থা আপনার
                ড্যাশবোর্ডে দেখতে পাবেন।
              </p>
              <div className="mt-6 grid gap-2.5">
                {student ? (
                  <button
                    type="button"
                    onClick={() => go("dashboard")}
                    className="btn-primary w-full"
                  >
                    ড্যাশবোর্ডে অবস্থা দেখুন
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => go("signup")}
                    className="btn-primary w-full"
                  >
                    এই নম্বর দিয়ে অ্যাকাউন্ট খুলুন
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openCourse(course.id)}
                  className="btn-outline w-full"
                >
                  <IconPlay size={16} /> ফ্রি প্রিভিউ লেসন করুন
                </button>
              </div>
            </div>
          ) : enrolled ? (
            <div className="py-2 text-center">
              <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
                <IconCheckCircle size={30} />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
                আপনি এই কোর্সে ভর্তি আছেন
              </h2>
              <p className="bn-read mx-auto mt-2 max-w-sm text-[var(--dim)]">
                আপনার আবেদন অনুমোদিত — সব লেসনই আপনার জন্য খোলা। শেখা
                চালিয়ে যান!
              </p>
              <button
                type="button"
                onClick={() => openCourse(course.id)}
                className="btn-primary mt-6 w-full"
              >
                <IconPlay size={17} /> কোর্স চালিয়ে যান
              </button>
            </div>
          ) : status === "pending" ? (
            <div className="py-2 text-center">
              <span
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px]"
                style={{ background: "var(--peach-soft)", color: "var(--peach-strong)" }}
              >
                <IconClock size={30} />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
                আবেদন যাচাই চলছে
              </h2>
              <p className="bn-read mx-auto mt-2 max-w-sm text-[var(--dim)]">
                এই কোর্সের জন্য আপনার আগের আবেদনটি এখনো যাচাইাধীন।
                অনুমোদন হলেই সব লেসন খুলবে — ততক্ষণ ফ্রি প্রিভিউ লেসনটি করে
                ফেলুন।
              </p>
              <button
                type="button"
                onClick={() => openCourse(course.id)}
                className="btn-primary mt-6 w-full"
              >
                <IconPlay size={17} /> ফ্রি প্রিভিউ লেসন করুন
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 className="text-[20px] font-extrabold tracking-tight">
                আবেদনের তথ্য
              </h2>
              {course.price != null ? (
                <p className="mt-1 text-[15px] text-[var(--dim)]">
                  কোর্সের মূল্য:{" "}
                  <strong className="text-[18px] text-[var(--text)]">
                    ৳{bnNum(course.price)}
                  </strong>
                </p>
              ) : (
                <p className="mt-1 text-[15px] text-[var(--dim)]">{course.title}</p>
              )}
              {!student && (
                <p className="bn-read-sm mt-3 rounded-2xl bg-[var(--surface-alt)] px-4 py-3 text-[var(--dim)]">
                  যেই মোবাইল নম্বর দিয়ে আবেদন করবেন, সেই নম্বরের
                  অ্যাকাউন্টেই কোর্স খুলবে। অ্যাকাউন্ট না থাকলে{" "}
                  <button
                    type="button"
                    onClick={() => go("signup")}
                    className="font-bold text-[var(--accent-strong)] underline"
                  >
                    ফ্রি সাইন আপ
                  </button>{" "}
                  করে নিন।
                </p>
              )}
              <div className="mt-5 grid gap-3.5">
                <div>
                  <label htmlFor="enr-name" className="text-sm font-semibold">
                    আপনার নাম
                  </label>
                  <input
                    id="enr-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input mt-1.5"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="enr-phone" className="text-sm font-semibold">
                    মোবাইল নম্বর
                  </label>
                  <input
                    id="enr-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    className="input mt-1.5"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="enr-method" className="text-sm font-semibold">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    id="enr-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="input mt-1.5"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="enr-txn" className="text-sm font-semibold">
                    ট্রানজ্যাকশন আইডি
                  </label>
                  <input
                    id="enr-txn"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    placeholder="যেমন: 9HX7K2LM1P"
                    className="input mt-1.5"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm font-medium text-[var(--danger)]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={mut.isPending}
                  className="btn-primary w-full py-3"
                >
                  {mut.isPending ? "পাঠানো হচ্ছে…" : "আবেদন জমা দিন"}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[13px] font-medium text-[var(--dim)]">
                  <IconLock size={13} />
                  যাচাই ছাড়া কোনো লেসন খুলবে না — পেমেন্ট নিশ্চিত হলেই
                  অনুমোদন দেওয়া হয়।
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
