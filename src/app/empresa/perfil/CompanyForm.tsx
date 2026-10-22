"use client";

import { saveCompanyProfile } from "../actions";
import { Field, FormMessage, Select, TextArea, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";

type Company = {
  legal_name: string; cif: string; sector_id: number | null; description: string; website: string | null;
  zone: string; billing_address: string; billing_email: string | null;
};

export function CompanyForm({ company, sectors }: { company: Company; sectors: { id: number; name: string }[] }) {
  const { state, onSubmit, pending } = useServerForm(saveCompanyProfile);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Razón social" name="legal_name" defaultValue={company.legal_name} required error={e.legal_name} />
      <Field label="CIF" name="cif" defaultValue={company.cif} required error={e.cif} />
      <Select label="Sector" name="sector_id" defaultValue={company.sector_id ?? ""} error={e.sector_id}>
        <option value="" disabled>Elige un sector</option>
        {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <TextArea label="Descripción de la empresa" name="description" defaultValue={company.description} error={e.description} />
      <Field label="Web" name="website" type="url" placeholder="https://" defaultValue={company.website ?? ""} error={e.website} />
      <Field label="Zona de actuación" name="zone" defaultValue={company.zone} hint="Ej. Andalucía y Extremadura" error={e.zone} />
      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Datos de facturación</legend>
        <Field label="Dirección fiscal" name="billing_address" defaultValue={company.billing_address} error={e.billing_address} />
        <Field label="Email de facturación" name="billing_email" type="email" defaultValue={company.billing_email ?? ""} error={e.billing_email} />
      </fieldset>
      <Field label="Logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG o WebP, máximo 5 MB" error={e.logo} />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Guardando…" : "Guardar perfil"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
