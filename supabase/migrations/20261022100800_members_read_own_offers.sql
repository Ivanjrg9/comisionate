-- Un comercial debe poder seguir leyendo las ofertas y empresas en las que participa aunque la oferta se oculte,
-- se cierre o la empresa se suspenda (si no, sus clientes y comisiones no se pueden mostrar).
-- Las funciones son security definer para evitar recursión entre las políticas de offers y memberships.
create function my_offer_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select offer_id from memberships where salesperson_id = auth.uid()
$$;

create function my_member_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select o.company_id from offers o join memberships m on m.offer_id = o.id where m.salesperson_id = auth.uid()
$$;

revoke execute on function my_offer_ids, my_member_company_ids from public, anon;
grant execute on function my_offer_ids, my_member_company_ids to authenticated;

create policy offers_read_member on offers for select to authenticated using (id in (select my_offer_ids()));
create policy companies_read_member on companies for select to authenticated using (id in (select my_member_company_ids()));
