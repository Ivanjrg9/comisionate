-- ComisionaTe · Endurecimiento previo al piloto.

-- ───────────── Aceptación de términos (fecha y versión) ─────────────
alter table profiles
  add column terms_version text,
  add column terms_accepted_at timestamptz;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r user_role := case when meta->>'role' = 'empresa' then 'empresa'::user_role else 'comercial'::user_role end;
  n text := coalesce(nullif(meta->>'full_name', ''), split_part(new.email, '@', 1));
  tv text := nullif(meta->>'terms_version', '');
begin
  insert into profiles (id, role, full_name, email, terms_version, terms_accepted_at)
  values (new.id, r, n, new.email, tv, case when tv is not null then now() end);
  if r = 'empresa' then
    insert into companies (owner_id, legal_name, cif)
    values (new.id, coalesce(nullif(meta->>'legal_name', ''), n), coalesce(meta->>'cif', ''));
  else
    insert into salespeople (id, nif, fiscal)
    values (new.id, meta->>'nif', case when meta->>'fiscal' = 'autonomo' then 'autonomo'::fiscal_type else 'particular'::fiscal_type end);
  end if;
  return new;
end $$;

create or replace function guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.uid() is not null and coalesce(current_setting('app.internal', true), '') <> 'on'
     and (new.role is distinct from old.role or new.status is distinct from old.status
          or new.leaving_at is distinct from old.leaving_at or new.anonymized_at is distinct from old.anonymized_at
          or new.terms_version is distinct from old.terms_version or new.terms_accepted_at is distinct from old.terms_accepted_at) then
    raise exception 'No puedes cambiar ese dato de tu cuenta';
  end if;
  return new;
end $$;

-- Registra la aceptación (p. ej. tras entrar con Google). Solo la primera vez: no sobrescribe.
create function accept_terms(p_version text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.internal', 'on', true);
  update profiles set terms_version = p_version, terms_accepted_at = now()
   where id = auth.uid() and terms_accepted_at is null;
end $$;
revoke execute on function accept_terms from public, anon;
grant execute on function accept_terms to authenticated;

-- ───────────── Una empresa con deuda o de baja no puede reactivar sus ofertas ─────────────
create or replace function guard_offer() returns trigger
language plpgsql security definer set search_path = public as $$
declare c companies;
begin
  new.updated_at := now();
  if new.status = 'activa' then
    select * into c from companies where id = new.company_id;
    if c.status <> 'verificada' then raise exception 'Tu empresa debe estar verificada para publicar ofertas'; end if;
    if not is_admin() then
      if c.baja_requested_at is not null then raise exception 'Has solicitado la baja: no puedes publicar ofertas'; end if;
      if company_in_default(c.id) then raise exception 'Tienes pagos pendientes: no puedes publicar ofertas hasta ponerte al día'; end if;
    end if;
  end if;
  return new;
end $$;

-- ───────────── Un comercial no activo no puede registrar clientes (aunque conserve la sesión) ─────────────
create function guard_lead_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select status from profiles where id = new.salesperson_id) <> 'activo' then
    raise exception 'Tu cuenta no está activa';
  end if;
  return new;
end $$;
create trigger leads_guard_insert before insert on leads
  for each row execute function guard_lead_insert();
