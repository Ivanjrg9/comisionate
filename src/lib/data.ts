import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getMyCompany = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data } = await supabase.from("companies").select("*").eq("owner_id", auth.user!.id).single();
  return data!;
});

export const getSectors = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("sectors").select("id, slug, name").eq("active", true).order("id");
  return data ?? [];
});
