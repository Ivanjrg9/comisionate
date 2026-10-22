export const IVA_PERCENT = 21;
export const IRPF_PERCENT = 15;
export const IRPF_NEW_AUTONOMO_PERCENT = 7;
export const PARTICULAR_ANNUAL_LIMIT = 5;

export type InvoiceBreakdown = { base: number; iva: number; irpf: number; irpfPercent: number; total: number };

/** Desglose orientativo de la factura de un autónomo: comisión + IVA 21 % − IRPF (15 %, o 7 % si es nuevo autónomo). */
export function invoiceBreakdown(commissionCents: number, newAutonomo: boolean): InvoiceBreakdown {
  const irpfPercent = newAutonomo ? IRPF_NEW_AUTONOMO_PERCENT : IRPF_PERCENT;
  const iva = Math.round((commissionCents * IVA_PERCENT) / 100);
  const irpf = Math.round((commissionCents * irpfPercent) / 100);
  return { base: commissionCents, iva, irpf, irpfPercent, total: commissionCents + iva - irpf };
}

/** Un particular que supera 5 comisiones en un año natural debería consultar con un gestor. */
export function particularNotice(commissionsThisYear: number): "ninguno" | "informativo" | "destacado" {
  if (commissionsThisYear > PARTICULAR_ANNUAL_LIMIT) return "destacado";
  return "informativo";
}
