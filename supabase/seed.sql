-- ComisionaTe · Datos de ejemplo (solo desarrollo). Contraseña de todos: Comisionate123!
-- Se ejecuta con `supabase db reset`.

insert into sectors (slug, name, active) values
  ('solar', 'Placas solares', true),
  ('aerotermia', 'Aerotermia', false);

create function pg_temp.mk_user(p_email text, p_role text, p_name text, p_extra jsonb default '{}') returns uuid
language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
    crypt('Comisionate123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('role', p_role, 'full_name', p_name) || p_extra, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', p_email), 'email', now(), now(), now());
  return uid;
end $$;

do $$
declare
  solar smallint := (select id from sectors where slug = 'solar');
  admin_id uuid; c_ids uuid[] := '{}'; c_owner uuid; cid uuid;
  sp_ids uuid[] := '{}'; sid uuid; i int;
  o_ids uuid[] := '{}'; oid uuid; m_ids uuid[] := '{}'; mid uuid;
  lid uuid; inv uuid; com uuid;
  sp_names text[] := array['Iván Ramos','Lucía Fernández','Carlos Ortega','Marta Beltrán','Pablo Sanz',
                           'Elena Vidal','Javier Molina','Sara Iglesias','Daniel Prieto','Nuria Campos'];
  co_names text[] := array['SolMed Energía','Fotón Hogar','Verde Sur Instalaciones'];
  co_cifs  text[] := array['B12345678','B87654321','B11223344'];
begin
  -- Admin
  admin_id := pg_temp.mk_user('admin@comisionate.test', 'comercial', 'Admin ComisionaTe');
  update profiles set role = 'admin' where id = admin_id;
  delete from salespeople where id = admin_id;

  -- Empresas (la primera es fundadora; la tercera tiene el % personalizado)
  for i in 1..3 loop
    c_owner := pg_temp.mk_user('empresa' || i || '@comisionate.test', 'empresa', co_names[i],
                 jsonb_build_object('legal_name', co_names[i], 'cif', co_cifs[i]));
    update companies set sector_id = solar, status = 'verificada', verified_at = now(),
           description = 'Instalación de placas solares y autoconsumo en ' || (array['Andalucía','Madrid','Valencia'])[i] || '.',
           zone = (array['Andalucía','Madrid','Comunidad Valenciana'])[i],
           website = 'https://example.com',
           billing_address = 'Calle de Ejemplo ' || i || ', ' || (array['Sevilla','Madrid','Valencia'])[i],
           billing_email = 'facturacion' || i || '@example.com',
           founder_until = case when i = 1 then date '2027-01-22' end,
           fee_percent_override = case when i = 3 then 8 end
     where owner_id = c_owner returning id into cid;
    c_ids := c_ids || cid;
  end loop;

  -- Comerciales: 1-5 autónomos, 6-10 particulares
  for i in 1..10 loop
    sid := pg_temp.mk_user('comercial' || i || '@comisionate.test', 'comercial', sp_names[i],
             jsonb_build_object('fiscal', case when i <= 5 then 'autonomo' else 'particular' end,
                                'nif', '1234567' || i || 'A'));
    update salespeople set zone = (array['Sevilla','Madrid','Valencia','Málaga','Madrid',
                                         'Alicante','Córdoba','Madrid','Valencia','Cádiz'])[i],
           experience = 'Experiencia comercial en el sector del hogar.',
           iban = 'ES9121000418450200051' || lpad(i::text, 3, '0'),
           new_autonomo = (i = 2)
     where id = sid;
    insert into salesperson_sectors values (sid, solar);
    sp_ids := sp_ids || sid;
  end loop;

  -- Ofertas
  insert into offers (company_id, sector_id, title, description, product_price_cents,
                      lead_kind, lead_value, sale_kind, sale_value, zones, requirements,
                      only_autonomos, access, status)
  values
   (c_ids[1], solar, 'Instalación solar residencial', 'Paneles + inversor para viviendas unifamiliares.',
    800000, 'fija', 5000, 'fija', 50000, '{Sevilla,Málaga,Córdoba,Cádiz}', 'Vivienda con tejado propio.', false, 'abierto', 'activa'),
   (c_ids[1], solar, 'Autoconsumo para comunidades', 'Instalaciones colectivas en comunidades de vecinos.',
    2500000, null, null, 'porcentaje', 300, '{Sevilla}', 'Contacto con el presidente de la comunidad.', true, 'aprobacion', 'activa'),
   (c_ids[2], solar, 'Kit solar Madrid', 'Kit de autoconsumo con baterías.',
    1200000, 'fija', 7500, 'porcentaje', 400, '{Madrid}', '', false, 'abierto', 'activa'),
   (c_ids[3], solar, 'Solar para empresas y naves', 'Instalaciones industriales.',
    6000000, 'fija', 10000, 'fija', 150000, '{Valencia,Alicante}', 'Cliente con consumo > 5.000 kWh/año.', true, 'abierto', 'activa');
  select array_agg(id order by title) into o_ids from offers;
  -- Orden alfabético: [1]=Autoconsumo comunidades [2]=Instalación residencial [3]=Kit Madrid [4]=Solar empresas

  -- Uniones (se usa la función real para generar códigos y snapshot, simulando la sesión)
  for i in 1..10 loop
    perform set_config('request.jwt.claims', json_build_object('sub', sp_ids[i], 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    if i <> 6 then perform join_offer((select id from offers where title = 'Instalación solar residencial')); end if;
    if i in (2, 3, 4, 5, 6, 8) then perform join_offer((select id from offers where title = 'Kit solar Madrid')); end if;
    if i <= 5 then perform join_offer((select id from offers where title = 'Solar para empresas y naves')); end if;
    perform set_config('role', 'postgres', true);
  end loop;
  perform set_config('request.jwt.claims', '', true);

end $$;

-- ───────────── Leads, comisiones, disputa, impago y facturas ─────────────
create function pg_temp.mk_lead(p_sp int, p_title text, p_name text, p_phone text, p_status lead_status,
                                p_days_ago int default 3, p_amount int default null) returns uuid
language plpgsql as $f$
declare
  mm record; lid uuid; ts timestamptz := now() - make_interval(days => p_days_ago);
  fee numeric; amt int; snap jsonb; signed timestamptz; ends timestamptz;
  qualified boolean := p_status in ('lead_cualificado','periodo_cancelacion','confirmada','pagada','cancelada');
  sold boolean := p_status in ('periodo_cancelacion','confirmada','pagada','cancelada');
begin
  select m.id as mid, m.offer_id, o.company_id, m.salesperson_id, m.terms_snapshot into mm
    from memberships m join offers o on o.id = m.offer_id
   where m.salesperson_id = (select id from profiles where email = 'comercial' || p_sp || '@comisionate.test')
     and o.title = p_title;
  snap := mm.terms_snapshot;
  fee := fee_percent_for(mm.company_id);
  signed := ts + interval '2 days';
  ends := signed + interval '14 days';

  insert into leads (membership_id, offer_id, company_id, salesperson_id, customer_name, phone_e164, email,
                     postal_code, municipality, property_type, notes, consent, status, reject_reason,
                     sale_amount_cents, qualified_at, signed_at, cancel_ends_at, created_at, updated_at)
  values (mm.mid, mm.offer_id, mm.company_id, mm.salesperson_id, p_name, normalize_phone(p_phone),
          lower(replace(p_name, ' ', '.')) || '@example.com', '41001', 'Sevilla', 'Vivienda unifamiliar',
          'Dato de ejemplo', true, p_status,
          case when p_status = 'rechazado' then 'cliente_no_interesado'::reject_reason end,
          case when sold then coalesce(p_amount, 900000) end,
          case when qualified then ts + interval '1 day' end,
          case when sold then signed end, case when sold then ends end, ts, ts)
  returning id into lid;

  insert into lead_events (lead_id, actor_id, from_status, to_status, created_at)
  values (lid, mm.salesperson_id, null, 'registrado', ts);
  if qualified then insert into lead_events (lead_id, from_status, to_status, created_at)
    values (lid, 'registrado', 'lead_cualificado', ts + interval '1 day'); end if;
  if sold then insert into lead_events (lead_id, from_status, to_status, created_at) values
    (lid, 'lead_cualificado', 'periodo_cancelacion', signed); end if;
  if p_status in ('confirmada','pagada') then insert into lead_events (lead_id, from_status, to_status, created_at)
    values (lid, 'periodo_cancelacion', 'confirmada', ends); end if;
  if p_status = 'pagada' then insert into lead_events (lead_id, from_status, to_status, created_at)
    values (lid, 'confirmada', 'pagada', ends + interval '5 days'); end if;
  if p_status = 'cancelada' then insert into lead_events (lead_id, from_status, to_status, reason, created_at)
    values (lid, 'periodo_cancelacion', 'cancelada', 'El cliente se echó atrás', signed + interval '5 days'); end if;
  if p_status = 'rechazado' then insert into lead_events (lead_id, from_status, to_status, reason, created_at)
    values (lid, 'registrado', 'rechazado', 'cliente_no_interesado', ts + interval '1 day'); end if;

  if qualified and snap->>'lead_kind' is not null then
    amt := calc_commission_cents((snap->>'lead_kind')::amount_kind, (snap->>'lead_value')::int,
                                 (snap->>'product_price_cents')::int);
    insert into commissions (lead_id, company_id, salesperson_id, type, amount_cents, fee_percent, fee_cents,
                             status, due_at, confirmed_at, paid_by_company_at, received_at, created_at)
    values (lid, mm.company_id, mm.salesperson_id, 'lead', amt, fee, round(amt * fee / 100)::int,
            case when p_status = 'pagada' then 'recibida'::commission_status else 'exigible' end,
            ts + interval '16 days', ts + interval '1 day',
            case when p_status = 'pagada' then ends end, case when p_status = 'pagada' then ends + interval '5 days' end,
            ts + interval '1 day');
  end if;
  if sold and snap->>'sale_kind' is not null then
    amt := calc_commission_cents((snap->>'sale_kind')::amount_kind, (snap->>'sale_value')::int,
                                 coalesce(p_amount, 900000));
    insert into commissions (lead_id, company_id, salesperson_id, type, amount_cents, fee_percent, fee_cents,
                             status, due_at, confirmed_at, paid_by_company_at, received_at, created_at)
    values (lid, mm.company_id, mm.salesperson_id, 'venta', amt, fee, round(amt * fee / 100)::int,
            case p_status when 'periodo_cancelacion' then 'pendiente'::commission_status
                          when 'cancelada' then 'anulada' when 'pagada' then 'recibida' else 'exigible' end,
            case when p_status in ('confirmada','pagada') then ends + interval '15 days' end,
            case when p_status in ('confirmada','pagada') then ends end,
            case when p_status = 'pagada' then ends + interval '3 days' end,
            case when p_status = 'pagada' then ends + interval '5 days' end, signed);
  end if;
  return lid;
end $f$;

do $$
declare lid uuid; disp_lead uuid; imp record;
begin
  -- Empresa 1 (fundadora: tarifa 0 %): "Instalación solar residencial"
  perform pg_temp.mk_lead(1, 'Instalación solar residencial', 'Ana Torres',   '600111001', 'registrado', 2);
  perform pg_temp.mk_lead(2, 'Instalación solar residencial', 'Luis Pardo',   '600111002', 'lead_cualificado', 6);
  perform pg_temp.mk_lead(3, 'Instalación solar residencial', 'Rosa Gil',     '600111003', 'periodo_cancelacion', 6, 1100000);
  perform pg_temp.mk_lead(4, 'Instalación solar residencial', 'Hugo León',    '600111004', 'confirmada', 22);
  perform pg_temp.mk_lead(5, 'Instalación solar residencial', 'Eva Rubio',    '600111005', 'pagada', 45, 1000000);
  perform pg_temp.mk_lead(1, 'Instalación solar residencial', 'Mario Cano',   '600111006', 'rechazado', 10);
  disp_lead := pg_temp.mk_lead(2, 'Instalación solar residencial', 'Paula Ruiz', '600111007', 'cancelada', 15);
  insert into disputes (lead_id, opened_by, explanation, created_at)
  select disp_lead, salesperson_id, 'El cliente firmó y la cancelación no me consta. Pido revisión.', now() - interval '4 days'
    from leads where id = disp_lead;

  -- Empresa 2 (10 %): "Kit solar Madrid"
  perform pg_temp.mk_lead(3, 'Kit solar Madrid', 'Irene Soto',   '611222001', 'registrado', 17);   -- sin respuesta > 15 días
  update leads set needs_review = true where customer_name = 'Irene Soto';
  perform pg_temp.mk_lead(4, 'Kit solar Madrid', 'Tomás Vega',   '611222002', 'lead_cualificado', 8);
  perform pg_temp.mk_lead(5, 'Kit solar Madrid', 'Clara Nieto',  '611222003', 'pagada', 50, 1300000);
  perform pg_temp.mk_lead(8, 'Kit solar Madrid', 'Óscar Bravo',  '611222004', 'periodo_cancelacion', 4, 1250000);
  perform pg_temp.mk_lead(6, 'Kit solar Madrid', 'Julia Márquez', '611222005', 'confirmada', 20, 1400000);

  -- Empresa 3 (8 %): "Solar para empresas y naves"  → IMPAGO: comisión exigible vencida, "No recibida"
  lid := pg_temp.mk_lead(1, 'Solar para empresas y naves', 'Naves Levante SL', '622333001', 'confirmada', 60, 8000000);
  update commissions set status = 'no_recibida', due_at = now() - interval '12 days',
         paid_by_company_at = now() - interval '9 days', not_received_at = now() - interval '8 days'
   where lead_id = lid and type = 'venta';
  perform pg_temp.mk_lead(2, 'Solar para empresas y naves', 'Talleres Gómez', '622333002', 'lead_cualificado', 5);
  perform pg_temp.mk_lead(3, 'Solar para empresas y naves', 'Agro Huerta SA',  '622333003', 'registrado', 1);

  -- Facturas mensuales de ComisionaTe
  insert into platform_invoices (company_id, period, number, total_cents, status, issued_at, due_at, paid_at)
  select company_id, date '2026-09-01', 'CT-2026-09-' || substr(company_id::text, 1, 4),
         coalesce(sum(fee_cents), 0), 'pagada', now() - interval '20 days', now() - interval '5 days', now() - interval '10 days'
    from commissions where status = 'recibida' and company_id = (select id from companies where legal_name = 'Fotón Hogar')
   group by company_id;
  insert into platform_invoices (company_id, period, number, total_cents, status, issued_at, due_at)
  select id, date '2026-08-01', 'CT-2026-08-' || substr(id::text, 1, 4), 120000, 'vencida',
         now() - interval '50 days', now() - interval '35 days'
    from companies where legal_name = 'Verde Sur Instalaciones';
  update companies set late_payments = 1 where legal_name = 'Verde Sur Instalaciones';

  -- Notificación de ejemplo
  insert into notifications (user_id, kind, title, body, link)
  select id, 'bienvenida', 'Bienvenido a ComisionaTe', 'Datos de ejemplo cargados.', '/'
    from profiles where email like '%@comisionate.test';
end $$;
