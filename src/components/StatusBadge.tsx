import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, type LeadStatus } from "@/lib/lead-status";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
      <span aria-hidden className={`size-2 rounded-full ${LEAD_STATUS_TONE[status]}`} />
      {LEAD_STATUS_LABEL[status]}
    </span>
  );
}
