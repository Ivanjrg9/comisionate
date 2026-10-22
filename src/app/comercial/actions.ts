"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/actions/shared";
import { IMAGE_TYPES, uploadFile } from "@/lib/storage";
import { salespersonProfileSchema } from "@/lib/validation/profile";
import type { FormState } from "@/lib/validation/auth";

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, uid: data.user.id };
}

export async function saveSalespersonProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = salespersonProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  const { supabase, uid } = await session();
  const { full_name, phone, new_autonomo, iban, ...rest } = parsed.data;

  const patch: Record<string, unknown> = {
    ...rest, iban: iban || null,
    new_autonomo: rest.fiscal === "autonomo" && !!new_autonomo,
  };
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadFile(supabase, "photos", uid, photo, IMAGE_TYPES);
    if ("error" in up) return { fieldErrors: { photo: up.error } };
    patch.photo_path = up.path;
  }

  const [p, s] = await Promise.all([
    supabase.from("profiles").update({ full_name, phone: phone || null }).eq("id", uid),
    supabase.from("salespeople").update(patch).eq("id", uid),
  ]);
  if (p.error || s.error) return { error: "No se pudo guardar el perfil" };

  const sectors = formData.getAll("sectors").map(Number).filter(Boolean);
  await supabase.from("salesperson_sectors").delete().eq("salesperson_id", uid);
  if (sectors.length) await supabase.from("salesperson_sectors").insert(sectors.map((sector_id) => ({ salesperson_id: uid, sector_id })));
  revalidatePath("/comercial", "layout");
  return { ok: true };
}

export async function joinOffer(formData: FormData) {
  const { supabase } = await session();
  const offerId = String(formData.get("offer_id"));
  if (formData.get("accept") !== "on") redirect(`/comercial/ofertas/${offerId}?error=acepta`);
  const { error } = await supabase.rpc("join_offer", { p_offer: offerId });
  if (error) redirect(`/comercial/ofertas/${offerId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/comercial/codigos");
  redirect("/comercial/codigos");
}
