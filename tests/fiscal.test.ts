import { describe, expect, it } from "vitest";
import { invoiceBreakdown, particularNotice } from "../src/lib/domain/fiscal";
import { receiptPdf, saleReportPdf } from "../src/lib/pdf/documents";

describe("desglose fiscal orientativo", () => {
  it("autónomo estándar: +21 % IVA −15 % IRPF", () => {
    expect(invoiceBreakdown(50000, false)).toEqual({ base: 50000, iva: 10500, irpf: 7500, irpfPercent: 15, total: 53000 });
  });
  it("nuevo autónomo: IRPF del 7 %", () => {
    expect(invoiceBreakdown(50000, true)).toMatchObject({ irpf: 3500, irpfPercent: 7, total: 57000 });
  });
});

describe("aviso para particulares", () => {
  it("se destaca al superar 5 comisiones en el año", () => {
    expect(particularNotice(5)).toBe("informativo");
    expect(particularNotice(6)).toBe("destacado");
  });
});

describe("PDFs", () => {
  it("genera un justificante válido con acentos, € y ñ", async () => {
    const bytes = await receiptPdf({
      commissionId: "abcdef12-0000", type: "venta", amountCents: 50002, paidAt: new Date().toISOString(), receivedAt: null,
      offerTitle: "Instalación solar año ñandú →", customerName: "Ana Peñalver",
      company: { legal_name: "SolMed Energía S.L.", cif: "B12345678", billing_address: "Calle Mayor 1, Sevilla" },
      salesperson: { full_name: "Iván Ramos", nif: "12345678A" },
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });
  it("genera un informe con paginación de muchos eventos", async () => {
    const events = Array.from({ length: 80 }, (_, i) => ({ to_status: "registrado" as const, reason: `Evento ${i}`, created_at: new Date().toISOString() }));
    const bytes = await saleReportPdf({
      lead: { id: "x", customer_name: "Cliente", phone_e164: "+34600000000", status: "pagada", created_at: new Date().toISOString(), signed_at: null, sale_amount_cents: 100000, reject_reason: null, reject_note: null },
      offerTitle: "Oferta", companyName: "Empresa", salespersonName: "Comercial", referralCode: "SOLAR-X-1AB", acceptedAt: new Date().toISOString(),
      terms: { lead_kind: "fija", lead_value: 5000, sale_kind: "porcentaje", sale_value: 400, cancel_days: 14, pay_days: 15, zones: [], requirements: "" },
      events, commissions: [{ type: "lead", amount_cents: 5000, status: "recibida", due_at: null, paid_by_company_at: null, received_at: null }],
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });
});
