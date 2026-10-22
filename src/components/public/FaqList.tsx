import type { Faq } from "@/lib/content/faq";

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="text-2xl leading-none text-primary transition group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-3xl pb-4 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
