import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const anon = () => createClient(url, anonKey, { auth: { persistSession: false } });
export const service = () => createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

/** Usuarios del seed (contraseña común). */
export async function loginAs(email: string): Promise<SupabaseClient> {
  const client = anon();
  const { error } = await client.auth.signInWithPassword({ email, password: "Comisionate123!" });
  if (error) throw new Error(`Login ${email}: ${error.message}`);
  return client;
}

export const randomPhone = () => "6" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");

export async function membershipOf(client: SupabaseClient, offerTitle: string) {
  const { data, error } = await client
    .from("memberships")
    .select("id, offers!inner(title)")
    .eq("offers.title", offerTitle)
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function registerLead(client: SupabaseClient, membership: string, phone = randomPhone()) {
  const { data, error } = await client.rpc("register_lead", {
    p_membership: membership, p_name: "Cliente Test", p_phone: phone, p_email: "",
    p_postal: "28001", p_municipality: "Madrid", p_property: "Piso", p_notes: "", p_consent: true,
  });
  if (error) throw error;
  return data as { ok: boolean; lead_id?: string; reason?: string };
}
