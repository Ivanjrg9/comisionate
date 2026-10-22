"use client";

import { ActionForm } from "@/components/ActionForm";
import { Field, FormMessage, Select, TextArea } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";
import { REJECT_REASONS, type LeadStatus } from "@/lib/lead-status";
import { cancelSale, markSale, qualifyLead, rejectLead } from "./actions";

const submit = "inline-flex min-h-11 items-center rounded-lg px-5 font-semibold disabled:opacity-60";

function SaleForm({ leadId }: { leadId: string }) {
  const { state, onSubmit, pending } = useServerForm(markSale);
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="lead_id" value={leadId} />
      <Field label="Importe de la venta (€)" name="amount" inputMode="decimal" hint="Con este importe calculamos la comisión por venta. Empieza el periodo de cancelación de 14 días." error={state.fieldErrors?.amount} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className={`${submit} bg-primary text-primary-foreground`}>{pending ? "Guardando…" : "Marcar venta (contrato firmado)"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function RejectForm({ leadId }: { leadId: string }) {
  const { state, onSubmit, pending } = useServerForm(rejectLead);
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="lead_id" value={leadId} />
      <Select label="Motivo del rechazo" name="reason" defaultValue="" error={state.fieldErrors?.reason}>
        <option value="" disabled>Elige un motivo</option>
        {Object.entries(REJECT_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <TextArea label="Explicación (obligatoria si eliges «Otro»)" name="note" rows={2} error={state.fieldErrors?.note} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className={`${submit} border border-danger text-danger hover:bg-danger/10`}>{pending ? "Guardando…" : "Rechazar"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function LeadActions({ leadId, status }: { leadId: string; status: LeadStatus }) {
  if (status === "registrado") {
    return (
      <div className="space-y-6">
        <ActionForm action={qualifyLead} label="Marcar como lead cualificado (visita técnica hecha)">
          <input type="hidden" name="lead_id" value={leadId} />
          <p className="text-sm text-muted">Se generará la comisión por lead (si la oferta la tiene) y tendrás 15 días para pagarla.</p>
        </ActionForm>
        <RejectForm leadId={leadId} />
      </div>
    );
  }
  if (status === "lead_cualificado") {
    return (
      <div className="space-y-6">
        <SaleForm leadId={leadId} />
        <RejectForm leadId={leadId} />
      </div>
    );
  }
  if (status === "periodo_cancelacion") {
    return (
      <ActionForm action={cancelSale} label="El cliente ha cancelado" tone="danger">
        <input type="hidden" name="lead_id" value={leadId} />
        <p className="text-sm text-muted">Solo durante los 14 días de desistimiento. Se anula la comisión por venta.</p>
        <TextArea label="Nota (opcional)" name="note" rows={2} />
      </ActionForm>
    );
  }
  return <p className="text-muted">No hay acciones disponibles en este estado.</p>;
}
