import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { dateEs } from "@/lib/format";
import { AccountBadge, AccountButtons } from "../AccountButtons";

export const metadata: Metadata = { title: "Comerciales" };

export default async function AdminSalespeoplePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, status, created_at, leaving_at, salespeople(fiscal, zone)")
    .eq("role", "comercial")
    .order("created_at", { ascending: false });
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Comerciales</h1>
      <ul className="space-y-3">
        {(data ?? []).map((p) => {
          const sp = p.salespeople as unknown as { fiscal: string; zone: string } | null;
          return (
            <li key={p.id} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.full_name}</p>
                  <p className="text-sm text-muted">{p.email} · {sp?.fiscal === "autonomo" ? "autónomo" : "particular"}{sp?.zone && ` · ${sp.zone}`} · alta {dateEs(p.created_at)}{p.leaving_at && " · baja solicitada"}</p>
                </div>
                <AccountBadge status={p.status} />
              </div>
              <AccountButtons profileId={p.id} status={p.status} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
