import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { bnNum, speak, useApp } from "../lib";
import { EmptyNote, PageHead, Spinner } from "../components";
import {
  IconArrowRight,
  IconBook,
  IconCap,
  IconChevronDown,
  IconClipboard,
  IconGrammar,
  IconLayers,
  IconMessage,
  IconRoute,
  IconShuffle,
  IconVolume,
} from "../icons";

export function GrammarPage() {
  return (
    <div className="fade-in mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
      <PageHead
        title="গ্রামার ও বাক্য গঠন"
        sub="শুধু নিয়ম মুখস্থ নয় — এখানে শিখবেন কীভাবে নিজে বাক্য বানাতে হয়। নিচের পথ ধরে এগোন: আগে বাক্য বানানো, তারপর প্যাটার্ন, তারপর পুরো লেসন।"
      />
      <LearningPath />
      <SentenceBuilder />
      <PatternLibrary />
      <LessonList />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step-by-step path: how a student learns spoken English alone here.  */
/* ------------------------------------------------------------------ */

function LearningPath() {
  const { go } = useApp();
  const steps = [
    {
      Icon: IconBook,
      title: "ধাপ ১ · শব্দ শেখো",
      text: "প্রতিদিন ১০টি করে শব্দ — বাংলা অর্থ ও উচ্চারণসহ। শব্দ ছাড়া বাক্য হয় না।",
      action: "শব্দভান্ডারে যান",
      go: () => go("vocab"),
    },
    {
      Icon: IconLayers,
      title: "ধাপ ২ · বাক্য বানাও",
      text: "Subject + Verb + Object কাঠামোটা শিখে নিজে বাক্য বানাও — নিচের বিল্ডার দিয়ে অনুশীলন করো।",
      action: "বিল্ডারটি নিচেই আছে",
      go: () =>
        document
          .getElementById("sentence-builder")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      Icon: IconGrammar,
      title: "ধাপ ৩ · নিয়ম বুঝো",
      text: "Tense, প্রশ্ন করা, পরিচয় দেওয়া — বাংলায় ব্যাখ্যা করা লেসনগুলো একে একে শেষ করো।",
      action: "লেসনগুলো নিচে",
      go: () =>
        document
          .getElementById("grammar-lessons")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      Icon: IconMessage,
      title: "ধাপ ৪ · মুখে বলো",
      text: "শেখা বাক্যগুলো জোরে জোরে বলো — উচ্চারণ বোতামে শুনে নকল করো। চুপ করে পড়লে স্পোকেন আসে না।",
      action: "প্যাটার্নগুলো বলুন",
      go: () =>
        document
          .getElementById("pattern-library")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      Icon: IconClipboard,
      title: "ধাপ ৫ · টেস্ট দাও",
      text: "কুইজ আর লেভেল টেস্টে যাচাই করো কতটা শিখলে — ভুলগুলোই পরের পড়ার দিশা।",
      action: "টেস্ট পেজে যান",
      go: () => go("tests"),
    },
  ];
  return (
    <section className="mt-9" aria-label="ধাপে ধাপে শেখার পথ">
      <h2 className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-tight">
        <span className="icon-chip h-10 w-10 rounded-xl">
          <IconRoute size={20} />
        </span>
        একা একা স্পোকেন শেখার পথ — ৫টি ধাপ
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <div key={s.title} className="card card-hover relative flex flex-col p-5">
            <span
              aria-hidden
              className="absolute right-4 top-4 text-[26px] font-extrabold leading-none text-[var(--surface-hover)]"
            >
              {bnNum(i + 1)}
            </span>
            <span className="icon-chip h-11 w-11 rounded-2xl">
              <s.Icon size={21} />
            </span>
            <h3 className="mt-3.5 text-[15.5px] font-bold leading-snug">{s.title}</h3>
            <p className="bn-read-sm mt-1.5 flex-1 text-[var(--dim)]">{s.text}</p>
            <button
              type="button"
              onClick={s.go}
              className="mt-3.5 inline-flex items-center gap-1 text-sm font-bold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
            >
              {s.action}
              <IconArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive sentence builder: Subject + Verb + Object + Extra.      */
/* ------------------------------------------------------------------ */

interface SubjectOpt {
  en: string;
  bn: string;
  third: boolean; // he/she/it-type subject → verb takes -s
}
interface VerbOpt {
  base: string;
  third: string;
  bn1: string; // আমি/আমরা/তুমি form
  bn3: string; // সে/তারা form
  objects: { en: string; bn: string }[];
}
interface ExtraOpt {
  en: string;
  bn: string;
}

const SUBJECTS: SubjectOpt[] = [
  { en: "I", bn: "আমি", third: false },
  { en: "You", bn: "তুমি", third: false },
  { en: "He", bn: "সে (ছেলে)", third: true },
  { en: "She", bn: "সে (মেয়ে)", third: true },
  { en: "We", bn: "আমরা", third: false },
  { en: "They", bn: "তারা", third: false },
  { en: "Rahim", bn: "রহিম", third: true },
];

const VERBS: VerbOpt[] = [
  {
    base: "eat", third: "eats", bn1: "খাই", bn3: "খায়",
    objects: [
      { en: "rice", bn: "ভাত" },
      { en: "an apple", bn: "একটা আপেল" },
      { en: "breakfast", bn: "সকালের নাশতা" },
    ],
  },
  {
    base: "read", third: "reads", bn1: "পড়ি", bn3: "পড়ে",
    objects: [
      { en: "a book", bn: "একটা বই" },
      { en: "the newspaper", bn: "পত্রিকা" },
      { en: "a story", bn: "একটা গল্প" },
    ],
  },
  {
    base: "play", third: "plays", bn1: "খেলি", bn3: "খেলে",
    objects: [
      { en: "football", bn: "ফুটবল" },
      { en: "cricket", bn: "ক্রিকেট" },
      { en: "games", bn: "খেলা" },
    ],
  },
  {
    base: "speak", third: "speaks", bn1: "বলি", bn3: "বলে",
    objects: [
      { en: "English", bn: "ইংরেজি" },
      { en: "Bangla", bn: "বাংলা" },
    ],
  },
  {
    base: "learn", third: "learns", bn1: "শিখি", bn3: "শিখে",
    objects: [
      { en: "English", bn: "ইংরেজি" },
      { en: "new words", bn: "নতুন শব্দ" },
      { en: "grammar", bn: "গ্রামার" },
    ],
  },
  {
    base: "watch", third: "watches", bn1: "দেখি", bn3: "দেখে",
    objects: [
      { en: "TV", bn: "টিভি" },
      { en: "a movie", bn: "একটা সিনেমা" },
      { en: "videos", bn: "ভিডিও" },
    ],
  },
  {
    base: "buy", third: "buys", bn1: "কিনি", bn3: "কিনে",
    objects: [
      { en: "a pen", bn: "একটা কলম" },
      { en: "some fruit", bn: "কিছু ফল" },
      { en: "a notebook", bn: "একটা খাতা" },
    ],
  },
  {
    base: "write", third: "writes", bn1: "লিখি", bn3: "লিখে",
    objects: [
      { en: "a letter", bn: "একটা চিঠি" },
      { en: "my name", bn: "আমার নাম" },
      { en: "sentences", bn: "বাক্য" },
    ],
  },
];

const EXTRAS: ExtraOpt[] = [
  { en: "", bn: "" },
  { en: "every day", bn: "প্রতিদিন" },
  { en: "in the morning", bn: "সকালে" },
  { en: "at home", bn: "বাসায়" },
  { en: "with my friends", bn: "বন্ধুদের সঙ্গে" },
];

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--dim)]">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function pickChip(active: boolean): string {
  return `rounded-full px-4 py-2 text-[15px] font-semibold transition-all ${
    active
      ? "text-[var(--accent-ink)] shadow-[var(--shadow-pop)]"
      : "border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
  }`;
}

function SentenceBuilder() {
  const [si, setSi] = useState(0);
  const [vi, setVi] = useState(3);
  const [oi, setOi] = useState(0);
  const [ei, setEi] = useState(1);

  const subject: SubjectOpt = SUBJECTS[si] ?? { en: "I", bn: "আমি", third: false };
  const verb: VerbOpt = VERBS[vi] ?? {
    base: "speak", third: "speaks", bn1: "বলি", bn3: "বলে",
    objects: [{ en: "English", bn: "ইংরেজি" }],
  };
  const object =
    verb.objects[Math.min(oi, verb.objects.length - 1)] ??
    verb.objects[0] ??
    { en: "English", bn: "ইংরেজি" };
  const extra: ExtraOpt = EXTRAS[ei] ?? { en: "", bn: "" };

  const verbEn = subject.third ? verb.third : verb.base;
  const sentenceEn =
    `${subject.en} ${verbEn} ${object.en}${extra.en ? ` ${extra.en}` : ""}.`;
  const verbBn = subject.third ? verb.bn3 : verb.bn1;
  const sentenceBn =
    `${subject.bn} ${extra.bn ? `${extra.bn} ` : ""}${object.bn} ${verbBn}।`;

  const randomize = () => {
    const nvi = Math.floor(Math.random() * VERBS.length);
    setVi(nvi);
    setSi(Math.floor(Math.random() * SUBJECTS.length));
    setOi(Math.floor(Math.random() * (VERBS[nvi]?.objects.length ?? 1)));
    setEi(Math.floor(Math.random() * EXTRAS.length));
  };

  return (
    <section id="sentence-builder" className="mt-12 scroll-mt-28" aria-label="বাক্য বানানোর অনুশীলনী">
      <div className="card overflow-hidden">
        <div
          className="px-6 py-6 text-white sm:px-8"
          style={{ background: "var(--accent-grad)" }}
        >
          <h2 className="flex items-center gap-2.5 text-[24px] font-extrabold tracking-tight">
            <IconLayers size={24} />
            বাক্য বানানোর কারখানা
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15.5px] leading-relaxed text-white/85">
            নিচে কর্তা, ক্রিয়া আর কর্ম বেছে নিন — বাক্য নিজে নিজে তৈরি হয়ে
            যাবে। খেয়াল করুন: বাংলায় ক্রিয়া শেষে, ইংরেজিতে মাঝখানে। আর
            He/She হলে verb-এর শেষে s বসে।
          </p>
          <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
            Subject <span aria-hidden>+</span> Verb <span aria-hidden>+</span> Object
            <span className="font-medium text-white/75">( + সময় / জায়গা )</span>
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="grid content-start gap-5">
            <ChipRow label="কর্তা — Subject (কে?)">
              {SUBJECTS.map((s, i) => (
                <button
                  key={s.en}
                  type="button"
                  aria-pressed={si === i}
                  onClick={() => setSi(i)}
                  className={pickChip(si === i)}
                  style={si === i ? { background: "var(--accent-grad)" } : undefined}
                >
                  {s.en}
                </button>
              ))}
            </ChipRow>
            <ChipRow label="ক্রিয়া — Verb (কী করে?)">
              {VERBS.map((v, i) => (
                <button
                  key={v.base}
                  type="button"
                  aria-pressed={vi === i}
                  onClick={() => {
                    setVi(i);
                    setOi(0);
                  }}
                  className={pickChip(vi === i)}
                  style={vi === i ? { background: "var(--accent-grad)" } : undefined}
                >
                  {v.base}
                </button>
              ))}
            </ChipRow>
            <ChipRow label="কর্ম — Object (কী / কাকে?)">
              {verb.objects.map((o, i) => (
                <button
                  key={o.en}
                  type="button"
                  aria-pressed={object.en === o.en}
                  onClick={() => setOi(i)}
                  className={pickChip(object.en === o.en)}
                  style={object.en === o.en ? { background: "var(--accent-grad)" } : undefined}
                >
                  {o.en}
                </button>
              ))}
            </ChipRow>
            <ChipRow label="সময় / জায়গা — চাইলে যোগ করুন">
              {EXTRAS.map((x, i) => (
                <button
                  key={x.en || "none"}
                  type="button"
                  aria-pressed={ei === i}
                  onClick={() => setEi(i)}
                  className={pickChip(ei === i)}
                  style={ei === i ? { background: "var(--accent-grad)" } : undefined}
                >
                  {x.en || "কিছু না"}
                </button>
              ))}
            </ChipRow>
          </div>

          <div className="flex flex-col rounded-[20px] border border-[var(--border)] bg-[var(--surface-alt)] p-6">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--dim)]">
              আপনার বানানো বাক্য
            </p>
            <p className="mt-3 text-[26px] font-extrabold leading-snug tracking-tight" lang="en">
              {sentenceEn}
            </p>
            <p className="bn-read mt-2 text-[var(--dim)]">{sentenceBn}</p>
            <p className="mt-3 rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--dim)]">
              {subject.third ? (
                <>
                  কর্তা <strong className="text-[var(--text)]">{subject.en}</strong>{" "}
                  (তৃতীয় পুরুষ) — তাই verb হলো{" "}
                  <strong className="text-[var(--text)]">{verbEn}</strong>, শেষে s
                  যোগ হয়েছে।
                </>
              ) : (
                <>
                  কর্তা <strong className="text-[var(--text)]">{subject.en}</strong>{" "}
                  — তাই verb-এর মূল রূপ{" "}
                  <strong className="text-[var(--text)]">{verbEn}</strong>, কোনো s
                  লাগে না।
                </>
              )}
            </p>
            <div className="mt-auto flex flex-wrap gap-2.5 pt-5">
              <button
                type="button"
                onClick={() => speak(sentenceEn.replace(/\.$/, ""), "US")}
                className="btn-primary px-5 py-2.5"
              >
                <IconVolume size={17} /> শুনুন ও বলুন
              </button>
              <button type="button" onClick={randomize} className="btn-outline px-5 py-2.5">
                <IconShuffle size={17} /> এলোমেলো বাক্য
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pattern library: the 12 frames that cover most daily speech.        */
/* ------------------------------------------------------------------ */

const PATTERNS: { formula: string; en: string; bn: string }[] = [
  { formula: "I am + পেশা/অবস্থা", en: "I am a student.", bn: "আমি একজন ছাত্র।" },
  { formula: "I have + জিনিস", en: "I have a question.", bn: "আমার একটা প্রশ্ন আছে।" },
  { formula: "I can + verb", en: "I can speak a little English.", bn: "আমি অল্প ইংরেজি বলতে পারি।" },
  { formula: "I want to + verb", en: "I want to learn English.", bn: "আমি ইংরেজি শিখতে চাই।" },
  { formula: "I need + জিনিস", en: "I need your help.", bn: "আমার তোমার সাহায্য দরকার।" },
  { formula: "I like / I don't like", en: "I like tea, but I don't like coffee.", bn: "আমার চা ভালো লাগে, কিন্তু কফি লাগে না।" },
  { formula: "There is / There are", en: "There is a book on the table.", bn: "টেবিলে একটা বই আছে।" },
  { formula: "I am going to + verb", en: "I am going to study tonight.", bn: "আমি আজ রাতে পড়ব।" },
  { formula: "Please + verb", en: "Please sit down.", bn: "অনুগ্রহ করে বসুন।" },
  { formula: "Can you + verb …?", en: "Can you help me?", bn: "তুমি কি আমাকে সাহায্য করতে পারো?" },
  { formula: "Let me + verb", en: "Let me try.", bn: "আমাকে চেষ্টা করতে দাও।" },
  { formula: "Subject + verb + object", en: "She reads a book every night.", bn: "সে প্রতি রাতে বই পড়ে।" },
];

function PatternLibrary() {
  return (
    <section id="pattern-library" className="mt-12 scroll-mt-28" aria-label="বাক্যের প্যাটার্ন">
      <div className="max-w-2xl">
        <h2 className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-tight">
          <span className="icon-chip h-10 w-10 rounded-xl">
            <IconCap size={20} />
          </span>
          ১২টি জাদুকরী প্যাটার্ন
        </h2>
        <p className="bn-read mt-2 text-[var(--dim)]">
          প্রতিদিনের কথার বেশিরভাগই এই ১২টি কাঠামোর ভেতরে পড়ে। প্রতিটার
          শব্দ বদলে বদলে নিজের বাক্য বানান — আর স্পিকার বোতামে শুনে জোরে
          জোরে বলুন।
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATTERNS.map((p, i) => (
          <article data-protect key={p.formula} className="card card-hover p-5">
            <p className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[12.5px] font-extrabold text-[var(--accent-strong)]">
                প্যাটার্ন {bnNum(i + 1)}
              </span>
              <button
                type="button"
                aria-label={`শুনুন: ${p.en}`}
                onClick={() => speak(p.en, "US")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--accent-strong)] transition-transform hover:scale-105"
              >
                <IconVolume size={17} />
              </button>
            </p>
            <p className="mt-3 text-[14px] font-bold text-[var(--dim)]" lang="en">
              {p.formula}
            </p>
            <p className="mt-1 text-[18px] font-bold leading-snug" lang="en">
              {p.en}
            </p>
            <p className="bn-read-sm mt-1.5 text-[var(--dim)]">{p.bn}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson list with category filter.                                   */
/* ------------------------------------------------------------------ */

function LessonList() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("সব");
  const list = useQuery({
    queryKey: ["grammar-lessons"],
    queryFn: () => api.listGrammarLessons({}),
  });

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const l of list.data?.lessons ?? []) {
      if (l.category && !seen.includes(l.category)) seen.push(l.category);
    }
    return seen;
  }, [list.data]);

  const lessons = (list.data?.lessons ?? []).filter(
    (l) => category === "সব" || l.category === category,
  );

  return (
    <section id="grammar-lessons" className="mt-12 scroll-mt-28" aria-label="গ্রামার লেসনসমূহ">
      <div className="max-w-2xl">
        <h2 className="text-[22px] font-extrabold tracking-tight">
          সব লেসন — বাংলায় ব্যাখ্যা
        </h2>
        <p className="bn-read mt-1.5 text-[var(--dim)]">
          উপরের ধাপ অনুযায়ী প্রথমে "বাক্য গঠন" আর "কথোপকথন" বিভাগের লেসনগুলো
          শেষ করুন, তারপর Tense-এর দিকে যান। লেসনে ঢুকতে কার্ডে চাপ দিন।
        </p>
      </div>

      {categories.length > 1 && (
        <div className="seg mt-5 max-w-full overflow-x-auto" role="tablist" aria-label="লেসনের বিভাগ">
          {["সব", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className="seg-btn whitespace-nowrap"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {list.isPending ? (
        <Spinner label="লেসন লোড হচ্ছে…" />
      ) : lessons.length === 0 ? (
        <div className="mt-6">
          <EmptyNote>এই বিভাগে এখনো কোনো লেসন নেই।</EmptyNote>
        </div>
      ) : (
        <div className="mt-6 grid gap-3.5">
          {lessons.map((l) => {
            const open = openId === l.id;
            const num = (list.data?.lessons.findIndex((x) => x.id === l.id) ?? 0) + 1;
            return (
              <article
                key={l.id}
                className={`card overflow-hidden transition-shadow ${open ? "shadow-[var(--shadow-lift)]" : "card-hover"}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : l.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-4 p-5 text-left sm:p-6"
                >
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-[var(--shadow-pop)]"
                    style={{ background: "var(--accent-grad)" }}
                  >
                    {bnNum(num)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold leading-snug">
                      {l.titleBn}
                    </span>
                    <span className="bn-read-sm mt-1 block text-[var(--dim)]">
                      {l.summary}
                    </span>
                    <span className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-bold">
                      <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1">
                        {l.category}
                      </span>
                      <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1">
                        লেভেল {l.level}
                      </span>
                      <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1">
                        {l.titleEn}
                      </span>
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--dim)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  >
                    <IconChevronDown size={18} />
                  </span>
                </button>
                {open && <LessonBody id={l.id} />}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LessonBody({ id }: { id: number }) {
  const q = useQuery({
    queryKey: ["grammar-lesson", id],
    queryFn: () => api.getGrammarLesson({ id }),
  });
  if (q.isPending) return <Spinner label="লেসন খুলছে…" />;
  const body = q.data?.lesson?.body ?? "";
  if (!body) return null;
  return (
    <div data-protect className="border-t border-[var(--border)] bg-[var(--surface-alt)] px-5 py-6 sm:px-7">
      {body.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-6 text-[18px] font-extrabold tracking-tight first:mt-0">
              {t.slice(3)}
            </h3>
          );
        }
        if (t.startsWith("- ")) {
          return (
            <p key={i} className="bn-read mt-2 flex gap-2.5 pl-1">
              <span aria-hidden className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{t.slice(2)}</span>
            </p>
          );
        }
        return (
          <p key={i} className="bn-read mt-2.5 first:mt-0">
            {t}
          </p>
        );
      })}
    </div>
  );
}
