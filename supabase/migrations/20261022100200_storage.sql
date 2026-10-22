-- Buckets: logos y fotos (públicos), materiales de venta y facturas (privados).
-- Las rutas empiezan por el uid del dueño: <uid>/...
insert into storage.buckets (id, name, public) values
  ('logos', 'logos', true),
  ('photos', 'photos', true),
  ('materials', 'materials', false),
  ('invoices', 'invoices', false)
on conflict (id) do nothing;

create policy "own folder write" on storage.objects for all to authenticated
  using (bucket_id in ('logos', 'photos', 'materials', 'invoices') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('logos', 'photos', 'materials', 'invoices') and (storage.foldername(name))[1] = auth.uid()::text);

-- Materiales: los ve cualquier usuario con sesión (marketplace)
create policy "materials read" on storage.objects for select to authenticated
  using (bucket_id = 'materials');

-- Facturas de autónomos: las ve el comercial (su carpeta) y la empresa destinataria
create policy "invoices read by company" on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and exists (
    select 1 from salesperson_invoices si join commissions c on c.id = si.commission_id
     where si.path = storage.objects.name and c.company_id = my_company_id()));

-- Las políticas de lectura públicas de logos/photos ya las da bucket.public = true.
