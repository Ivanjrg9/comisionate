"use client";

import { login } from "../actions";
import { Field, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";

export function LoginForm({ next }: { next?: string }) {
  const { state, onSubmit, pending } = useServerForm(login);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
