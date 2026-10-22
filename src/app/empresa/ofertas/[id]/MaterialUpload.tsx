"use client";

import { uploadMaterial } from "../../actions";
import { Field, FormMessage, secondaryButtonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";

export function MaterialUpload({ offerId }: { offerId: string }) {
  const { state, onSubmit, pending } = useServerForm(uploadMaterial);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="offer_id" value={offerId} />
      <Field label="Añadir material de venta" name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" hint="PDF o imagen, máximo 5 MB" />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={secondaryButtonClass}>{pending ? "Subiendo…" : "Subir"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
