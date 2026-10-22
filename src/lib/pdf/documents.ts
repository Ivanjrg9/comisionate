import { euros } from "@/lib/format";
import { LEAD_STATUS_LABEL, readableReason, type LeadStatus } from "@/lib/lead-status";
import { PdfBuilder } from "./builder";

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "-");
const dateTime = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

export type ReceiptData = {
  commissionId: string;
  type: "lead" | "venta";
  amountCents: number;
  paidAt: string | null;
  receivedAt: string | null;
  offerTitle: string;
  customerName: string;
  company: { legal_name: string; cif: string; billing_address: string };
  salesperson: { full_name: string; nif: string | null };
};

/** Justificante de pago para comerciales particulares (no emiten factura). */
export async function receiptPdf(d: ReceiptData) {
  const pdf = await PdfBuilder.create("Justificante de pago de comisión");
  pdf.row("Nº de justificante", `CT-J-${d.commissionId.slice(0, 8).toUpperCase()}`);
  pdf.row("Fecha de pago", date(d.paidAt));
  pdf.subheading("Quien paga (empresa)");
  pdf.row("Razón social", d.company.legal_name);
  pdf.row("CIF", d.company.cif);
  pdf.row("Domicilio", d.company.billing_address);
  pdf.subheading("Quien cobra (comercial)");
  pdf.row("Nombre", d.salesperson.full_name);
  pdf.row("DNI / NIE", d.salesperson.nif ?? "-");
  pdf.subheading("Detalle");
  pdf.row("Concepto", `Comisión por ${d.type === "lead" ? "lead cualificado" : "venta"} - oferta "${d.offerTitle}" - cliente ${d.customerName}`);
  pdf.row("Importe", euros(d.amountCents));
  pdf.row("Confirmado por el comercial", d.receivedAt ? date(d.receivedAt) : "Pendiente de confirmación");
  pdf.spacer(20);
  pdf.paragraph(
    "Documento generado por ComisionaTe a título informativo como justificante del pago de una comisión entre dos partes independientes. " +
      "ComisionaTe no asesora fiscalmente: cada parte es responsable de sus obligaciones fiscales. " +
      "Si vendes de forma habitual, consulta con un gestor si debes darte de alta como autónomo.",
    9, true,
  );
  return pdf.bytes();
}

export type ReportData = {
  lead: {
    id: string; customer_name: string; phone_e164: string; status: LeadStatus; created_at: string;
    signed_at: string | null; sale_amount_cents: number | null; reject_reason: string | null; reject_note: string | null;
  };
  offerTitle: string;
  companyName: string;
  salespersonName: string;
  referralCode: string;
  acceptedAt: string;
  terms: Record<string, unknown>;
  events: { to_status: LeadStatus; reason: string | null; created_at: string }[];
  commissions: { type: "lead" | "venta"; amount_cents: number; status: string; due_at: string | null; paid_by_company_at: string | null; received_at: string | null }[];
};

/** Informe de una venta: prueba para reclamar un pago. */
export async function saleReportPdf(d: ReportData) {
  const pdf = await PdfBuilder.create("Informe de venta");
  pdf.row("Referencia", d.lead.id);
  pdf.row("Generado el", date(new Date().toISOString()));
  pdf.subheading("Datos");
  pdf.row("Cliente", `${d.lead.customer_name} (${d.lead.phone_e164})`);
  pdf.row("Oferta", d.offerTitle);
  pdf.row("Empresa", d.companyName);
  pdf.row("Comercial", `${d.salespersonName} - código ${d.referralCode}`);
  pdf.row("Estado actual", LEAD_STATUS_LABEL[d.lead.status]);
  pdf.row("Registrado", date(d.lead.created_at));
  if (d.lead.signed_at) pdf.row("Firma del contrato", date(d.lead.signed_at));
  if (d.lead.sale_amount_cents != null) pdf.row("Importe de la venta", euros(d.lead.sale_amount_cents));
  if (d.lead.reject_reason) pdf.row("Motivo de rechazo", readableReason(d.lead.reject_reason + (d.lead.reject_note ? `: ${d.lead.reject_note}` : "")) ?? "-");

  pdf.subheading("Historial de estados");
  for (const e of d.events.filter((e) => e.to_status !== "venta"))
    pdf.row(dateTime(e.created_at), LEAD_STATUS_LABEL[e.to_status] + (e.reason ? ` - ${readableReason(e.reason)}` : ""));

  pdf.subheading("Comisiones");
  if (!d.commissions.length) pdf.paragraph("Todavía no se ha generado ninguna comisión.");
  for (const c of d.commissions) {
    pdf.row(c.type === "lead" ? "Por lead" : "Por venta", `${euros(c.amount_cents)} (${c.status.replace("_", " ")})`);
    if (c.due_at) pdf.row("  Vence", date(c.due_at));
    if (c.paid_by_company_at) pdf.row("  Pago marcado por la empresa", date(c.paid_by_company_at));
    if (c.received_at) pdf.row("  Recibido por el comercial", date(c.received_at));
  }

  pdf.subheading(`Condiciones aceptadas el ${dateTime(d.acceptedAt)}`);
  const t = d.terms as Record<string, string | number | boolean | string[] | null>;
  const kindText = (kind: unknown, value: unknown) => (kind === "fija" ? euros(Number(value)) : `${Number(value) / 100} %`);
  if (t.lead_kind) pdf.row("Comisión por lead", kindText(t.lead_kind, t.lead_value));
  if (t.sale_kind) pdf.row("Comisión por venta", kindText(t.sale_kind, t.sale_value));
  pdf.row("Plazo de cancelación", `${t.cancel_days} días`);
  pdf.row("Plazo de pago", `${t.pay_days} días`);
  pdf.row("Zonas", Array.isArray(t.zones) && t.zones.length ? t.zones.join(", ") : "Toda España");
  pdf.row("Requisitos", String(t.requirements || "-"));
  pdf.spacer(16);
  pdf.paragraph("Informe generado por ComisionaTe a partir de los registros de la plataforma. ComisionaTe es un intermediario y no es parte de la venta al cliente final.", 9, true);
  return pdf.bytes();
}

export type PlatformInvoiceData = {
  number: string; period: string; issuedAt: string; dueAt: string; totalCents: number;
  company: { legal_name: string; cif: string; billing_address: string };
  lines: { customer: string; type: "lead" | "venta"; commissionCents: number; percent: number; feeCents: number }[];
  platformIban: string | null;
};

/** Factura mensual de ComisionaTe a la empresa: tarifa sobre las comisiones validadas del mes. */
export async function platformInvoicePdf(d: PlatformInvoiceData) {
  const pdf = await PdfBuilder.create(`Factura ${d.number}`);
  const month = new Date(d.period).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  pdf.row("Periodo", month);
  pdf.row("Fecha de emisión", date(d.issuedAt));
  pdf.row("Vencimiento", date(d.dueAt));
  pdf.subheading("Cliente");
  pdf.row("Razón social", d.company.legal_name);
  pdf.row("CIF", d.company.cif);
  pdf.row("Domicilio", d.company.billing_address);
  pdf.subheading("Detalle: tarifa de ComisionaTe sobre comisiones validadas");
  for (const l of d.lines)
    pdf.row(`${l.type === "lead" ? "Lead" : "Venta"} - ${l.customer}`, `${euros(l.commissionCents)} x ${l.percent} % = ${euros(l.feeCents)}`);
  pdf.spacer(8);
  pdf.row("Total a pagar", euros(d.totalCents));
  pdf.paragraph("Importe sin IVA. Pago por transferencia en un máximo de 15 días desde la emisión.", 9, true);
  if (d.platformIban) pdf.row("IBAN de ComisionaTe", d.platformIban);
  return pdf.bytes();
}
