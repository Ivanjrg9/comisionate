-- ComisionaTe · Fase 6: administración, disputas, reportes, valoraciones, insignias y bajas.

alter table profiles  add column leaving_at timestamptz;          -- baja solicitada (comercial)
alter table companies add column baja_requested_at timestamptz;   -- baja solicitada (empresa)
create unique index disputes_one_open_per_lead on disputes (lead_id) where status = 'abierta';

-- ───────────── Guardas ampliadas ─────────────
-- Las funciones internas marcan app.internal para poder tocar campos protegidos.
create or replace function guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.uid() is not null and coalesce(current_setting('app.internal', true), '') <> 'on'
     and (new.role is distinct from old.role or new.status is distinct from old.status
          or new.leaving_at is distinct from old.leaving_at or new.anonymized_at is distinct from old.anonymized_at) then
    raise exception 'No puedes cambiar ese dato de tu cuenta';
  end if;
  return new;
end $$;

create or replace function guard_company_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.uid() is not null and coalesce(current_setting('app.internal', true), '') <> 'on' and (
       new.status is distinct from old.status or new.verified_at is distinct from old.verified_at
    or new.founder_until is distinct from old.founder_until
    or new.fee_percent_override is distinct from old.fee_percent_override
    or new.late_payments is distinct from old.late_payments
    or new.suspension_reason is distinct from old.suspension_reason
    or new.baja_requested_at is distinct from old.baja_requested_at) then
    raise exception 'Solo el administrador puede cambiar esos campos';
  end if;
  return new;
end $$;

-- El admin puede reabrir una venta aunque la empresa tenga una factura vencida.
create or replace function guard_lead_validation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('lead_cualificado', 'periodo_cancelacion') and new.status is distinct from old.status
     and not is_admin() and company_blocked(new.company_id) then
    raise exception 'Tienes una factura de ComisionaTe vencida: págala para poder validar ventas nuevas';
  end if;
  return new;
end $$;

-- Un comercial que se da de baja ya no puede unirse a ofertas nuevas.
create function guard_membership_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select leaving_at from profiles where id = new.salesperson_id) is not null then
    raise exception 'Tu cuenta está en proceso de baja: no puedes unirte a nuevas ofertas';
  end if;
  return new;
end $$;
create trigger memberships_guard_insert before insert on memberships
  for each row execute function guard_membership_insert();

-- ───────────── Avisos automáticos al admin ─────────────
create function on_dispute_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare l leads;
begin
  select * into l from leads where id = new.lead_id;
  perform notify_admins('disputa_nueva', 'Nueva disputa', left(new.explanation, 120), '/admin/disputas');
  perform notify_company(l.company_id, 'disputa_nueva', 'Un comercial ha abierto una disputa', 'Sobre el cliente ' || l.customer_name, '/empresa/leads/' || l.id);
  return new;
end $$;
create trigger disputes_notify after insert on disputes for each row execute function on_dispute_created();

create function on_report_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify_admins('reporte_nuevo', 'Nuevo reporte', left(new.reason, 120), '/admin/reportes');
  return new;
end $$;
create trigger reports_notify after insert on reports for each row execute function on_report_created();

-- ───────────── Acciones del administrador ─────────────
create function require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Solo el administrador puede hacer esto'; end if;
end $$;

create function admin_verify_company(p_company uuid, p_verify boolean) returns void
language plpgsql security definer set search_path = public as $$
declare c companies;
begin
  perform require_admin();
  update companies set status = case when p_verify then 'verificada'::company_status else 'pendiente' end,
         verified_at = case when p_verify then now() end
   where id = p_company returning * into c;
  if not found then raise exception 'Empresa no encontrada'; end if;
  if p_verify then
    perform notify(c.owner_id, 'empresa_verificada', '¡Tu empresa está verificada!', 'Ya puedes publicar ofertas.', '/empresa/ofertas');
  end if;
end $$;

-- Aplica el estado de una cuenta (activo / suspendido / expulsado) con sus efectos.
create function set_account_status(p_profile uuid, p_status account_status) returns void
language plpgsql security definer set search_path = public as $$
declare c companies;
begin
  if p_status not in ('activo', 'suspendido', 'expulsado') then raise exception 'Estado no válido'; end if;
  update profiles set status = p_status where id = p_profile;
  select * into c from companies where owner_id = p_profile;
  if found then
    if p_status = 'activo' then
      update companies set status = 'verificada', suspension_reason = null where id = c.id and status in ('suspendida', 'expulsada') and verified_at is not null;
      update offers set status = 'activa' where company_id = c.id and status = 'oculta';
    elsif p_status = 'suspendido' then
      update companies set status = 'suspendida', suspension_reason = 'admin' where id = c.id;
      update offers set status = 'oculta' where company_id = c.id and status = 'activa';
    else
      update companies set status = 'expulsada' where id = c.id;
      update offers set status = 'cerrada' where company_id = c.id and status <> 'cerrada';
    end if;
  elsif p_status = 'expulsado' then
    update memberships set status = 'desactivada' where salesperson_id = p_profile and status in ('activa', 'pendiente');
  end if;
  perform notify(p_profile, 'cuenta_estado',
    case p_status when 'activo' then 'Tu cuenta se ha reactivado' when 'suspendido' then 'Tu cuenta está suspendida' else 'Tu cuenta ha sido expulsada' end,
    'Los pagos pendientes legítimos se respetan en ambas direcciones.', null);
end $$;

create function admin_set_account_status(p_profile uuid, p_status account_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  if p_profile = auth.uid() then raise exception 'No puedes cambiar tu propia cuenta'; end if;
  if (select role from profiles where id = p_profile) = 'admin' then raise exception 'No se puede cambiar a otro administrador'; end if;
  perform set_account_status(p_profile, p_status);
end $$;

create function admin_update_company_terms(p_company uuid, p_founder_until date, p_fee numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  update companies set founder_until = p_founder_until, fee_percent_override = p_fee where id = p_company;
end $$;

create function admin_start_report_review(p_report uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  update reports set status = 'en_revision' where id = p_report and status = 'abierto';
end $$;

-- Resuelve un reporte y aplica la sanción: aviso → suspensión temporal → expulsión.
create function admin_resolve_report(p_report uuid, p_sanction sanction_kind, p_note text, p_target uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare r reports; target uuid;
begin
  perform require_admin();
  select * into r from reports where id = p_report and status <> 'resuelto';
  if not found then raise exception 'El reporte no existe o ya está resuelto'; end if;
  target := coalesce(p_target, r.target_profile_id);
  if p_sanction <> 'ninguna' then
    if target is null then raise exception 'Indica a quién se aplica la sanción'; end if;
    if (select role from profiles where id = target) = 'admin' then raise exception 'No se puede sancionar a un administrador'; end if;
    if p_sanction = 'aviso' then
      perform notify(target, 'sancion_aviso', 'Aviso del equipo de ComisionaTe', coalesce(p_note, 'Has recibido un aviso por incumplir las normas de conducta.'), null);
    elsif p_sanction = 'suspension' then
      perform set_account_status(target, 'suspendido');
    else
      perform set_account_status(target, 'expulsado');
    end if;
  end if;
  update reports set status = 'resuelto', sanction = p_sanction, admin_note = p_note,
         target_profile_id = coalesce(target_profile_id, target) where id = p_report;
  perform notify(r.reporter_id, 'reporte_resuelto', 'Hemos revisado tu reporte', coalesce(p_note, 'Gracias por avisarnos.'), null);
end $$;

-- Disputa: a favor del comercial el lead vuelve al estado que le corresponde; a favor de la empresa se cierra.
create function admin_resolve_dispute(p_dispute uuid, p_for_salesperson boolean, p_resolution text) returns void
language plpgsql security definer set search_path = public as $$
declare d disputes; l leads; new_status lead_status;
begin
  perform require_admin();
  select * into d from disputes where id = p_dispute and status = 'abierta';
  if not found then raise exception 'La disputa no existe o ya está resuelta'; end if;
  select * into l from leads where id = d.lead_id for update;

  if p_for_salesperson then
    if l.status = 'rechazado' then
      new_status := 'registrado';
      update leads set status = new_status, reject_reason = null, reject_note = null, warned_at = null,
                       needs_review = false, updated_at = now() where id = l.id;
    elsif l.status = 'cancelada' then
      if l.cancel_ends_at > now() then
        new_status := 'periodo_cancelacion';
        update commissions set status = 'pendiente' where lead_id = l.id and type = 'venta' and status = 'anulada';
      else
        new_status := 'confirmada';
        update commissions set status = 'exigible', confirmed_at = now(), due_at = now() + make_interval(days => setting_int('pay_days'))
         where lead_id = l.id and type = 'venta' and status = 'anulada';
      end if;
      update leads set status = new_status, updated_at = now() where id = l.id;
    else
      raise exception 'El lead ya no está rechazado ni cancelado';
    end if;
    insert into lead_events (lead_id, actor_id, from_status, to_status, reason)
    values (l.id, auth.uid(), l.status, new_status, 'Disputa resuelta a favor del comercial: ' || coalesce(p_resolution, ''));
  end if;

  update disputes set status = case when p_for_salesperson then 'resuelta_comercial'::dispute_status else 'resuelta_empresa' end,
         resolution = p_resolution, resolved_by = auth.uid(), resolved_at = now() where id = d.id;
  perform notify(d.opened_by, 'disputa_resuelta', 'Tu disputa ha sido resuelta', coalesce(p_resolution, ''), '/comercial/leads/' || l.id);
  perform notify_company(l.company_id, 'disputa_resuelta', 'Disputa resuelta', coalesce(p_resolution, ''), '/empresa/leads/' || l.id);
end $$;

-- ───────────── Valoraciones ─────────────
drop policy reviews_insert on reviews;   -- solo mediante submit_review (el destinatario lo fija la función)

create function submit_review(p_commission uuid, p_stars int, p_comment text default '') returns void
language plpgsql security definer set search_path = public as $$
declare c commissions; target uuid;
begin
  if p_stars not between 1 and 5 then raise exception 'La valoración va de 1 a 5 estrellas'; end if;
  select * into c from commissions where id = p_commission and status = 'recibida';
  if not found then raise exception 'Solo puedes valorar tras una comisión pagada'; end if;
  if c.salesperson_id = auth.uid() then
    select owner_id into target from companies where id = c.company_id;
  elsif c.company_id = my_company_id() then
    target := c.salesperson_id;
  else
    raise exception 'No participas en esta comisión';
  end if;
  begin
    insert into reviews (commission_id, author_id, target_id, stars, comment)
    values (p_commission, auth.uid(), target, p_stars, left(coalesce(p_comment, ''), 500));
  exception when unique_violation then
    raise exception 'Ya has valorado esta comisión';
  end;
  perform notify(target, 'valoracion', 'Has recibido una valoración', p_stars || ' de 5 estrellas', null);
end $$;

-- ───────────── Insignias y nota media (públicas) ─────────────
-- «Buen pagador»: 0 retrasos y al menos una comisión cobrada. Se calcula aquí porque un comercial no puede leer comisiones ajenas.
create function company_public_stats(p_companies uuid[])
returns table (company_id uuid, verified boolean, founder boolean, good_payer boolean, rating numeric, reviews int)
language sql stable security definer set search_path = public as $$
  select c.id,
         c.status = 'verificada',
         c.founder_until is not null,
         c.late_payments = 0 and exists (select 1 from commissions m where m.company_id = c.id and m.status = 'recibida'),
         (select round(avg(r.stars), 1) from reviews r where r.target_id = c.owner_id),
         (select count(*)::int from reviews r where r.target_id = c.owner_id)
    from companies c where c.id = any (p_companies)
$$;
grant execute on function company_public_stats to authenticated;

-- ───────────── Bajas y RGPD ─────────────
-- Anonimiza los datos personales; conserva ventas, pagos y facturas (obligación legal, 6 años).
create function anonymize_account(p_profile uuid) returns void
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  perform set_config('app.internal', 'on', true);
  select id into cid from companies where owner_id = p_profile;

  update leads set customer_name = 'Cliente anonimizado', phone_e164 = 'anon:' || id, email = null,
         postal_code = null, municipality = null, property_type = null, notes = ''
   where salesperson_id = p_profile or company_id = cid;
  update salespeople set nif = null, iban = null, experience = '', zone = '', photo_path = null where id = p_profile;
  update companies set description = '', website = null, billing_email = null, logo_path = null, status = 'baja'
   where owner_id = p_profile;
  update memberships set status = 'desactivada' where salesperson_id = p_profile;
  delete from notifications where user_id = p_profile;
  update profiles set full_name = 'Usuario dado de baja', email = 'baja-' || p_profile || '@anonimo.invalid',
         phone = null, status = 'baja', anonymized_at = now() where id = p_profile;
  -- Se cierra el acceso: sin identidades y con el usuario bloqueado.
  delete from auth.identities where user_id = p_profile;
  update auth.users set email = 'baja-' || p_profile || '@anonimo.invalid', encrypted_password = '',
         raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity' where id = p_profile;
end $$;
revoke execute on function anonymize_account from public, anon, authenticated;

-- ¿Quedan cobros o pagos por cerrar?
create function has_open_money(p_profile uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from commissions c
                  where (c.salesperson_id = p_profile or c.company_id = (select id from companies where owner_id = p_profile))
                    and c.status in ('pendiente', 'exigible', 'pagada_empresa', 'no_recibida'))
      or exists (select 1 from platform_invoices i
                  where i.company_id = (select id from companies where owner_id = p_profile) and i.paid_at is null)
      or exists (select 1 from disputes d join leads l on l.id = d.lead_id
                  where d.status = 'abierta' and (l.salesperson_id = p_profile or l.company_id = (select id from companies where owner_id = p_profile)))
$$;
revoke execute on function has_open_money from public, anon, authenticated;

-- Comercial: desactiva sus códigos; la cuenta se cierra cuando no quede nada pendiente.
create function request_salesperson_leave() returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth_role() <> 'comercial' then raise exception 'Solo los comerciales pueden usar esta opción'; end if;
  perform set_config('app.internal', 'on', true);
  update profiles set leaving_at = coalesce(leaving_at, now()) where id = auth.uid();
  update memberships set status = 'desactivada' where salesperson_id = auth.uid() and status in ('activa', 'pendiente');
  if has_open_money(auth.uid()) then return 'en_curso'; end if;
  perform anonymize_account(auth.uid());
  return 'cerrada';
end $$;

-- Empresa: solo con todo pagado. Ofertas cerradas y aviso a sus comerciales; los clientes ya registrados siguen 90 días.
create function request_company_leave() returns text
language plpgsql security definer set search_path = public as $$
declare c companies;
begin
  select * into c from companies where owner_id = auth.uid();
  if not found then raise exception 'Solo las empresas pueden usar esta opción'; end if;
  if c.baja_requested_at is not null then raise exception 'Ya has solicitado la baja'; end if;
  if has_open_money(auth.uid()) then
    raise exception 'Para darte de baja debes tenerlo todo pagado: comisiones, facturas de ComisionaTe y disputas abiertas';
  end if;
  perform set_config('app.internal', 'on', true);
  update companies set baja_requested_at = now() where id = c.id;
  update offers set status = 'cerrada' where company_id = c.id and status <> 'cerrada';
  update memberships set status = 'desactivada' where offer_id in (select id from offers where company_id = c.id) and status in ('activa', 'pendiente');
  insert into notifications (user_id, kind, title, body, link)
  select distinct m.salesperson_id, 'empresa_baja', c.legal_name || ' se ha dado de baja',
         'Sus ofertas se han cerrado. Los clientes que ya registraste siguen contando 90 días si se convierten en venta.', '/comercial/leads'
    from memberships m join offers o on o.id = m.offer_id where o.company_id = c.id;
  return 'en_curso';
end $$;

-- Tarea diaria: cierra las bajas pendientes cuando ya no queda dinero en juego.
create function finalize_leaves() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from profiles where role = 'comercial' and leaving_at is not null and status = 'activo' loop
    if not has_open_money(r.id) then perform anonymize_account(r.id); n := n + 1; end if;
  end loop;
  for r in select owner_id as id from companies
            where baja_requested_at < now() - make_interval(days => setting_int('reserve_days')) and status <> 'baja' loop
    if not has_open_money(r.id) then perform anonymize_account(r.id); n := n + 1; end if;
  end loop;
  return n;
end $$;
revoke execute on function finalize_leaves from public, anon, authenticated;
select cron.schedule('finalize-leaves', '30 3 * * *', $$select public.finalize_leaves()$$);

-- ───────────── Permisos ─────────────
revoke execute on function admin_verify_company, admin_set_account_status, admin_update_company_terms,
  admin_start_report_review, admin_resolve_report, admin_resolve_dispute, submit_review,
  request_salesperson_leave, request_company_leave from public, anon;
grant execute on function admin_verify_company, admin_set_account_status, admin_update_company_terms,
  admin_start_report_review, admin_resolve_report, admin_resolve_dispute, submit_review,
  request_salesperson_leave, request_company_leave to authenticated;
revoke execute on function set_account_status, require_admin from public, anon, authenticated;
