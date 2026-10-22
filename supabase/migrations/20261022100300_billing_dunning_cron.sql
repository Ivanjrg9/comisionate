-- ComisionaTe · Fase 5: facturación mensual, impagos, plazos y tareas programadas.
-- Todo se ejecuta en base de datos (pg_cron); nada depende del cliente.

alter table commissions
  add column dunning_stage smallint not null default 0,   -- escalado de impago empresa → comercial (0-3)
  add column reminded_at timestamptz;                      -- aviso previo al vencimiento
alter table platform_invoices
  add column dunning_stage smallint not null default 0;    -- escalado de factura impagada (0-3)
alter table companies
  add column suspension_reason text check (suspension_reason in ('impago', 'admin'));

-- ───────────── Notificaciones internas ─────────────
create function notify(p_user uuid, p_kind text, p_title text, p_body text default '', p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link)
$$;

create function notify_admins(p_kind text, p_title text, p_body text default '', p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link from profiles where role = 'admin' and status = 'activo'
$$;

create function notify_company(p_company uuid, p_kind text, p_title text, p_body text default '', p_link text default null)
returns void language sql security definer set search_path = public as $$
  select notify(owner_id, p_kind, p_title, p_body, p_link) from companies where id = p_company
$$;
revoke execute on function notify, notify_admins, notify_company from public, anon, authenticated;

-- ───────────── Estado de impago de una empresa ─────────────
-- Una factura impagada de ComisionaTe con 25+ días impide validar ventas nuevas.
create function company_blocked(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_invoices
                  where company_id = p_company and paid_at is null and issued_at < now() - interval '25 days')
$$;

-- «Empresa con pagos pendientes»: impago a un comercial (+10 días) o factura de ComisionaTe (+25 días).
create function company_in_default(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select company_blocked(p_company)
      or exists (select 1 from commissions where company_id = p_company and status = 'no_recibida' and dunning_stage >= 2)
$$;
grant execute on function company_blocked, company_in_default to authenticated;

create function guard_lead_validation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('lead_cualificado', 'periodo_cancelacion') and new.status is distinct from old.status
     and company_blocked(new.company_id) then
    raise exception 'Tienes una factura de ComisionaTe vencida: págala para poder validar ventas nuevas';
  end if;
  return new;
end $$;
create trigger leads_block_validation before update of status on leads
  for each row execute function guard_lead_validation();

-- Reactiva ofertas (y la cuenta, si se suspendió por impago) cuando ya no hay deuda.
create function restore_company_if_clean(p_company uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if company_in_default(p_company) then return; end if;
  update offers set status = 'activa' where company_id = p_company and status = 'oculta';
  update companies set status = 'verificada', suspension_reason = null
   where id = p_company and status = 'suspendida' and suspension_reason = 'impago';
end $$;
revoke execute on function restore_company_if_clean from public, anon, authenticated;

-- Pagar una comisión puede levantar el castigo.
create or replace function company_mark_paid(p_commission uuid) returns commissions
language plpgsql security definer set search_path = public as $$
declare c commissions;
begin
  update commissions set status = 'pagada_empresa', paid_by_company_at = now(), not_received_at = null
   where id = p_commission and company_id = my_company_id() and status in ('exigible', 'no_recibida')
   returning * into c;
  if not found then raise exception 'No se puede marcar como pagada'; end if;
  perform notify(c.salesperson_id, 'pago_empresa', 'La empresa ha marcado un pago', 'Confirma si lo has recibido', '/comercial/comisiones');
  perform restore_company_if_clean(c.company_id);
  return c;
end $$;

-- ───────────── Factura mensual de ComisionaTe ─────────────
-- Suma las tarifas de las comisiones firmes aún no facturadas hasta el final del mes indicado.
create function generate_monthly_invoices(p_period date default (date_trunc('month', now()) - interval '1 month')::date)
returns int language plpgsql security definer set search_path = public as $$
declare
  r record; inv platform_invoices; created int := 0;
  period_end timestamptz := (p_period + interval '1 month')::timestamptz;
begin
  for r in
    select company_id, sum(fee_cents)::int as total
      from commissions c
     where platform_invoice_id is null and fee_cents > 0
       and status in ('exigible', 'pagada_empresa', 'recibida', 'no_recibida')
       and confirmed_at < period_end
       and not exists (select 1 from platform_invoices pi where pi.company_id = c.company_id and pi.period = p_period)
     group by company_id
  loop
    insert into platform_invoices (company_id, period, number, total_cents, status, issued_at, due_at)
    values (r.company_id, p_period,
            'CT-' || to_char(p_period, 'YYYYMM') || '-' ||
              lpad(((select count(*) from platform_invoices where period = p_period) + 1)::text, 4, '0'),
            r.total, 'emitida', now(), now() + make_interval(days => setting_int('pay_days')))
    returning * into inv;

    update commissions set platform_invoice_id = inv.id
     where company_id = r.company_id and platform_invoice_id is null and fee_cents > 0
       and status in ('exigible', 'pagada_empresa', 'recibida', 'no_recibida') and confirmed_at < period_end;

    perform notify_company(r.company_id, 'factura_emitida', 'Nueva factura de ComisionaTe',
      'Factura ' || inv.number || ' por ' || replace(to_char(r.total / 100.0, 'FM999990.00'), '.', ',') || ' €. Vence el ' || to_char(inv.due_at, 'DD/MM/YYYY'),
      '/empresa/facturas');
    created := created + 1;
  end loop;
  return created;
end $$;

-- Marcar una factura como pagada (el admin, tras recibir la transferencia).
create function admin_mark_invoice_paid(p_invoice uuid) returns platform_invoices
language plpgsql security definer set search_path = public as $$
declare inv platform_invoices;
begin
  if not is_admin() then raise exception 'Solo el administrador puede marcar facturas como pagadas'; end if;
  update platform_invoices set status = 'pagada', paid_at = now() where id = p_invoice and paid_at is null returning * into inv;
  if not found then raise exception 'La factura no existe o ya está pagada'; end if;
  perform notify_company(inv.company_id, 'factura_pagada', 'Factura pagada', 'Hemos registrado el pago de ' || inv.number, '/empresa/facturas');
  perform restore_company_if_clean(inv.company_id);
  return inv;
end $$;
grant execute on function admin_mark_invoice_paid to authenticated;

-- ───────────── Plazos e impagos (se ejecuta cada día) ─────────────
create function process_overdue() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record; s int; target int; days numeric;
  out jsonb := jsonb_build_object('lead_avisos', 0, 'lead_revisiones', 0, 'recordatorios', 0, 'impagos', 0, 'facturas', 0);
begin
  -- 1) Lead sin respuesta: aviso a los 15 días; si sigue igual 7 días después, revisión del admin.
  for r in with u as (update leads set warned_at = now()
            where status = 'registrado' and warned_at is null
              and created_at < now() - make_interval(days => setting_int('respond_days')) returning id, company_id) select * from u loop
    perform notify_company(r.company_id, 'lead_sin_respuesta', 'Tienes un cliente sin atender',
      'Llevas más de 15 días sin actualizar un lead. Respóndelo para evitar la revisión del equipo.', '/empresa/leads/' || r.id);
    out := jsonb_set(out, '{lead_avisos}', to_jsonb((out->>'lead_avisos')::int + 1));
  end loop;
  for r in with u as (update leads set needs_review = true
            where status = 'registrado' and not needs_review and warned_at < now() - interval '7 days' returning id, salesperson_id) select * from u loop
    perform notify_admins('lead_revision', 'Lead sin respuesta pendiente de revisión', 'La empresa no ha respondido tras el aviso.', '/admin/leads/' || r.id);
    perform notify(r.salesperson_id, 'lead_revision', 'Tu cliente está en revisión', 'La empresa no ha respondido; el equipo de ComisionaTe lo revisará.', '/comercial/leads/' || r.id);
    out := jsonb_set(out, '{lead_revisiones}', to_jsonb((out->>'lead_revisiones')::int + 1));
  end loop;

  -- 2) Recordatorio 3 días antes de que venza el pago de una comisión.
  for r in with u as (update commissions set reminded_at = now()
            where status = 'exigible' and reminded_at is null and due_at between now() and now() + interval '3 days' returning company_id, lead_id, due_at) select * from u loop
    perform notify_company(r.company_id, 'pago_proximo', 'Un pago a comercial vence pronto',
      'Vence el ' || to_char(r.due_at, 'DD/MM/YYYY') || '.', '/empresa/comisiones');
    out := jsonb_set(out, '{recordatorios}', to_jsonb((out->>'recordatorios')::int + 1));
  end loop;

  -- 3) Impago empresa → comercial (desde «No recibido»): +3 aviso, +10 segundo aviso y ofertas ocultas, +15 revisión del admin.
  for r in select * from commissions where status = 'no_recibida' and dunning_stage < 3 loop
    days := extract(epoch from now() - r.not_received_at) / 86400;
    target := case when days >= 15 then 3 when days >= 10 then 2 when days >= 3 then 1 else 0 end;
    for s in r.dunning_stage + 1 .. target loop
      if s = 1 then
        perform notify_company(r.company_id, 'impago_aviso', 'Un comercial no ha recibido su comisión',
          'Revisa la transferencia y márcala de nuevo como pagada.', '/empresa/comisiones');
      elsif s = 2 then
        perform notify_company(r.company_id, 'impago_aviso2', 'Segundo aviso: ofertas ocultas',
          'Hemos ocultado tus ofertas del marketplace hasta que se resuelva el pago pendiente.', '/empresa/comisiones');
        update offers set status = 'oculta' where company_id = r.company_id and status = 'activa';
        update companies set late_payments = late_payments + 1 where id = r.company_id;
      else
        perform notify_admins('impago_revision', 'Impago pendiente de revisión',
          'Una comisión lleva 15 días sin cobrarse. Si no se resuelve, suspende la cuenta.', '/admin/empresas/' || r.company_id);
      end if;
    end loop;
    if target > r.dunning_stage then
      update commissions set dunning_stage = target where id = r.id;
      out := jsonb_set(out, '{impagos}', to_jsonb((out->>'impagos')::int + 1));
    end if;
  end loop;

  -- 4) Factura de ComisionaTe sin pagar (días desde la emisión): 15 vencida, 25 ofertas ocultas y sin validar, 30 cuenta suspendida.
  for r in select * from platform_invoices where paid_at is null and dunning_stage < 3 loop
    days := extract(epoch from now() - r.issued_at) / 86400;
    target := case when days >= 30 then 3 when days >= 25 then 2 when days >= 15 then 1 else 0 end;
    for s in r.dunning_stage + 1 .. target loop
      if s = 1 then
        update platform_invoices set status = 'vencida' where id = r.id;
        perform notify_company(r.company_id, 'factura_vencida', 'Factura de ComisionaTe vencida',
          'La factura ' || r.number || ' ha vencido. Págala para evitar restricciones.', '/empresa/facturas');
      elsif s = 2 then
        update offers set status = 'oculta' where company_id = r.company_id and status = 'activa';
        update companies set late_payments = late_payments + 1 where id = r.company_id;
        perform notify_company(r.company_id, 'factura_bloqueo', 'Ofertas ocultas por factura impagada',
          'No podrás validar ventas nuevas hasta pagar la factura ' || r.number || '.', '/empresa/facturas');
      else
        update companies set status = 'suspendida', suspension_reason = 'impago' where id = r.company_id and status = 'verificada';
        perform notify_company(r.company_id, 'cuenta_suspendida', 'Cuenta suspendida por impago',
          'Tu cuenta quedará suspendida hasta que pagues la factura ' || r.number || '.', '/empresa/facturas');
        perform notify_admins('cuenta_suspendida', 'Cuenta suspendida por factura impagada', r.number, '/admin/empresas/' || r.company_id);
      end if;
    end loop;
    if target > r.dunning_stage then
      update platform_invoices set dunning_stage = target where id = r.id;
      out := jsonb_set(out, '{facturas}', to_jsonb((out->>'facturas')::int + 1));
    end if;
  end loop;
  return out;
end $$;

-- La confirmación automática de ventas también avisa a las dos partes.
create or replace function confirm_due_sales() returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; r record;
begin
  for r in select id, company_id, salesperson_id from leads
            where status = 'periodo_cancelacion' and cancel_ends_at <= now() for update skip locked loop
    update leads set status = 'confirmada', updated_at = now() where id = r.id;
    update commissions set status = 'exigible', confirmed_at = now(),
           due_at = now() + make_interval(days => setting_int('pay_days'))
     where lead_id = r.id and type = 'venta' and status = 'pendiente';
    insert into lead_events (lead_id, from_status, to_status, reason)
    values (r.id, 'periodo_cancelacion', 'confirmada', 'Fin del periodo de cancelación');
    perform notify(r.salesperson_id, 'venta_confirmada', 'Tu comisión es firme', 'Terminó el periodo de cancelación sin incidencias.', '/comercial/comisiones');
    perform notify_company(r.company_id, 'venta_confirmada', 'Venta confirmada: toca pagar la comisión',
      'Tienes 15 días para pagarla.', '/empresa/comisiones');
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function generate_monthly_invoices, process_overdue, confirm_due_sales from public, anon, authenticated;

-- ───────────── Tareas programadas ─────────────
create extension if not exists pg_cron;

select cron.schedule('confirm-due-sales', '0 * * * *',  $$select public.confirm_due_sales()$$);
select cron.schedule('process-overdue',   '15 3 * * *', $$select public.process_overdue()$$);
select cron.schedule('monthly-invoices',  '0 4 1 * *',  $$select public.generate_monthly_invoices()$$);
