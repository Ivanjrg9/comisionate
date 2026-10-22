import { LEAD_STATUS_LABEL, readableReason, type LeadStatus } from "@/lib/lead-status";

export type LeadEvent = { id: number; to_status: LeadStatus; reason: string | null; created_at: string };

export function Timeline({ events }: { events: LeadEvent[] }) {
  return (
    <ol className="space-y-3 border-l-2 border-border pl-4">
      {events
        .filter((e) => e.to_status !== "venta") // «venta» y «periodo de cancelación» ocurren a la vez
        .map((e) => (
          <li key={e.id} className="relative">
            <span aria-hidden className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-primary" />
            <p className="font-medium">{LEAD_STATUS_LABEL[e.to_status]}</p>
            <p className="text-sm text-muted">
              {new Date(e.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
              {e.reason && ` · ${readableReason(e.reason)}`}
            </p>
          </li>
        ))}
    </ol>
  );
}
