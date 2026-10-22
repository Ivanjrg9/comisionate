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
