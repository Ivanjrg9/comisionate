# ComisionaTe — Plan de construcción

Fuente de verdad del negocio: `SPEC.md` (copia en la raíz del repo).

## Stack
Next.js 16 (App Router, `src/`, `proxy.ts` en vez de middleware) · TypeScript · Tailwind 4 ·
Supabase (Auth, Postgres, RLS, Storage, pg_cron) · zod · vitest · PDF en servidor · Vercel.

## Carpetas
```
src/app/(public)/      landing, cómo funciona, FAQ, legales
src/app/(auth)/        login, registro (empresa / comercial)
src/app/empresa/       panel de empresa
src/app/comercial/     panel de comercial
src/app/admin/         panel de administración
src/lib/supabase/      clientes browser / server / proxy
src/lib/domain/        lógica pura y testeada (comisiones, estados, plazos, teléfono)
src/lib/validation/    esquemas zod compartidos cliente/servidor
supabase/migrations/   SQL versionado
supabase/seed.sql      datos de ejemplo
docs/                  PLAN, DECISIONES, PROGRESO
```

## Esquema (resumen)
`sectors` · `profiles` (rol) · `companies` · `salespeople` · `salesperson_sectors` · `offers` ·
`offer_materials` · `memberships` (códigos + snapshot de condiciones) · `leads` · `lead_events` ·
`commissions` · `salesperson_invoices` · `platform_invoices` + `platform_invoice_items` ·
`disputes` · `reports` · `reviews` · `notifications` · `app_settings`.
Importes en céntimos (int). Teléfonos en E.164. Todos los estados son enums de Postgres.
Cálculo de comisiones, tarifa del 10 % y transiciones de estado: funciones SQL `security definer`.

## Fases
1. Setup, auth con roles, esquema, RLS, seed.
2. Perfiles, ofertas, marketplace, unirse + códigos.
3. Registro de clientes, ciclo de estados, cliente reservado, historial.
4. Comisiones, cancelación, pagos, facturas/justificantes, dashboards.
5. Facturación mensual, impagos, cron, notificaciones.
6. Admin, disputas, reportes, valoraciones, insignias, bajas.
7. Landing, públicas, legales, pulido.
8. Despliegue Vercel + comisionate.com + repaso final.

Cada fase termina con: build + tests + prueba en local + commit + actualización de `PROGRESO.md`.
