-- =============================================================================
-- Venta de dominios
--   * Búsqueda con la API de Hostinger (disponibilidad y precios del catálogo).
--   * Cobro al cliente con Wompi (checkout web) y confirmación por webhook.
--   * Registro automático en Hostinger cuando el pago se aprueba.
-- =============================================================================

create or replace function public.integration_catalog()
returns table (key text, secret boolean, is_public boolean, pattern text)
language sql
immutable
set search_path = ''
as $$
  values
    ('gtm_id', false, true, '^GTM-[A-Z0-9]{4,12}$'),
    ('ga4_id', false, true, '^G-[A-Z0-9]{4,16}$'),
    ('google_ads_id', false, true, '^AW-[0-9]{6,14}$'),
    ('google_ads_lead_label', false, true, '^[A-Za-z0-9_-]{4,64}$'),
    ('google_ads_booking_label', false, true, '^[A-Za-z0-9_-]{4,64}$'),
    ('meta_pixel_id', false, true, '^[0-9]{6,20}$'),
    ('clarity_id', false, true, '^[a-z0-9]{6,20}$'),
    ('linkedin_partner_id', false, true, '^[0-9]{4,12}$'),
    ('tiktok_pixel_id', false, true, '^[A-Z0-9]{10,30}$'),
    ('gsc_verification', false, true, '^[A-Za-z0-9_-]{20,80}$'),
    ('bing_verification', false, true, '^[A-Fa-f0-9]{32}$'),
    ('whatsapp_phone_number_id', false, false, '^[0-9]{6,30}$'),
    ('whatsapp_business_account_id', false, false, '^[0-9]{6,30}$'),
    ('whatsapp_graph_version', false, false, '^v[0-9]{2}\.[0-9]$'),
    ('whatsapp_access_token', true, false, '^\S{20,}$'),
    ('whatsapp_app_secret', true, false, '^[A-Za-z0-9]{16,64}$'),
    ('whatsapp_verify_token', true, false, '^\S{8,}$'),
    ('meta_page_id', false, false, '^[0-9]{5,30}$'),
    ('meta_page_token', true, false, '^\S{20,}$'),
    ('instagram_account_id', false, false, '^[0-9]{5,30}$'),
    ('ads_feed_user', false, false, '^[A-Za-z0-9._-]{3,64}$'),
    ('ads_feed_password', true, false, '^\S{12,}$'),
    ('ads_conversion_qualified', false, false, '^.{2,100}$'),
    ('ads_conversion_meeting', false, false, '^.{2,100}$'),
    ('ads_conversion_won', false, false, '^.{2,100}$'),
    ('cron_secret', true, false, '^\S{24,}$'),
    ('resend_api_key', true, false, '^re_\S{10,}$'),
    ('resend_webhook_secret', true, false, '^whsec_\S{10,}$'),
    ('email_from', false, false, '^.{3,160}$'),
    ('notify_emails', false, false, '^[^,\s@]+@[^,\s@]+\.[^,\s@]+(\s*,\s*[^,\s@]+@[^,\s@]+\.[^,\s@]+)*$'),
    ('anthropic_api_key', true, false, '^sk-ant-\S{20,}$'),
    ('ai_lead_insights', false, false, '^(on|off)$'),
    ('followup_sequence', false, false, '^(on|off)$'),
    ('abandoned_recovery', false, false, '^(on|off)$'),
    ('weekly_report', false, false, '^(on|off)$'),
    ('slack_webhook_url', true, false, '^https://hooks\.slack\.com/\S+$'),
    ('teams_webhook_url', true, false, '^https://\S+$'),
    ('google_chat_webhook_url', true, false, '^https://chat\.googleapis\.com/\S+$'),
    -- Dominios (Hostinger)
    ('hostinger_api_token', true, false, '^\S{20,}$'),
    ('domain_usd_cop', false, false, '^[0-9]{3,5}$'),
    ('domain_margin_pct', false, false, '^[0-9]{1,3}$'),
    ('domain_tlds', false, false, '^[a-z.]+(\s*,\s*[a-z.]+)*$'),
    ('domain_auto_register', false, false, '^(on|off)$'),
    -- Pagos (Wompi)
    ('wompi_public_key', false, false, '^pub_(test|prod)_\S{10,}$'),
    ('wompi_integrity_secret', true, false, '^(test|prod)_integrity_\S{10,}$'),
    ('wompi_events_secret', true, false, '^(test|prod)_events_\S{10,}$')
$$;

-- -----------------------------------------------------------------------------
-- Pedidos de dominio
-- -----------------------------------------------------------------------------

create table public.domain_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  domain text not null check (domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' and char_length(domain) <= 253),
  years smallint not null default 1 check (years between 1 and 10),
  item_id text,
  price_cop bigint not null check (price_cop > 0),
  cost_cents integer,
  cost_currency text,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  legal_id text check (char_length(legal_id) <= 30),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'registering', 'registered', 'failed', 'declined', 'cancelled', 'manual'
  )),
  payment_provider text not null default 'wompi',
  payment_id text,
  payment_status text,
  registrar_order_id text,
  registrar_status text,
  error text check (char_length(error) <= 500),
  lead_id uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  registered_at timestamptz,
  updated_at timestamptz not null default now()
);
create index domain_orders_status_idx on public.domain_orders (status, created_at desc);
create index domain_orders_email_idx on public.domain_orders (lower(email));

alter table public.domain_orders enable row level security;
-- El equipo los ve; solo el servidor (clave secreta) los crea y actualiza.
create policy "domain_orders: equipo lee" on public.domain_orders
  for select to authenticated using ((select public.is_employee()));
create policy "domain_orders: admin actualiza" on public.domain_orders
  for update to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

create or replace function public.domain_orders_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger domain_orders_touch before update on public.domain_orders
  for each row execute function public.domain_orders_touch();

-- Estado de un pedido para la página de resultado (solo con la referencia).
create or replace function public.domain_order_status(p_reference text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('domain', domain, 'status', status, 'price_cop', price_cop, 'created_at', created_at,
                            'registered_at', registered_at)
    from public.domain_orders where reference = p_reference
$$;
revoke all on function public.domain_order_status(text) from public;
grant execute on function public.domain_order_status(text) to anon, authenticated;

-- Reintentos automáticos del registro (lo hace la tarea programada).
alter table public.domain_orders
  add column register_attempts smallint not null default 0,
  add column last_attempt_at timestamptz;
