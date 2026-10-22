"use client";

import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/form";
import { updateGlobalFee } from "../actions";

export function FeeForm({ fee }: { fee: number }) {
  return (
    <ActionForm action={updateGlobalFee} label="Guardar tarifa global">
      <Field label="Tarifa global de ComisionaTe (%)" name="fee" inputMode="decimal" defaultValue={fee} hint="Se aplica a las empresas que no tengan tarifa propia ni sean fundadoras. Afecta solo a las comisiones que se validen a partir de ahora." />
    </ActionForm>
  );
}
