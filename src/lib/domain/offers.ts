import type { AmountKind } from "@/lib/format";

export type CommissionTerms = {
  product_price_cents: number | null;
  lead_kind: AmountKind | null;
  lead_value: number | null;
  sale_kind: AmountKind | null;
  sale_value: number | null;
};

const part = (kind: AmountKind | null, value: number | null, base: number | null) => {
  if (!kind || value == null) return 0;
  return kind === "fija" ? value : Math.round(((base ?? 0) * value) / 10000);
};

/** Comisión orientativa total (lead + venta) sobre el precio de producto de la oferta; solo para filtrar y ordenar. */
export function estimatedCommissionCents(t: CommissionTerms) {
  return part(t.lead_kind, t.lead_value, t.product_price_cents) + part(t.sale_kind, t.sale_value, t.product_price_cents);
}
