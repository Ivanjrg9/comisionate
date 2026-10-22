import type { FormState } from "@/lib/validation/auth";

export function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): FormState {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return { fieldErrors: out };
}

export const saved: FormState = { error: undefined, fieldErrors: undefined, ok: true };
