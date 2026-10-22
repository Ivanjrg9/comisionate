"use client";

import { ActionForm } from "@/components/ActionForm";
import { markInvoicePaid } from "../actions";

export function MarkInvoicePaid({ invoiceId }: { invoiceId: string }) {
  return (
    <ActionForm action={markInvoicePaid} label="Marcar como pagada (recibida la transferencia)">
      <input type="hidden" name="invoice_id" value={invoiceId} />
    </ActionForm>
  );
}
