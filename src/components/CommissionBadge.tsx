import { COMMISSION_LABEL, COMMISSION_TONE, type CommissionStatus } from "@/lib/commission-status";

export function CommissionBadge({ status }: { status: CommissionStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${COMMISSION_TONE[status]}`}>{COMMISSION_LABEL[status]}</span>;
}
