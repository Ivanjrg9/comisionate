import { COMMISSION_LABEL, COMMISSION_TONE, type CommissionStatus } from "@/lib/commission-status";

export function CommissionBadge({ status }: { status: CommissionStatus }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
      <span aria-hidden className={`size-2 rounded-full ${COMMISSION_TONE[status]}`} />
      {COMMISSION_LABEL[status]}
    </span>
  );
}
