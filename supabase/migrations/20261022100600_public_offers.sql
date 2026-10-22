-- Marketplace público: cualquiera puede ver las ofertas activas (de empresas verificadas) y las insignias.
-- No se exponen datos de personas ni los materiales de venta.
create policy offers_public_read on offers for select to anon using (status = 'activa');
grant execute on function company_public_stats to anon;
