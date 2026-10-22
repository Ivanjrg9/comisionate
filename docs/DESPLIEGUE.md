# Despliegue y mantenimiento

Resumen: **GitHub** (código) → **Vercel** (web) + **Supabase** (base de datos, login, archivos, tareas) + **Resend** (emails) + tu **dominio**.

## 0. Cuentas necesarias

| Servicio | Para qué | Coste inicial |
|---|---|---|
| GitHub | Guardar el código; Vercel despliega desde aquí | Gratis |
| Supabase | Base de datos, Auth, Storage, tareas programadas | Plan Free (ver «Producción» abajo) |
| Vercel | Alojar la web | Hobby gratis para empezar (uso no comercial); ver nota |
| Resend | Enviar emails | Gratis hasta 3.000/mes |
| Registrador de `comisionate.com` y `.es` | DNS | Ya los tienes (o los compras) |

> **Nota sobre planes:** el plan Hobby de Vercel es para uso personal/no comercial. Para una plataforma que cobra comisiones corresponde el plan **Pro**. Y en Supabase, el plan Free **pausa** los proyectos inactivos y no incluye copias de seguridad diarias: para producción real conviene **Pro**.

## 1. GitHub

```bash
gh auth login                                  # una vez
gh repo create comisionate --private --source=. --push
```

## 2. Supabase (producción)

1. En <https://supabase.com/dashboard> crea un **proyecto** nuevo. Elige región de la UE (p. ej. *Frankfurt* o *París*, por el RGPD) y guarda la **contraseña de la base de datos** en un gestor de contraseñas.
2. Desde la terminal:
   ```bash
   supabase login
   supabase link --project-ref <REF_DEL_PROYECTO>   # te pide la contraseña de la base de datos
   supabase db push                                  # aplica TODAS las migraciones (esquema, RLS, Storage, pg_cron)
   ```
   **No ejecutes el seed en producción.**
3. Comprueba en *SQL Editor*: `select jobname, schedule from cron.job;` → deben salir 4 tareas (`confirm-due-sales`, `process-overdue`, `monthly-invoices`, `finalize-leaves`). Y en *Storage* deben existir los buckets `logos`, `photos`, `materials`, `invoices`.
4. **Authentication → URL Configuration:** *Site URL* = `https://comisionate.com`; *Redirect URLs* = `https://comisionate.com/**` (y `http://localhost:3000/**` si quieres probar en local contra producción).
5. **Authentication → Providers → Email:** deja activada la **confirmación de email**.
6. **Authentication → SMTP Settings:** el correo integrado de Supabase está muy limitado; configura SMTP con Resend (host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = tu API key de Resend, remitente `avisos@comisionate.com`).
7. *(Opcional)* **Google:** crea unas credenciales OAuth en Google Cloud (tipo «Aplicación web», URI de redirección = la que muestra Supabase en *Providers → Google*), pégalas en Supabase y pon `NEXT_PUBLIC_GOOGLE_ENABLED=true` en Vercel. Solo está disponible para comerciales (las empresas se registran con email porque necesitan CIF).
8. Claves: *Project Settings → API Keys* (o `supabase projects api-keys --project-ref <REF>`): la **publishable key** y la **secret key**.

## 3. Resend (emails)

1. Crea cuenta en <https://resend.com>, añade el dominio `comisionate.com` y copia en tu DNS los registros que te indique (SPF/DKIM). Espera a que salga *Verified*.
2. Crea una **API key**.

## 4. Vercel

```bash
npx vercel login
npx vercel link          # crea/enlaza el proyecto «comisionate»
```

Variables de entorno (*Project → Settings → Environment Variables*, entorno *Production*; o `npx vercel env add NOMBRE production`):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<REF>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key |
| `NEXT_PUBLIC_SITE_URL` | `https://comisionate.com` |
| `RESEND_API_KEY` / `EMAIL_FROM` | tu key / `ComisionaTe <avisos@comisionate.com>` |
| `CRON_SECRET` | una cadena larga aleatoria (`openssl rand -hex 32`) |
| `PLATFORM_IBAN` | IBAN de ComisionaTe |
| `NEXT_PUBLIC_LEGAL_NAME`, `_TAX_ID`, `_ADDRESS`, `_REGISTRY`, `_EMAIL` | datos del titular |

Despliegue: `npx vercel --prod` (o simplemente `git push` a `main` si conectas el repositorio en Vercel → *Git*).

## 5. Dominio

En Vercel → *Settings → Domains*:
1. Añade `comisionate.com` (principal) y `www.comisionate.com` (redirige a `comisionate.com`).
2. Añade `comisionate.es` y `www.comisionate.es` con **redirección 308 a `https://comisionate.com`**.
3. En el DNS de tu registrador pon lo que Vercel indique (normalmente `A 76.76.21.21` para el dominio raíz y `CNAME cname.vercel-dns.com` para `www`). El certificado HTTPS es automático.

## 6. Primer administrador

1. Regístrate en la web con tu email (como comercial) y confírmalo.
2. En Supabase → *SQL Editor* ejecuta [`supabase/bootstrap-admin.sql`](../supabase/bootstrap-admin.sql) con tu email.
3. Cierra sesión y vuelve a entrar: verás el panel `/admin`.

## 7. Repaso tras desplegar

- [ ] Registro de empresa y de comercial funciona y llega el email de confirmación.
- [ ] El admin verifica la empresa; la empresa publica una oferta; el comercial se une y registra un cliente.
- [ ] El ciclo completo: cualificar → venta → pago → confirmación; descarga de justificante/factura/informe.
- [ ] `https://comisionate.com/api/cron/emails` sin cabecera devuelve 401; el cron de Vercel aparece en *Settings → Cron Jobs*.
- [ ] `comisionate.es` redirige a `comisionate.com`.
- [ ] Textos legales con los datos reales y revisados; `LEGAL.draft = false` en `src/lib/content/site.ts`.

## Mantenimiento

**Actualizar la web:** cambia el código, `npm test && npm run build`, `git push` (Vercel despliega solo).

**Cambios de base de datos:** crea una migración nueva (`supabase migration new nombre`), pruébala en local con `supabase db reset` y `npm test`, y aplícala con `supabase db push`. **Nunca edites migraciones ya aplicadas en producción.**

**Copias de seguridad:** plan Pro de Supabase incluye copias diarias (*Database → Backups*). Además, haz una copia manual periódica: `supabase db dump --linked -f backup-$(date +%F).sql` (y guárdala fuera del proyecto). Los archivos subidos (logos, facturas) están en *Storage*.

**Ver errores:** Vercel → *Logs* (errores de la web y del cron de emails); Supabase → *Logs* (API, Auth, Postgres). Tareas programadas: `select jobname, status, return_message, start_time from cron.job_run_details order by start_time desc limit 20;`.

**Claves:** si se filtra una clave, rótala en Supabase (*API Keys*) y actualiza la variable en Vercel; redespliega.

**Dependencias:** `npm outdated` / `npm audit` cada cierto tiempo; sube versiones con tests en verde.
