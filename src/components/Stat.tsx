export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "primary" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone === "primary" ? "text-primary" : tone === "danger" ? "text-danger" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_2rem]">
          <span>{i.label}</span>
          <span className="h-3 rounded-full bg-surface" aria-hidden>
            <span className="block h-3 rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}
