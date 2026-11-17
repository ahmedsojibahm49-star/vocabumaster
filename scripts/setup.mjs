// `npm run setup` — first-time setup for the standalone VocabMaster:
//  1. copies backend/.env.example -> backend/.env (and frontend likewise)
//     when the real file is missing,
//  2. generates a strong JWT_SECRET inside backend/.env when it is empty,
//  3. runs the backend migrate+seed (creates the tables and imports the
//     7,600 words, 39 grammar lessons and 2 courses when the DB is empty).
//
// Safe to re-run: it never overwrites an existing .env and the seed is
// idempotent (admin edits and student data are preserved).

import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function ensureEnv(exampleRel, targetRel) {
  const example = path.join(ROOT, exampleRel);
  const target = path.join(ROOT, targetRel);
  if (!existsSync(target)) {
    copyFileSync(example, target);
    console.log(`[setup] created ${targetRel} (edit it with your own values)`);
  }
  return target;
}

function ensureJwtSecret(envPath) {
  let text = readFileSync(envPath, "utf8");
  const m = /^JWT_SECRET=(.*)$/m.exec(text);
  if (!m || !m[1].trim()) {
    const secret = randomBytes(32).toString("hex");
    if (m) {
      text = text.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
    } else {
      text += `\nJWT_SECRET=${secret}\n`;
    }
    writeFileSync(envPath, text);
    console.log("[setup] generated a strong JWT_SECRET in backend/.env");
  }
}

const backendEnv = ensureEnv("backend/.env.example", "backend/.env");
ensureEnv("frontend/.env.example", "frontend/.env");
ensureJwtSecret(backendEnv);

console.log("[setup] running migrations + seed (this takes a few seconds)...");
execSync("npm run migrate --workspace=backend", {
  stdio: "inherit",
  cwd: ROOT,
});

console.log(`
[setup] done. Next steps:
  1. npm run dev
  2. Open http://localhost:5173
  3. Admin: footer -> অ্যাডমিন লগইন — admin@vocabmaster.local / Jarif-Admin-2026!
     (first login forces a password change)
  4. In the admin panel set your course prices + premium price, and upload
     the real book PDF from the বই (PDF রিডার) tab.
See SETUP-BANGLA.md for the full Bangla guide (incl. free Turso setup).`);
