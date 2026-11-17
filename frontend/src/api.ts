// Typed fetch client for the standalone backend. Same call shape as the
// artifact's action client — `api.<action>(args)` returns the typed
// response — but every call is a plain POST to `${VITE_API_URL}/<action>`
// on the Express backend (see backend/src/server.ts).
//
// `import type { Actions }` is type-only by design: the client bundle
// never pulls in any server runtime. The action map's zod schemas give
// the request/response types (no codegen). With `verbatimModuleSyntax:
// true`, dropping `type` is a compile error.

import type { z } from "zod";
import type { Actions } from "../../backend/src/actions";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

type ActionClient<A> = {
  [K in keyof A]: A[K] extends { request: infer R; response: infer S }
    ? (
        args: R extends z.ZodTypeAny ? z.infer<R> : never,
      ) => Promise<S extends z.ZodTypeAny ? z.infer<S> : never>
    : never;
};

async function callAction(action: string, args: unknown): Promise<unknown> {
  const res = await fetch(`${API_URL}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args ?? {}),
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!res.ok) {
    throw new Error(
      data?.error ?? `অনুরোধটি ব্যর্থ হয়েছে (${res.status}) — আবার চেষ্টা করুন।`,
    );
  }
  return data;
}

export const api = new Proxy({} as ActionClient<typeof Actions>, {
  get: (_target, action: string) => (args: unknown) =>
    callAction(action, args),
});

// Re-exported for convenience so client code can do
//
//     import { api, type ApiResponse } from "./api";
//     type Article = ApiResponse<typeof api, "listArticles">["articles"][number];
//
// (Same helper names the artifact's SDK client exported.)
export type ApiRequest<T, K extends keyof T> = T[K] extends (
  args: infer A,
) => unknown
  ? A
  : never;

export type ApiResponse<T, K extends keyof T> = T[K] extends (
  ...args: never[]
) => Promise<infer R>
  ? R
  : never;
