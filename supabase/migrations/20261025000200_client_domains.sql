-- =============================================================================
-- Dominios en autoservicio
--   * El cliente compra con su cuenta; el dominio queda a su nombre (perfil
--     WHOIS propio) y aparece en su portal.
--   * Renovación: se cobra al cliente antes del vencimiento (Wompi) y solo
--     entonces se renueva en Hostinger. La renovación automática de Hostinger
--     queda apagada para no pagar dominios que el cliente no pagó.
-- =============================================================================

-- Datos del titular (WHOIS) de cada cliente. Se reutilizan en cada compra.
create table public.client_whois (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  entity_type text not null default 'individual' check (entity_type in ('individual', 'organization')),
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  company text check (char_length(company) <= 120),
  document_id text check (char_length(document_id) <= 30),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (char_length(phone) between 7 and 20),
  address text not null check (char_length(address) between 4 and 160),
  city text not null check (char_length(city) between 2 and 80),
  state text not null check (char_length(state) between 2 and 80),
  zip text not null check (char_length(zip) between 3 and 12),
  country text not null default 'CO' check (country ~ '^[A-Z]{2}$'),
  -- Perfiles creados en Hostinger por extensión: {"com": 123, "co": 456}
  registrar_ids jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.client_whois enable row level security;
create policy "client_whois: el titular lo ve" on public.client_whois
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_employee()));

-- Dominios de cada cliente.
create table public.client_domains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  domain text not null unique check (domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  status text not null default 'active' check (status in ('pending', 'active', 'expiring', 'expired', 'transferred', 'cancelled')),
  registered_at timestamptz not null default now(),
  expires_at timestamptz,
  auto_renew boolean not null default true,
  privacy boolean not null default true,
  locked boolean not null default true,
  subscription_id text,
  renewal_price_cop bigint,
  last_synced_at timestamptz,
  last_reminder_days smallint,
  order_id uuid references public.domain_orders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_domains_owner_idx on public.client_domains (owner_id);
create index client_domains_expiry_idx on public.client_domains (expires_at) where status in ('active', 'expiring');
alter table public.client_domains enable row level security;
create policy "client_domains: dueño o equipo leen" on public.client_domains
  for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_employee()));
-- El cliente solo cambia su preferencia de renovación automática.
create policy "client_domains: dueño cambia renovación" on public.client_domains
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create or replace function public.client_domains_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  -- El cliente solo puede cambiar auto_renew; el resto lo cambia el servidor.
  if not public.is_service() and not public.is_employee()
     and (to_jsonb(new) - 'auto_renew' - 'updated_at') is distinct from (to_jsonb(old) - 'auto_renew' - 'updated_at') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger client_domains_guard before update on public.client_domains
  for each row execute function public.client_domains_guard();

-- Pedidos: dueño, tipo (registro o renovación) y dominio.
alter table public.domain_orders
  add column user_id uuid references public.profiles (id) on delete set null,
  add column kind text not null default 'register' check (kind in ('register', 'renewal')),
  add column domain_id uuid references public.client_domains (id) on delete set null,
  add column registrar_subscription_id text,
  add column receipt jsonb;
create index domain_orders_user_idx on public.domain_orders (user_id, created_at desc);
create policy "domain_orders: el cliente ve los suyos" on public.domain_orders
  for select to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Cuenta de cliente creada por el propio cliente (compra de dominios).
-- El API de administración de Auth inserta el usuario antes de aplicar
-- app_metadata, y handle_new_user exige created_by en ese momento: por eso
-- la cuenta se crea aquí, como admin_create_user, y solo la llama el servidor.
-- -----------------------------------------------------------------------------
create or replace function public.self_signup_client(p_email text, p_password text, p_full_name text, p_phone text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := gen_random_uuid();
  v_email text := lower(btrim(p_email));
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(coalesce(p_password, '')) < 8 or char_length(btrim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'email_exists' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'kind', 'client', 'role', 'client', 'created_by', 'self_signup'),
    jsonb_build_object('full_name', left(btrim(p_full_name), 120), 'phone', left(coalesce(btrim(p_phone), ''), 30)),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', v_email, 'email_verified', true), 'email', now(), now());
  return jsonb_build_object('id', uid, 'email', v_email);
end;
$$;
revoke all on function public.self_signup_client(text, text, text, text) from public, anon, authenticated;
grant execute on function public.self_signup_client(text, text, text, text) to service_role;
