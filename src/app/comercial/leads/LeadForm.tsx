"use client";

import { Checkbox, Field, Select, TextArea, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { registerLead } from "./actions";

export type MembershipOption = { id: string; code: string; label: string };

export function LeadForm({ memberships, defaultMembership }: { memberships: MembershipOption[]; defaultMembership?: string }) {
  const { state, onSubmit, pending } = useServerForm(registerLead);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Select label="Oferta y código" name="membership_id" defaultValue={defaultMembership ?? memberships[0]?.id} error={e.membership_id}>
        {memberships.map((m) => <option key={m.id} value={m.id}>{m.label} · {m.code}</option>)}
      </Select>
      <Field label="Nombre del cliente" name="customer_name" autoComplete="off" required error={e.customer_name} />
      <Field label="Teléfono" name="phone" type="tel" inputMode="tel" autoComplete="off" required error={e.phone} />
      <Field label="Email (opcional)" name="email" type="email" autoComplete="off" error={e.email} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Código postal" name="postal_code" inputMode="numeric" maxLength={5} error={e.postal_code} />
        <Field label="Municipio" name="municipality" error={e.municipality} />
      </div>
      <Select label="Tipo de inmueble" name="property_type" defaultValue="">
        <option value="">Sin indicar</option>
        {["Vivienda unifamiliar", "Piso", "Comunidad de vecinos", "Local o nave", "Otro"].map((t) => <option key={t}>{t}</option>)}
      </Select>
      <TextArea label="Notas (consumo, tejado, cuándo llamar…)" name="notes" rows={3} error={e.notes} />
      <div>
        <Checkbox name="consent" label="El cliente ha dado su consentimiento para que sus datos se compartan con la empresa" />
        {e.consent && <p role="alert" className="text-sm text-danger">{e.consent}</p>}
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>{pending ? "Registrando…" : "Registrar cliente"}</button>
    </form>
  );
}
