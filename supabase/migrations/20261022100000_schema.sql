-- ComisionaTe · Esquema base (Fase 1)
-- Importes en céntimos (integer). Teléfonos en E.164. Estados como enums.

create extension if not exists pgcrypto;

-- ───────────── Enums ─────────────
create type user_role        as enum ('admin', 'empresa', 'comercial');
create type account_status   as enum ('activo', 'suspendido', 'expulsado', 'baja');
create type company_status   as enum ('pendiente', 'verificada', 'suspendida', 'expulsada', 'baja');
create type fiscal_type      as enum ('autonomo', 'particular');
create type amount_kind      as enum ('fija', 'porcentaje');
create type offer_status     as enum ('borrador', 'activa', 'pausada', 'oculta', 'cerrada');
create type access_mode      as enum ('abierto', 'aprobacion');
create type membership_status as enum ('pendiente', 'activa', 'rechazada', 'desactivada');
create type lead_status      as enum (
  'registrado', 'lead_cualificado', 'venta', 'periodo_cancelacion',
  'confirmada', 'pagada', 'rechazado', 'cancelada'
);
create type reject_reason    as enum (
  'cliente_no_interesado', 'datos_falsos', 'duplicado', 'fuera_de_zona', 'otro'
);
create type commission_type  as enum ('lead', 'venta');
create type commission_status as enum (
  'pendiente',      -- generada pero aún no firme (venta en periodo de cancelación)
  'exigible',       -- firme: la empresa debe pagarla antes de due_at
  'pagada_empresa', -- la empresa marca pagado, falta confirmación del comercial
  'recibida',       -- el comercial confirma recibido
  'no_recibida',    -- el comercial reclama
  'anulada'
);
create type platform_invoice_status as enum ('emitida', 'pagada', 'vencida');
create type dispute_status   as enum ('abierta', 'resuelta_comercial', 'resuelta_empresa');
create type report_status    as enum ('abierto', 'en_revision', 'resuelto');
create type sanction_kind    as enum ('ninguna', 'aviso', 'suspension', 'expulsion');

-- ───────────── Catálogo ─────────────
create table sectors (
  id         smallint generated always as identity primary key,
  slug       text not null unique,
  name       text not null,
  active     boolean not null default true
);

create table app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
insert into app_settings (key, value) values
  ('fee_percent', '10'::jsonb),             -- % global para ComisionaTe
  ('cancel_days', '14'::jsonb),             -- periodo de cancelación
  ('pay_days', '15'::jsonb),                -- plazo de pago de la empresa
  ('reserve_days', '90'::jsonb),            -- cliente reservado
  ('respond_days', '15'::jsonb);            -- plazo de respuesta a un lead

-- ───────────── Usuarios ─────────────
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null,
  full_name   text not null default '',
  email       text not null,
  phone       text,
  status      account_status not null default 'activo',
  anonymized_at timestamptz,
  created_at  timestamptz not null default now()
);

create table companies (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references profiles (id) on delete restrict,
  legal_name    text not null,
  cif           text not null,
  sector_id     smallint references sectors (id),
  logo_path     text,
  description   text not null default '',
  website       text,
  zone          text not null default '',
  billing_address text not null default '',
  billing_email text,
  status        company_status not null default 'pendiente',
  verified_at   timestamptz,
  founder_until date,                           -- 3 meses sin el 10 %
  fee_percent_override numeric(5,2) check (fee_percent_override between 0 and 100),
  late_payments int not null default 0,
  created_at    timestamptz not null default now()
);

create table salespeople (
  id          uuid primary key references profiles (id) on delete cascade,
  nif         text,
  fiscal      fiscal_type not null default 'particular',
  new_autonomo boolean not null default false,  -- IRPF 7 %
  zone        text not null default '',
  experience  text not null default '',
  photo_path  text,
  iban        text,
  created_at  timestamptz not null default now()
);

create table salesperson_sectors (
  salesperson_id uuid references salespeople (id) on delete cascade,
  sector_id      smallint references sectors (id) on delete cascade,
  primary key (salesperson_id, sector_id)
);

-- ───────────── Ofertas ─────────────
create table offers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies (id) on delete cascade,
  sector_id     smallint not null references sectors (id),
  title         text not null,
  description   text not null default '',
  product_price_cents int check (product_price_cents >= 0),
  lead_kind     amount_kind,
  lead_value    int check (lead_value >= 0),      -- céntimos o puntos básicos (100 = 1 %)
  sale_kind     amount_kind,
  sale_value    int check (sale_value >= 0),
  zones         text[] not null default '{}',     -- provincias / códigos postales
  requirements  text not null default '',
  only_autonomos boolean not null default false,
  access        access_mode not null default 'abierto',
  status        offer_status not null default 'borrador',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (lead_kind is not null or sale_kind is not null),
  check ((lead_kind is null) = (lead_value is null)),
  check ((sale_kind is null) = (sale_value is null))
);
create index offers_company_idx on offers (company_id);
create index offers_marketplace_idx on offers (status, sector_id);

create table offer_materials (
  id         uuid primary key default gen_random_uuid(),
  offer_id   uuid not null references offers (id) on delete cascade,
  name       text not null,
  path       text not null,                      -- ruta en Storage
  created_at timestamptz not null default now()
);

-- Unión comercial ↔ oferta (código de referido + condiciones aceptadas)
create table memberships (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references offers (id) on delete cascade,
  salesperson_id uuid not null references salespeople (id) on delete cascade,
  referral_code  text not null unique,
  status         membership_status not null default 'activa',
  accepted_at    timestamptz not null default now(),
  terms_snapshot jsonb not null,                 -- copia inmutable de las condiciones
  created_at     timestamptz not null default now(),
  unique (offer_id, salesperson_id)
);

-- ───────────── Leads y ventas ─────────────
create table leads (
  id              uuid primary key default gen_random_uuid(),
  membership_id   uuid not null references memberships (id) on delete restrict,
  offer_id        uuid not null references offers (id) on delete restrict,
  company_id      uuid not null references companies (id) on delete restrict,
  salesperson_id  uuid not null references salespeople (id) on delete restrict,
  customer_name   text not null,
  phone_e164      text not null,
  email           text,
  postal_code     text,
  municipality    text,
  property_type   text,
  notes           text not null default '',
  consent         boolean not null check (consent),
  status          lead_status not null default 'registrado',
  reject_reason   reject_reason,
  reject_note     text,
  sale_amount_cents int check (sale_amount_cents >= 0),
  qualified_at    timestamptz,
  signed_at       timestamptz,
  cancel_ends_at  timestamptz,
  needs_review    boolean not null default false,
  warned_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index leads_company_idx on leads (company_id, status);
create index leads_salesperson_idx on leads (salesperson_id, status);
create index leads_dedupe_idx on leads (company_id, phone_e164, created_at desc);

create table lead_events (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references leads (id) on delete cascade,
  actor_id    uuid references profiles (id),
  from_status lead_status,
  to_status   lead_status not null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index lead_events_lead_idx on lead_events (lead_id, created_at);

-- ───────────── Comisiones y facturas ─────────────
create table commissions (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads (id) on delete restrict,
  company_id     uuid not null references companies (id) on delete restrict,
  salesperson_id uuid not null references salespeople (id) on delete restrict,
  type           commission_type not null,
  amount_cents   int not null check (amount_cents >= 0),   -- lo que cobra el comercial (íntegro)
  fee_percent    numeric(5,2) not null,                    -- tarifa aplicada a ComisionaTe
  fee_cents      int not null check (fee_cents >= 0),
  status         commission_status not null default 'pendiente',
  due_at         timestamptz,                              -- fin del plazo de pago
  paid_by_company_at timestamptz,
  received_at    timestamptz,
  not_received_at timestamptz,
  confirmed_at   timestamptz,
  platform_invoice_id uuid,
  created_at     timestamptz not null default now(),
  unique (lead_id, type)
);
create index commissions_company_idx on commissions (company_id, status);
create index commissions_salesperson_idx on commissions (salesperson_id, status);

create table salesperson_invoices (
  id            uuid primary key default gen_random_uuid(),
  commission_id uuid not null unique references commissions (id) on delete cascade,
  path          text not null,
  uploaded_at   timestamptz not null default now()
);

create table platform_invoices (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies (id) on delete restrict,
  period       date not null,                             -- primer día del mes facturado
  number       text not null unique,
  total_cents  int not null check (total_cents >= 0),
  status       platform_invoice_status not null default 'emitida',
  issued_at    timestamptz not null default now(),
  due_at       timestamptz not null,
  paid_at      timestamptz,
  stripe_invoice_id text,                                 -- preparado para Stripe
  unique (company_id, period)
);
alter table commissions
  add constraint commissions_platform_invoice_fk
  foreign key (platform_invoice_id) references platform_invoices (id);

-- ───────────── Confianza y soporte ─────────────
create table disputes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads (id) on delete cascade,
  opened_by   uuid not null references profiles (id),
  explanation text not null,
  status      dispute_status not null default 'abierta',
  resolution  text,
  resolved_by uuid references profiles (id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id),
  target_profile_id uuid references profiles (id),
  lead_id     uuid references leads (id),
  reason      text not null,
  status      report_status not null default 'abierto',
  sanction    sanction_kind not null default 'ninguna',
  admin_note  text,
  created_at  timestamptz not null default now(),
  check (target_profile_id is not null or lead_id is not null)
);

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions (id) on delete cascade,
  author_id   uuid not null references profiles (id),
  target_id   uuid not null references profiles (id),
  stars       smallint not null check (stars between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now(),
  unique (commission_id, author_id)
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  link       text,
  read_at    timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read_at, created_at desc);
