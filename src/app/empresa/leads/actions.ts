"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/actions/shared";
import { rejectSchema, saleSchema } from "@/lib/validation/lead";
import type { FormState } from "@/lib/validation/auth";

type Transition = { p_to: string; p_amount?: number; p_reason?: string; p_note?: string };

async function transition(formData: FormData, args: Transition): Promise<FormState> {
  const id = String(formData.get("lead_id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_lead_status", { p_lead: id, ...args });
  if (error) return { error: error.message };
  revalidatePath("/empresa/leads");
  revalidatePath(`/empresa/leads/${id}`);
  return { ok: true };
}

export async function qualifyLead(_: FormState, formData: FormData) {
  return transition(formData, { p_to: "lead_cualificado" });
}

export async function rejectLead(_: FormState, formData: FormData) {
  const parsed = rejectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  return transition(formData, { p_to: "rechazado", p_reason: parsed.data.reason, p_note: parsed.data.note || undefined });
}

export async function markSale(_: FormState, formData: FormData) {
  const parsed = saleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  return transition(formData, { p_to: "venta", p_amount: Math.round(parsed.data.amount * 100) });
}

export async function cancelSale(_: FormState, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  return transition(formData, { p_to: "cancelada", p_note: note || undefined });
}
