"use client";

import type { ReactNode } from "react";
import { useServerForm } from "@/components/useServerForm";
import { FormMessage } from "@/components/form";
import type { FormState } from "@/lib/validation/auth";

/** Formulario pequeño para una acción del servidor (cualificar, rechazar…). */
export function ActionForm({
  action, label, tone = "primary", children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  tone?: "primary" | "secondary" | "danger";
  children?: ReactNode;
}) {
  const { state, onSubmit, pending } = useServerForm(action);
  const toneClass = {
    primary: "border border-white/10 bg-primary text-primary-foreground shadow-[inset_0_1px_0_#fff,inset_0_-2px_6px_rgba(0,0,0,0.1)] hover:bg-white",
    secondary: "border border-border-strong bg-border text-foreground hover:bg-[#303030]",
    danger: "border border-danger/60 text-danger hover:bg-danger/10",
  }[tone];
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition disabled:opacity-60 ${toneClass}`}>
          {pending ? "Un momento…" : label}
        </button>
        <FormMessage state={{ ok: state.ok, error: state.error ?? Object.values(state.fieldErrors ?? {})[0] }} />
      </div>
    </form>
  );
}
