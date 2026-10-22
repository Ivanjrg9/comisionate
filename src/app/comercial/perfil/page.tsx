import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSectors } from "@/lib/data";
import { SalespersonForm } from "./SalespersonForm";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function SalespersonProfilePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user!.id;
  const [sectors, { data: profile }, { data: sp }, { data: mine }, { data: iban }] = await Promise.all([
    getSectors(),
    supabase.from("profiles").select("full_name, phone").eq("id", uid).single(),
    supabase.from("salespeople").select("nif, fiscal, new_autonomo, zone, experience").eq("id", uid).single(),
    supabase.from("salesperson_sectors").select("sector_id").eq("salesperson_id", uid),
    supabase.rpc("get_salesperson_iban", { p_salesperson: uid }),
  ]);
  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Mi perfil</h1>
      <SalespersonForm
        sectors={sectors}
        values={{
          full_name: profile?.full_name ?? "", phone: profile?.phone ?? "", nif: sp?.nif ?? "",
          fiscal: sp?.fiscal ?? "particular", new_autonomo: sp?.new_autonomo ?? false,
          zone: sp?.zone ?? "", experience: sp?.experience ?? "", iban: iban ?? "",
          sectorIds: mine?.map((m) => m.sector_id) ?? [],
        }}
      />
    </div>
  );
}
