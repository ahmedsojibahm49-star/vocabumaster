# VocabMaster — Standalone (Turso)

Bangla-first English learning website by **Jarif Ahmed** — the same
VocabMaster site (vocabulary hub with all 7,600 Oxford 7000 Words + IELTS
600, v3.4 pronunciations, grammar lessons, courses, quizzes, level test,
IELTS mock, student dashboard, premium levels, secure in-site book reader,
admin panel), re-platformed to run **outside Muse** with **Turso** (libSQL)
as the database.

> **বাংলা সেটআপ গাইড: [SETUP-BANGLA.md](./SETUP-BANGLA.md)** — Turso
> অ্যাকাউন্ট খোলা থেকে VS Code-এ চালানো পর্যন্ত ধাপে ধাপে।

## Quick start (local)

```bash
npm run install-all   # install backend + frontend dependencies
npm run setup         # creates .env files, generates JWT_SECRET, migrates + seeds
npm run dev           # backend :4000 + frontend :5173
```

Open http://localhost:5173. Admin: footer → **অ্যাডমিন লগইন** —
`admin@vocabmaster.local` / `Jarif-Admin-2026!` (first login forces a
password change).

## Layout

| Path | Contents |
| --- | --- |
| `backend/` | Express + TypeScript API. Drizzle ORM on Turso/libSQL. All 62 actions from the original site as `POST /api/<action>`. Uploads on local disk under `backend/uploads/` (gitignored). |
| `backend/drizzle/` | Migrations 0001–0010 (SQLite dialect, works on Turso). |
| `backend/src/actions.ts` | The full action set (auth, vocab, grammar, courses, tests, dashboard, admin, book reader) — ported 1:1 from the artifact source. |
| `frontend/` | The site's own React UI (unchanged design), built with Vite. The space-sdk action client is replaced by a fetch client (`frontend/src/api.ts`) calling the backend. |
| `scripts/setup.mjs` | First-time setup helper (env files + JWT_SECRET + migrate/seed). |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run install-all` | `npm install` (both workspaces) |
| `npm run setup` | Create `.env` files, generate `JWT_SECRET`, migrate + seed |
| `npm run dev` | Backend :4000 + frontend :5173 (with `/api` proxy) |
| `npm run dev:backend` / `dev:frontend` | One side only |
| `npm run build` | Backend `tsc` + frontend `vite build` |
| `npm run typecheck` | `tsc --noEmit` for backend + frontend |
| `npm run migrate` | Migrate + seed only (idempotent) |
| `npm start` | Run the built backend (also serves the built frontend) |

## Configuration

- `backend/.env` — `TURSO_DATABASE_URL` (`libsql://…` or `file:./local.db`),
  `TURSO_AUTH_TOKEN`, `JWT_SECRET` (signs the 10-minute book download links),
  `PORT` (default 4000).
- `frontend/.env` — `VITE_API_URL` (default `http://localhost:4000/api` in
  dev; for a separately hosted frontend set it to your backend URL).

## Notes

- **Prices are set by the admin, not in code.** Course prices and the
  premium price start unset — set them in the admin panel. The book price
  defaults to ৳990 (from the book); the book's name, price and free/paid
  mode are all editable in the admin panel's **বই (PDF রিডার)** tab and
  Settings, and apply site-wide immediately.
- **Free ↔ premium, any time, from the admin panel.** Each vocabulary level
  (A1–IELTS) can be switched free/premium in Settings; each course has a
  one-tap **ফ্রি করুন / পেইড করুন** switch; the book has its own free/paid
  switch. All three are enforced server-side and take effect immediately.
  Defaults: A1/A2 free, B1–IELTS premium, courses paid, book paid ৳990.
- **Lesson attachments.** Admins can attach PDF and other study files
  (images, audio, Word/Excel, ZIP — max 20 MB each) to any course lesson;
  students open PDFs inside the course player. Files of locked lessons
  are never served.
- **Per-student level grants.** From the admin panel's student list, the
  **লেভেল** button frees any single level (e.g. B1) for one student only —
  no full premium needed, and revoking locks it again. The student's own
  grants travel with their profile (`levelGrants`).
- **Premium book reader.** Fit-page (whole page on one screen) + fit-width
  + 50–200% zoom, always-visible prev/next bar and desktop side arrows,
  keyboard navigation (←/→, PageUp/PageDown, Home/End), server-saved page
  bookmarks, all-pages grid with chapter/bookmark marks, dark/light/sepia
  themes, fullscreen (native, with an immersive fallback where the webview
  refuses it), page scrubber, % read + pages left, session clock, mobile
  swipe, and resume from the last page. The Book page prefetches the PDF
  so the reader opens fast; the dashboard's **বইটি পড়ুন** button opens
  the reader directly. Flashcards match the home CTA card (bright teal
  gradient + big soft white corner ring).
- **One-tap book install (admin).** The book tab's **সার্ভার থেকে আসল বইটি
  বসান** button installs the real v3.4 book (762 pages) from the server —
  on this standalone build it reads the file from the operator's machine;
  if the file isn't there, it reports so and the admin uploads the PDF
  from the same tab instead.
- **The book PDF is not in this zip.** The owner uploads the real
  `Oxford-7000-Words-A1-to-C2-v3.4.pdf` once from the admin panel's
  **বই (PDF রিডার)** tab. Buyers then read it inside the site — no
  download, 10-minute signed links, per-page name/number watermark.
- Uploads (course videos ≤ 45 MB, cover images, book PDF ≤ 45 MB, lesson
  files ≤ 20 MB each) are
  stored on the server's disk under `backend/uploads/`. On Render, attach
  a persistent disk or uploads are lost on redeploy — see SETUP-BANGLA.md.
- Auth model is the same as the original site: students sign up with
  mobile + strong password (min 8 chars, letters + digits), sessions live
  in the browser's localStorage; the admin login is verified server-side
  against a hashed password in settings, with a forced change on first
  login with the bootstrap password.
# vocabumaster
