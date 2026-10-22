import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, type LeadStatus } from "@/lib/lead-status";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${LEAD_STATUS_TONE[status]}`}>
      {LEAD_STATUS_LABEL[status]}
    </span>
  );
}
