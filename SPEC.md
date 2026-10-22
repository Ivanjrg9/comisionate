# ComisionaTe — Especificación completa del MVP

> Instrucción para Claude Code: este documento es la especificación completa del proyecto.
> Léelo entero antes de empezar. Sigue la sección "Cómo quiero que trabajes" al final.

---

## 1. Contexto del negocio

**Nombre:** ComisionaTe (se escribe siempre así, con la "T" mayúscula).
**Dominios:** comisionate.com (principal) y comisionate.es (redirige al .com).
**Eslogan:** "Tu red de comerciales a comisión".

ComisionaTe es una plataforma web que conecta **EMPRESAS** que quieren vender más con
**COMERCIALES** independientes (profesionales o particulares que buscan un ingreso extra).
La empresa publica una oferta con una comisión pactada. El comercial se une a la oferta,
obtiene un **código de referido único** y registra los clientes que consigue. Cuando la empresa
valida un lead o una venta, el comercial gana su comisión.

**Mercado:** España. Toda la interfaz en español.
**Nicho inicial:** instalación de placas solares / autoconsumo fotovoltaico.
La landing, los textos y los datos de ejemplo se enfocan en este sector, pero **el modelo de
datos debe ser multisector** (tabla `sectors`) para añadir sectores después sin rehacer nada.

---

## 2. Modelo de negocio (reglas de dinero)

### Para el comercial
- Registrarse y usar la plataforma es **gratis siempre**.
- Cobra **íntegra** la comisión anunciada en la oferta. ComisionaTe nunca le descuenta nada.

### Para la empresa
- Registrarse y publicar ofertas es **gratis**. Sin suscripción, sin permanencia.
- Por cada lead o venta validada paga: **la comisión del comercial + un 10 % para ComisionaTe**.
  - Ejemplo: comisión de 500 € → la empresa paga 500 € al comercial y 50 € a ComisionaTe.
- **Empresas fundadoras:** las primeras empresas tienen **3 meses sin el 10 %**
  (campo `founder_until` con fecha; mientras esté vigente, la tarifa es 0 %).
- El porcentaje es **configurable por el admin**: valor global por defecto (10 %) y
  posibilidad de sobrescribirlo por empresa.

### Tipos de comisión por oferta
Cada oferta puede tener una o ambas:
- **Comisión por lead cualificado** (se gana cuando la visita técnica se ha realizado).
- **Comisión por venta** (se gana cuando el cliente firma el contrato).
Cada una puede ser **importe fijo (€)** o **porcentaje** del importe de la venta.

### Flujo del dinero (MVP: SIN pasarela de pago)
1. **Empresa → Comercial:** la empresa paga la comisión **directamente** al comercial
   (transferencia, fuera de la plataforma). La empresa marca "Pagado" y el comercial
   confirma "Recibido" (o marca "No recibido").
2. **Empresa → ComisionaTe:** a final de cada mes, la plataforma genera una **factura
   mensual** por empresa con la suma del 10 % de sus comisiones validadas ese mes.
   En el MVP se paga por transferencia y el admin la marca como pagada.
3. Deja el modelo de datos preparado para integrar **Stripe** más adelante (cobro automático
   del 10 % con tarjeta/SEPA) y **Stripe Connect** (pagos a comerciales), pero **no lo
   implementes ahora**.

---

## 3. Ciclo de vida de un lead / venta

Fases reales de una venta solar:
`Contacto → Visita técnica → Presupuesto → Firma del contrato → Instalación`

### Estados en la plataforma
```
registrado ──► lead_cualificado ──► venta ──► periodo_cancelacion ──► confirmada ──► pagada
     │                │                              │
     └──► rechazado ◄─┘                              └──► cancelada (comisión anulada)
```

1. **registrado:** el comercial registra al cliente (nombre, teléfono, email opcional,
   municipio/código postal, tipo de inmueble, notas) usando su código. Obligatorio marcar la
   casilla "El cliente ha dado su consentimiento para que sus datos se compartan con la empresa".
2. **lead_cualificado:** la empresa lo marca cuando se ha hecho la visita técnica.
   → Se genera la comisión por lead (si la oferta la tiene). Debe pagarse en **15 días**.
3. **venta:** la empresa lo marca cuando el cliente firma el contrato, indicando el importe de
   la venta. → Se calcula la comisión por venta y empieza el periodo de cancelación.
4. **periodo_cancelacion:** **14 días** desde la firma (derecho de desistimiento). Si el
   cliente cancela en este plazo, la empresa marca **cancelada** y la comisión se anula.
5. **confirmada:** al terminar los 14 días sin cancelación, la comisión es **firme**
   (automático). La empresa debe pagarla en **15 días** (≈ 29 días desde la firma).
6. **pagada:** la empresa marca pagado y el comercial confirma recibido.
7. **rechazado:** la empresa puede rechazar en cualquier fase previa a la venta, con
   **motivo obligatorio** (lista: cliente no interesado, datos falsos, duplicado, fuera de
   zona, otro + texto).

Una vez **confirmada**, si el cliente cancela más tarde, el comercial **no devuelve nada**,
salvo que la venta se consiguiera con engaño (lo decide el admin).

### Protecciones
- **Plazo de respuesta de la empresa:** si un lead en estado `registrado` no se actualiza en
  **15 días**, aviso a la empresa; si sigue sin respuesta, se marca para revisión del admin.
- **Cliente reservado:** si otro comercial registra el mismo cliente (mismo teléfono
  normalizado) para la misma empresa en los **90 días** siguientes, se bloquea el registro y
  el cliente queda asignado al primero. Avisar al segundo comercial sin revelarle datos.
- **Disputas:** si la empresa rechaza o cancela, el comercial puede abrir una disputa con
  explicación; el admin la resuelve (a favor del comercial → vuelve al estado correspondiente;
  a favor de la empresa → se cierra).
- **Historial:** cada cambio de estado se guarda (quién, cuándo, estado anterior y nuevo,
  motivo).

---

## 4. Fiscalidad del comercial

- En su perfil, el comercial indica si es **autónomo** o **particular** (y NIF/DNI).
- La empresa ve este dato y puede marcar sus ofertas como **"Solo autónomos"**.
- **Autónomo:** al confirmarse una comisión, puede **subir su factura (PDF)** asociada a esa
  comisión; la empresa la descarga. Mostrar desglose orientativo: comisión + IVA 21 % −
  retención IRPF (15 % por defecto, 7 % si el comercial marca "nuevo autónomo").
- **Particular:** la plataforma **genera automáticamente un justificante de pago en PDF**
  (datos de empresa y comercial, DNI, concepto, importe, fecha) descargable por ambos.
  Mostrar aviso informativo: "Si vas a vender de forma habitual, consulta con un gestor si
  debes darte de alta como autónomo". Al superar **5 comisiones en un año natural**, mostrar
  ese aviso de forma destacada.
- ComisionaTe **no asesora fiscalmente**: los Términos indican que cada parte es responsable
  de sus obligaciones fiscales.

---

## 5. Relación entre las partes (reflejar en Términos y en la UI)

- ComisionaTe es un **intermediario**: no es parte de la venta al cliente final ni responde
  de la instalación. El contrato de instalación es entre cliente y empresa.
- El comercial es **independiente**: no es empleado de la empresa ni de ComisionaTe. Sin
  horarios, sin mínimos, sin exclusividad (puede trabajar con varias empresas).
- El comercial **no puede firmar contratos** en nombre de la empresa ni cobrar dinero al cliente.
- Al unirse a una oferta, el comercial ve las condiciones (comisión, zona, plazos, normas) y
  las **acepta con un clic**. Guardar la aceptación con fecha/hora y una **copia inmutable de
  las condiciones** (snapshot). Si la empresa cambia la oferta, los cambios solo aplican a
  comerciales nuevos; los existentes mantienen sus condiciones.

---

## 6. Normas de conducta y sanciones

**El comercial no puede:** hacerse pasar por compañía eléctrica/administración, prometer
ahorros/subvenciones/precios no confirmados por la empresa, presionar a personas vulnerables,
registrar clientes sin consentimiento o con datos falsos, hacer llamadas en frío no
autorizadas, cobrar dinero al cliente.

**La empresa no puede:** rechazar ventas válidas para no pagar, cerrar fuera de la plataforma
con clientes traídos por un comercial, retrasar pagos, cambiar condiciones a comerciales que
ya las aceptaron.

**Sanciones (ambas partes):** aviso → suspensión temporal → expulsión. Las ventas conseguidas
con engaño no generan comisión.

**En la plataforma:** botón "Reportar" en perfiles y ventas; los reportes llegan al admin con
estado (abierto, en revisión, resuelto) y sanción aplicada.

---

## 7. Impagos

**Empresa no paga al comercial** (desde el vencimiento del plazo):
- El comercial marca "No recibido".
- +3 días: aviso automático a la empresa.
- +10 días: segundo aviso y **sus ofertas se ocultan** del marketplace.
- +15 días: revisión del admin; si no se resuelve → **cuenta suspendida** y etiqueta visible
  "Empresa con pagos pendientes".

**Empresa no paga la factura del 10 %** (plazo de pago 15 días desde la emisión):
- +15 días: aviso de factura vencida.
- +25 días: ofertas ocultas y no puede validar ventas nuevas.
- +30 días: cuenta suspendida hasta que pague.

Al pagar, la cuenta se reactiva. Con 3 o más impagos, el admin puede expulsar.
El comercial puede **descargar un informe PDF** de cualquier venta (datos, estados, fechas,
condiciones aceptadas) como prueba para reclamar.

---

## 8. Bajas

- **Comercial:** puede darse de baja cuando quiera. Sus códigos se desactivan, pero conserva
  el derecho a cobrar todo lo que tenga en curso. La cuenta se cierra del todo cuando no
  quedan comisiones pendientes.
- **Empresa:** solo puede darse de baja con **todo pagado** (comisiones y facturas). Sus
  ofertas se desactivan y se avisa a sus comerciales. Los clientes ya registrados siguen
  generando comisión si se convierten en venta en los **90 días** siguientes.
- **Expulsión:** se respetan los pagos pendientes legítimos en ambas direcciones.
- **RGPD:** tras la baja, anonimizar datos personales; conservar registros de ventas, pagos y
  facturas (obligación legal, 6 años) sin usarlos para otros fines.

---

## 9. Roles y funcionalidades

### Empresa
- Registro y perfil: razón social, CIF, sector, logo, descripción, web, zona de actuación,
  datos de facturación. Requiere aprobación del admin para publicar (insignia "Empresa verificada").
- Crear/editar/pausar ofertas: título, descripción, sector, precio orientativo del producto,
  comisión por lead y/o por venta (fija o %), zonas (provincias/códigos postales), requisitos,
  "Solo autónomos", acceso abierto o con aprobación, material de venta (PDF/imágenes en Storage).
- Gestionar solicitudes de comerciales.
- Panel de leads/ventas con filtros por estado y acciones rápidas (cualificar, marcar venta,
  rechazar con motivo, cancelar, marcar pagado).
- Descargar facturas de autónomos y justificantes de particulares.
- Ver sus facturas mensuales de ComisionaTe.
- Dashboard: leads y ventas por estado, comisiones pendientes/pagadas, ranking de comerciales,
  tasa de conversión.

### Comercial
- Registro y perfil: nombre, DNI/NIF, autónomo/particular, zona, experiencia, sectores, foto,
  IBAN (solo visible para empresas con las que tenga comisiones pendientes).
- Marketplace de ofertas con filtros (sector, zona, tipo y cuantía de comisión).
- Unirse a ofertas (aceptando condiciones) y obtener código único legible
  (ej. `SOLAR-IVAN-7K2`), con botón copiar y compartir por WhatsApp.
- Registrar clientes desde el móvil en menos de 1 minuto.
- Seguimiento de cada lead/venta con su estado.
- Dashboard: ganancias pendientes, confirmadas y cobradas; historial; avisos.
- Confirmar o reclamar pagos, abrir disputas, subir facturas, descargar justificantes/informes.

### Admin
- Aprobar/verificar empresas; suspender/expulsar usuarios.
- Configurar % global y por empresa; marcar empresas fundadoras.
- Ver todas las ofertas, leads, ventas, disputas, reportes y facturas.
- Resolver disputas y reportes; marcar facturas como pagadas.
- Métricas globales: empresas activas, comerciales activos, ventas, comisiones, ingresos.

### Confianza
- Valoraciones mutuas (1–5 estrellas + comentario) tras una comisión pagada.
- Insignias: empresa verificada, empresa fundadora, buen pagador (0 retrasos).

### Notificaciones
- Por email (Supabase + Resend o similar) y dentro de la app (campana).
- Eventos: nuevo lead, cambio de estado, plazos que vencen, pagos, disputas, avisos de impago.
- Los plazos automáticos (14 días, 15 días, avisos de impago, facturas mensuales) se
  implementan con tareas programadas (Supabase Cron / pg_cron o Edge Functions programadas).

---

## 10. Páginas públicas

- **Landing** enfocada en placas solares con dos caminos claros: "Soy empresa" / "Soy comercial".
  Secciones: cómo funciona (3 pasos), beneficios para cada parte, ejemplo de comisión,
  preguntas frecuentes, llamada a la acción.
- **Cómo funciona** (detallado, con los plazos y el flujo del dinero).
- **Preguntas frecuentes** (incluye: ¿tengo que ser autónomo?, ¿cuándo cobro?, ¿qué pasa si
  el cliente cancela?, ¿cuánto cuesta para la empresa?, ¿qué pasa si una empresa no paga?).
- **Legales (plantillas a revisar por un profesional):** aviso legal, política de privacidad
  (RGPD), política de cookies, términos de uso para empresas y para comerciales, que recojan
  las secciones 2–8 de este documento.

---

## 11. Stack y requisitos técnicos

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** (+ shadcn/ui si lo ves útil)
- **Supabase:** Auth (email + Google), Postgres, Row Level Security, Storage, Cron
- **Generación de PDF** en servidor (facturas mensuales, justificantes, informes)
- Despliegue en **Vercel**

Requisitos:
- Esquema completo con **migraciones SQL** de Supabase, incluyendo enums de estados.
- **RLS estricto:** cada empresa solo ve sus ofertas, leads y ventas; cada comercial solo los
  suyos; los datos del cliente final solo los ven la empresa de esa venta y el comercial que
  lo registró; el admin lo ve todo.
- Cálculo de comisiones y tarifas **en base de datos o servidor**, nunca confiando en el cliente.
- Importes en céntimos (enteros) para evitar errores de redondeo.
- Teléfonos normalizados (formato E.164) para detectar duplicados.
- Validación de formularios en cliente y servidor (zod).
- **Mobile-first:** los comerciales lo usarán sobre todo desde el móvil.
- Accesible y rápido; textos claros, sin jerga.
- **Seed** con: 3 empresas solares (1 fundadora), 10 comerciales (autónomos y particulares),
  leads y ventas en todos los estados, 1 disputa, 1 impago, facturas de ejemplo, 1 admin.
- **Tests** de la lógica crítica: cálculo de comisiones, transiciones de estado, plazos,
  cliente reservado, RLS.
- **README** con instalación, variables de entorno, cómo ejecutar el seed y cómo desplegar.

### Identidad visual
- Logo de texto "Comisiona**Te**" con la "Te" resaltada en el color de acento.
- Paleta energética y de confianza: verde (#16A34A) como primario, amarillo solar (#FACC15)
  como acento, neutros grises; modo claro y oscuro.
- Tipografía moderna (Inter o similar).

---

## 12. Fuera del MVP (no implementar ahora)
- Pagos automáticos con Stripe / Stripe Connect.
- Generación automática de facturas del comercial.
- App móvil nativa.
- Chat interno.
- Comisiones multinivel.
- Exclusividad de comerciales.
- Sectores adicionales (solo dejar preparado el modelo).

---

## 13. Cómo quiero que trabajes (modo autónomo)

**Construye el proyecto completo tú solo, de principio a fin.** Yo superviso, hago las pruebas
y te doy los accesos que necesites. No me pidas aprobación del plan ni de cada fase.

### Reglas
1. **Planifica y ejecuta sin esperar.** Guarda tu plan (esquema de base de datos, carpetas,
   rutas, fases) en `docs/PLAN.md` y empieza a construir directamente.
2. **Toma tú las decisiones técnicas.** Si algo de esta especificación es ambiguo, elige la
   opción más razonable, apúntala en `docs/DECISIONES.md` con el motivo y sigue.
   Solo me preguntas si la decisión cambia el negocio (dinero, plazos, condiciones legales).
3. **Prueba tú mismo cada fase antes de darla por buena:** compila, pasa los tests, ejecuta la
   app en local y comprueba los flujos principales (por ejemplo con Playwright). Si algo
   falla, arréglalo antes de continuar.
4. **Haz un commit de Git al terminar cada fase**, con un mensaje claro.
5. **Mantén `docs/PROGRESO.md` actualizado**: fases terminadas, qué funciona, qué falta y
   problemas conocidos. Así puedo retomar en otra sesión con "lee SPEC.md y docs/PROGRESO.md
   y continúa".
6. **Solo te detienes para pedirme cosas que no puedes hacer tú:**
   - Crear cuentas o iniciar sesión en servicios (Supabase, GitHub, Resend, Vercel).
   - Claves y variables de entorno.
   - Permisos para ejecutar comandos, si los necesitas.
   - Configurar el dominio comisionate.com.
   Cuando me pidas algo, dime **exactamente** qué hacer, paso a paso y en lenguaje sencillo
   (soy estudiante de DAW), y en cuanto lo tengas, continúa sin esperar más instrucciones.
   Si puedes avanzar en otra parte mientras espero, hazlo.
7. **Usa las herramientas de línea de comandos** cuando estén disponibles (`supabase`, `gh`,
   `vercel`) para crear y configurar lo que puedas tú mismo, una vez yo haya iniciado sesión.
8. **Nunca subas claves ni contraseñas al repositorio.** Usa `.env.local` (en `.gitignore`)
   y un `.env.example` sin valores reales.
9. **Para cuando necesite probar**, al final de cada fase dame un resumen corto:
   qué has hecho, cómo lo pruebo (URL, usuario de prueba del seed, pasos) y qué debería ver.
   Después sigue con la siguiente fase sin esperar mi respuesta, salvo que te diga que pares.

### Fases (en este orden)
- **Fase 1:** setup, auth con roles, esquema, RLS y seed.
- **Fase 2:** perfiles, ofertas (empresa) y marketplace (comercial), unirse a ofertas
  con aceptación de condiciones y códigos de referido.
- **Fase 3:** registro de clientes, ciclo de estados, cliente reservado, historial.
- **Fase 4:** cálculo de comisiones, periodo de cancelación, pagos y confirmaciones,
  facturas/justificantes, dashboards.
- **Fase 5:** facturación mensual de ComisionaTe, impagos, tareas programadas, notificaciones.
- **Fase 6:** admin, disputas, reportes, valoraciones, insignias, bajas.
- **Fase 7:** landing, páginas públicas y legales, pulido visual y responsive.
- **Fase 8:** despliegue en Vercel con el dominio comisionate.com y repaso final completo.

### Al terminar
Entrégame un resumen final con: URL de la web, usuarios de prueba para cada rol,
lista de lo que funciona, lo que queda pendiente para después del MVP y los pasos para
mantenerla (actualizar, hacer copias de seguridad, ver errores).
