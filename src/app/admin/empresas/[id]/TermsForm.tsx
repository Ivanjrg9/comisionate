"use client";

import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/form";
import { updateCompanyTerms } from "../../actions";

export function TermsForm({ companyId, founderUntil, fee, globalFee }: { companyId: string; founderUntil: string | null; fee: number | null; globalFee: number }) {
  return (
    <ActionForm action={updateCompanyTerms} label="Guardar condiciones">
      <input type="hidden" name="company_id" value={companyId} />
      <Field label="Empresa fundadora: sin tarifa hasta" name="founder_until" type="date" defaultValue={founderUntil ?? ""} hint="Vacío = no es fundadora. Mientras esté vigente la tarifa es 0 %." />
      <Field label="Tarifa propia (%)" name="fee" inputMode="decimal" defaultValue={fee ?? ""} hint={`Vacío = tarifa global (${globalFee} %).`} />
    </ActionForm>
  );
}
