"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/auth";

async function rpc(name: string, args: Record<string, unknown>, paths: string[]): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(name, args);
  if (error) return { error: error.message };
  paths.forEach((p) => revalidatePath(p));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function verifyCompany(_: FormState, f: FormData) {
  return rpc("admin_verify_company", { p_company: str(f, "company_id"), p_verify: str(f, "verify") === "yes" }, ["/admin/empresas"]);
}

export async function setAccountStatus(_: FormState, f: FormData) {
  return rpc("admin_set_account_status", { p_profile: str(f, "profile_id"), p_status: str(f, "status") }, ["/admin/empresas", "/admin/comerciales"]);
}

export async function updateCompanyTerms(_: FormState, f: FormData) {
  const fee = str(f, "fee").replace(",", ".").trim();
  const feeNumber = fee === "" ? null : Number(fee);
  if (feeNumber !== null && (Number.isNaN(feeNumber) || feeNumber < 0 || feeNumber > 100)) return { fieldErrors: { fee: "Escribe un porcentaje entre 0 y 100" } };
  return rpc("admin_update_company_terms", {
    p_company: str(f, "company_id"), p_founder_until: str(f, "founder_until") || null, p_fee: feeNumber,
  }, [`/admin/empresas/${str(f, "company_id")}`]);
}

export async function resolveDispute(_: FormState, f: FormData) {
  const resolution = str(f, "resolution").trim();
  if (!resolution) return { fieldErrors: { resolution: "Explica la decisión: la verán las dos partes" } };
  return rpc("admin_resolve_dispute", { p_dispute: str(f, "dispute_id"), p_for_salesperson: str(f, "favor") === "comercial", p_resolution: resolution }, ["/admin/disputas"]);
}

export async function startReportReview(_: FormState, f: FormData) {
  return rpc("admin_start_report_review", { p_report: str(f, "report_id") }, ["/admin/reportes"]);
}

export async function resolveReport(_: FormState, f: FormData) {
  const note = str(f, "note").trim();
  if (!note) return { fieldErrors: { note: "Escribe una nota para el reporte" } };
  return rpc("admin_resolve_report", { p_report: str(f, "report_id"), p_sanction: str(f, "sanction") || "ninguna", p_note: note, p_target: str(f, "target") || null }, ["/admin/reportes"]);
}

export async function markInvoicePaid(_: FormState, f: FormData) {
  return rpc("admin_mark_invoice_paid", { p_invoice: str(f, "invoice_id") }, ["/admin/facturas"]);
}

export async function updateGlobalFee(_: FormState, f: FormData): Promise<FormState> {
  const value = Number(str(f, "fee").replace(",", "."));
  if (Number.isNaN(value) || value < 0 || value > 100) return { fieldErrors: { fee: "Escribe un porcentaje entre 0 y 100" } };
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "fee_percent");
  if (error) return { error: error.message };
  revalidatePath("/admin/ajustes");
  return { ok: true };
}
