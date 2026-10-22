# Progreso

Para retomar: "lee SPEC.md y docs/PROGRESO.md y continúa".
Entorno local: `supabase start` (Docker) → `supabase db reset` (migraciones + seed) → `npm run dev` → `npm test`.

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
