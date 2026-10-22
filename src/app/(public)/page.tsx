import type { Metadata } from "next";
import Link from "next/link";
import { Ticket } from "@/components/public/Ticket";
import { Calculator } from "@/components/public/Calculator";
import { FaqList } from "@/components/public/FaqList";
import { FAQ } from "@/lib/content/faq";
import { RULES, SITE } from "@/lib/content/site";
import { buttonClass, secondaryButtonClass } from "@/components/form";

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

const Check = () => <span aria-hidden className="mr-2 font-bold">✓</span>;

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
        <div>
          <h1 className="max-w-[18ch] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Recomienda instalaciones solares y cobra tu comisión
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            ComisionaTe conecta empresas de placas solares con comerciales independientes. Tú consigues el cliente, la empresa lo instala y tú cobras la comisión pactada, íntegra.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/registro?rol=comercial" className={buttonClass}>Soy comercial: empieza gratis</Link>
            <Link href="/registro?rol=empresa" className={secondaryButtonClass}>Soy empresa: publica una oferta</Link>
          </div>
          <p className="mt-4 text-sm text-muted">Gratis para comerciales. Las empresas solo pagan cuando hay resultados.</p>
        </div>
        <Ticket />
      </section>

      <section aria-labelledby="pasos" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="pasos" className="text-3xl font-extrabold">Así funciona</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-neutral-900">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8"><Link href="/como-funciona" className="font-semibold text-primary underline">Ver el proceso completo, con todos los plazos</Link></p>
        </div>
      </section>

      <section aria-label="Para quién es" className="mx-auto grid max-w-6xl gap-6 px-4 py-14 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-extrabold">Si eres comercial: un ingreso extra sin jefe ni horarios</h2>
          <ul className="mt-5 space-y-2">
            {["Registrarte es gratis, siempre.", "Cobras la comisión íntegra: ComisionaTe no te descuenta nada.", "Trabaja con varias empresas a la vez, sin exclusividad.", "Ves en qué punto está cada cliente, desde el móvil.", "Si una empresa no paga, te damos un informe en PDF para reclamar."].map((t) => <li key={t}><Check />{t}</li>)}
          </ul>
          <Link href="/registro?rol=comercial" className={`${buttonClass} mt-8`}>Crear mi cuenta de comercial</Link>
        </div>
        <div className="rounded-2xl bg-forest p-8 text-white">
          <h2 className="text-2xl font-extrabold">Si eres empresa: más ventas, y solo pagas por resultados</h2>
          <ul className="mt-5 space-y-2">
            {["Publicar ofertas es gratis, sin suscripción ni permanencia.", `Por cada lead o venta validada pagas la comisión del comercial más un ${RULES.feePercent} % para ComisionaTe.`, `Las primeras empresas fundadoras tienen ${RULES.founderMonths} meses sin ese ${RULES.feePercent} %.`, "Los comerciales aceptan tus condiciones antes de empezar.", "Panel con leads, ventas, conversión y ranking de comerciales."].map((t) => <li key={t}><Check />{t}</li>)}
          </ul>
          <Link href="/registro?rol=empresa" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-2.5 font-semibold text-neutral-900 transition hover:opacity-90">Registrar mi empresa</Link>
        </div>
      </section>

      <section aria-labelledby="calculadora" className="mx-auto max-w-6xl px-4 pb-14">
        <h2 id="calculadora" className="text-3xl font-extrabold">¿Cuánto puedes ganar?</h2>
        <p className="mb-8 mt-2 max-w-2xl text-muted">Mueve los controles y mira el ejemplo. La comisión de cada oferta se ve antes de unirte.</p>
        <Calculator />
      </section>

      <section aria-labelledby="faq" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h2 id="faq" className="mb-6 text-3xl font-extrabold">Preguntas frecuentes</h2>
          <FaqList items={FAQ.slice(0, 6)} />
          <p className="mt-6"><Link href="/preguntas-frecuentes" className="font-semibold text-primary underline">Ver todas las preguntas</Link></p>
        </div>
      </section>

      <section aria-labelledby="empezar" className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 id="empezar" className="text-3xl font-extrabold">Empieza hoy, es gratis</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted">Crea tu cuenta en un minuto. Sin permanencia ni cuotas.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/registro?rol=comercial" className={buttonClass}>Soy comercial</Link>
          <Link href="/registro?rol=empresa" className={secondaryButtonClass}>Soy empresa</Link>
        </div>
      </section>
    </main>
  );
}
