"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFile } from "@/lib/storage";
import type { FormState } from "@/lib/validation/auth";

export async function confirmPayment(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("salesperson_confirm_payment", {
    p_commission: String(formData.get("commission_id")),
    p_received: formData.get("received") === "yes",
  });
  if (error) return { error: error.message };
  revalidatePath("/comercial", "layout");
  return { ok: true };
}

export async function uploadInvoice(_: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get("file");
  const commissionId = String(formData.get("commission_id"));
  if (!(file instanceof File) || file.size === 0) return { error: "Elige el PDF de tu factura" };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const up = await uploadFile(supabase, "invoices", auth.user!.id, file, ["application/pdf"], commissionId);
  if ("error" in up) return { error: up.error };
  const { error } = await supabase.from("salesperson_invoices").insert({ commission_id: commissionId, path: up.path });
  if (error) return { error: "No se pudo guardar la factura (¿ya subiste una?)" };
  revalidatePath("/comercial/comisiones");
  return { ok: true };
}
