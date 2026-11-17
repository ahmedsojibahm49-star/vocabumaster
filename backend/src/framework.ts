// Minimal action-definition shim — the standalone replacement for the
// artifact runtime's `defineAction`. An action is its zod request /
// response schemas plus a handler; server.ts turns each one into a
// `POST /api/<name>` endpoint. The `Actions` map in actions.ts keeps the
// exact same shape it had in the artifact, so the client keeps its typed
// `api.<action>(args)` calls (see frontend/src/api.ts).
//
// The generics matter: `defineAction` infers the handler's `args` type
// from the request schema and checks the return value against the
// response schema — the same type safety the artifact runtime gave.

import type { z } from "zod";
import type { Ctx } from "./ctx.js";

export interface ActionDef<
  R extends z.ZodTypeAny = z.ZodTypeAny,
  S extends z.ZodTypeAny = z.ZodTypeAny,
> {
  description?: string;
  request: R;
  response: S;
  handler: (ctx: Ctx, args: z.infer<R>) => Promise<z.infer<S>>;
}

export function defineAction<
  R extends z.ZodTypeAny,
  S extends z.ZodTypeAny,
>(def: {
  description?: string;
  request: R;
  response: S;
  handler: (ctx: Ctx, args: z.infer<R>) => Promise<z.infer<S>>;
}): ActionDef<R, S> {
  return def;
}

export type ActionsModule = Record<string, ActionDef>;
