import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, ctx: RouteContext<"/api/comisiones/[id]/factura">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: invoice } = await supabase.from("salesperson_invoices").select("path").eq("commission_id", id).single();
  if (!invoice) return new Response("No hay factura subida", { status: 404 });
  const { data } = await supabase.storage.from("invoices").createSignedUrl(invoice.path, 120, { download: true });
  if (!data) return new Response("No autorizado", { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
