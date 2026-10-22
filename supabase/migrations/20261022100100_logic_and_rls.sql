-- ComisionaTe · Lógica de negocio en BD + RLS (Fase 1)
-- Todo el dinero, los estados y los plazos se calculan aquí, nunca en el cliente.

-- ───────────── Helpers ─────────────
create function setting_int(p_key text) returns int
language sql stable as $$ select (value #>> '{}')::int from app_settings where key = p_key $$;

create function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and status = 'activo'
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth_role() = 'admin', false)
$$;

create function my_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from companies where owner_id = auth.uid()
$$;

-- Teléfono español → E.164. Devuelve null si no es válido.
create function normalize_phone(p_raw text) returns text
language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(p_raw, ''), '[^0-9+]', '', 'g');
begin
  if d like '+%' then
    d := '+' || regexp_replace(d, '\D', '', 'g');
    return case when length(d) between 9 and 16 then d end;
  end if;
  d := regexp_replace(d, '^00', '');
  if d ~ '^34[6789][0-9]{8}$' then return '+' || d; end if;
  if d ~ '^[6789][0-9]{8}$' then return '+34' || d; end if;
  return null;
end $$;

-- Importe de una comisión en céntimos. porcentaje: value en puntos básicos (1000 = 10 %).
create function calc_commission_cents(p_kind amount_kind, p_value int, p_base_cents int)
returns int language sql immutable as $$
  select case p_kind
    when 'fija' then p_value
    when 'porcentaje' then round(coalesce(p_base_cents, 0)::numeric * p_value / 10000)::int
  end
$$;

-- Tarifa de ComisionaTe vigente para una empresa en un instante.
create function fee_percent_for(p_company uuid, p_at timestamptz default now())
returns numeric language sql stable security definer set search_path = public as $$
  select case
    when c.founder_until is not null and p_at::date <= c.founder_until then 0
    else coalesce(c.fee_percent_override, (select (value #>> '{}')::numeric from app_settings where key = 'fee_percent'))
  end
  from companies c where c.id = p_company
$$;

-- ───────────── Alta de usuarios ─────────────
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r user_role := case when meta->>'role' = 'empresa' then 'empresa'::user_role else 'comercial'::user_role end;
  n text := coalesce(nullif(meta->>'full_name', ''), split_part(new.email, '@', 1));
begin
  insert into profiles (id, role, full_name, email) values (new.id, r, n, new.email);
  if r = 'empresa' then
    insert into companies (owner_id, legal_name, cif)
    values (new.id, coalesce(nullif(meta->>'legal_name', ''), n), coalesce(meta->>'cif', ''));
  else
    insert into salespeople (id, nif, fiscal)
    values (new.id, meta->>'nif', case when meta->>'fiscal' = 'autonomo' then 'autonomo'::fiscal_type else 'particular'::fiscal_type end);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Nadie, salvo el admin, puede cambiar su propio rol/estado desde el cliente.
create function guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.uid() is not null
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'No puedes cambiar tu rol ni tu estado';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles
  for each row execute function guard_profile_update();

create function guard_company_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.uid() is not null and (
       new.status is distinct from old.status or new.verified_at is distinct from old.verified_at
    or new.founder_until is distinct from old.founder_until
    or new.fee_percent_override is distinct from old.fee_percent_override
    or new.late_payments is distinct from old.late_payments) then
    raise exception 'Solo el administrador puede cambiar esos campos';
  end if;
  return new;
end $$;
create trigger companies_guard before update on companies
  for each row execute function guard_company_update();

-- Una oferta solo puede estar activa si la empresa está verificada.
create function guard_offer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'activa' and (select status from companies where id = new.company_id) <> 'verificada' then
    raise exception 'Tu empresa debe estar verificada para publicar ofertas';
  end if;
  return new;
end $$;
create trigger offers_guard before insert or update on offers
  for each row execute function guard_offer();

-- ───────────── Unirse a una oferta ─────────────
create function generate_referral_code(p_sector text, p_name text) returns text
language plpgsql set search_path = public, extensions as $$
declare
  base text := upper(left(regexp_replace(translate(lower(split_part(p_name, ' ', 1)),
                'áéíóúüñ', 'aeiouun'), '[^a-z]', '', 'g'), 8));
  pre  text := upper(left(regexp_replace(p_sector, '[^a-z]', '', 'g'), 5));
  code text;
begin
  loop
    code := pre || '-' || coalesce(nullif(base, ''), 'COM') || '-' ||
            upper(substr(translate(encode(gen_random_bytes(4), 'hex'), 'abcdef', 'ABCDEF'), 1, 3));
    exit when not exists (select 1 from memberships where referral_code = code);
  end loop;
  return code;
end $$;

create function join_offer(p_offer uuid) returns memberships
language plpgsql security definer set search_path = public as $$
declare
  o offers; c companies; sp salespeople; pr profiles; sec sectors; m memberships;
begin
  select * into sp from salespeople where id = auth.uid();
  if not found or auth_role() <> 'comercial' then raise exception 'Solo los comerciales pueden unirse a ofertas'; end if;
  select * into o from offers where id = p_offer and status = 'activa';
  if not found then raise exception 'La oferta no está disponible'; end if;
  select * into c from companies where id = o.company_id and status = 'verificada';
  if not found then raise exception 'La empresa no está disponible'; end if;
  if o.only_autonomos and sp.fiscal <> 'autonomo' then
    raise exception 'Esta oferta es solo para autónomos';
  end if;
  select * into pr from profiles where id = sp.id;
  select * into sec from sectors where id = o.sector_id;

  insert into memberships (offer_id, salesperson_id, referral_code, status, terms_snapshot)
  values (o.id, sp.id, generate_referral_code(sec.slug, pr.full_name),
          case o.access when 'abierto' then 'activa'::membership_status else 'pendiente' end,
          jsonb_build_object(
            'offer_title', o.title, 'company', c.legal_name, 'description', o.description,
            'product_price_cents', o.product_price_cents,
            'lead_kind', o.lead_kind, 'lead_value', o.lead_value,
            'sale_kind', o.sale_kind, 'sale_value', o.sale_value,
            'zones', o.zones, 'requirements', o.requirements,
            'only_autonomos', o.only_autonomos,
            'cancel_days', setting_int('cancel_days'), 'pay_days', setting_int('pay_days'),
            'accepted_at', now()))
  returning * into m;
  return m;
end $$;

-- ───────────── Registrar un cliente (con cliente reservado) ─────────────
create function register_lead(
  p_membership uuid, p_name text, p_phone text, p_email text, p_postal text,
  p_municipality text, p_property text, p_notes text, p_consent boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  m memberships; o offers; phone text; clash leads; new_id uuid;
begin
  select * into m from memberships where id = p_membership and salesperson_id = auth.uid() and status = 'activa';
  if not found then raise exception 'Código de referido no válido'; end if;
  select * into o from offers where id = m.offer_id;
  if o.status <> 'activa' then raise exception 'La oferta no admite nuevos clientes'; end if;
  if not coalesce(p_consent, false) then raise exception 'Necesitas el consentimiento del cliente'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Indica el nombre del cliente'; end if;
  phone := normalize_phone(p_phone);
  if phone is null then raise exception 'Teléfono no válido'; end if;

  select * into clash from leads
   where company_id = o.company_id and phone_e164 = phone and status <> 'rechazado'
     and created_at > now() - make_interval(days => setting_int('reserve_days'))
   order by created_at limit 1;
  if found then
    if clash.salesperson_id <> auth.uid() then
      insert into notifications (user_id, kind, title, body)
      values (auth.uid(), 'cliente_reservado', 'Cliente ya registrado',
              'Ese cliente ya está asignado a otro comercial para esta empresa durante 90 días.');
    end if;
    return jsonb_build_object('ok', false, 'reason', case when clash.salesperson_id = auth.uid()
                              then 'duplicado_propio' else 'cliente_reservado' end);
  end if;

  insert into leads (membership_id, offer_id, company_id, salesperson_id, customer_name, phone_e164,
                     email, postal_code, municipality, property_type, notes, consent)
  values (m.id, o.id, o.company_id, auth.uid(), trim(p_name), phone, nullif(p_email, ''),
          nullif(p_postal, ''), nullif(p_municipality, ''), nullif(p_property, ''),
          coalesce(p_notes, ''), p_consent)
  returning id into new_id;

  insert into lead_events (lead_id, actor_id, from_status, to_status)
  values (new_id, auth.uid(), null, 'registrado');
  insert into notifications (user_id, kind, title, body, link)
  select c.owner_id, 'nuevo_lead', 'Nuevo cliente registrado', o.title, '/empresa/leads/' || new_id
  from companies c where c.id = o.company_id;
  return jsonb_build_object('ok', true, 'lead_id', new_id);
end $$;

-- ───────────── Transiciones de estado (empresa) ─────────────
create function set_lead_status(
  p_lead uuid, p_to lead_status, p_amount int default null,
  p_reason reject_reason default null, p_note text default null
) returns leads
language plpgsql security definer set search_path = public as $$
declare
  l leads; m memberships; fee numeric; amt int; cancel_days int := setting_int('cancel_days');
  pay_days int := setting_int('pay_days'); prev lead_status;
begin
  select * into l from leads where id = p_lead for update;
  if not found then raise exception 'Lead no encontrado'; end if;
  prev := l.status;
  if l.company_id is distinct from my_company_id() then raise exception 'No tienes permiso sobre este lead'; end if;
  if (select status from companies where id = l.company_id) <> 'verificada' then
    raise exception 'Tu cuenta no puede validar ventas ahora mismo';
  end if;
  select * into m from memberships where id = l.membership_id;
  fee := fee_percent_for(l.company_id);

  if l.status = 'registrado' and p_to = 'lead_cualificado' then
    if m.terms_snapshot->>'lead_kind' is not null then
      amt := calc_commission_cents((m.terms_snapshot->>'lead_kind')::amount_kind,
               (m.terms_snapshot->>'lead_value')::int, (m.terms_snapshot->>'product_price_cents')::int);
      insert into commissions (lead_id, company_id, salesperson_id, type, amount_cents, fee_percent, fee_cents,
                               status, due_at, confirmed_at)
      values (l.id, l.company_id, l.salesperson_id, 'lead', amt, fee, round(amt * fee / 100)::int,
              'exigible', now() + make_interval(days => pay_days), now());
    end if;
    update leads set status = 'lead_cualificado', qualified_at = now(), needs_review = false, updated_at = now()
     where id = l.id returning * into l;
    insert into lead_events (lead_id, actor_id, from_status, to_status) values (l.id, auth.uid(), 'registrado', 'lead_cualificado');

  elsif l.status in ('registrado', 'lead_cualificado') and p_to = 'rechazado' then
    if p_reason is null then raise exception 'El motivo del rechazo es obligatorio'; end if;
    if p_reason = 'otro' and coalesce(trim(p_note), '') = '' then raise exception 'Explica el motivo'; end if;
    update leads set status = 'rechazado', reject_reason = p_reason, reject_note = p_note,
                     needs_review = false, updated_at = now() where id = l.id returning * into l;
    insert into lead_events (lead_id, actor_id, from_status, to_status, reason)
    values (l.id, auth.uid(), prev, 'rechazado', p_reason || coalesce(': ' || p_note, ''));

  elsif l.status = 'lead_cualificado' and p_to = 'venta' then
    if p_amount is null or p_amount < 0 then raise exception 'Indica el importe de la venta'; end if;
    if m.terms_snapshot->>'sale_kind' is not null then
      amt := calc_commission_cents((m.terms_snapshot->>'sale_kind')::amount_kind,
               (m.terms_snapshot->>'sale_value')::int, p_amount);
      insert into commissions (lead_id, company_id, salesperson_id, type, amount_cents, fee_percent, fee_cents, status)
      values (l.id, l.company_id, l.salesperson_id, 'venta', amt, fee, round(amt * fee / 100)::int, 'pendiente');
    end if;
    update leads set status = 'periodo_cancelacion', sale_amount_cents = p_amount, signed_at = now(),
                     cancel_ends_at = now() + make_interval(days => cancel_days), updated_at = now()
     where id = l.id returning * into l;
    insert into lead_events (lead_id, actor_id, from_status, to_status) values
      (l.id, auth.uid(), 'lead_cualificado', 'venta'),
      (l.id, auth.uid(), 'venta', 'periodo_cancelacion');

  elsif l.status = 'periodo_cancelacion' and p_to = 'cancelada' then
    update commissions set status = 'anulada' where lead_id = l.id and type = 'venta';
    update leads set status = 'cancelada', updated_at = now() where id = l.id returning * into l;
    insert into lead_events (lead_id, actor_id, from_status, to_status, reason)
    values (l.id, auth.uid(), 'periodo_cancelacion', 'cancelada', p_note);

  else
    raise exception 'Transición no permitida: % → %', l.status, p_to;
  end if;

  insert into notifications (user_id, kind, title, body, link)
  values (l.salesperson_id, 'estado_lead', 'Tu cliente ha cambiado de estado',
          'Ahora: ' || l.status, '/comercial/leads/' || l.id);
  return l;
end $$;

-- Tarea programada: pasa a "confirmada" las ventas cuyo periodo de cancelación terminó.
create function confirm_due_sales() returns int
language plpgsql security definer set search_path = public as $$
declare n int; r record;
begin
  n := 0;
  for r in select id from leads where status = 'periodo_cancelacion' and cancel_ends_at <= now() for update skip locked loop
    update leads set status = 'confirmada', updated_at = now() where id = r.id;
    update commissions set status = 'exigible', confirmed_at = now(),
           due_at = now() + make_interval(days => setting_int('pay_days'))
     where lead_id = r.id and type = 'venta' and status = 'pendiente';
    insert into lead_events (lead_id, from_status, to_status, reason)
    values (r.id, 'periodo_cancelacion', 'confirmada', 'Fin del periodo de cancelación');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function confirm_due_sales() from public, anon, authenticated;

-- ───────────── Pagos de comisiones ─────────────
create function company_mark_paid(p_commission uuid) returns commissions
language plpgsql security definer set search_path = public as $$
declare c commissions;
begin
  update commissions set status = 'pagada_empresa', paid_by_company_at = now(), not_received_at = null
   where id = p_commission and company_id = my_company_id() and status in ('exigible', 'no_recibida')
   returning * into c;
  if not found then raise exception 'No se puede marcar como pagada'; end if;
  insert into notifications (user_id, kind, title, body, link)
  values (c.salesperson_id, 'pago_empresa', 'La empresa ha marcado un pago', 'Confirma si lo has recibido', '/comercial/comisiones');
  return c;
end $$;

create function salesperson_confirm_payment(p_commission uuid, p_received boolean) returns commissions
language plpgsql security definer set search_path = public as $$
declare c commissions;
begin
  update commissions set
      status = case when p_received then 'recibida'::commission_status else 'no_recibida' end,
      received_at = case when p_received then now() end,
      not_received_at = case when p_received then null else now() end
   where id = p_commission and salesperson_id = auth.uid() and status = 'pagada_empresa'
   returning * into c;
  if not found then raise exception 'No hay ningún pago pendiente de confirmar'; end if;
  if p_received then
    update leads set status = 'pagada', updated_at = now()
     where id = c.lead_id and status = 'confirmada'
       and not exists (select 1 from commissions x where x.lead_id = c.lead_id and x.status not in ('recibida', 'anulada'));
  end if;
  return c;
end $$;

-- IBAN: solo visible para empresas con comisiones pendientes con ese comercial.
create function get_salesperson_iban(p_salesperson uuid) returns text
language sql stable security definer set search_path = public as $$
  select s.iban from salespeople s
   where s.id = p_salesperson
     and (s.id = auth.uid() or is_admin() or exists (
          select 1 from commissions c
           where c.salesperson_id = s.id and c.company_id = my_company_id()
             and c.status in ('exigible', 'pagada_empresa', 'no_recibida')))
$$;

-- ───────────── RLS ─────────────
alter table sectors              enable row level security;
alter table app_settings         enable row level security;
alter table profiles             enable row level security;
alter table companies            enable row level security;
alter table salespeople          enable row level security;
alter table salesperson_sectors  enable row level security;
alter table offers               enable row level security;
alter table offer_materials      enable row level security;
alter table memberships          enable row level security;
alter table leads                enable row level security;
alter table lead_events          enable row level security;
alter table commissions          enable row level security;
alter table salesperson_invoices enable row level security;
alter table platform_invoices    enable row level security;
alter table disputes             enable row level security;
alter table reports              enable row level security;
alter table reviews              enable row level security;
alter table notifications        enable row level security;

-- Catálogo
create policy sectors_read on sectors for select using (true);
create policy sectors_admin on sectors for all using (is_admin()) with check (is_admin());
create policy settings_read on app_settings for select to authenticated using (true);
create policy settings_admin on app_settings for all using (is_admin()) with check (is_admin());

-- Perfiles: el propio, admin, y las contrapartes con relación comercial
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_counterpart on profiles for select using (
  exists (select 1 from memberships m join offers o on o.id = m.offer_id
           where m.salesperson_id = profiles.id and o.company_id = my_company_id())
  or exists (select 1 from companies c join offers o on o.company_id = c.id
              join memberships m on m.offer_id = o.id
              where c.owner_id = profiles.id and m.salesperson_id = auth.uid()));
create policy profiles_update on profiles for update using (id = auth.uid() or is_admin());

-- Empresas: las verificadas son públicas (marketplace); la propia y el admin ven todo
create policy companies_read on companies for select using (
  status = 'verificada' or owner_id = auth.uid() or is_admin());
create policy companies_update on companies for update using (owner_id = auth.uid() or is_admin());

-- Comerciales: el propio, admin y empresas con relación (el IBAN va por get_salesperson_iban)
create policy salespeople_read on salespeople for select using (
  id = auth.uid() or is_admin()
  or exists (select 1 from memberships m join offers o on o.id = m.offer_id
              where m.salesperson_id = salespeople.id and o.company_id = my_company_id()));
create policy salespeople_update on salespeople for update using (id = auth.uid() or is_admin());
-- El grant por defecto es a nivel de tabla: hay que quitarlo y conceder columna a columna (sin iban).
revoke select on salespeople from anon, authenticated;
grant select (id, nif, fiscal, new_autonomo, zone, experience, photo_path, created_at)
  on salespeople to authenticated;
create policy sp_sectors_read on salesperson_sectors for select using (true);
create policy sp_sectors_write on salesperson_sectors for all
  using (salesperson_id = auth.uid()) with check (salesperson_id = auth.uid());

-- Ofertas
create policy offers_read on offers for select to authenticated using (
  status = 'activa' or company_id = my_company_id() or is_admin());
create policy offers_write on offers for all
  using (company_id = my_company_id() or is_admin())
  with check (company_id = my_company_id() or is_admin());
create policy materials_read on offer_materials for select to authenticated using (
  exists (select 1 from offers o where o.id = offer_id
           and (o.status = 'activa' or o.company_id = my_company_id() or is_admin())));
create policy materials_write on offer_materials for all
  using (exists (select 1 from offers o where o.id = offer_id and o.company_id = my_company_id()))
  with check (exists (select 1 from offers o where o.id = offer_id and o.company_id = my_company_id()));

-- Uniones: se crean con join_offer(); la empresa solo puede aprobar/rechazar
create policy memberships_read on memberships for select using (
  salesperson_id = auth.uid() or is_admin()
  or exists (select 1 from offers o where o.id = offer_id and o.company_id = my_company_id()));
create policy memberships_company_update on memberships for update using (
  exists (select 1 from offers o where o.id = offer_id and o.company_id = my_company_id()));
revoke update on memberships from authenticated;
grant update (status) on memberships to authenticated;

-- Leads, historial, comisiones: solo lectura directa; las escrituras van por funciones
create policy leads_read on leads for select using (
  salesperson_id = auth.uid() or company_id = my_company_id() or is_admin());
create policy lead_events_read on lead_events for select using (
  exists (select 1 from leads l where l.id = lead_id
           and (l.salesperson_id = auth.uid() or l.company_id = my_company_id() or is_admin())));
create policy commissions_read on commissions for select using (
  salesperson_id = auth.uid() or company_id = my_company_id() or is_admin());

create policy sp_invoices_read on salesperson_invoices for select using (
  exists (select 1 from commissions c where c.id = commission_id
           and (c.salesperson_id = auth.uid() or c.company_id = my_company_id() or is_admin())));
create policy sp_invoices_insert on salesperson_invoices for insert with check (
  exists (select 1 from commissions c where c.id = commission_id and c.salesperson_id = auth.uid()
           and c.status in ('exigible', 'pagada_empresa', 'recibida', 'no_recibida')));

create policy platform_invoices_read on platform_invoices for select using (
  company_id = my_company_id() or is_admin());
create policy platform_invoices_admin on platform_invoices for update using (is_admin());

-- Disputas, reportes, valoraciones, notificaciones
create policy disputes_read on disputes for select using (
  is_admin() or exists (select 1 from leads l where l.id = lead_id
    and (l.salesperson_id = auth.uid() or l.company_id = my_company_id())));
create policy disputes_insert on disputes for insert with check (
  opened_by = auth.uid() and exists (select 1 from leads l where l.id = lead_id
    and l.salesperson_id = auth.uid() and l.status in ('rechazado', 'cancelada')));
create policy disputes_admin on disputes for update using (is_admin());

create policy reports_read on reports for select using (reporter_id = auth.uid() or is_admin());
create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy reports_admin on reports for update using (is_admin());

create policy reviews_read on reviews for select to authenticated using (true);
create policy reviews_insert on reviews for insert with check (
  author_id = auth.uid() and exists (
    select 1 from commissions c where c.id = commission_id and c.status = 'recibida'
      and (c.salesperson_id = auth.uid() or c.company_id = my_company_id())));

create policy notifications_own on notifications for select using (user_id = auth.uid());
create policy notifications_mark on notifications for update using (user_id = auth.uid());
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

-- Las funciones de escritura solo las usan usuarios con sesión
revoke execute on function join_offer, register_lead, set_lead_status,
  company_mark_paid, salesperson_confirm_payment, get_salesperson_iban from public, anon;
grant execute on function join_offer, register_lead, set_lead_status,
  company_mark_paid, salesperson_confirm_payment, get_salesperson_iban to authenticated;
