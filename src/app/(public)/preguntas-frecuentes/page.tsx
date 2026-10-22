import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/public/FaqList";
import { FAQ } from "@/lib/content/faq";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resolvemos tus dudas sobre comisiones, plazos de cobro, cancelaciones, impuestos e impagos en ComisionaTe.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Preguntas frecuentes</h1>
      <p className="mb-8 mt-2 text-muted">Lo que más nos preguntan comerciales y empresas. Si no encuentras tu duda, mira <Link href="/como-funciona" className="font-semibold text-primary underline">cómo funciona</Link> con todos los plazos.</p>
      <FaqList items={FAQ} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
