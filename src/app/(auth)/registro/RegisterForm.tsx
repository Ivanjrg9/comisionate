"use client";

import { useActionState } from "react";
import { register } from "../actions";
import { Field, buttonClass } from "@/components/form";

export function RegisterForm({ role }: { role: "empresa" | "comercial" }) {
  const [state, action, pending] = useActionState(register, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="role" value={role} />
      <Field label="Tu nombre y apellidos" name="full_name" autoComplete="name" required error={e.full_name} />
      {role === "empresa" ? (
        <>
          <Field label="Razón social" name="legal_name" autoComplete="organization" required error={e.legal_name} />
          <Field label="CIF" name="cif" required error={e.cif} />
        </>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">¿Eres autónomo o particular?</legend>
            {[
              ["particular", "Particular (sin alta de autónomo)"],
              ["autonomo", "Autónomo"],
            ].map(([value, label]) => (
              <label key={value} className="flex min-h-11 items-center gap-3">
                <input type="radio" name="fiscal" value={value} defaultChecked={value === "particular"} className="size-5 accent-primary" />
                {label}
              </label>
            ))}
            {e.fiscal && <p role="alert" className="text-sm text-danger">{e.fiscal}</p>}
          </fieldset>
          <Field label="DNI / NIE" name="nif" required error={e.nif} />
        </>
      )}
      <Field label="Email" name="email" type="email" autoComplete="email" required error={e.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres" required error={e.password} />
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 size-5 shrink-0 accent-primary" />
          <span>Acepto los términos de uso y la política de privacidad.</span>
        </label>
        {e.terms && <p role="alert" className="mt-1 text-sm text-danger">{e.terms}</p>}
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
