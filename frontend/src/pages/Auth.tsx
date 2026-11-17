import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api";
import {
  isStrongPassword,
  loadAdminAuthed,
  passwordChecks,
  passwordScore,
  saveAdminAuthed,
  saveAdminEmail,
  saveAdminMustChange,
  useApp,
} from "../lib";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconClipboard,
  IconEye,
  IconEyeSlash,
  IconGrammar,
  IconInfo,
  IconLock,
  IconMail,
  IconPhone,
  IconShield,
  IconSparkle,
  IconUser,
  IconVideo,
} from "../icons";

/* ------------------------------------------------------------------ */
/* Split-screen auth shell (reference: Commerce Hunters login).        */
/* Form on the left, dark brand panel on the right; NO site nav bar,   */
/* header or footer is rendered on these pages (App hides the chrome). */
/* On phones the panel becomes a compact brand band on top.            */
/* ------------------------------------------------------------------ */

interface PanelChip {
  label: string;
  Icon: (p: { size?: number; className?: string }) => ReactNode;
}

function BrandMark({ size = 46 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[14px] text-white shadow-[0_14px_30px_-10px_rgba(9,89,79,0.55)]"
      style={{ width: size, height: size, background: "var(--accent-grad)" }}
    >
      <IconBook size={Math.round(size * 0.52)} />
    </span>
  );
}

function AuthShell({
  panelKicker,
  panelTitle,
  panelAccent,
  panelText,
  chips,
  children,
}: {
  panelKicker: string;
  panelTitle: string;
  panelAccent: string;
  panelText: string;
  chips: PanelChip[];
  children: ReactNode;
}) {
  const { go } = useApp();
  return (
    <div className="fade-in grid min-h-dvh lg:grid-cols-[1.02fr_1fr]">
      {/* ------- Form side ------- */}
      <div className="auth-side flex flex-col px-5 pb-8 pt-safe sm:px-10">
        <div className="mx-auto flex w-full max-w-md items-center justify-between pt-5">
          <span className="flex items-center gap-2.5 lg:hidden">
            <BrandMark size={38} />
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-tight">
                Vocab<span className="text-[var(--accent)]">Master</span>
              </span>
              <span className="mt-0.5 block text-[10.5px] font-medium text-[var(--dim)]">
                Online Learning Platform
              </span>
            </span>
          </span>
          <span className="hidden lg:block" aria-hidden />
          <button
            type="button"
            onClick={() => go("home")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--dim)] shadow-[var(--shadow-card)] transition-colors hover:text-[var(--text)]"
          >
            <IconArrowLeft size={15} />
            হোমে ফিরুন
          </button>
        </div>

        {/* Top-anchored, NOT vertically centered: a centered form
            re-centers (visibly jumps) every time dynamic content changes
            height — an error box appearing, the forgot-password panel
            opening, the strength label wrapping. Anchored at the top,
            those grow downward and the fields themselves never move. */}
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start pb-9 pt-10 lg:pt-20">
          {children}
          <p className="mt-7 flex items-center justify-center gap-1.5 text-center text-[13px] font-medium text-[var(--accent-strong)]">
            <IconShield size={15} />
            ১০০% সুরক্ষিত — আপনার পাসওয়ার্ড হ্যাশ করে সংরক্ষণ করা হয়
          </p>
        </div>
      </div>

      {/* ------- Brand panel (desktop) ------- */}
      <aside className="auth-panel relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-14">
        <div className="auth-dots absolute inset-0" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-3.5">
            <BrandMark size={52} />
            <span className="leading-tight">
              <span className="block text-[21px] font-extrabold tracking-tight">
                VocabMaster
              </span>
              <span className="block text-[13px] font-medium text-white/65">
                Online Learning Platform
              </span>
            </span>
          </div>
          <p className="mt-12 text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--teal-bright)]">
            {panelKicker}
          </p>
          <h2 className="mt-3 max-w-md text-[40px] font-extrabold leading-[1.25] tracking-tight">
            {panelTitle}{" "}
            <span className="text-[var(--teal-bright)]">{panelAccent}</span>
          </h2>
          <p className="bn-read mt-4 max-w-md text-white/75">{panelText}</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {chips.map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-[13.5px] font-semibold backdrop-blur-sm"
              >
                <Icon size={16} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Floating help button (real contact: the owner's email). */}
      <a
        href="mailto:ahmedsojibahmso@gmail.com?subject=VocabMaster%20—%20সাহায্য%20দরকার"
        aria-label="সাহায্য দরকার হলে ইমেইল করুন"
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_16px_32px_-10px_rgba(9,89,79,0.55)] transition-transform hover:-translate-y-0.5"
        style={{ background: "var(--accent-grad)" }}
      >
        <IconMail size={21} />
      </a>
    </div>
  );
}

/* ------------------------- shared form bits ------------------------ */

function FormHead({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--accent-strong)]">
        <IconSparkle size={14} />
        {eyebrow}
      </p>
      <h1 className="mt-2 text-[32px] font-extrabold tracking-tight">{title}</h1>
    </div>
  );
}

function PhoneField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        মোবাইল নাম্বার
      </label>
      <div className="field-shell mt-1.5">
        <IconPhone size={17} className="shrink-0 text-[var(--dim)]" />
        <span className="shrink-0 border-r border-[var(--border)] pr-2.5 text-[15px] font-semibold text-[var(--dim)]">
          +৮৮
        </span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="01XXXXXXXXX"
          inputMode="tel"
          autoComplete="tel"
          aria-label="মোবাইল নাম্বার"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="field-shell mt-1.5">
        <IconLock size={17} className="shrink-0 text-[var(--dim)]" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
          aria-pressed={show}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--dim)] transition-colors hover:text-[var(--text)]"
        >
          {show ? <IconEyeSlash size={18} /> : <IconEye size={18} />}
        </button>
      </div>
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[14px] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]"
    >
      <IconInfo size={17} className="mt-0.5 shrink-0" />
      {error}
    </p>
  );
}

/**
 * Live strong-password meter + rule checklist shown under the password
 * field while signing up. The same rules are enforced on the server, so
 * this is guidance — a weak password is rejected either way.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const score = passwordScore(password);
  const strong = isStrongPassword(password);
  const barColor =
    score <= 1
      ? "var(--danger)"
      : score === 2
        ? "var(--peach)"
        : score === 3
          ? "var(--gold)"
          : "var(--accent)";
  const label = !password
    ? "শক্তিশালী পাসওয়ার্ড দিন — হ্যাকারদের হাত থেকে অ্যাকাউন্ট বাঁচবে"
    : strong
      ? score >= 4
        ? "খুব শক্তিশালী পাসওয়ার্ড ✓"
        : "শক্তিশালী পাসওয়ার্ড ✓"
      : score <= 1
        ? "খুব দুর্বল — আরও শক্ত করুন"
        : "মোটামুটি — নিচের শর্তগুলো পূরণ করুন";
  const rules: { ok: boolean; text: string }[] = [
    { ok: checks.length, text: "কমপক্ষে ৮ অক্ষর" },
    { ok: checks.letter, text: "অন্তত একটি অক্ষর (a–z)" },
    { ok: checks.digit, text: "অন্তত একটি সংখ্যা (0–9)" },
  ];
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
      <div
        className="flex gap-1.5"
        role="img"
        aria-label={`পাসওয়ার্ডের শক্তি: ${label}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            aria-hidden
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              background: i < score ? barColor : "var(--border-strong)",
            }}
          />
        ))}
      </div>
      <p
        // Fixed two-line height: the label text changes with every
        // keystroke and its lengths wrap differently — without a reserved
        // height the meter box grew/shrank while typing and everything
        // below it kept shifting.
        className="mt-2 min-h-[44px] text-[13px] font-semibold"
        style={{ color: strong ? "var(--accent-strong)" : "var(--dim)" }}
        aria-live="polite"
      >
        {label}
      </p>
      <ul className="mt-1.5 grid gap-1">
        {rules.map((r) => (
          <li
            key={r.text}
            className={`flex items-center gap-1.5 text-[13px] font-medium ${
              r.ok ? "text-[var(--accent-strong)]" : "text-[var(--dim)]"
            }`}
          >
            <IconCheck size={13} className="shrink-0" />
            {r.text}
            {r.ok ? " — হয়েছে" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STUDENT_CHIPS: PanelChip[] = [
  { label: "৭,৬০০ শব্দের ভান্ডার", Icon: IconBook },
  { label: "গ্রামার ও বাক্য গঠন", Icon: IconGrammar },
  { label: "কোর্স ও লেসন", Icon: IconVideo },
  { label: "ফ্রি লেভেল টেস্ট", Icon: IconClipboard },
];

// ---------- Student login (dedicated page, no site chrome) ----------

export function LoginPage() {
  const { setStudent, go } = useApp();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const mut = useMutation({
    mutationFn: () => api.loginStudent({ phone: phone.trim(), password }),
    onSuccess: (r) => {
      if (r.ok && r.student) {
        setStudent(r.student);
        go("dashboard");
      } else {
        setError(r.error ?? "লগইন করা যায়নি — আবার চেষ্টা করুন।");
      }
    },
    onError: () => setError("লগইন করা যায়নি — আবার চেষ্টা করুন।"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.trim().length < 6) return setError("সঠিক মোবাইল নম্বর লিখুন।");
    if (!password) return setError("পাসওয়ার্ড লিখুন।");
    mut.mutate();
  };

  return (
    <AuthShell
      panelKicker="পুনরায় স্বাগতম"
      panelTitle="স্বাগতম! তোমার"
      panelAccent="শেখার জার্নি শুরু হোক"
      panelText="লগইন করো আর চালিয়ে যাও তোমার প্রতিদিনের শব্দ শেখা, গ্রামার লেসন, কোর্স আর টেস্ট — XP, স্ট্রিক আর অগ্রগতি সব আগের জায়গাতেই পাবে।"
      chips={STUDENT_CHIPS}
    >
      <FormHead eyebrow="পুনরায় স্বাগতম" title="লগইন করুন" />
      <form onSubmit={submit} className="mt-7 grid gap-4">
        <PhoneField id="login-phone" value={phone} onChange={setPhone} />
        <PasswordField
          id="login-password"
          label="পাসওয়ার্ড"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <div className="flex items-start gap-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text)]">
          <IconInfo size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p>
            আগের সংস্করণে শুধু নাম+নম্বর দিয়ে প্রোফাইল খুলে থাকলে, অনুগ্রহ করে{" "}
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="font-bold text-[var(--accent-strong)] underline decoration-dotted underline-offset-2"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>{" "}
            অপশনটা দেখুন — প্রথমবার এখানে শক্তিশালী পাসওয়ার্ড (কমপক্ষে ৮
            অক্ষর, অক্ষর ও সংখ্যা মিলিয়ে) দিলেই সেটাই আপনার পাসওয়ার্ড
            হয়ে যাবে।
          </p>
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={() => setForgotOpen(!forgotOpen)}
            aria-expanded={forgotOpen}
            className="text-sm font-bold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
          >
            পাসওয়ার্ড ভুলে গেছেন?
          </button>
        </div>
        {forgotOpen && (
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-[14px] leading-relaxed">
            <p className="font-semibold">পাসওয়ার্ড রিসেট করতে ইমেইল করুন:</p>
            <a
              href="mailto:ahmedsojibahmso@gmail.com?subject=VocabMaster%20—%20পাসওয়ার্ড%20রিসেট"
              className="mt-1 inline-flex items-center gap-1.5 font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
            >
              <IconMail size={15} /> ahmedsojibahmso@gmail.com
            </a>
            <p className="mt-1.5 text-[var(--dim)]">
              ইমেইলে আপনার নাম আর মোবাইল নম্বরটা লিখে পাঠান — যাচাই করে নতুন
              পাসওয়ার্ড সেট করে দেওয়া হবে।
            </p>
          </div>
        )}
        <FormError error={error} />
        <button
          type="submit"
          disabled={mut.isPending}
          className="btn-primary w-full py-3.5 text-base"
        >
          {mut.isPending ? "প্রবেশ করা হচ্ছে…" : "লগইন করুন"}
          <IconArrowRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => go("signup")}
          className="btn-outline w-full py-3.5 text-base"
        >
          রেজিস্ট্রেশন করুন
        </button>
        <p className="text-center text-sm text-[var(--dim)]">
          অ্যাডমিন হিসেবে এসেছেন?{" "}
          <button
            type="button"
            onClick={() => go("admin")}
            className="font-bold text-[var(--accent-strong)] hover:text-[var(--accent)]"
          >
            অ্যাডমিন লগইন →
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

// ---------- Student signup (dedicated page, no site chrome) ----------

export function SignupPage() {
  const { setStudent, go } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.signupStudent({ name: name.trim(), phone: phone.trim(), password }),
    onSuccess: (r) => {
      if (r.ok && r.student) {
        setStudent(r.student);
        go("dashboard");
      } else {
        setError(r.error ?? "সাইন আপ করা যায়নি — আবার চেষ্টা করুন।");
      }
    },
    onError: () => setError("সাইন আপ করা যায়নি — আবার চেষ্টা করুন।"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2)
      return setError("আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।");
    if (phone.trim().length < 6) return setError("সঠিক মোবাইল নম্বর লিখুন।");
    const checks = passwordChecks(password);
    if (!checks.length)
      return setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
    if (!checks.letter)
      return setError("পাসওয়ার্ডে অন্তত একটি ইংরেজি অক্ষর (a–z) থাকতে হবে।");
    if (!checks.digit)
      return setError("পাসওয়ার্ডে অন্তত একটি সংখ্যা (0–9) থাকতে হবে।");
    if (password !== confirm)
      return setError("দুইবার দেওয়া পাসওয়ার্ড মেলেনি।");
    mut.mutate();
  };

  return (
    <AuthShell
      panelKicker="নতুন অ্যাকাউন্ট"
      panelTitle="আজই শুরু হোক তোমার"
      panelAccent="ইংরেজি শেখার জার্নি"
      panelText="এক মিনিটেই ফ্রি অ্যাকাউন্ট — তারপর প্রতিদিনের শব্দ, XP, স্ট্রিক, গ্রামার লেসন আর কোর্সের অগ্রগতি সব তোমার নামে সেভ থাকবে।"
      chips={STUDENT_CHIPS}
    >
      <FormHead eyebrow="ফ্রি অ্যাকাউন্ট খুলুন" title="সাইন আপ করুন" />
      <form onSubmit={submit} className="mt-7 grid gap-4">
        <div>
          <label htmlFor="signup-name" className="text-sm font-semibold">
            আপনার নাম
          </label>
          <div className="field-shell mt-1.5">
            <IconUser size={17} className="shrink-0 text-[var(--dim)]" />
            <input
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: Fatema Akter"
              autoComplete="name"
              aria-label="আপনার নাম"
            />
          </div>
        </div>
        <PhoneField id="signup-phone" value={phone} onChange={setPhone} />
        <PasswordField
          id="signup-password"
          label="শক্তিশালী পাসওয়ার্ড"
          value={password}
          onChange={setPassword}
          placeholder="কমপক্ষে ৮ অক্ষর — অক্ষর ও সংখ্যা মিলিয়ে"
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={password} />
        <PasswordField
          id="signup-confirm"
          label="পাসওয়ার্ড আবার লিখুন"
          value={confirm}
          onChange={setConfirm}
          placeholder="একই পাসওয়ার্ড আবার"
          autoComplete="new-password"
        />
        <FormError error={error} />
        <button
          type="submit"
          disabled={mut.isPending}
          className="btn-primary w-full py-3.5 text-base"
        >
          {mut.isPending ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "অ্যাকাউন্ট তৈরি করুন"}
          <IconArrowRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => go("login")}
          className="btn-outline w-full py-3.5 text-base"
        >
          আগেই অ্যাকাউন্ট আছে? লগইন করুন
        </button>
      </form>
      <ul className="mt-6 grid gap-2 text-sm text-[var(--dim)]">
        {[
          "৭,৬০০ শব্দের পুরো শব্দভান্ডার ফ্রি",
          "প্রতিদিনের টাস্কে XP আর স্ট্রিক",
          "কোর্সে ভর্তি হলে লেসনের অগ্রগতি সেভ থাকে",
        ].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <IconCheck size={15} className="shrink-0 text-[var(--accent)]" />
            {t}
          </li>
        ))}
      </ul>
    </AuthShell>
  );
}

// ---------- Admin login (dedicated page in front of the panel) ------

const ADMIN_CHIPS: PanelChip[] = [
  { label: "কোর্স ম্যানেজমেন্ট", Icon: IconVideo },
  { label: "ভর্তির আবেদন", Icon: IconClipboard },
  { label: "গ্রামার লেসন", Icon: IconGrammar },
  { label: "ছাত্রছাত্রী ও সেটিংস", Icon: IconUser },
];

export function AdminLoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => api.adminLogin({ email: email.trim(), password }),
    onSuccess: (r) => {
      if (r.ok) {
        saveAdminAuthed(true);
        saveAdminEmail(email.trim());
        saveAdminMustChange(r.mustChangePassword);
        onDone();
      } else {
        setError(r.error ?? "লগইন করা যায়নি — আবার চেষ্টা করুন।");
      }
    },
    onError: () => setError("লগইন করা যায়নি — আবার চেষ্টা করুন।"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("অ্যাডমিন ইমেইল লিখুন।");
    if (!password) return setError("পাসওয়ার্ড লিখুন।");
    mut.mutate();
  };

  return (
    <AuthShell
      panelKicker="অ্যাডমিন প্যানেল"
      panelTitle="সাইটের পুরো"
      panelAccent="নিয়ন্ত্রণ এক জায়গায়"
      panelText="কোর্স, লেসন, শব্দ, ভর্তির আবেদন আর ছাত্রছাত্রী — সব ম্যানেজ করুন এখান থেকে। এই পেজ শুধু সাইটের মালিকের (Jarif Ahmed) জন্য।"
      chips={ADMIN_CHIPS}
    >
      <FormHead eyebrow="শুধু সাইটের মালিকের জন্য" title="অ্যাডমিন লগইন" />
      <form onSubmit={submit} className="mt-7 grid gap-4">
        <div>
          <label htmlFor="admin-email" className="text-sm font-semibold">
            অ্যাডমিন ইমেইল
          </label>
          <div className="field-shell mt-1.5">
            <IconMail size={17} className="shrink-0 text-[var(--dim)]" />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="আপনার অ্যাডমিন ইমেইল"
              autoComplete="username"
              aria-label="অ্যাডমিন ইমেইল"
            />
          </div>
        </div>
        <PasswordField
          id="admin-password"
          label="পাসওয়ার্ড"
          value={password}
          onChange={setPassword}
          placeholder="অ্যাডমিন পাসওয়ার্ড"
          autoComplete="current-password"
        />
        <FormError error={error} />
        {error && (
          <p className="-mt-1 text-[13px] leading-relaxed text-[var(--dim)]">
            টিপস: চোখের বোতামে চাপ দিয়ে পাসওয়ার্ডটা দেখে মিলিয়ে নিন —
            বড়/ছোট হাতের অক্ষর আর শেষের চিহ্ন ঠিক আছে তো? প্রথম লগইনের পর
            প্যানেল খোলার আগেই নিজের নতুন পাসওয়ার্ড বসাতে হবে।
          </p>
        )}
        <button
          type="submit"
          disabled={mut.isPending}
          className="btn-primary w-full py-3.5 text-base"
        >
          {mut.isPending ? "যাচাই হচ্ছে…" : "অ্যাডমিন প্যানেলে প্রবেশ করুন"}
          <IconArrowRight size={18} />
        </button>
        <p className="text-center text-[13px] leading-relaxed text-[var(--dim)]">
          লগইন তথ্য শুধু সাইটের মালিকের কাছেই থাকে — এই পেজে কোনো
          পাসওয়ার্ড দেখানো হয় না।
        </p>
      </form>
    </AuthShell>
  );
}

export function isAdminAuthed(): boolean {
  return loadAdminAuthed();
}
