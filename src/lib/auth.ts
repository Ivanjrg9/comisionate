import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "empresa" | "comercial";

export const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  empresa: "/empresa",
  comercial: "/comercial",
};

export async function getProfile() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("profiles").select("id, role, full_name, email, status").eq("id", auth.user.id).single();
  return data;
}

/** Exige sesión y el rol indicado; si no, redirige al login o a su propio panel. */
export async function requireRole(role: Role) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "activo") redirect("/login?error=cuenta");
  if (profile.role !== role) redirect(HOME_BY_ROLE[profile.role as Role]);
  return profile;
}
