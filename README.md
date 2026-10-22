# ComisionaTe

**Tu red de comerciales a comisión.** Plataforma web que conecta **empresas** de placas solares con **comerciales** independientes: la empresa publica una oferta con una comisión, el comercial se une, registra clientes con su código de referido y cobra cuando la empresa valida el lead o la venta.

- Especificación del negocio: [`SPEC.md`](SPEC.md)
- Plan, decisiones y estado: [`docs/PLAN.md`](docs/PLAN.md) · [`docs/DECISIONES.md`](docs/DECISIONES.md) · [`docs/PROGRESO.md`](docs/PROGRESO.md)
- Cómo publicarla y mantenerla: [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, RLS, Storage, pg_cron) · zod · pdf-lib · Vitest · Vercel.

## Requisitos

- Node.js 20 o superior (probado con 24) y npm
- Docker (para Supabase en local)
- [Supabase CLI](https://supabase.com/docs/guides/cli): `brew install supabase/tap/supabase`

## Instalación en local

```bash
npm install
supabase start                 # levanta Postgres, Auth y Storage en Docker (la primera vez tarda)
supabase db reset              # aplica las migraciones y carga los datos de ejemplo (seed)
cp .env.example .env.local     # y rellénalo con los valores de `supabase status` (ver abajo)
npm run dev                    # http://localhost:3000 (usa otro puerto si está ocupado)
```

`supabase status` muestra la URL de la API y las claves. En `.env.local` pon:

| Variable | Valor en local |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la «Publishable key» de `supabase status` |
| `SUPABASE_SERVICE_ROLE_KEY` | la «Secret key» de `supabase status` (solo servidor y tests) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

## Variables de entorno

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Conexión del navegador y del servidor con Supabase | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Tareas de servidor (envío de emails) y tests. **Nunca** con prefijo `NEXT_PUBLIC_` | Sí en producción |
| `NEXT_PUBLIC_SITE_URL` | URL pública (enlaces de emails, sitemap, SEO) | Sí |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envío de notificaciones por email (Resend) | Para emails |
| `CRON_SECRET` | Protege `/api/cron/emails` (Vercel Cron lo envía solo) | Para emails |
| `PLATFORM_IBAN` | IBAN de ComisionaTe en el PDF de la factura mensual | Recomendada |
| `NEXT_PUBLIC_LEGAL_*` | Datos del titular para aviso legal y privacidad | Antes de publicar |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | `true` cuando Google esté activado en Supabase | No |

Nunca subas `.env.local` al repositorio (ya está en `.gitignore`).

## Datos de ejemplo (seed)

`supabase db reset` borra la base de datos local y la deja con: 1 admin, 3 empresas solares (una fundadora, una con tarifa propia), 10 comerciales (autónomos y particulares), leads y comisiones en todos los estados, 1 disputa, 1 impago y facturas de ejemplo. **El seed es solo para desarrollo: no se ejecuta en producción.**

Contraseña de todos: `Comisionate123!`

| Rol | Usuarios |
|---|---|
| Admin | `admin@comisionate.test` |
| Empresas | `empresa1@…` (fundadora), `empresa2@…`, `empresa3@…` (con impago) `@comisionate.test` |
| Comerciales | `comercial1@…` a `comercial10@…` `@comisionate.test` (1-5 autónomos, 6-10 particulares) |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y arrancar en producción |
| `npm run lint` | ESLint |
| `npm test` | Tests unitarios y de base de datos, Vitest (necesita `supabase start` y el seed) |
| `npm run test:e2e` | Pruebas de extremo a extremo con Playwright: compila la app y la prueba en Chrome (necesita `supabase start` y el seed; usa el puerto 3100) |
| `npx tsc --noEmit` | Comprobar tipos |

## Estructura

```
src/app/(public)/   landing, cómo funciona, FAQ y páginas legales
src/app/(auth)/     login y registro
src/app/empresa/    panel de empresa
src/app/comercial/  panel de comercial
src/app/admin/      panel de administración
src/app/api/        PDFs (justificantes, informes, facturas) y tarea de emails
src/lib/            Supabase, validación (zod), PDFs, contenidos y utilidades
supabase/migrations esquema, lógica de negocio en SQL, RLS, Storage y tareas pg_cron
supabase/seed.sql   datos de ejemplo
tests/              Vitest: lógica de negocio, RLS, pagos, impagos, bajas, PDFs
e2e/                Playwright: flujo completo empresa→comercial→cobro, acceso, recuperar contraseña, web pública
```

## Cómo está pensada la seguridad

- **RLS estricto**: cada empresa solo ve sus ofertas, leads y ventas; cada comercial, los suyos; los datos del cliente final, solo la empresa de esa venta y el comercial que lo registró; el admin lo ve todo.
- Dinero, tarifas, estados y plazos se calculan **en la base de datos** (funciones SQL), nunca en el cliente. Importes en céntimos.
- Las tareas automáticas (confirmar ventas a los 14 días, avisos, impagos, facturas mensuales, bajas) corren con `pg_cron`.

## Despliegue

Consulta [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): Supabase (proyecto, migraciones, Auth), Vercel, dominio `comisionate.com` (y `comisionate.es` redirigiendo), Resend, primer administrador, copias de seguridad y monitorización.
