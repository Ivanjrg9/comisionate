import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Marca la notificación como leída y lleva al usuario a donde apunta.
export async function GET(request: NextRequest, ctx: RouteContext<"/notificaciones/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .select("link")
    .single();
  const link = data?.link && data.link.startsWith("/") && !data.link.startsWith("//") ? data.link : "/";
  return NextResponse.redirect(new URL(link, request.url));
}
