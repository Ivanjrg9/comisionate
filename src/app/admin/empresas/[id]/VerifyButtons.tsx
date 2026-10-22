"use client";

import { ActionForm } from "@/components/ActionForm";
import { verifyCompany } from "../../actions";

export function VerifyButtons({ companyId, verified }: { companyId: string; verified: boolean }) {
  return (
    <ActionForm action={verifyCompany} label={verified ? "Quitar verificación" : "Verificar empresa"} tone={verified ? "secondary" : "primary"}>
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="verify" value={verified ? "no" : "yes"} />
    </ActionForm>
  );
}
