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
    primary: "bg-primary text-primary-foreground",
    secondary: "border border-border hover:bg-surface",
    danger: "border border-danger text-danger hover:bg-danger/10",
  }[tone];
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`inline-flex min-h-11 items-center rounded-lg px-5 font-semibold disabled:opacity-60 ${toneClass}`}>
          {pending ? "Un momento…" : label}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
