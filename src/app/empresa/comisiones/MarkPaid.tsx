"use client";

import { ActionForm } from "@/components/ActionForm";
import { markPaid } from "./actions";

export function MarkPaid({ commissionId, retry }: { commissionId: string; retry: boolean }) {
  return (
    <ActionForm action={markPaid} label={retry ? "Ya lo he pagado (de nuevo)" : "Marcar como pagada"}>
      <input type="hidden" name="commission_id" value={commissionId} />
    </ActionForm>
  );
}
