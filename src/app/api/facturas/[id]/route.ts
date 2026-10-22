import { createClient } from "@/lib/supabase/server";
import { platformInvoicePdf } from "@/lib/pdf/documents";
import { pdfResponse } from "@/lib/pdf/response";

export async function GET(_: Request, ctx: RouteContext<"/api/facturas/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  // RLS: solo la empresa de la factura o el admin.
  const { data: inv } = await supabase
    .from("platform_invoices")
    .select("id, number, period, issued_at, due_at, total_cents, companies(legal_name, cif, billing_address)")
    .eq("id", id)
    .single();
  if (!inv) return new Response("No encontrada", { status: 404 });

  const { data: comms } = await supabase
    .from("commissions")
    .select("type, amount_cents, fee_percent, fee_cents, leads(customer_name)")
    .eq("platform_invoice_id", id)
    .order("confirmed_at");

  const bytes = await platformInvoicePdf({
    number: inv.number, period: inv.period, issuedAt: inv.issued_at, dueAt: inv.due_at, totalCents: inv.total_cents,
    company: inv.companies as unknown as { legal_name: string; cif: string; billing_address: string },
    lines: (comms ?? []).map((c) => ({
      customer: (c.leads as unknown as { customer_name: string }).customer_name, type: c.type,
      commissionCents: c.amount_cents, percent: Number(c.fee_percent), feeCents: c.fee_cents,
    })),
    platformIban: process.env.PLATFORM_IBAN ?? null,
  });
  return pdfResponse(bytes, `${inv.number}.pdf`);
}
