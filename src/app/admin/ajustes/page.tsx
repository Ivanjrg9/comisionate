import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FeeForm } from "./FeeForm";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  const get = (k: string) => Number(data?.find((s) => s.key === k)?.value ?? 0);
  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <FeeForm fee={get("fee_percent")} />
      <section aria-labelledby="plazos">
        <h2 id="plazos" className="mb-2 text-lg font-semibold">Plazos vigentes</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Periodo de cancelación: {get("cancel_days")} días</li>
          <li>Plazo de pago de la empresa: {get("pay_days")} días</li>
          <li>Cliente reservado: {get("reserve_days")} días</li>
          <li>Plazo de respuesta a un lead: {get("respond_days")} días</li>
        </ul>
        <p className="mt-2 text-sm text-muted">Los plazos son parte de las condiciones legales: cambiarlos requiere actualizar también los Términos.</p>
      </section>
    </div>
  );
}
