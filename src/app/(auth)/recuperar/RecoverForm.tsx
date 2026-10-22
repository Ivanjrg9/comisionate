"use client";

import { Field, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { requestPasswordReset } from "../actions";

export function RecoverForm() {
  const { state, onSubmit, pending } = useServerForm(requestPasswordReset);
  if (state.ok) {
    return (
      <p role="status" className="rounded-lg bg-primary/15 p-4">
        Si hay una cuenta con ese email, te hemos enviado un enlace para elegir una contraseña nueva. Revisa también la carpeta de spam. El enlace caduca en una hora.
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email de tu cuenta" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>{pending ? "Enviando…" : "Enviarme el enlace"}</button>
    </form>
  );
}
