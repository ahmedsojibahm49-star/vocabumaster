import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PdfViewer } from "../pdf-viewer";
import { api } from "../api";
import { bnNum, BOOK_APPLICATION_TITLE, clearSession, readSession, useApp } from "../lib";
import { Spinner } from "../components";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconBookmark,
  IconBookmarkFill,
  IconBrightness,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCompress,
  IconDownload,
  IconExpand,
  IconFitPage,
  IconFitWidth,
  IconFlag,
  IconGridDots,
  IconLayers,
  IconLock,
  IconShield,
  IconWallet,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "../icons";
import coverImg from "../assets/book-cover.png";
import authorImg from "../assets/author-photo.jpg";
import samplePdf from "../assets/free-sample.pdf";

const EMAIL = "ahmedsojibahmso@gmail.com";

/**
 * The book's real table of contents (Oxford 7000 Words v3.4, verified
 * against the printed contents pages): section title → first PDF page.
 * The reader's chapter jumps use exactly these page numbers.
 */
export const BOOK_TOC: { title: string; page: number; note: string }[] = [
  { title: "ভূমিকা ও বইটি কীভাবে ব্যবহার করবেন", page: 3, note: "শুরুর কথা" },
  { title: "উচ্চারণ গাইড (Pronunciation Guide)", page: 8, note: "USA / UK উচ্চারণের নিয়ম" },
  { title: "A1 — Beginner Vocabulary", page: 11, note: "৯০০ শব্দ" },
  { title: "A2 — Elementary Vocabulary", page: 86, note: "১,০০০ শব্দ" },
  { title: "B1 — Intermediate Vocabulary", page: 183, note: "১,২০০ শব্দ" },
  { title: "B2 — Upper-Intermediate Vocabulary", page: 295, note: "১,৪০০ শব্দ" },
  { title: "C1 — Advanced Vocabulary", page: 438, note: "১,৩০০ শব্দ" },
  { title: "C2 — Proficient Vocabulary", page: 585, note: "১,২০০ শব্দ" },
  { title: "IELTS Vocabulary", page: 706, note: "৬০০ শব্দ" },
  { title: "শেষ কথা ও লেখক পরিচিতি", page: 759, note: "ধন্যবাদ" },
];

const DEFAULT_BLURB =
  "এই ওয়েবসাইটের শব্দভান্ডার এসেছে এই বই থেকেই। বইটি কিনলেই পুরো বইটি ওয়েবসাইটের ভিতরেই পড়তে পারবেন — প্রতিটি শব্দের বাংলা অর্থ, সহজ উচ্চারণ (USA ও UK আলাদা), সমার্থক ও বিপরীত শব্দ, আর উদাহরণ বাক্য — A1 থেকে C2, সাথে IELTS-এর ৬০০ শব্দ।";

export function BookPage() {
  const { student, go } = useApp();
  const queryClient = useQueryClient();
  const [reading, setReading] = useState(false);

  const access = useQuery({
    queryKey: ["book-access", student?.id ?? null],
    queryFn: () => api.getBookAccess({ studentId: student?.id ?? null }),
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

  // Access comes from the SERVER only. The persisted local profile is a
  // login-time snapshot: after the admin removes a student's book
  // access, that snapshot still says "yes" — trusting it here is what
  // kept the book open for removed students.
  const hasAccess =
    access.data?.hasAccess ?? state.data?.student?.bookAccess ?? false;
  const uploaded = access.data?.uploaded ?? false;
  const price = access.data?.price ?? settings.data?.bookPrice ?? 990;
  // The book's display name and free/premium mode are admin settings —
  // the owner can rename the book or make it free for everyone any time.
  const bookTitle =
    access.data?.title ?? settings.data?.bookTitle ?? "Oxford 7000 Words";
  const freeForAll = access.data?.freeForAll ?? settings.data?.bookFree ?? false;
  const totalPages = access.data?.totalPages ?? 762;
  const lastPage = access.data?.lastPage ?? 1;
  const bookApp = (state.data?.enrollments ?? []).find(
    (e) => e.courseId == null && e.courseTitle === BOOK_APPLICATION_TITLE,
  );

  // Speed: as soon as a book owner lands on this page, fetch the
  // reader's signed URL AND warm the browser cache with the PDF bytes,
  // so tapping "বইটি পড়ুন" opens the first page almost immediately
  // instead of waiting on a fresh URL plus a cold full-file download.
  // The warm-up is fire-and-forget — if it fails, the reader simply
  // loads the file itself, exactly as before.
  const readerWarm = useQuery({
    queryKey: ["book-reader", student?.id ?? 0],
    queryFn: () => api.getBookReader({ studentId: student?.id ?? 0 }),
    enabled: !!student && hasAccess && uploaded,
    staleTime: 60_000,
  });
  const warmStartedRef = useRef(false);
  useEffect(() => {
    const url = readerWarm.data?.url;
    if (!url || warmStartedRef.current) return;
    warmStartedRef.current = true;
    fetch(url, { credentials: "same-origin" })
      .then((r) => r.arrayBuffer())
      .catch(() => {});
  }, [readerWarm.data?.url]);

  // Dashboard hand-off: the dashboard's "পড়ুন / পড়া চালিয়ে যান"
  // button sets a one-shot session flag (App.openBookReader) so this
  // page opens the reader DIRECTLY once access is verified — the
  // student asked for one tap from the dashboard into the PDF, not a
  // landing on this sales page first. The flag is consumed here so a
  // later plain visit to the Book page never auto-opens anything.
  const autoOpenRef = useRef(false);
  useEffect(() => {
    if (autoOpenRef.current) return;
    if (readSession("vm-open-reader") !== "1") return;
    if (student && hasAccess && uploaded) {
      autoOpenRef.current = true;
      clearSession("vm-open-reader");
      setReading(true);
    } else if (access.data != null) {
      // Access check finished and the reader can't open (no access,
      // or no file yet): drop the stale intent so a later ordinary
      // visit to this page doesn't surprise-open the reader.
      clearSession("vm-open-reader");
    }
  }, [student, hasAccess, uploaded, access.data]);

  if (reading && student && hasAccess) {
    return (
      <BookReader
        studentId={student.id}
        bookTitle={bookTitle}
        totalPages={totalPages}
        fallbackPage={lastPage}
        onClose={() => {
          setReading(false);
          // Re-check access the moment the reader closes, so a removal
          // made while reading is reflected on this page at once.
          void queryClient.invalidateQueries({ queryKey: ["book-access"] });
          void queryClient.invalidateQueries({ queryKey: ["student-state"] });
        }}
      />
    );
  }

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      {/* ---------- Hero / sales ---------- */}
      <section
        className="relative grid items-center gap-8 overflow-hidden rounded-[28px] p-7 text-white shadow-[var(--shadow-lift)] sm:p-10 lg:grid-cols-[auto_1fr]"
        style={{ background: "linear-gradient(135deg, #0c453c 0%, #083028 100%)" }}
        aria-label="Oxford 7000 Words — বই"
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-white/5"
          aria-hidden
        />
        <img
          src={coverImg}
          alt="Oxford 7000 Words — A1 to C2 Level বইয়ের কভার"
          className="relative mx-auto w-44 -rotate-3 rounded-lg shadow-[0_24px_44px_rgba(0,0,0,0.45)] ring-1 ring-white/20 sm:w-56"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide">
            <IconBook size={15} /> {bookTitle.toUpperCase()}
          </span>
          <h1 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[40px]">
            পুরো বইটি পড়ুন ওয়েবসাইটের ভিতরেই
          </h1>
          <p className="bn-read mt-3 max-w-xl text-white/85">
            {settings.data?.bookBlurb || DEFAULT_BLURB}
          </p>
          <ul className="mt-5 grid max-w-xl gap-2.5 text-[15px] text-white/90 sm:grid-cols-2">
            <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />মোট ৭,৬০০ শব্দ (৭,০০০ + IELTS ৬০০)</li>
            <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />{bnNum(totalPages)} পৃষ্ঠা — A1 থেকে C2</li>
            <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />USA ও UK — দুই উচ্চারণ আলাদা করে</li>
            <li className="flex items-start gap-2"><IconCheck size={16} className="mt-0.5 shrink-0 text-[#5fdcc9]" />লেখক: Jarif Ahmed</li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {freeForAll ? (
              <p className="text-4xl font-extrabold tracking-tight">
                সবার জন্য ফ্রি
                <span className="ml-2 align-middle text-base font-medium text-white/70">
                  — লগইন করলেই পড়ুন
                </span>
              </p>
            ) : (
              <p className="text-4xl font-extrabold tracking-tight">
                ৳{bnNum(price)}
                <span className="ml-2 align-middle text-base font-medium text-white/70">
                  এককালীন
                </span>
              </p>
            )}
            {hasAccess && uploaded && student && (
              <button
                type="button"
                onClick={() => setReading(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-[#083028] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <IconBook size={18} />
                {lastPage > 1
                  ? `পড়া চালিয়ে যান — পৃষ্ঠা ${bnNum(lastPage)} থেকে`
                  : "বইটি পড়ুন"}
              </button>
            )}
          </div>
          {hasAccess && !uploaded && (
            <p className="mt-4 max-w-lg rounded-2xl bg-white/10 px-4 py-3 text-[14.5px] font-medium leading-relaxed text-white/90">
              আপনার বইয়ের অ্যাক্সেস চালু আছে — বইয়ের ফাইলটি রিডারে যোগ
              হলেই এখান থেকে পড়তে পারবেন।
            </p>
          )}
        </div>
      </section>

      {/* ---------- Reader features ---------- */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="রিডারের সুবিধা">
        {[
          {
            Icon: IconShield,
            title: "নিরাপদ — ডাউনলোড নেই",
            text: "বইটি শুধু ওয়েবসাইটের ভিতরেই পড়া যায়। ডাউনলোড বা কপি করার কোনো বোতাম নেই — আপনার কেনা বই শুধু আপনারই।",
          },
          {
            Icon: IconFlag,
            title: "যেখানে থামবেন, সেখান থেকে",
            text: "শেষ পড়া পৃষ্ঠাটা মনে থাকে — আবার খুললেই ঠিক সেখান থেকেই শুরু হবে।",
          },
          {
            Icon: IconLayers,
            title: "সূচিপত্র, গ্রিড ও বুকমার্ক",
            text: "A1, A2, B1… IELTS — যেকোনো অধ্যায়ে এক চাপেই যান। পৃষ্ঠা গ্রিড থেকে যেকোনো পৃষ্ঠায় লাফ দিন, পছন্দের পৃষ্ঠা বুকমার্ক করে রাখুন।",
          },
          {
            Icon: IconFitPage,
            title: "পুরো পৃষ্ঠা, নিজের মতো করে",
            text: "পুরো পৃষ্ঠা এক স্ক্রিনে দেখুন, চাইলে জুম করে বড় করে পড়ুন — ডার্ক/লাইট/সেপিয়া থিম, ফুলস্ক্রিন আর সোয়াইপ নেভিগেশনও আছে।",
          },
        ].map((f) => (
          <div key={f.title} className="card p-5 sm:p-6">
            <span className="icon-chip h-11 w-11 rounded-2xl">
              <f.Icon size={21} />
            </span>
            <h2 className="mt-3.5 text-[16.5px] font-bold">{f.title}</h2>
            <p className="bn-read-sm mt-1.5 text-[var(--dim)]">{f.text}</p>
          </div>
        ))}
      </section>

      {/* ---------- Contents preview ---------- */}
      <section className="mt-10" aria-label="বইয়ের সূচিপত্র">
        <h2 className="text-[26px] font-extrabold tracking-tight sm:text-3xl">
          বইয়ের ভিতরে যা আছে
        </h2>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-[var(--dim)]">
          মোট {bnNum(totalPages)} পৃষ্ঠা — প্রতিটি লেভেলের শুরু কোন পৃষ্ঠায়,
          এক নজরে দেখে নিন।
        </p>
        <ol className="mt-5 grid gap-2.5 md:grid-cols-2">
          {BOOK_TOC.map((s, i) => (
            <li
              key={s.page}
              className="card flex items-center gap-3.5 px-5 py-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[14px] font-extrabold text-[var(--accent-strong)]">
                {bnNum(i + 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{s.title}</span>
                <span className="block text-[13.5px] text-[var(--dim)]">{s.note}</span>
              </span>
              <span className="shrink-0 rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[13px] font-bold">
                পৃষ্ঠা {bnNum(s.page)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Purchase / status ---------- */}
      <section className="mt-10" aria-label="বই কেনা">
        {access.isPending ? (
          <Spinner label="বইয়ের তথ্য লোড হচ্ছে…" />
        ) : freeForAll && !student ? (
          <div className="card p-7 text-center sm:p-9">
            <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
              <IconBook size={30} />
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
              বইটি এখন সবার জন্য ফ্রি!
            </h2>
            <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
              এই বইটি এখন ফ্রিতে পড়া যাচ্ছে — শুধু লগইন করলেই পুরো বইটি
              ওয়েবসাইটের রিডারে খুলে যাবে।
            </p>
            <button
              type="button"
              onClick={() => go("login")}
              className="btn-primary mt-6 px-7"
            >
              লগইন করে পড়ুন
            </button>
          </div>
        ) : hasAccess ? (
          <div className="card p-7 text-center sm:p-9">
            <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
              <IconCheckCircle size={30} />
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
              বইটি আপনার — শুভ পড়া!
            </h2>
            <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
              {uploaded
                ? `আপনার অ্যাকাউন্টে বই পড়ার অ্যাক্সেস চালু আছে। ${lastPage > 1 ? `শেষবার পৃষ্ঠা ${bnNum(lastPage)} পর্যন্ত পড়েছিলেন।` : ""}`
                : "আপনার অ্যাকাউন্টে বই পড়ার অ্যাক্সেস চালু আছে — ফাইলটি রিডারে যোগ হলেই পড়তে পারবেন।"}
            </p>
            {uploaded &&
              (student ? (
                <button
                  type="button"
                  onClick={() => setReading(true)}
                  className="btn-primary mt-6 px-7"
                >
                  <IconBook size={17} /> এখনই পড়ুন
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => go("login")}
                  className="btn-primary mt-6 px-7"
                >
                  লগইন করে পড়ুন
                </button>
              ))}
          </div>
        ) : (
          <BookPurchaseForm
            price={price}
            bookAppStatus={bookApp?.status ?? null}
            paymentNote={access.data?.paymentNote ?? ""}
            whatsapp={access.data?.whatsapp ?? ""}
          />
        )}
      </section>

      {/* ---------- Author + sample ---------- */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="card flex items-center gap-5 p-6">
          <img
            src={authorImg}
            alt="Jarif Ahmed — লেখক"
            className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-[var(--border)]"
          />
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight">লেখক: Jarif Ahmed</h2>
            <p className="bn-read-sm mt-1 text-[var(--dim)]">
              English-এ দুর্বল ছাত্রদের জন্যই এই বই — বাংলায় বুঝে যাতে সবাই
              ইংরেজি শিখতে পারে।
            </p>
          </div>
        </div>
        <div className="card flex flex-wrap items-center gap-5 p-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight">আগে ফ্রি স্যাম্পল দেখুন</h2>
            <p className="bn-read-sm mt-1 text-[var(--dim)]">
              বইয়ের প্রথম ১৫ পৃষ্ঠা ফ্রি — দেখে সিদ্ধান্ত নিন।
            </p>
          </div>
          <a
            href={samplePdf}
            download="VocabMaster-Oxford-7000-Words-Sample.pdf"
            className="btn-outline shrink-0"
          >
            <IconDownload size={17} /> ফ্রি স্যাম্পল (PDF)
          </a>
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-[var(--dim)]">
        বই নিয়ে কোনো প্রশ্ন থাকলে ইমেইল করুন:{" "}
        <a href={`mailto:${EMAIL}`} className="font-bold text-[var(--accent-strong)] underline">
          {EMAIL}
        </a>
      </p>
    </div>
  );
}

function BookPurchaseForm({
  price,
  bookAppStatus,
  paymentNote,
  whatsapp,
}: {
  price: number;
  bookAppStatus: string | null;
  paymentNote: string;
  whatsapp: string;
}) {
  const { student, go } = useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState(student?.name ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [method, setMethod] = useState("bKash");
  const [txnId, setTxnId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.requestEnrollment({
        courseId: null,
        courseTitle: BOOK_APPLICATION_TITLE,
        name: name.trim(),
        phone: phone.trim(),
        method,
        txnId: txnId.trim(),
      }),
    onSuccess: (r) => {
      setDoneId(r.id);
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
      void queryClient.invalidateQueries({ queryKey: ["book-access"] });
    },
    onError: () => setError("আবেদন পাঠানো যায়নি — আবার চেষ্টা করুন।"),
  });

  if (doneId != null) {
    return (
      <div className="card p-7 text-center sm:p-9">
        <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
          <IconCheckCircle size={30} />
        </span>
        <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
          বই কেনার আবেদন পৌঁছেছে!
        </h2>
        <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
          আবেদন নম্বর #{bnNum(doneId)}। পেমেন্ট যাচাই শেষে অনুমোদন হলেই
          এই পেজ থেকেই পুরো বইটি পড়তে পারবেন — ড্যাশবোর্ডেও অবস্থা দেখা
          যাবে।
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {student ? (
            <button type="button" onClick={() => go("dashboard")} className="btn-primary px-7">
              ড্যাশবোর্ডে যান
            </button>
          ) : (
            <button type="button" onClick={() => go("signup")} className="btn-primary px-7">
              এই নম্বর দিয়ে অ্যাকাউন্ট খুলুন
            </button>
          )}
          <a href={samplePdf} download="VocabMaster-Oxford-7000-Words-Sample.pdf" className="btn-outline px-7">
            <IconDownload size={16} /> ততক্ষণ ফ্রি স্যাম্পল পড়ুন
          </a>
        </div>
      </div>
    );
  }

  if (bookAppStatus === "pending") {
    return (
      <div className="card p-7 text-center sm:p-9">
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px]"
          style={{ background: "var(--peach-soft)", color: "var(--peach-strong)" }}
        >
          <IconClock size={30} />
        </span>
        <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
          আপনার বই কেনার আবেদন যাচাই চলছে
        </h2>
        <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
          পেমেন্ট নিশ্চিত হলেই বই পড়ার অ্যাক্সেস চালু হয়ে যাবে — এই
          পেজেই "বইটি পড়ুন" বোতাম দেখা যাবে।
        </p>
      </div>
    );
  }

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
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
      <div className="min-w-0">
        <h2 className="text-[26px] font-extrabold tracking-tight">
          বইটি কেনার ধাপসমূহ
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              n: "১",
              t: "পেমেন্ট করুন",
              d: `bKash/Nagad-এ ৳${bnNum(price)} পাঠান — নম্বর জানতে নিচের নির্দেশনা দেখুন।`,
            },
            {
              n: "২",
              t: "আবেদন জমা দিন",
              d: "ডানদিকের ফর্মে আপনার নাম, মোবাইল নম্বর আর ট্রানজ্যাকশন আইডি দিন।",
            },
            {
              n: "৩",
              t: "পড়া শুরু করুন",
              d: "অনুমোদন হলেই এই পেজ থেকে পুরো বইটি ওয়েবসাইটের ভিতরেই পড়তে পারবেন।",
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
        {paymentNote && (
          <div
            className="mt-5 flex gap-3.5 rounded-[var(--radius)] border px-5 py-4 text-[15px] leading-relaxed shadow-[var(--shadow-card)]"
            style={{
              background:
                "linear-gradient(135deg, var(--peach-soft) 0%, var(--surface) 80%)",
              borderColor: "color-mix(in srgb, var(--peach) 30%, transparent)",
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: "var(--peach-grad)" }}
            >
              <IconWallet size={19} />
            </span>
            <span>
              <strong>পেমেন্ট নির্দেশনা:</strong> {paymentNote}
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
        <div className="card mt-5 flex gap-3.5 p-5">
          <span className="icon-chip h-10 w-10 shrink-0 rounded-xl">
            <IconLock size={19} />
          </span>
          <p className="bn-read-sm text-[var(--dim)]">
            <strong className="text-[var(--text)]">মনে রাখুন:</strong> বইয়ের
            অ্যাক্সেস চালু হয় আপনার অ্যাকাউন্টের মোবাইল নম্বরে। আবেদনে ঠিক
            সেই নম্বরটাই দিন, যেটা দিয়ে লগইন করেন। বইটি শুধু পড়াই যাবে —
            ডাউনলোড করা যাবে না, তাই আপনার বই নিরাপদ থাকে।
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="card min-w-0 p-6 sm:p-7 lg:sticky lg:top-32"
      >
        <h2 className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight">
          <IconBook size={21} className="text-[var(--accent)]" />
          বই কেনার আবেদন
        </h2>
        <p className="mt-1 text-[15px] text-[var(--dim)]">
          মূল্য:{" "}
          <strong className="text-[18px] text-[var(--text)]">৳{bnNum(price)}</strong>{" "}
          (এককালীন)
        </p>
        {bookAppStatus === "rejected" && (
          <p className="bn-read-sm mt-3 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 font-medium text-[var(--danger)]">
            আপনার আগের বই কেনার আবেদনটি বাতিল হয়েছিল — পেমেন্টের তথ্য
            ঠিক করে আবার আবেদন করতে পারেন।
          </p>
        )}
        {!student && (
          <p className="bn-read-sm mt-3 rounded-2xl bg-[var(--surface-alt)] px-4 py-3 text-[var(--dim)]">
            বইয়ের অ্যাক্সেস আপনার অ্যাকাউন্টে চালু হয় — আগেই{" "}
            <button
              type="button"
              onClick={() => go("login")}
              className="font-bold text-[var(--accent-strong)] underline"
            >
              লগইন
            </button>{" "}
            বা{" "}
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
            <label htmlFor="book-name" className="text-sm font-semibold">আপনার নাম</label>
            <input id="book-name" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1.5" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="book-phone" className="text-sm font-semibold">মোবাইল নম্বর (অ্যাকাউন্টের নম্বর)</label>
            <input id="book-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className="input mt-1.5" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="book-method" className="text-sm font-semibold">পেমেন্ট মাধ্যম</label>
            <select id="book-method" value={method} onChange={(e) => setMethod(e.target.value)} className="input mt-1.5">
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
            </select>
          </div>
          <div>
            <label htmlFor="book-txn" className="text-sm font-semibold">ট্রানজ্যাকশন আইডি</label>
            <input id="book-txn" value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="যেমন: 9HX7K2LM1P" className="input mt-1.5" />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-[var(--danger)]">{error}</p>
          )}
          <button type="submit" disabled={mut.isPending} className="btn-primary w-full py-3">
            {mut.isPending ? "পাঠানো হচ্ছে…" : "বই কেনার আবেদন জমা দিন"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[13px] font-medium text-[var(--dim)]">
            <IconLock size={13} />
            যাচাই ছাড়া অ্যাক্সেস চালু হয় না — পেমেন্ট নিশ্চিত হলেই অনুমোদন দেওয়া হয়।
          </p>
        </div>
      </form>
    </div>
  );
}

/**
 * The secure reader — a premium, full-screen reading room.
 *
 * It renders through a portal at the document root with the body
 * scroll locked, so the site header/nav/footer can never bleed into
 * the book (the old in-page overlay let the page chrome show through
 * on mobile — the owner's "home/dashboard texts inside the book"
 * complaint).
 *
 * Access is enforced LIVE, not just at open time. The signed URL now
 * lives only 10 minutes and this reader re-verifies with the server
 * every few minutes: if the admin removes the student's book access,
 * the next check returns no URL and the book closes with a notice.
 * (Before this fix the reader cached its URL for 45 minutes, so a
 * removed student simply kept reading.)
 *
 * The PDF itself is never public and never downloadable: PDF.js
 * renders pages to a canvas "sheet" on a dark stage (no download or
 * print controls exist in this viewer), the stage sits inside
 * [data-protect] (copy/right-click blocked site-wide), and a fixed
 * watermark with the reader's own name + mobile number floats over
 * the pages at every scroll position, so a leaked screenshot
 * identifies its source. Chapter jumps remount the viewer at the
 * section's first page and save that page as the resume point.
 *
 * Page navigation (fixed after the owner reported "no next-page
 * button, keyboard does nothing"): the SDK viewer's own prev/next
 * buttons are small and unstyled by default, and it has no keyboard
 * support at all. The reader therefore (1) styles those buttons into
 * clear pills, (2) adds a big always-visible bottom bar plus desktop
 * side arrows, and (3) handles ←/→/PageUp/PageDown/Home/End itself.
 * All of them press the viewer's own buttons, so page turns render
 * instantly from the already-downloaded document (no remount, no
 * re-download); a MutationObserver on the page canvas's aria-label
 * syncs the real page into the top bar, progress and resume point.
 * For speed, the Book page also prefetches the signed URL and warms
 * the browser cache with the PDF bytes before the reader is opened.
 *
 * Fullscreen (fixed after the owner's "ফুলস্ক্রিন হয় না" report):
 * requestFullscreen() REJECTS inside embedded webviews that don't
 * grant the fullscreen permission, and doesn't exist at all for
 * elements on iPhone Safari — the old code swallowed the rejection,
 * so the button did nothing. Now the toggle tries native fullscreen
 * (standard + webkit), checks whether it actually engaged, and if
 * not, switches the reader into an immersive mode that hides every
 * bar so the page fills the screen anyway. The tap always works.
 */
function BookReader({
  studentId,
  bookTitle,
  totalPages,
  fallbackPage,
  onClose,
}: {
  studentId: number;
  bookTitle: string;
  totalPages: number;
  fallbackPage: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const reader = useQuery({
    queryKey: ["book-reader", studentId],
    queryFn: () => api.getBookReader({ studentId }),
    // No long-lived cache: access is verified fresh on every open and
    // re-checked while reading, so an admin removal lands within
    // minutes instead of surviving in a cached signed URL.
    staleTime: 0,
    refetchInterval: 4 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [jumpPage, setJumpPage] = useState<number | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  // ---- Premium reader controls ----
  // View mode decides how the page sheet is sized inside the stage:
  // "page" narrows the sheet until the WHOLE page fits the screen
  // height (the owner's "pages are not fully visible" fix), "width"
  // fills the stage width, and the zoom steps (50%–200%) scale the
  // sheet from the fit-width size for close reading.
  const [fitMode, setFitMode] = useState<"page" | "width">("page");
  const [zoom, setZoom] = useState(1);
  const [readerTheme, setReaderTheme] = useState<"dark" | "light" | "sepia">("dark");
  const [gridOpen, setGridOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Immersive mode: the fallback when the browser REFUSES native
  // fullscreen — inside the app's embedded webview (and on iPhones,
  // where element fullscreen does not exist at all) requestFullscreen
  // rejects, and the old code swallowed that rejection, so the button
  // looked dead (the owner's "ফুলস্ক্রিন হয় না" report). Immersive
  // mode hides every reader bar so the page sheet fills the whole
  // screen — the same reading experience, no browser permission
  // needed. A floating pill keeps page turns + exit one tap away.
  const [immersive, setImmersive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Reading clock for THIS session (seconds), shown in the toolbar so
  // the student sees their reading time building up.
  const [sessionSecs, setSessionSecs] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Latest overlay state for the keyboard handler: Escape peels one
  // layer at a time (grid → TOC → reader) instead of closing all.
  const uiStateRef = useRef<{
    grid: boolean;
    toc: boolean;
    immersive: boolean;
    setGrid: (v: boolean) => void;
    setToc: (v: boolean) => void;
    setImmersive: (v: boolean) => void;
  }>({
    grid: false,
    toc: false,
    immersive: false,
    setGrid: () => {},
    setToc: () => {},
    setImmersive: () => {},
  });
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const bookmarksQ = useQuery({
    queryKey: ["book-bookmarks", studentId],
    queryFn: () => api.getBookBookmarks({ studentId }),
    enabled: !!studentId,
  });
  const bookmarkPages = bookmarksQ.data?.pages ?? [];
  const bookmarkMut = useMutation({
    mutationFn: (page: number) => api.toggleBookBookmark({ studentId, page }),
    onSuccess: (r, page) => {
      queryClient.setQueryData(["book-bookmarks", studentId], { pages: r.pages });
      showToast(
        r.bookmarked
          ? `পৃষ্ঠা ${bnNum(page)} বুকমার্ক করা হয়েছে`
          : "বুকমার্ক সরিয়ে দেওয়া হয়েছে",
      );
    },
  });

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  };

  // Session reading clock — ticks only while the book is actually open.
  useEffect(() => {
    if (!activeUrl) return;
    const t = window.setInterval(() => setSessionSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [activeUrl]);

  // Track real fullscreen state (the user can also exit with Esc).
  // webkitFullscreenElement covers older Safari, which fires the
  // webkit-prefixed change event instead.
  useEffect(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
    };
    const onFs = () =>
      setIsFullscreen(
        document.fullscreenElement != null ||
          doc.webkitFullscreenElement != null,
      );
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, []);

  const toggleFullscreen = () => {
    // Immersive fallback already on → the button simply turns it off.
    if (immersive) {
      setImmersive(false);
      return;
    }
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => void;
    };
    if (document.fullscreenElement || doc.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        void document.exitFullscreen().catch(() => {});
      } else {
        doc.webkitExitFullscreen?.();
      }
      return;
    }
    const el = rootRef.current as
      | (HTMLDivElement & {
          webkitRequestFullscreen?: () => void;
        })
      | null;
    try {
      if (el?.requestFullscreen) {
        // The promise REJECTS where the embedding frame forbids
        // fullscreen (the Muse app webview) — caught here, and the
        // check below turns the immersive fallback on instead of
        // leaving the tap looking dead.
        void el.requestFullscreen().catch(() => {});
      } else if (el?.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } catch {
      // Some browsers throw synchronously for a disallowed request;
      // the fallback check below handles that too.
    }
    // Give the browser a beat to engage native fullscreen; if it
    // didn't (blocked webview, iPhone Safari), fall back to immersive
    // mode so the tap ALWAYS does something visible.
    window.setTimeout(() => {
      if (
        !document.fullscreenElement &&
        !doc.webkitFullscreenElement
      ) {
        setImmersive(true);
        showToast("পুরো স্ক্রিন মোড চালু — পৃষ্ঠাটি এখন পুরো স্ক্রিনে");
      }
    }, 350);
  };
  // Resume-point adoption: adoptedPageRef is the last server lastPage
  // this mount has applied; userNavRef flips true the moment the
  // student turns or jumps a page themselves, after which refetches
  // no longer move the reading position.
  const adoptedPageRef = useRef(0);
  const userNavRef = useRef(false);
  // The page the student is actually on. The viewer's own buttons move
  // it internally; a MutationObserver on the rendered page's aria-label
  // (below) keeps this in sync, so the top bar, progress bar, chapter
  // name, bottom bar and the saved resume point all track real reading
  // instead of only chapter jumps.
  const [currentPage, setCurrentPage] = useState(1);
  const currentPageRef = useRef(1);
  // The page count of the document that ACTUALLY loaded, read from the
  // viewer's own page label. The settings total describes the printed
  // book (762), but the uploaded file can differ (the owner's current
  // upload has 697 pages) — once the document is in, its own count is
  // the truth for the bars, progress and first/last jumps, so the
  // reader never shows two different totals at once.
  const [docTotal, setDocTotal] = useState<number | null>(null);
  const docTotalRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  // The page whose debounced save is still pending; flushed on
  // unmount so closing the reader right after a page turn never
  // loses the new resume point.
  const pendingSaveRef = useRef<number | null>(null);
  // Filled in during render (once jumpTo exists); the keyboard handler,
  // the bottom bar and the side arrows all drive the reader from here.
  const navRef = useRef<{
    prev: () => void;
    next: () => void;
    first: () => void;
    last: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitPage: () => void;
    toggleFullscreen: () => void;
    toggleBookmark: () => void;
    toggleToc: () => void;
  }>({
    prev: () => {},
    next: () => {},
    first: () => {},
    last: () => {},
    zoomIn: () => {},
    zoomOut: () => {},
    fitPage: () => {},
    toggleFullscreen: () => {},
    toggleBookmark: () => {},
    toggleToc: () => {},
  });

  const total = docTotal ?? reader.data?.totalPages ?? totalPages;
  const startPage = Math.min(
    Math.max(1, jumpPage ?? reader.data?.lastPage ?? fallbackPage),
    total,
  );

  // Adopt the first signed URL the server hands out. Later refetches
  // only re-verify access — adopting each fresh URL would remount the
  // viewer and reload the whole book for nothing. A refetch that comes
  // back WITHOUT a URL after one was granted means the access was
  // removed: the book closes.
  useEffect(() => {
    if (!reader.data) return;
    if (reader.data.url) {
      const url = reader.data.url;
      setActiveUrl((prev) => prev ?? url);
      // Adopt the server's resume point — and keep adopting while the
      // student hasn't turned a page themselves: the first response
      // can be a stale cached one (the Book page prefetches this
      // query), and the fresh refetch right behind it carries the
      // real last page. A one-shot guard here froze a reopened reader
      // on the stale page, so ordinary page turns never resumed.
      const p = reader.data.lastPage || fallbackPage || 1;
      if (!userNavRef.current && p !== adoptedPageRef.current) {
        adoptedPageRef.current = p;
        setJumpPage(p);
        currentPageRef.current = p;
        setCurrentPage(p);
      }
    } else if (activeUrl) {
      setRevoked(true);
    }
  }, [reader.data, activeUrl, fallbackPage]);

  // Lock the page behind the reader (it can no longer scroll into
  // view around the edges), let Escape close it, and give the desktop
  // keyboard full page control: ←/→ and PageUp/PageDown turn pages,
  // Home/End jump to the first/last page. (The SDK viewer has no
  // keyboard handling of its own — without this, keys did nothing.)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Peel one layer at a time: page grid first, then the TOC
        // drawer, then immersive mode, and only then the reader
        // itself. (In NATIVE fullscreen the browser exits fullscreen
        // on Esc before this handler matters.)
        if (uiStateRef.current.grid) uiStateRef.current.setGrid(false);
        else if (uiStateRef.current.toc) uiStateRef.current.setToc(false);
        else if (uiStateRef.current.immersive)
          uiStateRef.current.setImmersive(false);
        else onClose();
        return;
      }
      // While the student is typing a page number (or using any form
      // control), the keys belong to the field, not the reader.
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        navRef.current.next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        navRef.current.prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        navRef.current.first();
      } else if (e.key === "End") {
        e.preventDefault();
        navRef.current.last();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        navRef.current.zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        navRef.current.zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        navRef.current.fitPage();
      } else if (e.key === "f" || e.key === "F") {
        navRef.current.toggleFullscreen();
      } else if (e.key === "b" || e.key === "B") {
        navRef.current.toggleBookmark();
      } else if (e.key === "t" || e.key === "T") {
        navRef.current.toggleToc();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const saveMut = useMutation({
    mutationFn: (page: number) => api.saveBookProgress({ studentId, page }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["book-access"] });
    },
  });
  // The page observer calls the mutation through this ref: the
  // useMutation result object changes identity whenever the mutation
  // state changes, so depending on it in the observer effect made
  // every page turn's re-render run the effect cleanup — which
  // cleared the pending debounced save before it could fire.
  const saveRef = useRef(saveMut.mutate);
  saveRef.current = saveMut.mutate;

  const jumpTo = (page: number) => {
    const p = Math.min(Math.max(1, Math.floor(page) || 1), total);
    userNavRef.current = true;
    setJumpPage(p);
    setTocOpen(false);
    currentPageRef.current = p;
    setCurrentPage(p);
    saveMut.mutate(p);
  };

  const submitJump = (e: React.FormEvent) => {
    e.preventDefault();
    jumpTo(Number(jumpInput));
    setJumpInput("");
  };

  // Page turning goes through the viewer's OWN prev/next buttons: the
  // viewer keeps its page state internally and renders the next page
  // straight from the already-downloaded document, so a turn is
  // instant — no remount, no re-download of the whole book. The
  // reader's big bottom/side buttons and the keyboard all press these
  // same buttons, and the observer below syncs the real page back out.
  const clickViewerNav = (which: "prev" | "next") => {
    const stage = stageRef.current;
    if (!stage) return;
    const nav = stage.querySelector("nav");
    if (!nav) return;
    const buttons = nav.querySelectorAll("button");
    const btn =
      which === "prev" ? buttons.item(0) : buttons.item(buttons.length - 1);
    if (btn && !btn.disabled) btn.click();
  };
  const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const stepZoom = (dir: 1 | -1) => {
    const idx = ZOOM_STEPS.reduce(
      (best, z, i) => (Math.abs(z - zoom) < Math.abs((ZOOM_STEPS[best] ?? 1) - zoom) ? i : best),
      0,
    );
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, idx + dir))] ?? 1;
    setZoom(next);
  };
  navRef.current = {
    prev: () => clickViewerNav("prev"),
    next: () => clickViewerNav("next"),
    first: () => jumpTo(1),
    last: () => jumpTo(total),
    zoomIn: () => stepZoom(1),
    zoomOut: () => stepZoom(-1),
    fitPage: () => {
      setFitMode("page");
      setZoom(1);
    },
    toggleFullscreen,
    toggleBookmark: () => bookmarkMut.mutate(currentPageRef.current),
    toggleToc: () => setTocOpen((v) => !v),
  };

  // Sync the page the viewer is actually showing into currentPage: the
  // rendered canvas carries it in its aria-label ("বইয়ের পৃষ্ঠা ১২ …").
  // The saved resume point follows real reading too — debounced, so a
  // run of rapid page turns saves once, not once per page.
  useEffect(() => {
    if (!activeUrl) return;
    const stage = stageRef.current;
    if (!stage) return;
    const read = () => {
      const canvas = stage.querySelector("canvas");
      // While the document is (re)loading the viewer hides the canvas
      // and its label transiently reads "page 1 of 1" — acting on that
      // would reset the reading position and the saved progress to
      // page 1 on every chapter jump. Only a visible canvas counts.
      if (!canvas || canvas.hidden) return;
      const label = canvas.getAttribute("aria-label") ?? "";
      const latin = label.replace(/[০-৯]/g, (d) =>
        String("০১২৩৪৫৬৭৮৯".indexOf(d)),
      );
      const nums = latin.match(/\d+/g);
      if (!nums || nums.length === 0) return;
      // The label is "বইয়ের পৃষ্ঠা <page> (মোট <total>)" — the second
      // number is the loaded document's real page count.
      const docT = nums.length > 1 ? Number(nums[1]) : NaN;
      if (
        Number.isFinite(docT) &&
        docT >= 1 &&
        docT !== docTotalRef.current
      ) {
        docTotalRef.current = docT;
        setDocTotal(docT);
      }
      const p = Number(nums[0]);
      if (!Number.isFinite(p) || p < 1 || p === currentPageRef.current)
        return;
      userNavRef.current = true;
      currentPageRef.current = p;
      setCurrentPage(p);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      pendingSaveRef.current = p;
      saveTimerRef.current = window.setTimeout(() => {
        pendingSaveRef.current = null;
        saveRef.current(p);
      }, 700);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(stage, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label", "hidden"],
    });
    return () => {
      obs.disconnect();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [activeUrl]);

  // Flush a still-pending progress save when the reader closes, so
  // the resume point survives even a close within the debounce window.
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current != null) {
        saveRef.current(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }
    };
  }, []);

  uiStateRef.current = {
    grid: gridOpen,
    toc: tocOpen,
    immersive,
    setGrid: setGridOpen,
    setToc: setTocOpen,
    setImmersive,
  };

  const chapter =
    [...BOOK_TOC].reverse().find((s) => currentPage >= s.page) ??
    BOOK_TOC[0]!;
  const nextChapter = BOOK_TOC.find((s) => s.page > currentPage);
  const progressPct = Math.min(
    100,
    Math.max(0, ((currentPage - 1) / Math.max(1, total - 1)) * 100),
  );
  const remainingPages = Math.max(0, total - currentPage);
  const isBookmarked = bookmarkPages.includes(currentPage);
  const sessionLabel =
    sessionSecs >= 60
      ? `${bnNum(Math.floor(sessionSecs / 60))} মিনিট`
      : `${bnNum(sessionSecs)} সেকেন্ড`;
  // Page-sheet width per view mode. The book is Letter (8.5×11in,
  // ratio ≈ 0.773): in fit-page mode the sheet's width is capped so
  // its HEIGHT (width ÷ 0.773) fits between the reader's bars — the
  // whole page is then visible at once with no scrolling. Fit-width
  // and zoom widen the sheet for close reading; the stage scrolls.
  const sheetWidth =
    fitMode === "page"
      ? immersive
        ? // Bars hidden: nearly the full viewport height is page.
          "min(97vw, calc((100dvh - 30px) * 0.773), 920px)"
        : "min(94vw, calc((100dvh - 215px) * 0.773), 880px)"
      : `min(calc(94vw * ${zoom}), calc(880px * ${zoom}))`;
  // The fullscreen button reflects EITHER fullscreen flavour: native
  // browser fullscreen or the immersive fallback.
  const fsActive = isFullscreen || immersive;
  const onDarkStage = readerTheme === "dark";
  const barCls = onDarkStage
    ? "border-white/10 bg-white/[0.04]"
    : "border-black/10 bg-white/55";
  const barText = onDarkStage ? "text-white" : "text-[#10302a]";
  const ghostBtn = onDarkStage
    ? "border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
    : "border-black/10 bg-white/70 text-[#10302a] hover:bg-white";
  const cycleTheme = () =>
    setReaderTheme((t) => (t === "dark" ? "light" : t === "light" ? "sepia" : "dark"));
  const themeLabel =
    readerTheme === "dark" ? "ডার্ক" : readerTheme === "light" ? "লাইট" : "সেপিয়া";
  const watermark = [
    reader.data?.studentName ?? "",
    reader.data?.studentPhone ?? "",
  ]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div
      ref={rootRef}
      className={`fade-in reader-theme-${readerTheme} fixed inset-0 z-[100] flex flex-col ${barText}`}
      role="dialog"
      aria-modal="true"
      aria-label={`বই রিডার — ${bookTitle}`}
    >
      {/* ---- Top bar (hidden in immersive mode: page fills all) ---- */}
      <div className={`${immersive ? "hidden" : ""} relative z-40 border-b pt-safe backdrop-blur-md ${barCls}`}>
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${ghostBtn}`}
            aria-label="রিডার বন্ধ করে বইয়ের পেজে ফিরুন"
          >
            <IconArrowLeft size={16} /> ফিরুন
          </button>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[15px] font-extrabold leading-tight tracking-tight sm:text-base">
              <IconBook size={18} className="shrink-0 text-[#2cc9b4]" />
              <span className="truncate">{bookTitle}</span>
            </p>
            <p className={`truncate text-[12.5px] font-medium leading-tight ${onDarkStage ? "text-white/60" : "text-[#10302a]/60"}`}>
              {chapter.title}
              {nextChapter
                ? ` · পরের অধ্যায় পৃষ্ঠা ${bnNum(nextChapter.page)} থেকে`
                : ""}
            </p>
          </div>
          <span
            className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold md:inline-flex ${ghostBtn}`}
            title="এই সেশনে পড়ার সময়"
          >
            <IconClock size={13} /> {sessionLabel}
          </span>
          <form
            className="hidden items-center gap-1.5 md:flex"
            onSubmit={submitJump}
          >
            <label htmlFor="reader-jump" className="sr-only">
              পৃষ্ঠা নম্বর লিখে যান
            </label>
            <input
              id="reader-jump"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="পৃষ্ঠা নং"
              inputMode="numeric"
              className={`w-24 rounded-full border px-3.5 py-2 text-sm outline-none transition-colors focus:border-[#2cc9b4] ${ghostBtn} placeholder:opacity-50`}
            />
            <button
              type="submit"
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${ghostBtn}`}
            >
              যান
            </button>
          </form>
          <span className={`hidden shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-bold sm:inline ${ghostBtn}`}>
            পৃষ্ঠা {bnNum(currentPage)} / {bnNum(total)}
          </span>
          <button
            type="button"
            onClick={() => setTocOpen((v) => !v)}
            aria-expanded={tocOpen}
            className="btn-primary shrink-0 px-4 py-2 text-sm"
          >
            <IconLayers size={16} /> সূচিপত্র
          </button>
        </div>
        {/* Reading progress */}
        <div
          className={`h-[3px] w-full ${onDarkStage ? "bg-white/[0.07]" : "bg-black/[0.08]"}`}
          role="progressbar"
          aria-valuenow={currentPage}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="পড়ার অগ্রগতি"
        >
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #12937f, #2cc9b4)",
            }}
          />
        </div>
        {/* ---- Premium toolbar: view modes, zoom, theme, tools ---- */}
        {activeUrl && !revoked && (
          <div
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 pb-2.5 sm:justify-center sm:px-5"
            role="toolbar"
            aria-label="রিডারের টুলবার"
          >
            <div className={`flex shrink-0 items-center gap-0.5 rounded-full border p-1 ${ghostBtn}`}>
              <button
                type="button"
                onClick={() => {
                  setFitMode("width");
                  stepZoom(-1);
                }}
                disabled={zoom <= 0.5 && fitMode === "width"}
                aria-label="জুম কমান"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#2cc9b4]/20 disabled:opacity-35"
              >
                <IconZoomOut size={17} />
              </button>
              <span className="min-w-[52px] text-center text-[12.5px] font-extrabold tabular-nums" aria-live="polite">
                {fitMode === "page" ? "পুরো পেজ" : `${bnNum(Math.round(zoom * 100))}%`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFitMode("width");
                  stepZoom(1);
                }}
                disabled={zoom >= 2}
                aria-label="জুম বাড়ান"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#2cc9b4]/20 disabled:opacity-35"
              >
                <IconZoomIn size={17} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setFitMode("page");
                setZoom(1);
              }}
              aria-pressed={fitMode === "page"}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${fitMode === "page" ? "border-[#2cc9b4]/60 bg-[#2cc9b4]/20" : ghostBtn}`}
            >
              <IconFitPage size={16} /> পুরো পৃষ্ঠা
            </button>
            <button
              type="button"
              onClick={() => setFitMode("width")}
              aria-pressed={fitMode === "width"}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${fitMode === "width" ? "border-[#2cc9b4]/60 bg-[#2cc9b4]/20" : ghostBtn}`}
            >
              <IconFitWidth size={16} /> পুরো প্রস্থ
            </button>
            <button
              type="button"
              onClick={() => bookmarkMut.mutate(currentPage)}
              aria-pressed={isBookmarked}
              aria-label={isBookmarked ? "এই পৃষ্ঠার বুকমার্ক সরান" : "এই পৃষ্ঠা বুকমার্ক করুন"}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${isBookmarked ? "border-[#2cc9b4]/60 bg-[#2cc9b4]/20" : ghostBtn}`}
            >
              {isBookmarked ? <IconBookmarkFill size={16} /> : <IconBookmark size={16} />}
              {isBookmarked ? "বুকমার্ক করা" : "বুকমার্ক"}
            </button>
            <button
              type="button"
              onClick={() => setGridOpen(true)}
              aria-label="সব পৃষ্ঠার গ্রিড খুলুন"
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${ghostBtn}`}
            >
              <IconGridDots size={16} /> পৃষ্ঠা গ্রিড
            </button>
            <button
              type="button"
              onClick={cycleTheme}
              aria-label={`রিডারের থিম বদলান — এখন ${themeLabel}`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${ghostBtn}`}
            >
              <IconBrightness size={16} /> {themeLabel}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fsActive ? "ফুলস্ক্রিন থেকে বের হোন" : "ফুলস্ক্রিনে পড়ুন"}
              aria-pressed={fsActive}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${ghostBtn}`}
            >
              {fsActive ? <IconCompress size={16} /> : <IconExpand size={16} />}
              {fsActive ? "ছোট করুন" : "ফুলস্ক্রিন"}
            </button>
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* ---- TOC drawer ---- */}
        {tocOpen && (
          <>
            <button
              type="button"
              aria-label="সূচিপত্র বন্ধ করুন"
              onClick={() => setTocOpen(false)}
              className="absolute inset-0 z-10 bg-black/50 lg:hidden"
            />
            <aside
              className="absolute inset-y-0 left-0 z-20 flex w-[300px] max-w-[86vw] shrink-0 flex-col border-r border-white/10 bg-[#0a1a16] p-3 shadow-2xl lg:static lg:z-auto lg:bg-white/[0.03] lg:shadow-none"
              aria-label="বইয়ের সূচিপত্র"
            >
              <div className="flex items-center justify-between px-1.5 pb-2">
                <p className="text-[15px] font-extrabold tracking-tight">
                  অধ্যায়সমূহ
                </p>
                <button
                  type="button"
                  onClick={() => setTocOpen(false)}
                  aria-label="সূচিপত্র বন্ধ করুন"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <IconX size={16} />
                </button>
              </div>
              <ol className="grid min-h-0 flex-1 gap-1.5 overflow-y-auto pr-0.5">
                {BOOK_TOC.map((s) => {
                  const isCurrent = chapter.page === s.page;
                  return (
                    <li key={s.page}>
                      <button
                        type="button"
                        onClick={() => jumpTo(s.page)}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={`${s.title} — পৃষ্ঠা ${bnNum(s.page)} থেকে পড়ুন`}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                          isCurrent
                            ? "bg-[#2cc9b4]/15 text-[#7fe8d8] ring-1 ring-[#2cc9b4]/30"
                            : "text-white/85 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[14.5px] font-bold leading-snug">
                            {s.title}
                          </span>
                          {isCurrent && <IconCheck size={15} className="shrink-0" />}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-white/50">
                          {s.note} · পৃষ্ঠা {bnNum(s.page)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {bookmarkPages.length > 0 && (
                <div className="mt-3 border-t border-white/10 px-1.5 pt-3">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-extrabold tracking-tight text-white">
                    <IconBookmarkFill size={14} className="text-[#2cc9b4]" />
                    আমার বুকমার্ক ({bnNum(bookmarkPages.length)})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {bookmarkPages.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => jumpTo(p)}
                        aria-label={`বুকমার্ক করা পৃষ্ঠা ${bnNum(p)}-তে যান`}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-bold transition-colors ${
                          p === currentPage
                            ? "bg-[#2cc9b4] text-[#04241f]"
                            : "bg-white/[0.07] text-white/85 ring-1 ring-white/10 hover:bg-white/[0.13]"
                        }`}
                      >
                        পৃষ্ঠা {bnNum(p)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <form
                className="mt-3 flex items-center gap-1.5 px-1 md:hidden"
                onSubmit={submitJump}
              >
                <label htmlFor="reader-jump-m" className="sr-only">
                  পৃষ্ঠা নম্বর লিখে যান
                </label>
                <input
                  id="reader-jump-m"
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="পৃষ্ঠা নম্বর"
                  inputMode="numeric"
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2cc9b4]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.14]"
                >
                  যান <IconArrowRight size={14} />
                </button>
              </form>
              <p className="bn-read-sm mt-4 flex gap-2 px-1.5 text-white/55">
                <IconShield size={15} className="mt-1 shrink-0 text-[#5fdcc9]" />
                এই বইটি শুধু আপনার পড়ার জন্য — ডাউনলোড করা যায় না।
                যেখানে থামবেন, পরের বার সেখান থেকেই শুরু হবে।
              </p>
            </aside>
          </>
        )}

        {/* ---- Page stage ---- */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={stageRef}
            className="reader-stage h-full overflow-auto"
            data-protect
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) touchRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = touchRef.current;
              touchRef.current = null;
              const t = e.changedTouches[0];
              if (!start || !t || !activeUrl || revoked) return;
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              // A mostly-horizontal swipe past 70px turns the page —
              // but only at fit zoom levels where the sheet is not
              // wider than the screen (otherwise the swipe is the
              // student panning a zoomed page, not turning it).
              if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && fitMode === "page") {
                if (dx < 0) navRef.current.next();
                else navRef.current.prev();
              }
            }}
          >
          {revoked ? (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/[0.06] text-[#f0a04b] ring-1 ring-white/10">
                <IconLock size={30} />
              </span>
              <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                বইয়ের অ্যাক্সেস বন্ধ করা হয়েছে
              </h2>
              <p className={`bn-read-sm mt-2 ${onDarkStage ? "text-white/60" : "text-[#10302a]/65"}`}>
                আপনার অ্যাকাউন্টে বই পড়ার অ্যাক্সেস এখন চালু নেই — তাই
                রিডারটি বন্ধ হয়ে গেছে। কোনো ভুল হয়ে থাকলে যোগাযোগ
                করুন:{" "}
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-bold text-[#5fdcc9] underline"
                >
                  {EMAIL}
                </a>
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary mt-6 px-6"
              >
                বইয়ের পেজে ফিরুন
              </button>
            </div>
          ) : reader.isPending && !activeUrl ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
              <img
                src={coverImg}
                alt=""
                className="w-24 rounded-md shadow-[0_20px_44px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
              />
              <p className={`mt-5 font-semibold ${onDarkStage ? "text-white/85" : "text-[#10302a]/85"}`} role="status">
                বইটি খুলছে…
              </p>
              <p className={`mt-1 text-sm ${onDarkStage ? "text-white/50" : "text-[#10302a]/55"}`}>
                {bnNum(total)} পৃষ্ঠার বই — প্রথমবার লোড হতে একটু সময়
                লাগতে পারে; একবার লোড হলেই প্রতিটি পৃষ্ঠা সঙ্গে সঙ্গে
                খুলবে
              </p>
              <div className={`mt-5 h-1.5 w-52 overflow-hidden rounded-full ${onDarkStage ? "bg-white/10" : "bg-black/10"}`}>
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#2cc9b4]" />
              </div>
            </div>
          ) : !activeUrl ? (
            <div className="mx-auto max-w-md px-4 py-16 text-center">
              <div className={`rounded-[var(--radius)] border p-6 leading-relaxed ${onDarkStage ? "border-white/10 bg-white/[0.05] text-white/80" : "border-black/10 bg-white/60 text-[#10302a]/85"}`}>
                বইটি এখন খোলা যাচ্ছে না — হয় ফাইলটি এখনো আপলোড হয়নি,
                নয়তো আপনার অ্যাক্সেস যাচাই করা যায়নি। একটু পরে আবার
                চেষ্টা করুন।
              </div>
              <button
                type="button"
                onClick={() => void reader.refetch()}
                className="btn-primary mt-4 px-6"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : (
            <div className="mx-auto px-2 py-4 sm:px-4 sm:py-6" style={{ width: sheetWidth }}>
              <div className="reader-page overflow-hidden rounded-[10px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/10">
                <PdfViewer
                  key={`${activeUrl}-${startPage}`}
                  src={activeUrl}
                  initialPage={startPage}
                  ariaLabel={`${bookTitle} — বইয়ের পৃষ্ঠা`}
                  labels={{
                    loading: "বইটি লোড হচ্ছে…",
                    loadError:
                      "বইটি লোড করা যায়নি — সংযোগ দেখে আবার চেষ্টা করুন।",
                    pageError: "এই পৃষ্ঠাটি দেখানো যাচ্ছে না।",
                    previousPage: "আগের পৃষ্ঠা",
                    nextPage: "পরের পৃষ্ঠা",
                    pageIndicator: (p, t) =>
                      `পৃষ্ঠা ${bnNum(p)} / ${bnNum(t)}`,
                    navigationAriaLabel: "বইয়ের পৃষ্ঠা বদলান",
                    pageAriaLabel: (p, t) =>
                      `বইয়ের পৃষ্ঠা ${bnNum(p)} (মোট ${bnNum(t)})`,
                  }}
                  className="w-full [&_nav]:px-1 [&_nav]:pt-3 [&_nav_button]:rounded-full [&_nav_button]:border [&_nav_button]:border-[#0a5c50]/30 [&_nav_button]:bg-[#0a5c50]/[0.07] [&_nav_button]:px-4 [&_nav_button]:py-1.5 [&_nav_button]:text-sm [&_nav_button]:font-bold [&_nav_button]:text-[#08594f] [&_nav_button]:transition-colors [&_nav_button:disabled]:opacity-35 [&_nav_span]:text-sm [&_nav_span]:font-bold [&_nav_span]:text-[#3f4a44]"
                />
              </div>
              <p className={`mt-4 flex items-center justify-center gap-1.5 text-center text-[12.5px] font-medium ${onDarkStage ? "text-white/45" : "text-[#10302a]/55"}`}>
                <IconShield size={13} className="shrink-0" />
                {fitMode === "page"
                  ? "পুরো পৃষ্ঠা দেখা যাচ্ছে — সোয়াইপ, বোতাম বা কীবোর্ডের ← → দিয়ে পৃষ্ঠা বদলান।"
                  : "পৃষ্ঠা বদলাতে নিচের বোতাম, পাশের তীর বা কীবোর্ডের ← → ব্যবহার করুন।"}{" "}
                এই বইটি শুধু পড়ার জন্য, ডাউনলোড করা যায় না।
              </p>
            </div>
          )}
          </div>

          {/* Big side arrows (desktop): always visible next to the page,
              one click per page — alongside the bottom bar and the
              keyboard, so turning a page never needs hunting. */}
          {activeUrl && !revoked && (
            <>
              <button
                type="button"
                onClick={() => navRef.current.prev()}
                disabled={currentPage <= 1}
                aria-label="আগের পৃষ্ঠা"
                className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-30 lg:flex"
              >
                <IconArrowLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => navRef.current.next()}
                disabled={currentPage >= total}
                aria-label="পরের পৃষ্ঠা"
                className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-30 lg:flex"
              >
                <IconArrowRight size={22} />
              </button>
            </>
          )}
        </div>

        {/* Watermark: the reader's own identity over the pages, fixed
            so it stays on top at every scroll position. */}
        {watermark && activeUrl && !revoked && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
          >
            <div className="absolute -inset-10 grid rotate-[-18deg] grid-cols-2 content-between gap-y-40 opacity-[0.05]">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap text-center text-[15px] font-extrabold tracking-wide text-white"
                >
                  {watermark} · VocabMaster
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Bottom page bar: big prev/next buttons that are ALWAYS
          on screen (every device), driving the viewer's own page
          state so turns render instantly from the loaded document.
          Hidden in immersive mode — the floating pill below takes
          over so the page can use the full screen height. */}
      {activeUrl && !revoked && !immersive && (
        <div className={`relative z-40 border-t pb-safe backdrop-blur-md ${barCls}`}>
          {/* Page scrubber: drag to sweep through the whole book. */}
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-2.5 sm:px-5">
            <span className={`shrink-0 text-[12px] font-bold tabular-nums ${onDarkStage ? "text-white/55" : "text-[#10302a]/55"}`}>
              {bnNum(Math.round(progressPct))}%
            </span>
            <label htmlFor="reader-scrub" className="sr-only">
              পৃষ্ঠা টেনে বদলান
            </label>
            <input
              id="reader-scrub"
              type="range"
              min={1}
              max={total}
              step={1}
              value={currentPage}
              onChange={(e) => jumpTo(Number(e.target.value))}
              className="reader-scrub min-w-0 flex-1"
              aria-valuetext={`পৃষ্ঠা ${bnNum(currentPage)} / ${bnNum(total)}`}
            />
            <span className={`shrink-0 text-[12px] font-bold tabular-nums ${onDarkStage ? "text-white/55" : "text-[#10302a]/55"}`}>
              {remainingPages > 0 ? `আর ${bnNum(remainingPages)} পৃষ্ঠা বাকি` : "শেষ পৃষ্ঠা"}
            </span>
          </div>
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
            <button
              type="button"
              onClick={() => navRef.current.prev()}
              disabled={currentPage <= 1}
              aria-label="আগের পৃষ্ঠা"
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-35 sm:px-5 ${ghostBtn}`}
            >
              <IconArrowLeft size={17} /> আগের পৃষ্ঠা
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-sm font-extrabold leading-tight">
                পৃষ্ঠা {bnNum(currentPage)} / {bnNum(total)}
              </p>
              <p className={`mt-0.5 hidden text-[11.5px] font-medium leading-tight md:block ${onDarkStage ? "text-white/45" : "text-[#10302a]/50"}`}>
                কীবোর্ড: ← → পৃষ্ঠা · +/− জুম · B বুকমার্ক · F ফুলস্ক্রিন
              </p>
            </div>
            <button
              type="button"
              onClick={() => navRef.current.next()}
              disabled={currentPage >= total}
              aria-label="পরের পৃষ্ঠা"
              className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-40 sm:px-5"
            >
              পরের পৃষ্ঠা <IconArrowRight size={17} />
            </button>
          </div>
        </div>
      )}

      {/* ---- Immersive floating pill: with every bar hidden, this
          small glass pill is the only chrome — page turns both ways,
          the current page, and the way back out of fullscreen. ---- */}
      {immersive && activeUrl && !revoked && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-4"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/55 p-1.5 text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => navRef.current.prev()}
              disabled={currentPage <= 1}
              aria-label="আগের পৃষ্ঠা"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-35"
            >
              <IconArrowLeft size={19} />
            </button>
            <span className="min-w-[86px] text-center text-[13px] font-extrabold tabular-nums" aria-live="polite">
              পৃষ্ঠা {bnNum(currentPage)} / {bnNum(total)}
            </span>
            <button
              type="button"
              onClick={() => navRef.current.next()}
              disabled={currentPage >= total}
              aria-label="পরের পৃষ্ঠা"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-35"
            >
              <IconArrowRight size={19} />
            </button>
            <span aria-hidden className="mx-0.5 h-6 w-px bg-white/20" />
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="ফুলস্ক্রিন থেকে বের হোন"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/15"
            >
              <IconCompress size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ---- Page grid overlay: every page one tap away, chapters
          and bookmarks marked — no more hunting through 700 pages. ---- */}
      {gridOpen && activeUrl && !revoked && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#07120f]/97 text-white backdrop-blur-md" role="dialog" aria-modal="true" aria-label="সব পৃষ্ঠার গ্রিড">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 pt-safe sm:px-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2cc9b4]/15 text-[#5fdcc9]">
              <IconGridDots size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="pt-0.5 text-[16px] font-extrabold leading-snug tracking-tight">সব পৃষ্ঠা</p>
              <p className="text-[12.5px] font-medium leading-tight text-white/55">
                যেকোনো পৃষ্ঠায় চাপ দিলেই সেখানে চলে যাবেন · অধ্যায়ের শুরু টিল রঙে, বুকমার্কে রিং
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGridOpen(false)}
              aria-label="পৃষ্ঠা গ্রিড বন্ধ করুন"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-colors hover:bg-white/[0.12]"
            >
              <IconX size={18} />
            </button>
          </div>
          <div className="reader-stage min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto grid max-w-4xl grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {Array.from({ length: total }, (_, i) => i + 1).map((p) => {
                const isChapter = BOOK_TOC.some((s) => s.page === p);
                const isMarked = bookmarkPages.includes(p);
                const isCurrent = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setGridOpen(false);
                      jumpTo(p);
                    }}
                    aria-label={`পৃষ্ঠা ${bnNum(p)}${isChapter ? " — অধ্যায়ের শুরু" : ""}${isMarked ? " — বুকমার্ক করা" : ""}`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`rounded-xl px-1 py-2.5 text-[13px] font-bold tabular-nums transition-all ${
                      isCurrent
                        ? "bg-[#2cc9b4] text-[#04241f] shadow-[0_8px_20px_-8px_rgba(44,201,180,0.8)]"
                        : isChapter
                          ? "bg-[#2cc9b4]/18 text-[#7fe8d8] ring-1 ring-[#2cc9b4]/40 hover:bg-[#2cc9b4]/30"
                          : "bg-white/[0.05] text-white/80 ring-1 ring-white/[0.07] hover:bg-white/[0.11]"
                    } ${isMarked && !isCurrent ? "ring-2 ring-[#f0a04b]/70" : ""}`}
                  >
                    {bnNum(p)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast (bookmark feedback) ---- */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-0 bottom-32 z-50 flex justify-center px-4"
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-[#0a5c50] px-5 py-2.5 text-sm font-bold text-white shadow-[0_16px_36px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/20">
            <IconBookmarkFill size={15} className="text-[#7fe8d8]" />
            {toast}
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
