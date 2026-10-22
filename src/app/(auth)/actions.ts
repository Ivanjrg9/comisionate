"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME_BY_ROLE, type Role } from "@/lib/auth";
import { loginSchema, registerSchema, type FormState } from "@/lib/validation/auth";

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email o contraseña incorrectos" };

  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", auth.user!.id).single();
  if (profile?.status !== "activo") {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no está activa. Contacta con nosotros." };
  }
  redirect(safeNext(formData.get("next")) ?? HOME_BY_ROLE[profile.role as Role]);
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const { email, password, terms, ...meta } = parsed.data;
  void terms; // solo se valida; no se guarda en los metadatos
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
  if (error) {
    return { error: error.code === "user_already_exists" ? "Ya existe una cuenta con ese email" : "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  if (!data.session) redirect("/login?aviso=confirma-email");
  redirect(HOME_BY_ROLE[meta.role]);
}
