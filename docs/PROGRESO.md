# Progreso

Para retomar: "lee SPEC.md y docs/PROGRESO.md y continúa".
Entorno local: `supabase start` (Docker) → `supabase db reset` (migraciones + seed) → `npm run dev` → `npm test`.

## Endurecimiento previo al piloto — TERMINADO
- Seguridad: una empresa con deuda o en baja ya no puede reactivar ofertas ocultas; un comercial suspendido no puede registrar
  clientes aunque conserve la sesión; cabeceras de seguridad. **Bug real corregido:** al pagar una empresa suspendida por impago,
  la reactivación de ofertas fallaba (orden cuenta/ofertas).
- Cuentas: recuperar contraseña (email → enlace → nueva contraseña, sin revelar si existe la cuenta), política de contraseña,
  anti-bots en el registro, aceptación de términos con fecha y versión (también para Google), emails de Auth en español.
- Producto: marketplace público `/ofertas`, paginación y búsqueda en los listados, aviso al admin cuando hay una empresa por
  verificar, avisos de perfil incompleto, botón de Google (activable).
- Accesibilidad: auditoría axe-core en 31 pantallas (claro/oscuro): 0 violaciones WCAG 2.1 AA tras corregir el contraste.
- Tests: **81 unitarios/BD + 33 E2E** (Playwright en Chrome: flujo completo de negocio, acceso, recuperación de contraseña con
  lectura del email, anti-bots, web pública en móvil y escritorio).

## Fase 7 — TERMINADA
- Landing (`/`): hero con «ticket de comisión» (500 € al comercial + 50 € de tarifa = 550 € que paga la empresa), pasos,
  bloques para comerciales y empresas, calculadora de ganancias, FAQ y llamada a la acción. Modo claro y oscuro.
- `/como-funciona` (ciclo de vida con plazos, flujo del dinero, impuestos, protecciones, escalado de impagos) y
  `/preguntas-frecuentes` (10 preguntas, con datos estructurados FAQPage).
- Legales (plantillas): aviso legal, política de privacidad (RGPD), política de cookies (solo técnicas: sin banner),
  términos para empresas y términos para comerciales, con las secciones 2-8 de la spec.
- SEO y calidad: metadatos por página, sitemap, robots (bloquea paneles y API), icono, 404 y error en español,
  «saltar al contenido», sin desbordes a 375 px, estáticas.
- Tests: 71. Un test verifica que los plazos/tarifa publicados coinciden con `app_settings`.
- **Antes de publicar:** rellenar los datos del titular (`NEXT_PUBLIC_LEGAL_*`) y poner `LEGAL.draft = false` en
  `src/lib/content/site.ts` cuando un profesional haya revisado los textos.

## Fase 6 — TERMINADA
- Panel de admin (`/admin`): resumen con métricas globales y cola de pendientes; empresas (verificar, suspender, expulsar,
  reactivar, fundadora, tarifa propia, impagos); comerciales (suspender/expulsar/reactivar); ofertas; leads (con filtro
  «requieren revisión») y su detalle; disputas; reportes; facturas (marcar pagada → reactiva la cuenta); ajustes (tarifa global).
- Disputas: el comercial la abre en un lead rechazado/cancelado (una abierta por lead); el admin resuelve; a favor del
  comercial el lead vuelve a «registrado» o la venta recupera su comisión; a favor de la empresa se cierra. Avisos a ambas partes.
- Reportes: botón «Reportar» en ventas, ofertas (empresa) y comerciales de una oferta → admin: abierto → en revisión →
  resuelto con sanción (aviso / suspensión / expulsión). Suspender oculta ofertas; expulsar las cierra.
- Valoraciones 1-5 + comentario tras una comisión cobrada (una por parte; el destinatario lo fija el servidor).
  Insignias: empresa verificada, fundadora, buen pagador (0 retrasos y alguna comisión cobrada) + nota media en marketplace.
- Bajas: comercial (códigos desactivados; la cuenta se cierra al no quedar nada pendiente) y empresa (solo con todo pagado;
  ofertas cerradas, avisa a sus comerciales, cierre a los 90 días). Anonimización RGPD (perfil, IBAN, NIF, datos del cliente final,
  acceso bloqueado) conservando ventas, pagos y facturas. Tarea diaria `finalize-leaves`.
- Tests: 69 en total (admin, disputas, sanciones, valoraciones, insignias, bajas). Revisado con Playwright.
- Limitación conocida: una empresa expulsada ya no puede entrar a marcar pagos; esos casos los gestiona el admin.

## Fase 5 — TERMINADA
- Facturación mensual (`generate_monthly_invoices`, pg_cron día 1 a las 04:00): suma las tarifas de las comisiones firmes
  no facturadas por empresa; numeración `CT-AAAAMM-NNNN`; vence a los 15 días; idempotente; las fundadoras (0 %) no reciben.
  La empresa ve sus facturas y las descarga en PDF (`/empresa/facturas`, `/api/facturas/[id]`).
- Impago empresa → comercial (desde «No recibido»): +3 d aviso, +10 d segundo aviso + ofertas ocultas + 1 impago,
  +15 d revisión del admin. Al volver a pagar se reactivan las ofertas.
- Factura de ComisionaTe sin pagar (días desde la emisión): 15 vencida, 25 ofertas ocultas y bloqueo de validar ventas
  (trigger), 30 cuenta suspendida. `admin_mark_invoice_paid` reactiva todo (la pantalla del admin llega en la Fase 6).
- Leads sin respuesta: aviso a los 15 días y paso a revisión del admin 7 días después; recordatorio 3 días antes de
  vencer un pago; avisos al confirmarse una venta.
- Notificaciones: campana en todas las áreas (sin JS, accesible) + email con Resend (`/api/cron/emails`, Vercel Cron diario,
  protegido con `CRON_SECRET`; sin `RESEND_API_KEY` no envía nada).
- pg_cron: `confirm-due-sales` (cada hora), `process-overdue` (03:15 diario), `monthly-invoices` (día 1, 04:00).
- Tests: 54 (facturación, plazos, escalado de impagos, bloqueo, reactivación, email). Revisado con Playwright.
- Pendiente: etiqueta «Empresa con pagos pendientes» en el marketplace/perfil público (las ofertas ya se ocultan) y
  suspender manualmente por impago de comisión (Fase 6, admin).

## Fase 4 — TERMINADA
- Pagos: la empresa marca «pagada» (muestra IBAN mientras hay pago pendiente) y el comercial confirma «recibido» o
  «no recibido» (la empresa puede volver a marcarlo). Al cobrarse todo, el lead pasa a «Pagada».
- Autónomos: desglose orientativo (comisión + IVA 21 % − IRPF 15 %/7 %), subida de factura PDF (Storage `invoices`,
  una por comisión) y descarga por la empresa de esa comisión (RLS verificada: otra empresa no accede).
- Particulares: justificante de pago PDF generado en servidor (`/api/comisiones/[id]/justificante`) y aviso informativo
  del gestor; aviso destacado al superar 5 comisiones en el año natural.
- Informe PDF de cada venta (`/api/leads/[id]/informe`): datos, historial, comisiones y condiciones aceptadas.
- Dashboards: comercial (pendientes / confirmadas / cobradas, clientes por estado, pagos por confirmar) y empresa
  (leads por estado, conversión, comisiones por pagar/pagadas, ranking de comerciales, alertas de plazos).
- Librería nueva (exigida por la spec): `pdf-lib`. Tests: 38+ (fiscal, PDFs, pagos, facturas con RLS).
- Pendiente: la tarifa del 10 % solo se muestra; la factura mensual de ComisionaTe llega en la Fase 5.

## Fase 3 — TERMINADA
- Comercial: registrar cliente desde el móvil (consentimiento obligatorio, teléfono normalizado), lista con filtros
  por estado, detalle con siguiente paso, comisiones e historial; acceso rápido «Registrar cliente» desde cada código.
- Cliente reservado (90 días): se bloquea al segundo comercial con aviso sin revelar datos; los rechazados liberan el cliente.
- Empresa: panel de leads con filtros por estado y acción rápida «Cualificar»; detalle con datos del cliente,
  acciones según estado (cualificar, rechazar con motivo, marcar venta con importe, cancelar en periodo de desistimiento),
  comisiones y tarifa de ComisionaTe, e historial. Aviso de «sin respuesta» a partir de 10 días.
- Tests: 31 en total. Revisado con Playwright en 375 y 1280 px.
- Pendiente de esta parte: los avisos automáticos de 15 días y el paso a revisión del admin (Fase 5, cron);
  el botón de disputa (Fase 6).

## Fase 2 — TERMINADA
- Storage: buckets `logos`, `photos` (públicos), `materials`, `invoices` (privados); políticas por carpeta `<uid>/`.
- Empresa: perfil (con logo), ofertas (crear/editar/pausar/publicar; comisión por lead y/o venta, fija o %),
  material de venta (PDF/imagen), solicitudes de comerciales (aprobar/rechazar).
- Comercial: perfil (fiscal, IBAN, sectores, foto), marketplace con filtros (sector, provincia, tipo, comisión mínima),
  detalle con condiciones y aceptación con un clic (snapshot inmutable), códigos (copiar + WhatsApp).
- Formularios con `useServerForm`: no se vacían al devolver errores de validación.
- Tests: 29 en total (`tests/offers*.test.ts` nuevos). Revisado con Playwright en 375 y 1280 px.
- Decisión: el % de comisión **por lead** se calcula sobre el precio orientativo del producto (ver DECISIONES).

## Fase 1 — TERMINADA
- Next.js 16 + Tailwind 4 + TS, identidad visual (verde/amarillo, Inter, logo, modo oscuro).
- Supabase local: esquema completo con enums, RLS en todas las tablas, funciones SQL de negocio
  (`register_lead`, `set_lead_status`, `join_offer`, `company_mark_paid`, `salesperson_confirm_payment`,
  `confirm_due_sales`, `fee_percent_for`, `calc_commission_cents`, `normalize_phone`).
- Seed: 1 admin, 3 empresas (1 fundadora, 1 con % propio), 10 comerciales, leads en todos los estados,
  1 disputa, 1 impago, 2 facturas de ComisionaTe.
- Auth con roles: registro (empresa/comercial), login, salir, guard por rol, `proxy.ts` refresca sesión.
- Tests (23, `npm test`): comisiones, transiciones, plazos (14/15 días), cliente reservado, RLS, IBAN.
- Revisado con Playwright en 375 y 1280 px.

### Usuarios de prueba (contraseña `Comisionate123!`)
admin@comisionate.test · empresa1..3@comisionate.test · comercial1..10@comisionate.test
(comercial 1-5 autónomos, 6-10 particulares)

### Pendiente / conocido
- Login con Google: botón y configuración en Supabase (Fase 8, requiere cuenta Google Cloud).
- Los paneles «Resumen» son solo un saludo; los dashboards llegan en la Fase 4.
- El bucket `invoices` está creado pero aún sin uso (facturas de autónomos: Fase 4).
- El admin aún no tiene pantalla para verificar empresas (Fase 6); hasta entonces se hace en BD.
- Puerto 3000 ocupado en este Mac por otra app (Remotion): Next usa 3001.
