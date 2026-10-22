"use client";

import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/form";
import { confirmPayment, uploadInvoice } from "./actions";

export function ConfirmPayment({ commissionId }: { commissionId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <ActionForm action={confirmPayment} label="Sí, lo he recibido">
        <input type="hidden" name="commission_id" value={commissionId} />
        <input type="hidden" name="received" value="yes" />
      </ActionForm>
      <ActionForm action={confirmPayment} label="No lo he recibido" tone="danger">
        <input type="hidden" name="commission_id" value={commissionId} />
        <input type="hidden" name="received" value="no" />
      </ActionForm>
    </div>
  );
}

export function InvoiceUpload({ commissionId }: { commissionId: string }) {
  return (
    <ActionForm action={uploadInvoice} label="Subir factura" tone="secondary">
      <input type="hidden" name="commission_id" value={commissionId} />
      <Field label="Tu factura en PDF" name="file" id={`factura-${commissionId}`} type="file" accept="application/pdf" hint="Máximo 5 MB" />
    </ActionForm>
  );
}
