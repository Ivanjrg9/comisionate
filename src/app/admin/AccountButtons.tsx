"use client";

import { ActionForm } from "@/components/ActionForm";
import { setAccountStatus } from "./actions";

const LABEL = { activo: "Activa", suspendido: "Suspendida", expulsado: "Expulsada", baja: "De baja" } as const;

export function AccountBadge({ status }: { status: keyof typeof LABEL }) {
  const tone = status === "activo" ? "bg-primary/15 text-primary" : status === "baja" ? "bg-surface text-muted" : "bg-danger/15 text-danger";
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{LABEL[status]}</span>;
}

/** Suspender / expulsar / reactivar una cuenta (empresa o comercial). */
export function AccountButtons({ profileId, status }: { profileId: string; status: string }) {
  const one = (to: string, label: string, tone: "primary" | "secondary" | "danger") => (
    <ActionForm key={to} action={setAccountStatus} label={label} tone={tone}>
      <input type="hidden" name="profile_id" value={profileId} />
      <input type="hidden" name="status" value={to} />
    </ActionForm>
  );
  if (status === "baja") return <span className="text-sm text-muted">Cuenta cerrada</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "activo" && one("activo", "Reactivar", "primary")}
      {status === "activo" && one("suspendido", "Suspender", "secondary")}
      {status !== "expulsado" && one("expulsado", "Expulsar", "danger")}
    </div>
  );
}
