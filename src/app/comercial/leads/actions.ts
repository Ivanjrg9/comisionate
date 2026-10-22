"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/actions/shared";
import { leadSchema } from "@/lib/validation/lead";
import type { FormState } from "@/lib/validation/auth";

export async function registerLead(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_lead", {
    p_membership: v.membership_id, p_name: v.customer_name, p_phone: v.phone, p_email: v.email,
    p_postal: v.postal_code, p_municipality: v.municipality, p_property: v.property_type,
    p_notes: v.notes, p_consent: true,
  });
  if (error) return { error: error.message };

  const result = data as { ok: boolean; lead_id?: string; reason?: string };
  if (!result.ok) {
    return {
      error: result.reason === "cliente_reservado"
        ? "Este cliente ya está registrado para esa empresa por otro comercial (queda reservado durante 90 días). No podemos darte más datos."
        : "Ya registraste a este cliente para esa empresa.",
    };
  }
  revalidatePath("/comercial/leads");
  redirect(`/comercial/leads/${result.lead_id}?nuevo=1`);
}
