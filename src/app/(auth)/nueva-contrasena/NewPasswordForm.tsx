"use client";

import { Field, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { setNewPassword } from "../actions";

export function NewPasswordForm() {
  const { state, onSubmit, pending } = useServerForm(setNewPassword);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Contraseña nueva" name="password" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres, con letras y números" required error={e.password} />
      <Field label="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" required error={e.confirm} />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>{pending ? "Guardando…" : "Guardar contraseña"}</button>
    </form>
  );
}
