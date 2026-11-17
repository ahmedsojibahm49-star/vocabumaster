import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import {
  bnNum,
  LEVEL_BLURB,
  LEVELS,
  PREMIUM_APPLICATION_TITLE,
  useAccessSettings,
  useApp,
} from "../lib";
import { Spinner } from "../components";
import {
  IconBook,
  IconCheck,
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconLock,
  IconMedal,
  IconWallet,
} from "../icons";

const EMAIL = "ahmedsojibahmso@gmail.com";

/**
 * VocabMaster Premium: which levels are free vs premium is the admin's
 * live setting (default A1 + A2 free; B1, B2, C1, C2 and IELTS premium).
 * This page explains the current model with the real per-level word
 * counts, shows the admin-set price (never an invented one), and takes
 * the premium application — pay by bKash/Nagad, submit the transaction
 * ID, and the admin's approval switches premium on for the applicant's
 * account (the আবেদন page in the admin panel).
 */
export function PremiumPage() {
  const { student, go } = useApp();
  const {
    freeLevels: FREE_LEVELS,
    premiumLevels: PREMIUM_LEVELS,
    isPremiumLevel,
  } = useAccessSettings();
  const queryClient = useQueryClient();
  const [name, setName] = useState(student?.name ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [method, setMethod] = useState("bKash");
  const [txnId, setTxnId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.getStats({}) });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings({}),
  });
  const state = useQuery({
    queryKey: ["student-state", student?.id],
    queryFn: () => api.getStudentState({ studentId: student?.id ?? 0 }),
    enabled: student != null,
  });

  const countOf = (lvl: string) =>
    stats.data?.byLevel.find((b) => b.level === lvl)?.count ?? 0;
  const freeTotal = FREE_LEVELS.reduce((n, l) => n + countOf(l), 0);
  const premiumTotal = PREMIUM_LEVELS.reduce((n, l) => n + countOf(l), 0);

  // The student's own latest premium application, if any (enrolments come
  // back newest-first, matched by their account phone number).
  const premiumApp = (state.data?.enrollments ?? []).find(
    (e) => e.courseId == null && e.courseTitle === PREMIUM_APPLICATION_TITLE,
  );
  // Prefer the server's fresh student row (the admin may have just
  // granted premium; the locally stored profile can lag behind).
  const isPremium = state.data?.student?.premium ?? student?.premium ?? false;
  const price = settings.data?.premiumPrice ?? null;
  const whatsapp = settings.data?.whatsapp ?? "";

  const mut = useMutation({
    mutationFn: () =>
      api.requestEnrollment({
        courseId: null,
        courseTitle: PREMIUM_APPLICATION_TITLE,
        name: name.trim(),
        phone: phone.trim(),
        method,
        txnId: txnId.trim(),
      }),
    onSuccess: (r) => {
      setDoneId(r.id);
      void queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
    onError: () => setError("আবেদন পাঠানো যায়নি — আবার চেষ্টা করুন।"),
  });

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
      {/* ---------- Hero ---------- */}
      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-9 text-white shadow-[var(--shadow-lift)] sm:px-10 sm:py-11"
        style={{ background: "var(--accent-grad)" }}
        aria-label="VocabMaster Premium"
      >
        <span className="auth-dots pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide backdrop-blur-sm">
              <IconMedal size={15} /> VOCABMASTER PREMIUM
            </span>
            <h1 className="mt-4 text-[32px] font-extrabold leading-tight tracking-tight sm:text-[42px]">
              পুরো শব্দভান্ডার আপনার হাতের মুঠোয়
            </h1>
            <p className="bn-read mt-3 max-w-xl text-white/85">
              {FREE_LEVELS.join(" ও ")} লেভেল সবার জন্য একদম ফ্রি। প্রিমিয়াম
              নিলে খুলে যাবে {PREMIUM_LEVELS.join(", ")} — মোট{" "}
              {bnNum(premiumTotal)}টি উন্নত লেভেলের শব্দ, ফ্ল্যাশকার্ড, কুইজ
              আর IELTS মক টেস্টসহ।
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[13.5px] font-bold">
              <span className="rounded-full bg-white/12 px-3.5 py-1.5 backdrop-blur-sm">
                ফ্রি: {FREE_LEVELS.join(" · ")} ({bnNum(freeTotal)} শব্দ)
              </span>
              <span className="rounded-full bg-white px-3.5 py-1.5 text-[var(--accent-strong)]">
                প্রিমিয়াম: {PREMIUM_LEVELS.join(" · ")} ({bnNum(premiumTotal)} শব্দ)
              </span>
            </div>
          </div>
          <div className="glass-chip relative min-w-[240px] p-6 text-center text-[var(--text)]">
            {price != null ? (
              <>
                <p className="text-[13px] font-bold uppercase tracking-wider text-[var(--dim)]">
                  এককালীন মূল্য
                </p>
                <p className="mt-1.5 text-[44px] font-extrabold leading-none tracking-tight">
                  ৳{bnNum(price)}
                </p>
                <p className="bn-read-sm mt-2 text-[var(--dim)]">
                  একবার পেমেন্ট — সব প্রিমিয়াম লেভেল চিরদিনের জন্য খোলা।
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-bold uppercase tracking-wider text-[var(--dim)]">
                  মূল্য
                </p>
                <p className="mt-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
                  জানতে যোগাযোগ করুন
                </p>
                <p className="bn-read-sm mt-2 text-[var(--dim)]">
                  পেমেন্টের পরিমাণ ও নম্বর জানতে ইমেইল করুন:{" "}
                  <a href={`mailto:${EMAIL}`} className="font-bold text-[var(--accent-strong)] underline">
                    {EMAIL}
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Free vs Premium ---------- */}
      <section className="mt-9" aria-label="ফ্রি বনাম প্রিমিয়াম">
        <h2 className="text-[26px] font-extrabold tracking-tight sm:text-3xl">
          ফ্রি বনাম প্রিমিয়াম — কী কী পাবেন
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="card p-6 sm:p-7">
            <p className="flex items-center gap-2 text-lg font-extrabold">
              <span className="icon-chip h-10 w-10 rounded-xl">
                <IconBook size={19} />
              </span>
              ফ্রি — সবার জন্য
            </p>
            <ul className="mt-4 grid gap-2.5">
              {FREE_LEVELS.map((l) => (
                <li key={l} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-alt)] px-4 py-3">
                  <span className="text-[20px] font-extrabold text-[var(--accent)]">{l}</span>
                  <span className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--dim)]">
                    {LEVEL_BLURB[l]}
                  </span>
                  <span className="shrink-0 text-sm font-bold">{bnNum(countOf(l))} শব্দ</span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 grid gap-1.5 text-sm text-[var(--dim)]">
              {[
                `শব্দ পড়া, ফ্ল্যাশকার্ড ও কুইজ — ${FREE_LEVELS.join("/")} লেভেলে`,
                "সব গ্রামার লেসন ও বাক্য বানানোর প্র্যাকটিস",
                "ফ্রি লেভেল টেস্ট, ডেইলি টাস্ক, XP ও স্ট্রিক",
              ].map((f) => (
                <li key={f} className="flex items-start gap-1.5">
                  <IconCheck size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => go("vocab")}
              className="btn-outline mt-5 w-full"
            >
              ফ্রি শব্দ পড়া শুরু করুন
            </button>
          </div>

          <div
            className="card relative overflow-hidden p-6 sm:p-7"
            style={{
              borderColor: "color-mix(in srgb, var(--gold) 45%, transparent)",
              background:
                "linear-gradient(160deg, var(--gold-soft) 0%, var(--surface) 55%)",
            }}
          >
            <p className="flex items-center gap-2 text-lg font-extrabold">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[var(--shadow-pop)]"
                style={{ background: "var(--peach-grad)" }}
              >
                <IconMedal size={19} />
              </span>
              প্রিমিয়াম — পুরো ভান্ডার
            </p>
            <ul className="mt-4 grid gap-2.5">
              {LEVELS.filter((l) => isPremiumLevel(l)).map((l) => (
                <li key={l} className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
                  <span className="text-[20px] font-extrabold text-[var(--peach)]">{l}</span>
                  <span className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--dim)]">
                    {LEVEL_BLURB[l]}
                  </span>
                  <span
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] p-1.5 text-[var(--gold)]"
                    aria-label="প্রিমিয়াম লেভেল"
                    title="প্রিমিয়াম লেভেল"
                  >
                    <IconLock size={12} />
                  </span>
                  <span className="shrink-0 text-sm font-bold">{bnNum(countOf(l))} শব্দ</span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 grid gap-1.5 text-sm text-[var(--dim)]">
              {[
                "সব লেভেলের শব্দ — অর্থ, USA/UK উচ্চারণ, উদাহরণসহ",
                "প্রতিটি লেভেলে ফ্ল্যাশকার্ড ও শব্দ কুইজ",
                "IELTS শব্দ মক টেস্ট",
                "সার্চে এখন সব শব্দই পাওয়া যাবে",
              ].map((f) => (
                <li key={f} className="flex items-start gap-1.5">
                  <IconCheck size={15} className="mt-0.5 shrink-0 text-[var(--peach)]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Status / application ---------- */}
      <section className="mt-9" aria-label="প্রিমিয়াম নেওয়ার আবেদন">
        {PREMIUM_LEVELS.length === 0 ? (
          <div className="card p-7 text-center sm:p-9">
            <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
              <IconCheckCircle size={30} />
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
              এখন সব লেভেলই সবার জন্য ফ্রি!
            </h2>
            <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
              A1 থেকে IELTS — পুরো শব্দভান্ডার এখন ফ্রিতে খোলা আছে।
              প্রিমিয়াম নেওয়ার দরকার নেই, সরাসরি পড়া শুরু করুন।
            </p>
            <button
              type="button"
              onClick={() => go("vocab")}
              className="btn-primary mt-6 px-7"
            >
              <IconBook size={17} /> শব্দ পড়া শুরু করুন
            </button>
          </div>
        ) : isPremium ? (
          <div className="card p-7 text-center sm:p-9">
            <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
              <IconCheckCircle size={30} />
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
              আপনার প্রিমিয়াম সক্রিয় আছে
            </h2>
            <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
              {PREMIUM_LEVELS.join(" থেকে ")} — সব লেভেলই আপনার জন্য খোলা।
              শুভকামনা, শেখা চালিয়ে যান!
            </p>
            <button
              type="button"
              onClick={() => go("vocab")}
              className="btn-primary mt-6 px-7"
            >
              <IconBook size={17} /> প্রিমিয়াম শব্দ পড়ুন
            </button>
          </div>
        ) : doneId != null ? (
          <div className="card p-7 text-center sm:p-9">
            <span className="icon-chip mx-auto h-16 w-16 rounded-[20px]">
              <IconCheckCircle size={30} />
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
              প্রিমিয়াম আবেদন পৌঁছেছে!
            </h2>
            <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
              আবেদন নম্বর #{bnNum(doneId)}। পেমেন্ট যাচাই শেষে অনুমোদন হলেই
              আপনার অ্যাকাউন্টে প্রিমিয়াম চালু হয়ে যাবে — ড্যাশবোর্ডে
              অবস্থা দেখতে পাবেন।
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {student ? (
                <button
                  type="button"
                  onClick={() => go("dashboard")}
                  className="btn-primary px-7"
                >
                  ড্যাশবোর্ডে যান
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => go("signup")}
                  className="btn-primary px-7"
                >
                  এই নম্বর দিয়ে অ্যাকাউন্ট খুলুন
                </button>
              )}
              <button
                type="button"
                onClick={() => go("vocab")}
                className="btn-outline px-7"
              >
                ততক্ষণ ফ্রি লেভেল পড়ুন
              </button>
            </div>
          </div>
        ) : premiumApp?.status === "pending" ? (
          <div className="card p-7 text-center sm:p-9">
            <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px]"
              style={{ background: "var(--peach-soft)", color: "var(--peach-strong)" }}
            >
              <IconClock size={30} />
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight">
              আপনার প্রিমিয়াম আবেদন যাচাই চলছে
            </h2>
            <p className="bn-read mx-auto mt-2 max-w-md text-[var(--dim)]">
              পেমেন্ট নিশ্চিত হলেই প্রিমিয়াম চালু হয়ে যাবে। ততক্ষণ{" "}
              {FREE_LEVELS.join("/")} ফ্রি লেভেল দিয়ে শেখা চালিয়ে যান।
            </p>
            <button
              type="button"
              onClick={() => go("vocab")}
              className="btn-primary mt-6 px-7"
            >
              ফ্রি শব্দ পড়ুন
            </button>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
            <div className="min-w-0">
              <h2 className="text-[26px] font-extrabold tracking-tight">
                প্রিমিয়াম নেওয়ার ধাপসমূহ
              </h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    n: "১",
                    t: "পেমেন্ট করুন",
                    d:
                      price != null
                        ? `bKash/Nagad-এ ৳${bnNum(price)} পাঠান — নম্বর জানতে নিচের নির্দেশনা দেখুন।`
                        : "bKash/Nagad-এ পেমেন্ট করুন — পরিমাণ ও নম্বর জানতে যোগাযোগ করুন।",
                  },
                  {
                    n: "২",
                    t: "আবেদন জমা দিন",
                    d: "ডানদিকের ফর্মে আপনার নাম, মোবাইল নম্বর আর ট্রানজ্যাকশন আইডি দিন।",
                  },
                  {
                    n: "৩",
                    t: "প্রিমিয়াম চালু",
                    d: "অ্যাডমিন যাচাই করে অনুমোদন দিলেই আপনার অ্যাকাউন্টে সব লেভেল খুলে যাবে।",
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
              {settings.isPending ? (
                <Spinner label="তথ্য লোড হচ্ছে…" />
              ) : settings.data?.paymentNote ? (
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
              ) : null}
              <div className="card mt-5 flex gap-3.5 p-5">
                <span className="icon-chip h-10 w-10 shrink-0 rounded-xl">
                  <IconClipboard size={19} />
                </span>
                <p className="bn-read-sm text-[var(--dim)]">
                  <strong className="text-[var(--text)]">মনে রাখুন:</strong>{" "}
                  প্রিমিয়াম চালু হয় আপনার অ্যাকাউন্টের মোবাইল নম্বরে। তাই
                  আবেদনে ঠিক সেই নম্বরটাই দিন, যেটা দিয়ে আপনি লগইন করেন —
                  তাহলে অনুমোদনের সঙ্গে সঙ্গেই সব লেভেল খুলে যাবে।
                </p>
              </div>
            </div>

            <form
              onSubmit={submit}
              className="card min-w-0 p-6 sm:p-7 lg:sticky lg:top-32"
            >
              <h2 className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight">
                <IconMedal size={21} className="text-[var(--peach)]" />
                প্রিমিয়ামের আবেদন
              </h2>
              {price != null && (
                <p className="mt-1 text-[15px] text-[var(--dim)]">
                  মূল্য:{" "}
                  <strong className="text-[18px] text-[var(--text)]">
                    ৳{bnNum(price)}
                  </strong>{" "}
                  (এককালীন)
                </p>
              )}
              {premiumApp?.status === "rejected" && (
                <p className="bn-read-sm mt-3 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 font-medium text-[var(--danger)]">
                  আপনার আগের প্রিমিয়াম আবেদনটি বাতিল হয়েছিল — পেমেন্টের
                  তথ্য ঠিক করে আবার আবেদন করতে পারেন।
                </p>
              )}
              {!student && (
                <p className="bn-read-sm mt-3 rounded-2xl bg-[var(--surface-alt)] px-4 py-3 text-[var(--dim)]">
                  প্রিমিয়াম আপনার অ্যাকাউন্টে চালু হয় — আগেই{" "}
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
                  করে নিলে অনুমোদনের পরপরই সব লেভেল খুলবে।
                </p>
              )}
              <div className="mt-5 grid gap-3.5">
                <div>
                  <label htmlFor="prm-name" className="text-sm font-semibold">
                    আপনার নাম
                  </label>
                  <input
                    id="prm-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input mt-1.5"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="prm-phone" className="text-sm font-semibold">
                    মোবাইল নম্বর (অ্যাকাউন্টের নম্বর)
                  </label>
                  <input
                    id="prm-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    className="input mt-1.5"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="prm-method" className="text-sm font-semibold">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    id="prm-method"
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
                  <label htmlFor="prm-txn" className="text-sm font-semibold">
                    ট্রানজ্যাকশন আইডি
                  </label>
                  <input
                    id="prm-txn"
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
                  className="btn-warm w-full py-3"
                >
                  {mut.isPending ? "পাঠানো হচ্ছে…" : "প্রিমিয়ামের আবেদন জমা দিন"}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[13px] font-medium text-[var(--dim)]">
                  <IconLock size={13} />
                  যাচাই ছাড়া প্রিমিয়াম চালু হয় না — পেমেন্ট নিশ্চিত হলেই
                  অনুমোদন দেওয়া হয়।
                </p>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
