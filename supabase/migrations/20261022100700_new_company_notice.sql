-- Avisa a los administradores cuando se registra una empresa nueva (hay que verificarla).
create function on_company_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify_admins('empresa_nueva', 'Nueva empresa por verificar', new.legal_name, '/admin/empresas/' || new.id);
  return new;
end $$;
create trigger companies_notify_admins after insert on companies
  for each row execute function on_company_created();
