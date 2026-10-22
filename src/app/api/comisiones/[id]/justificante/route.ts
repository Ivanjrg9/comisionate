import { createClient } from "@/lib/supabase/server";
import { receiptPdf } from "@/lib/pdf/documents";
import { pdfResponse } from "@/lib/pdf/response";

export async function GET(_: Request, ctx: RouteContext<"/api/comisiones/[id]/justificante">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  // RLS: solo la empresa y el comercial de la comisión (o el admin) pueden leerla.
  const { data: c } = await supabase
    .from("commissions")
    .select("id, type, amount_cents, status, paid_by_company_at, received_at, leads(customer_name, offers(title)), companies(legal_name, cif, billing_address), salespeople(nif, fiscal, profiles(full_name))")
    .eq("id", id)
    .single();
  if (!c) return new Response("No encontrado", { status: 404 });
  if (c.status !== "pagada_empresa" && c.status !== "recibida") return new Response("El pago aún no está marcado", { status: 409 });

  const lead = c.leads as unknown as { customer_name: string; offers: { title: string } };
  const company = c.companies as unknown as { legal_name: string; cif: string; billing_address: string };
  const sp = c.salespeople as unknown as { nif: string | null; fiscal: string; profiles: { full_name: string } };
  if (sp.fiscal !== "particular") return new Response("Los autónomos aportan su propia factura", { status: 409 });

  const bytes = await receiptPdf({
    commissionId: c.id, type: c.type, amountCents: c.amount_cents, paidAt: c.paid_by_company_at, receivedAt: c.received_at,
    offerTitle: lead.offers.title, customerName: lead.customer_name, company,
    salesperson: { full_name: sp.profiles.full_name, nif: sp.nif },
  });
  return pdfResponse(bytes, `justificante-${c.id.slice(0, 8)}.pdf`);
}
