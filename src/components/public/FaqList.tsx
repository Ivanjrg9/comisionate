import type { Faq } from "@/lib/content/faq";

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
      {items.map((f) => (
        <details key={f.q} className="group px-4">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="text-2xl font-normal leading-none text-muted transition group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-3xl pb-4 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
