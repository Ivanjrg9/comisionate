"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { HOME_BY_ROLE, type Role } from "@/lib/auth";
import { loginSchema, passwordSchema, registerSchema, type FormState } from "@/lib/validation/auth";
import { LEGAL, SITE } from "@/lib/content/site";

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
  // Anti-bots: el campo trampa debe ir vacío y un humano tarda más de ~1 s en rellenar el formulario.
  const started = Number(formData.get("started"));
  if (formData.get("website") || !started || Date.now() - started < 1200) {
    return { error: "No se pudo crear la cuenta. Recarga la página e inténtalo de nuevo." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const { email, password, terms, ...meta } = parsed.data;
  void terms; // solo se valida; no se guarda en los metadatos
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { ...meta, terms_version: LEGAL.version } } });
  if (error) {
    return { error: error.code === "user_already_exists" ? "Ya existe una cuenta con ese email" : "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  if (!data.session) redirect("/login?aviso=confirma-email");
  redirect(HOME_BY_ROLE[meta.role]);
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: z.email("Escribe un email válido") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const origin = (await headers()).get("origin") ?? SITE.url;
  const supabase = await createClient();
  // Respondemos siempre lo mismo para no revelar si el email tiene cuenta.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${origin}/auth/callback?next=/nueva-contrasena` });
  return { ok: true };
}

export async function setNewPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ password: passwordSchema, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "El enlace ha caducado. Pide uno nuevo desde «¿Has olvidado tu contraseña?»." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.code === "same_password" ? "Elige una contraseña distinta de la anterior." : "No se pudo cambiar la contraseña. Pide un enlace nuevo." };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
  redirect(HOME_BY_ROLE[(profile?.role ?? "comercial") as Role]);
}
