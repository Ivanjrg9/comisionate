"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function createReport(_: FormState, f: FormData): Promise<FormState> {
  const reason = str(f, "reason");
  if (reason.length < 10) return { fieldErrors: { reason: "Cuéntanos qué ha pasado (mínimo 10 caracteres)" } };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const lead = str(f, "lead_id");
  const target = str(f, "target_profile_id");
  if (!lead && !target) return { error: "Falta indicar qué reportas" };
  const { error } = await supabase.from("reports").insert({
    reporter_id: auth.user!.id, reason: reason.slice(0, 1000),
    lead_id: lead || null, target_profile_id: target || null,
  });
  if (error) return { error: "No se pudo enviar el reporte" };
  return { ok: true };
}

export async function openDispute(_: FormState, f: FormData): Promise<FormState> {
  const explanation = str(f, "explanation");
  if (explanation.length < 20) return { fieldErrors: { explanation: "Explica por qué no estás de acuerdo (mínimo 20 caracteres)" } };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("disputes").insert({ lead_id: str(f, "lead_id"), opened_by: auth.user!.id, explanation: explanation.slice(0, 2000) });
  if (error) return { error: "No se pudo abrir la disputa. ¿Ya hay una abierta?" };
  revalidatePath(`/comercial/leads/${str(f, "lead_id")}`);
  return { ok: true };
}

export async function submitReview(_: FormState, f: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", { p_commission: str(f, "commission_id"), p_stars: Number(str(f, "stars")), p_comment: str(f, "comment") });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
