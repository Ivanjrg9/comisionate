"use client";

import { FormMessage, TextArea } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { resolveDispute } from "../actions";

export function ResolveDispute({ disputeId }: { disputeId: string }) {
  const { state, onSubmit, pending } = useServerForm(resolveDispute);
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="dispute_id" value={disputeId} />
      <TextArea label="Decisión (la verán el comercial y la empresa)" name="resolution" rows={2} error={state.fieldErrors?.resolution} />
      <div className="flex flex-wrap items-center gap-3">
        <button name="favor" value="comercial" disabled={pending} className="min-h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60">A favor del comercial</button>
        <button name="favor" value="empresa" disabled={pending} className="min-h-11 rounded-lg border border-border px-5 font-semibold hover:bg-surface disabled:opacity-60">A favor de la empresa</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
