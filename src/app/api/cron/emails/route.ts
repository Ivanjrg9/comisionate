import { createClient } from "@supabase/supabase-js";
import { renderEmail, sendEmail } from "@/lib/email";

// Envía por email las notificaciones pendientes. Lo llama Vercel Cron (ver vercel.json) con CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("No autorizado", { status: 401 });
  if (!process.env.RESEND_API_KEY) return Response.json({ sent: 0, skipped: "RESEND_API_KEY no configurada" });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: pending, error } = await db
    .from("notifications")
    .select("id, title, body, link, profiles(email)")
    .is("emailed_at", null)
    .gt("created_at", new Date(Date.now() - 3 * 864e5).toISOString())
    .order("created_at")
    .limit(100);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const n of pending ?? []) {
    const email = (n.profiles as unknown as { email: string } | null)?.email;
    if (!email) continue;
    if (await sendEmail(email, n.title, renderEmail(n.title, n.body, n.link))) {
      await db.from("notifications").update({ emailed_at: new Date().toISOString() }).eq("id", n.id);
      sent++;
    }
  }
  return Response.json({ sent, pending: pending?.length ?? 0 });
}
