-- Convierte en administrador a un usuario YA registrado (producción).
-- 1) Regístrate normalmente en la web con tu email.
-- 2) Pega esto en Supabase → SQL Editor, cambia el email y ejecútalo.
update public.profiles set role = 'admin' where email = 'TU_EMAIL@EJEMPLO.COM';
-- Un administrador no necesita fila de comercial/empresa:
delete from public.salespeople where id = (select id from public.profiles where email = 'TU_EMAIL@EJEMPLO.COM');
delete from public.companies   where owner_id = (select id from public.profiles where email = 'TU_EMAIL@EJEMPLO.COM');
