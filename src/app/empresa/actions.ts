"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/actions/shared";
import { IMAGE_TYPES, MATERIAL_TYPES, uploadFile } from "@/lib/storage";
import { companyProfileSchema } from "@/lib/validation/profile";
import { offerSchema, toOfferRow } from "@/lib/validation/offer";
import type { FormState } from "@/lib/validation/auth";

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", data.user.id).single();
  if (!company) redirect("/login");
  return { supabase, uid: data.user.id, companyId: company.id };
}

export async function saveCompanyProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = companyProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  const { supabase, uid, companyId } = await session();

  const patch: Record<string, unknown> = { ...parsed.data, website: parsed.data.website || null, billing_email: parsed.data.billing_email || null };
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const up = await uploadFile(supabase, "logos", uid, logo, IMAGE_TYPES);
    if ("error" in up) return { fieldErrors: { logo: up.error } };
    patch.logo_path = up.path;
  }
  const { error } = await supabase.from("companies").update(patch).eq("id", companyId);
  if (error) return { error: "No se pudo guardar el perfil" };
  revalidatePath("/empresa", "layout");
  return { ok: true };
}

export async function saveOffer(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = offerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  const { supabase, companyId } = await session();
  const row = toOfferRow(parsed.data);
  const id = formData.get("id");

  if (typeof id === "string" && id) {
    const { error } = await supabase.from("offers").update(row).eq("id", id).eq("company_id", companyId);
    if (error) return { error: error.message };
    revalidatePath("/empresa/ofertas");
    return { ok: true };
  }
  const { data, error } = await supabase.from("offers").insert({ ...row, company_id: companyId }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/empresa/ofertas/${data.id}`);
}

export async function uploadMaterial(_: FormState, formData: FormData): Promise<FormState> {
  const offerId = String(formData.get("offer_id"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige un archivo" };
  const { supabase, uid, companyId } = await session();
  const { data: offer } = await supabase.from("offers").select("id").eq("id", offerId).eq("company_id", companyId).single();
  if (!offer) return { error: "Oferta no encontrada" };

  const up = await uploadFile(supabase, "materials", uid, file, MATERIAL_TYPES, offerId);
  if ("error" in up) return { error: up.error };
  const { error } = await supabase.from("offer_materials").insert({ offer_id: offerId, name: file.name, path: up.path });
  if (error) return { error: "No se pudo registrar el archivo" };
  revalidatePath(`/empresa/ofertas/${offerId}`);
  return { ok: true };
}

export async function deleteMaterial(formData: FormData) {
  const { supabase } = await session();
  const id = String(formData.get("id"));
  const { data: material } = await supabase.from("offer_materials").select("path, offer_id").eq("id", id).single();
  if (!material) return;
  await supabase.storage.from("materials").remove([material.path]);
  await supabase.from("offer_materials").delete().eq("id", id);
  revalidatePath(`/empresa/ofertas/${material.offer_id}`);
}

export async function setMembershipStatus(formData: FormData) {
  const { supabase } = await session();
  const status = formData.get("status") === "activa" ? "activa" : "rechazada";
  const { data } = await supabase.from("memberships").update({ status }).eq("id", String(formData.get("id"))).select("offer_id").single();
  if (data) revalidatePath(`/empresa/ofertas/${data.offer_id}`);
}
