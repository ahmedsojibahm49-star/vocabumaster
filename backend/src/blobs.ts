// Disk blob store — the standalone replacement for the artifact runtime's
// `ctx.blobs`. Uploaded course videos, course cover images and the book
// PDF live as plain files under backend/uploads/ (gitignored, never
// shipped in the zip):
//
//   uploads/course-videos/<ts>-<rand>.mp4   public, served at /api/files/<key>
//   uploads/course-images/<ts>-<rand>.jpg   public, served at /api/files/<key>
//   uploads/lesson-files/<ts>-<rand>.pdf  public, served at /api/files/<key>
//                                           (URLs only disclosed to students who
//                                           can open the lesson — see getCourseLesson)
//   uploads/book/oxford-7000-words.pdf      PRIVATE — served only at
//                                           /api/files/book?token=... with a
//                                           short-lived HMAC-signed token
//                                           issued by getBookReader.
//
// A tiny JSON sidecar next to each file remembers its content type and
// visibility, so `head()` can answer without a database.

import { createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface BlobHead {
  sizeBytes: number;
  contentType: string;
}

export interface GetUrlOpts {
  public?: boolean;
  expiresInSeconds?: number;
  /** When set, the URL is a signed private download (book PDF). */
  studentId?: number;
}

const PUBLIC_PREFIXES = ["course-videos/", "course-images/", "lesson-files/"];

export function isPublicBlobKey(key: string): boolean {
  return PUBLIC_PREFIXES.some((p) => key.startsWith(p));
}

export class DiskBlobs {
  constructor(
    private readonly root: string,
    private readonly origin: () => string,
    private readonly secret: string,
  ) {}

  private filePath(key: string): string {
    if (
      !key ||
      key.startsWith("/") ||
      key.includes("\\") ||
      key.split("/").includes("..")
    ) {
      throw new Error(`bad blob key: ${key}`);
    }
    return path.join(this.root, ...key.split("/"));
  }

  private metaPath(key: string): string {
    return `${this.filePath(key)}.meta.json`;
  }

  async put(
    key: string,
    bytes: Buffer,
    opts: { contentType: string; public?: boolean },
  ): Promise<void> {
    const fp = this.filePath(key);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, bytes);
    await fs.writeFile(
      this.metaPath(key),
      JSON.stringify({
        contentType: opts.contentType,
        public: !!opts.public,
        sizeBytes: bytes.length,
      }),
    );
  }

  async head(key: string): Promise<BlobHead | null> {
    try {
      const st = await fs.stat(this.filePath(key));
      let contentType = "application/octet-stream";
      try {
        const meta = JSON.parse(
          await fs.readFile(this.metaPath(key), "utf8"),
        ) as { contentType?: string };
        if (meta.contentType) contentType = meta.contentType;
      } catch {
        // No sidecar: fall back to the extension.
        if (key.endsWith(".pdf")) contentType = "application/pdf";
        else if (key.endsWith(".mp4")) contentType = "video/mp4";
        else if (key.endsWith(".webm")) contentType = "video/webm";
        else if (key.endsWith(".jpg") || key.endsWith(".jpeg"))
          contentType = "image/jpeg";
        else if (key.endsWith(".png")) contentType = "image/png";
        else if (key.endsWith(".webp")) contentType = "image/webp";
      }
      return { sizeBytes: st.size, contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.filePath(key), { force: true });
    await fs.rm(this.metaPath(key), { force: true });
  }

  /** Absolute URL for a stored file. Public keys get a plain /api/files/ URL. */
  async getUrl(key: string, opts?: GetUrlOpts): Promise<string> {
    const origin = this.origin();
    if (opts?.studentId != null) {
      // Private book download: HMAC-signed token, 10 minutes by default.
      const exp =
        Math.floor(Date.now() / 1000) + (opts.expiresInSeconds ?? 3600);
      const payload = `${opts.studentId}.${exp}`;
      const sig = createHmac("sha256", this.secret)
        .update(payload)
        .digest("hex");
      return `${origin}/api/files/book?token=${payload}.${sig}`;
    }
    return `${origin}/api/files/${key}`;
  }

  /** Verifies a `?token=` from /api/files/book. Returns the student id or null. */
  verifyBookToken(token: string | undefined): number | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [studentId, exp, sig] = parts as [string, string, string];
    const payload = `${studentId}.${exp}`;
    const expected = createHmac("sha256", this.secret)
      .update(payload)
      .digest("hex");
    if (sig.length !== expected.length) return null;
    // Constant-time compare (lengths are equal here).
    let diff = 0;
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff !== 0) return null;
    if (Number(exp) * 1000 < Date.now()) return null;
    const id = Number(studentId);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
  }
}
