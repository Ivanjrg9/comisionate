"use client";

import { ActionForm } from "@/components/ActionForm";
import { FormMessage, Select, TextArea } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { resolveReport, startReportReview } from "../actions";

export function StartReview({ reportId }: { reportId: string }) {
  return (
    <ActionForm action={startReportReview} label="Poner en revisión" tone="secondary">
      <input type="hidden" name="report_id" value={reportId} />
    </ActionForm>
  );
}

export function ResolveReport({ reportId, targets }: { reportId: string; targets: { id: string; label: string }[] }) {
  const { state, onSubmit, pending } = useServerForm(resolveReport);
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="report_id" value={reportId} />
      {targets.length > 0 && (
        <Select label="A quién se aplica" name="target" defaultValue={targets[0].id}>
          {targets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      )}
      <Select label="Sanción" name="sanction" defaultValue="ninguna">
        <option value="ninguna">Ninguna (archivar)</option>
        <option value="aviso">Aviso</option>
        <option value="suspension">Suspensión temporal</option>
        <option value="expulsion">Expulsión</option>
      </Select>
      <TextArea label="Nota (la recibe quien reportó)" name="note" rows={2} error={state.fieldErrors?.note} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="min-h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Guardando…" : "Resolver reporte"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
