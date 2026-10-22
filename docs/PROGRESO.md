# Progreso

Para retomar: "lee SPEC.md y docs/PROGRESO.md y continúa".
Entorno local: `supabase start` (Docker) → `supabase db reset` (migraciones + seed) → `npm run dev` → `npm test`.

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
- Los paneles son solo un saludo; el contenido llega en las fases 2-6.
- Storage (logos, materiales, facturas PDF) se crea en la Fase 2.
- Puerto 3000 ocupado en este Mac por otra app (Remotion): Next usa 3001.
