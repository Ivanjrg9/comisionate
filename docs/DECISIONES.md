# Decisiones técnicas

| # | Decisión | Motivo |
|---|----------|--------|
| 1 | Proyecto en `~/comisionate` | La spec no fija ruta; carpeta propia y fuera de `Desktop/2ºDAW` (no es de una asignatura). |
| 2 | Supabase **local con Docker** durante el desarrollo | Permite probar RLS, seed y cron sin cuenta; luego se enlaza al proyecto real. |
| 3 | `proxy.ts` en lugar de `middleware.ts` | Next 16 renombró la convención (según su doc local). |
| 4 | Roles en `profiles.role` (enum) y claim leído desde BD | Un solo sitio de verdad; RLS usa funciones `is_admin()`, `my_company_id()`. |
| 5 | Lógica de dinero y estados en funciones SQL `security definer` | La spec exige no confiar en el cliente. |
| 6 | Tests de dominio con vitest; tests RLS contra Supabase local | Cubren cálculo, transiciones, plazos, reservado y RLS. |
| 7 | Cliente reservado: comprobación en trigger de `leads` (mismo teléfono E.164 + misma empresa, 90 días, ignorando rechazados) | Un índice parcial no admite `now()`. |
| 8 | Sin `cacheComponents` (opción que activa por defecto create-next-app 16) | La app es casi toda autenticada y dinámica; exigiría `<Suspense>` en cada página con sesión sin beneficio. Se puede activar más adelante. |
| 9 | Comisión **por lead en %**: se calcula sobre el precio orientativo del producto (obligatorio rellenarlo) | La spec admite % en ambas, pero en la fase de lead aún no hay importe de venta. Comisión por venta en %: sobre el importe real de la venta. |
| 10 | `useServerForm` (onSubmit + startTransition) en vez de `<form action>` | React 19 vacía los campos tras un error de validación con `action`. |
| 11 | Filtro «comisión mínima» sobre una estimación (lead + venta sobre el precio orientativo) | Permite filtrar y ordenar ofertas mezclando comisiones fijas y porcentuales. |
| 12 | PDFs con `pdf-lib` y fuentes estándar (Helvetica, WinAnsi): los caracteres no soportados salen como «?» | Evita embeber fuentes (peso y licencias); cubre español y €. |
| 13 | Justificante solo para comerciales «particular»; los autónomos suben su propia factura | Es lo que pide la spec (sección 4). |
| 14 | Lead sin respuesta: aviso a los 15 días y revisión del admin **7 días después** del aviso | La spec dice «si sigue sin respuesta» sin plazo; 7 días es prudente. Fácil de cambiar en `process_overdue`. |
| 15 | Impago de comisión +15 días: solo notifica al admin; **la suspensión la decide el admin** | La spec dice «si no se resuelve → suspendida»; se deja la decisión humana. Con factura impagada a +30 días la suspensión es automática (así lo pide la spec). |
| 16 | Plazos de la factura de ComisionaTe (15/25/30) se cuentan **desde la emisión** | Es la lectura literal de la spec (plazo de pago 15 días desde emisión; +15 aviso). |
| 17 | La factura mensual agrupa comisiones **firmes y no facturadas hasta fin de mes** (no solo las del mes) | Evita que se pierdan comisiones si un mes falla la tarea; el total siempre coincide con las líneas. |
| 18 | Emails con Vercel Cron diario (`/api/cron/emails`) + Resend por `fetch` | Sin librería ni Edge Function; en plan Hobby el cron mínimo es diario. Con pg_net + URL pública se podría acercar a tiempo real. |
| 19 | La factura PDF de ComisionaTe indica «importe sin IVA» | La spec no define el tratamiento del IVA de la tarifa del 10 %: **pregunta de negocio abierta** (ver resumen de la Fase 5). |
| 20 | «Buen pagador» = 0 retrasos registrados **y** al menos una comisión cobrada; se calcula en SQL (`company_public_stats`) | La spec solo dice «0 retrasos»; exigir actividad evita dar la insignia a empresas nuevas sin historial. |
| 21 | Insignia «fundadora» permanente (aunque venza la exención de 3 meses) | Es un reconocimiento de antigüedad; la tarifa sí depende de `founder_until`. |
| 22 | La valoración se hace solo por función SQL (`submit_review`), sin insert directo | Evita que alguien elija el destinatario o valore sin comisión pagada. |
| 23 | Baja de empresa: cierre automático a los 90 días si todo está pagado; los clientes registrados siguen contando ese tiempo | Cumple «90 días siguientes» de la spec sin dejar la cuenta abierta indefinidamente. |
| 24 | Anonimización: perfil, NIF, IBAN, foto, datos del cliente final y acceso; se conservan CIF/razón social de la empresa, ventas, pagos y facturas | Obligación de conservar registros 6 años. Los datos fiscales de una empresa no son datos personales del responsable. |
| 25 | Landing con «ticket de comisión» como pieza central; verde bosque `#14532d` para bloques rellenos | El verde de marca `#16A34A` con texto blanco no llega a contraste AA (3,3:1); el verde bosque sí (≈9:1). |
| 26 | Sin banner de cookies | Solo se usan cookies técnicas de sesión (exentas de consentimiento). Si se añade analítica habrá que añadir banner y actualizar la política. |
| 27 | Textos legales con aviso visible «plantilla pendiente de revisión» mientras `LEGAL.draft` sea true | La spec pide plantillas a revisar por un profesional; evita publicarlas por descuido. |
| 28 | Páginas públicas estáticas (sin leer la sesión en la cabecera) | Rendimiento y caché en Vercel; la cabecera pública no cambia según el usuario. |
| 29 | `--primary` pasa de `#16a34a` a `#15803d` (modo claro) y texto sobre fondos verdes tintados usa `--on-tint` | Auditoría axe-core: el blanco sobre `#16a34a` daba 3,3:1 (AA exige 4,5:1) en 82 elementos. Tras el cambio: 0 violaciones WCAG 2.1 AA en 31 pantallas, claro y oscuro. El verde `#16a34a` original sigue en el icono. |
| 30 | Marketplace público `/ofertas` (solo ofertas activas, sin datos de personas) con revalidación de 5 min | Ayuda a convencer a comerciales y al SEO sin abrir datos privados; la RLS anónima solo permite `status = 'activa'`. |
| 31 | Anti-bots del registro: campo trampa + tiempo mínimo de 1,2 s; límites de Auth de Supabase para el resto | Sin captcha ni cuentas de terceros. Si hay abuso real, añadir Cloudflare Turnstile (gratis). |
| 32 | Cabeceras de seguridad (nosniff, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy); sin CSP por ahora | Una CSP estricta con Next exige nonces; se deja como mejora tras el piloto. |
| 33 | **Rediseño visual con el sistema «Graphite»** (`~/Downloads/DESIGN.md`, a petición expresa): tema oscuro, lienzo `#0a0a0a`, bordes `#262626`, texto `#fafafa`, Inter sin ligaduras, botón principal Paper White, naranja `#ff8833` solo en enlaces, espectro solar solo como línea decorativa, radios 8/10 px | Sustituye a las decisiones 25 y 29 (verde bosque/verde primario). **Se apartan de la spec original** (verde `#16A34A`, amarillo `#FACC15`, modo claro y oscuro): la app es ahora **solo oscura**; si se quiere volver a ofrecer modo claro habría que definir una variante clara de Graphite. |
| 34 | La «Te» del logo se resalta con el ámbar del espectro solar (`#ffb931`) en texto, sin relleno | Mantiene la idea de la spec (Te resaltada) sin romper la regla de no usar colores saturados rellenos. |
| 35 | Estados (pendiente, cobrada, rechazada…) como píldora con borde fino y **punto de color** (gris/ámbar/verde/rojo), con el significado en el texto | Graphite es monocromo: el color es solo señal y nunca lo único que transmite la información. |
| 36 | Los PDFs y los emails mantienen fondo blanco (son documentos/correos), con titulares en grafito y botón grafito | Se imprimen y se leen en clientes de correo claros; se alinean con la paleta sin invertirlos. |
| 37 | Un comercial puede leer siempre las ofertas y empresas en las que participa (política `offers_read_member` / `companies_read_member`) | **Bug corregido:** al ocultarse/cerrarse una oferta o suspenderse la empresa, las páginas de sus clientes y comisiones se rompían. |
