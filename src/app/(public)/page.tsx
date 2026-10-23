import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Calculator } from "@/components/public/Calculator";
import { FaqList } from "@/components/public/FaqList";
import { PolygonArt } from "@/components/public/PolygonArt";
import { ProductPreview } from "@/components/public/ProductPreview";
import { Ticket } from "@/components/public/Ticket";
import { buttonClass, secondaryButtonClass } from "@/components/form";
import { FAQ } from "@/lib/content/faq";
import { RULES, SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: "Plataforma que conecta empresas de placas solares con comerciales independientes. Gratis para comerciales: cobras la comisión íntegra por cada cliente que consigues.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { title: "Únete a una oferta", text: "Elige una oferta del marketplace, acepta las condiciones con un clic y recibe tu código de referido, por ejemplo SOLAR-IVAN-7K2." },
  { title: "Registra a tus clientes", text: "Desde el móvil, en menos de un minuto: nombre, teléfono y el consentimiento del cliente. La empresa recibe el aviso al momento." },
  { title: "Cobra tu comisión", text: "Cuando la empresa valida el lead o la venta, la comisión es tuya. Te paga directamente y tú confirmas que la has recibido." },
];

const Check = () => <span aria-hidden className="mr-2 text-muted">✓</span>;

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <h1 className="display max-w-[15ch]">Recomienda instalaciones solares y cobra tu comisión</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              ComisionaTe conecta empresas de placas solares con comerciales independientes. Tú consigues el cliente, la empresa lo instala y tú cobras la comisión pactada, íntegra.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro?rol=comercial" className={buttonClass}>Soy comercial: empieza gratis</Link>
              <Link href="/registro?rol=empresa" className={secondaryButtonClass}>Soy empresa: publica una oferta</Link>
            </div>
            <p className="mt-4 text-sm text-muted">Gratis para comerciales. Las empresas solo pagan cuando hay resultados.</p>
          </div>
          <div className="relative pb-16 pt-6">
            <PolygonArt className="pointer-events-none absolute left-1/2 top-1/2 w-[135%] max-w-none -translate-x-1/2 -translate-y-1/2" />
            <div className="relative"><Ticket /></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="producto" className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <h2 id="producto" className="section-title max-w-2xl">Todo el proceso, desde el móvil</h2>
        <p className="mb-8 mt-3 max-w-2xl text-muted">Esto es lo que verás al entrar: registrar, seguir y cobrar, sin papeles ni llamadas para preguntar cómo va.</p>
        <ProductPreview />
      </section>

      <section aria-labelledby="pasos" className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <h2 id="pasos" className="section-title">Así funciona</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="overflow-hidden rounded-xl border border-border bg-background shadow-[rgba(0,0,0,0.3)_0px_8px_10px_0px]">
              <div aria-hidden className="relative grid h-28 grid-rows-3">
                <span className="bg-true-black" /><span className="bg-surface" /><span className="bg-border" />
                <span className="absolute bottom-3 left-4 text-5xl font-medium leading-none tabular-nums">{i + 1}</span>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6"><ArrowLink href="/como-funciona">Ver el proceso completo, con todos los plazos</ArrowLink></p>
      </section>

      <section aria-label="Para quién es" className="mx-auto grid max-w-6xl gap-3 px-4 pb-20 sm:pb-28 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-background p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Si eres comercial: un ingreso extra sin jefe ni horarios</h2>
          <ul className="mt-5 flex-1 space-y-2 text-muted">
            {["Registrarte es gratis, siempre.", "Cobras la comisión íntegra: ComisionaTe no te descuenta nada.", "Trabaja con varias empresas a la vez, sin exclusividad.", "Ves en qué punto está cada cliente, desde el móvil.", "Si una empresa no paga, te damos un informe en PDF para reclamar."].map((t) => <li key={t}><Check />{t}</li>)}
          </ul>
          <p className="mt-6"><ArrowLink href="/registro?rol=comercial">Crear mi cuenta de comercial</ArrowLink></p>
        </div>
        <div className="flex flex-col rounded-xl border border-border bg-background p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Si eres empresa: más ventas, y solo pagas por resultados</h2>
          <ul className="mt-5 flex-1 space-y-2 text-muted">
            {["Publicar ofertas es gratis, sin suscripción ni permanencia.", `Por cada lead o venta validada pagas la comisión del comercial más un ${RULES.feePercent} % para ComisionaTe.`, `Las primeras empresas fundadoras tienen ${RULES.founderMonths} meses sin ese ${RULES.feePercent} %.`, "Los comerciales aceptan tus condiciones antes de empezar.", "Panel con leads, ventas, conversión y ranking de comerciales."].map((t) => <li key={t}><Check />{t}</li>)}
          </ul>
          <p className="mt-6"><ArrowLink href="/registro?rol=empresa">Registrar mi empresa</ArrowLink></p>
        </div>
      </section>

      <section aria-labelledby="calculadora" className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <h2 id="calculadora" className="section-title">¿Cuánto puedes ganar?</h2>
        <p className="mb-8 mt-3 max-w-2xl text-muted">Mueve los controles y mira el ejemplo. La comisión de cada oferta se ve antes de unirte.</p>
        <Calculator />
      </section>

      <section aria-labelledby="faq" className="mx-auto max-w-4xl px-4 pb-20 sm:pb-28">
        <h2 id="faq" className="section-title mb-8">Preguntas frecuentes</h2>
        <FaqList items={FAQ.slice(0, 6)} />
        <p className="mt-6"><ArrowLink href="/preguntas-frecuentes">Ver todas las preguntas</ArrowLink></p>
      </section>

      <section aria-labelledby="empezar" className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <div className="frame relative">
          <PolygonArt className="pointer-events-none absolute -right-16 top-1/2 hidden w-[420px] -translate-y-1/2 opacity-50 md:block" />
          <div className="relative px-6 py-12 sm:px-10 sm:py-16">
            <h2 id="empezar" className="section-title">Empieza hoy, es gratis</h2>
            <p className="mt-3 max-w-lg text-muted">Crea tu cuenta en un minuto. Sin permanencia ni cuotas.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro?rol=comercial" className={buttonClass}>Soy comercial</Link>
              <Link href="/registro?rol=empresa" className={secondaryButtonClass}>Soy empresa</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
