"use client";

import { useState } from "react";
import { saveOffer } from "../actions";
import { Checkbox, Field, FormMessage, Select, TextArea, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";

export type OfferValues = {
  id?: string; title: string; description: string; sector_id: number | null; product_price_cents: number | null;
  lead_kind: "fija" | "porcentaje" | null; lead_value: number | null;
  sale_kind: "fija" | "porcentaje" | null; sale_value: number | null;
  zones: string[]; requirements: string; only_autonomos: boolean; access: "abierto" | "aprobacion";
  status: "borrador" | "activa" | "pausada" | "oculta" | "cerrada";
};

const num = (n: number | null) => (n == null ? "" : String(n / 100).replace(".", ","));

function CommissionBlock({ prefix, title, kind, value, errors }: {
  prefix: "lead" | "sale"; title: string; kind: "fija" | "porcentaje" | null; value: number | null; errors: Record<string, string>;
}) {
  const [enabled, setEnabled] = useState(kind !== null);
  const [k, setK] = useState<"fija" | "porcentaje">(kind ?? "fija");
  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <Checkbox label="Esta oferta paga esta comisión" name={`${prefix}_enabled`} checked={enabled} onChange={(ev) => setEnabled(ev.target.checked)} />
      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Tipo" name={`${prefix}_kind`} value={k} onChange={(ev) => setK(ev.target.value as "fija" | "porcentaje")} error={errors[`${prefix}_kind`]}>
            <option value="fija">Importe fijo (€)</option>
            <option value="porcentaje">Porcentaje de la venta (%)</option>
          </Select>
          <Field label={k === "fija" ? "Importe (€)" : "Porcentaje (%)"} name={`${prefix}_value`} inputMode="decimal" defaultValue={num(value)} error={errors[`${prefix}_value`]} />
        </div>
      )}
    </fieldset>
  );
}

export function OfferForm({ offer, sectors }: { offer?: OfferValues; sectors: { id: number; name: string }[] }) {
  const { state, onSubmit, pending } = useServerForm(saveOffer);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {offer?.id && <input type="hidden" name="id" value={offer.id} />}
      <Field label="Título de la oferta" name="title" defaultValue={offer?.title} required error={e.title} />
      <TextArea label="Descripción" name="description" defaultValue={offer?.description} error={e.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Sector" name="sector_id" defaultValue={offer?.sector_id ?? sectors[0]?.id} error={e.sector_id}>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Field label="Precio orientativo del producto (€)" name="product_price" inputMode="decimal" defaultValue={num(offer?.product_price_cents ?? null)} error={e.product_price} />
      </div>
      {e.lead_enabled && <p role="alert" className="text-sm text-danger">{e.lead_enabled}</p>}
      <CommissionBlock prefix="lead" title="Comisión por lead cualificado (visita técnica realizada)" kind={offer?.lead_kind ?? null} value={offer?.lead_value ?? null} errors={e} />
      <CommissionBlock prefix="sale" title="Comisión por venta (contrato firmado)" kind={offer?.sale_kind ?? null} value={offer?.sale_value ?? null} errors={e} />
      <TextArea label="Zonas (provincias o códigos postales, separados por comas)" name="zones" rows={2} defaultValue={offer?.zones.join(", ")} />
      <TextArea label="Requisitos para el cliente" name="requirements" rows={2} defaultValue={offer?.requirements} error={e.requirements} />
      <Checkbox label="Solo autónomos" hint="Solo podrán unirse comerciales dados de alta como autónomos." name="only_autonomos" defaultChecked={offer?.only_autonomos} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Acceso" name="access" defaultValue={offer?.access ?? "abierto"}>
          <option value="abierto">Abierto: se unen directamente</option>
          <option value="aprobacion">Con aprobación: tú decides</option>
        </Select>
        <Select label="Estado" name="status" defaultValue={offer?.status === "oculta" || offer?.status === "cerrada" ? "pausada" : (offer?.status ?? "borrador")}>
          <option value="borrador">Borrador (no visible)</option>
          <option value="activa">Activa (visible en el marketplace)</option>
          <option value="pausada">Pausada</option>
        </Select>
      </div>
      <p className="text-sm text-muted">
        Si cambias las condiciones, solo se aplican a los comerciales que se unan a partir de ahora; los actuales mantienen las que aceptaron.
      </p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Guardando…" : offer?.id ? "Guardar oferta" : "Crear oferta"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
