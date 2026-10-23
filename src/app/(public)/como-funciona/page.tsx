import type { Metadata } from "next";
import Link from "next/link";
import { RULES } from "@/lib/content/site";
import { buttonClass, secondaryButtonClass } from "@/components/form";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description: "El proceso completo de ComisionaTe: de unirte a una oferta a cobrar tu comisión, con todos los plazos y el flujo del dinero.",
  alternates: { canonical: "/como-funciona" },
};

const LIFECYCLE = [
  { title: "Registro del cliente", text: "El comercial registra al cliente con su código y el consentimiento del cliente. La empresa recibe el aviso y tiene 15 días para atenderlo.", term: "La empresa responde en 15 días" },
  { title: "Visita técnica: lead cualificado", text: "La empresa marca el lead como cualificado cuando se ha hecho la visita técnica. Si la oferta paga comisión por lead, se genera en ese momento.", term: "Comisión por lead: pago en 15 días" },
  { title: "Firma del contrato: venta", text: "La empresa indica que el cliente ha firmado y el importe de la venta. Se calcula la comisión por venta y empieza el periodo de cancelación.", term: "14 días de desistimiento" },
  { title: "Comisión firme", text: "Pasados los 14 días sin cancelación, la comisión es firme de forma automática y la empresa debe pagarla.", term: "Pago en 15 días (unos 29 desde la firma)" },
  { title: "Pagada", text: "La empresa marca el pago por transferencia y el comercial confirma que lo ha recibido. Si no le ha llegado, lo marca como «No recibido».", term: "Fin del proceso" },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="max-w-3xl text-3xl font-semibold sm:text-4xl">Cómo funciona ComisionaTe, paso a paso</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Una empresa publica una oferta con una comisión pactada. Un comercial se une, consigue clientes y, cuando la empresa valida un lead o una venta, cobra su comisión.
      </p>

      <section aria-labelledby="ciclo" className="mt-12">
        <h2 id="ciclo" className="text-2xl font-semibold">Del primer contacto al cobro</h2>
        <ol className="mt-6 max-w-3xl space-y-0 border-l-2 border-primary/40 pl-6">
          {LIFECYCLE.map((s, i) => (
            <li key={s.title} className="relative pb-8 last:pb-0">
              <span aria-hidden className="absolute -left-[2.15rem] flex size-7 items-center justify-center rounded-full border border-border-strong bg-surface text-sm font-semibold text-foreground">{i + 1}</span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 leading-relaxed text-muted">{s.text}</p>
              <p className="mt-1 inline-block rounded-full bg-primary/15 px-3 py-0.5 text-sm font-semibold text-on-tint">{s.term}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-sm text-muted">
          Una empresa también puede rechazar un lead antes de la venta, siempre indicando el motivo. Si ya es firme y el cliente cancela más tarde, el comercial no devuelve nada, salvo que la venta se hubiera conseguido con engaño.
        </p>
      </section>

      <section aria-labelledby="dinero" className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 id="dinero" className="text-2xl font-semibold">Cómo se mueve el dinero</h2>
          <ol className="mt-4 space-y-4">
            <li><strong>La empresa paga al comercial, directamente.</strong> Por transferencia, fuera de la plataforma. Marca «Pagado» y el comercial confirma «Recibido».</li>
            <li><strong>La empresa paga a ComisionaTe a fin de mes.</strong> Generamos una factura mensual con el {RULES.feePercent} % de las comisiones validadas ese mes, por transferencia en 15 días.</li>
          </ol>
          <p className="mt-4 text-muted">El comercial cobra la comisión íntegra. Ejemplo: con una comisión de 500 €, la empresa paga 500 € al comercial y 50 € a ComisionaTe. Las empresas fundadoras no pagan ese {RULES.feePercent} % durante los {RULES.founderMonths} primeros meses.</p>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold">Impuestos</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li><strong className="text-foreground">Autónomo:</strong> sube su factura en PDF y ve un desglose orientativo: comisión + IVA 21 % − IRPF (15 %, o 7 % para nuevos autónomos).</li>
            <li><strong className="text-foreground">Particular:</strong> la plataforma genera un justificante de pago en PDF. Si vendes de forma habitual, consulta con un gestor si debes darte de alta como autónomo.</li>
            <li>ComisionaTe no asesora fiscalmente: cada parte es responsable de sus obligaciones.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="protecciones" className="mt-14">
        <h2 id="protecciones" className="text-2xl font-semibold">Protecciones para las dos partes</h2>
        <dl className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {[
            ["Cliente reservado", `El primer comercial que registra a un cliente para una empresa se lo queda ${RULES.reserveDays} días. Un segundo intento se bloquea y se le avisa sin revelar datos.`],
            ["Condiciones congeladas", "Al unirte a una oferta guardamos una copia de las condiciones que aceptaste. Si la empresa las cambia, solo afecta a los nuevos comerciales."],
            ["Disputas", "Si una empresa rechaza o cancela y no estás de acuerdo, abres una disputa. El equipo de ComisionaTe decide y el lead vuelve al estado que corresponda si te da la razón."],
            ["Informe de cada venta", "Puedes descargar un PDF con los datos, los estados, las fechas y las condiciones aceptadas. Es tu prueba si necesitas reclamar."],
            ["Valoraciones e insignias", "Tras una comisión pagada, ambas partes se valoran. Hay insignias de empresa verificada, fundadora y buen pagador."],
            ["Normas de conducta", "Las dos partes se comprometen a unas normas. Los reportes llegan al equipo y las sanciones van de aviso a suspensión y expulsión."],
          ].map(([t, d]) => (
            <div key={t}><dt className="font-semibold">{t}</dt><dd className="mt-1 leading-relaxed text-muted">{d}</dd></div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="impagos" className="mt-14 max-w-3xl">
        <h2 id="impagos" className="text-2xl font-semibold">Si una empresa no paga</h2>
        <table className="legal mt-4">
          <caption className="sr-only">Escalado de un impago de comisión</caption>
          <thead><tr><th scope="col">Desde que se marca «No recibido»</th><th scope="col">Qué ocurre</th></tr></thead>
          <tbody>
            <tr><td>3 días</td><td>Aviso automático a la empresa.</td></tr>
            <tr><td>10 días</td><td>Segundo aviso y sus ofertas se ocultan del marketplace.</td></tr>
            <tr><td>15 días</td><td>Lo revisa el equipo; si no se resuelve, se suspende la cuenta y aparece la etiqueta «Empresa con pagos pendientes».</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">Con las facturas de ComisionaTe pasa lo mismo: aviso a los 15 días, ofertas ocultas y sin poder validar ventas a los 25, y cuenta suspendida a los 30 hasta que pague.</p>
      </section>

      <section className="mt-14 flex flex-col gap-3 sm:flex-row">
        <Link href="/registro?rol=comercial" className={buttonClass}>Soy comercial</Link>
        <Link href="/registro?rol=empresa" className={secondaryButtonClass}>Soy empresa</Link>
      </section>
    </main>
  );
}
