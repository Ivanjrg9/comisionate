"use client";

import { FormMessage, Select, TextArea } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { createReport, openDispute, submitReview } from "@/lib/actions/trust";

const submit = "inline-flex min-h-11 items-center rounded-lg px-5 font-semibold disabled:opacity-60";

/** «Reportar»: desplegable con un motivo libre. Llega al admin con estado abierto. */
export function ReportForm({ leadId, targetProfileId, label = "Reportar" }: { leadId?: string; targetProfileId?: string; label?: string }) {
  const { state, onSubmit, pending } = useServerForm(createReport);
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-muted underline">{label}</summary>
      {state.ok ? (
        <p role="status" className="mt-2 font-medium text-primary">Gracias, hemos recibido tu reporte. El equipo lo revisará.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-2 space-y-3" noValidate>
          {leadId && <input type="hidden" name="lead_id" value={leadId} />}
          {targetProfileId && <input type="hidden" name="target_profile_id" value={targetProfileId} />}
          <TextArea label="¿Qué ha pasado?" name="reason" rows={3} error={state.fieldErrors?.reason} />
          <div className="flex items-center gap-3">
            <button disabled={pending} className={`${submit} border border-border hover:bg-surface`}>{pending ? "Enviando…" : "Enviar reporte"}</button>
            <FormMessage state={state} />
          </div>
        </form>
      )}
    </details>
  );
}

export function DisputeForm({ leadId }: { leadId: string }) {
  const { state, onSubmit, pending } = useServerForm(openDispute);
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border p-4" noValidate>
      <input type="hidden" name="lead_id" value={leadId} />
      <h3 className="font-bold">¿No estás de acuerdo? Abre una disputa</h3>
      <p className="text-sm text-muted">El equipo de ComisionaTe revisará el caso y decidirá. Si te da la razón, el cliente vuelve al estado que le corresponde.</p>
      <TextArea label="Tu explicación" name="explanation" rows={3} error={state.fieldErrors?.explanation} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className={`${submit} bg-primary text-primary-foreground`}>{pending ? "Enviando…" : "Abrir disputa"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function ReviewForm({ commissionId, whom }: { commissionId: string; whom: string }) {
  const { state, onSubmit, pending } = useServerForm(submitReview);
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-primary underline">Valorar a {whom}</summary>
      <form onSubmit={onSubmit} className="mt-2 space-y-3" noValidate>
        <input type="hidden" name="commission_id" value={commissionId} />
        <Select label="Puntuación" name="stars" defaultValue="5">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)} ({n})</option>)}
        </Select>
        <TextArea label="Comentario (opcional)" name="comment" rows={2} />
        <div className="flex items-center gap-3">
          <button disabled={pending} className={`${submit} bg-primary text-primary-foreground`}>{pending ? "Enviando…" : "Enviar valoración"}</button>
          <FormMessage state={state} />
        </div>
      </form>
    </details>
  );
}
