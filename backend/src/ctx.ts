// Standalone action context — the replacement for the artifact runtime's
// `Ctx`. Handlers in actions.ts use exactly three things from it:
//
//   ctx.db<typeof schema>()  -> the Drizzle database (Turso / libSQL)
//   ctx.blobs                -> the disk blob store (./blobs.ts)
//   ctx.invalidateQueries()  -> no-op here; the React client invalidates
//                               its own react-query cache after mutations,
//                               exactly as it did in the artifact.

import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "./schema.js";
import type { DiskBlobs } from "./blobs.js";

export type Db = LibSQLDatabase<typeof schema>;

export interface Ctx {
  db: () => Db;
  blobs: DiskBlobs;
  invalidateQueries: () => void;
}

export function makeCtx(db: Db, blobs: DiskBlobs): Ctx {
  return {
    db: () => db,
    blobs,
    invalidateQueries: () => {
      // Client-side react-query invalidation covers this (see
      // frontend/src/components.tsx / pages — every mutation already
      // calls queryClient.invalidateQueries()).
    },
  };
}
