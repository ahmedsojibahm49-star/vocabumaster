// Copies backend/drizzle (SQL migrations) into backend/dist/drizzle so the
// compiled server can run them from dist/ too. Run by `npm run build`.
import { cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../drizzle");
const dest = path.resolve(here, "../dist/drizzle");
cpSync(src, dest, { recursive: true });
console.log(`[vocabmaster] migrations copied: ${src} -> ${dest}`);
