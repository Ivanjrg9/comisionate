"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/auth";

export async function markPaid(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("company_mark_paid", { p_commission: String(formData.get("commission_id")) });
  if (error) return { error: error.message };
  revalidatePath("/empresa", "layout");
  return { ok: true };
}
