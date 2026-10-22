import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LEGAL } from "@/lib/content/site";

const safePath = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : null);

// Vuelta de Google OAuth, de los enlaces de confirmación de email y de «recuperar contraseña».
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safePath(request.nextUrl.searchParams.get("next")) ?? "/comercial";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await supabase.rpc("accept_terms", { p_version: LEGAL.version }); // no hace nada si ya estaban aceptados
      return NextResponse.redirect(new URL(next, request.url));
    }
  }
  return NextResponse.redirect(new URL("/login?error=enlace", request.url));
}
