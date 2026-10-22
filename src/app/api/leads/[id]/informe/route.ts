import { createClient } from "@/lib/supabase/server";
import { saleReportPdf } from "@/lib/pdf/documents";
import { pdfResponse } from "@/lib/pdf/response";

export async function GET(_: Request, ctx: RouteContext<"/api/leads/[id]/informe">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, customer_name, phone_e164, status, created_at, signed_at, sale_amount_cents, reject_reason, reject_note, offers(title, companies(legal_name)), memberships(referral_code, accepted_at, terms_snapshot), salespeople(profiles(full_name))")
    .eq("id", id)
    .single();
  if (!lead) return new Response("No encontrado", { status: 404 });

  const [{ data: events }, { data: commissions }] = await Promise.all([
    supabase.from("lead_events").select("to_status, reason, created_at").eq("lead_id", id).order("id"),
    supabase.from("commissions").select("type, amount_cents, status, due_at, paid_by_company_at, received_at").eq("lead_id", id).order("type"),
  ]);
  const offer = lead.offers as unknown as { title: string; companies: { legal_name: string } };
  const membership = lead.memberships as unknown as { referral_code: string; accepted_at: string; terms_snapshot: Record<string, unknown> };
  const sp = lead.salespeople as unknown as { profiles: { full_name: string } };

  const bytes = await saleReportPdf({
    lead, offerTitle: offer.title, companyName: offer.companies.legal_name, salespersonName: sp.profiles.full_name,
    referralCode: membership.referral_code, acceptedAt: membership.accepted_at, terms: membership.terms_snapshot,
    events: events ?? [], commissions: commissions ?? [],
  });
  return pdfResponse(bytes, `informe-venta-${id.slice(0, 8)}.pdf`);
}
