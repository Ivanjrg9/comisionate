"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/auth";

const confirmed = (f: FormData) => f.get("confirm") === "on";

export async function leaveAsSalesperson(_: FormState, f: FormData): Promise<FormState> {
  if (!confirmed(f)) return { error: "Marca la casilla para confirmar que quieres darte de baja" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_salesperson_leave");
  if (error) return { error: error.message };
  if (data === "cerrada") {
    await supabase.auth.signOut();
    redirect("/login?aviso=baja");
  }
  revalidatePath("/comercial", "layout");
  return { ok: true };
}

export async function leaveAsCompany(_: FormState, f: FormData): Promise<FormState> {
  if (!confirmed(f)) return { error: "Marca la casilla para confirmar que quieres darte de baja" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_company_leave");
  if (error) return { error: error.message };
  revalidatePath("/empresa", "layout");
  return { ok: true };
}
