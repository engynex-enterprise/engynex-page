-- =============================================================================
-- Integraciones configurables desde el portal (sin variables de entorno)
--
-- * IDs públicos (GTM, GA4, Google Ads, píxel de Meta): los lee el sitio.
-- * Valores internos (IDs de WhatsApp, nombres de conversiones): solo servidor.
-- * Secretos (tokens, contraseñas): cifrados en Supabase Vault; el portal solo
--   muestra los últimos 4 caracteres y nunca los devuelve completos.
-- Solo el administrador los cambia. La única clave que sigue en el entorno del
-- servidor es SUPABASE_SECRET_KEY: es la que permite leer este almacén.
-- =============================================================================

create table public.integration_settings (
  key text primary key,
  value text check (char_length(value) <= 500),
  secret_id uuid,
  hint text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.integration_settings enable row level security;
-- Sin políticas: nadie la lee directo; todo pasa por las funciones de abajo.

-- Catálogo: clave, ¿secreta?, ¿pública?, formato válido.
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
    ('whatsapp_phone_number_id', false, false, '^[0-9]{6,30}$'),
    ('whatsapp_business_account_id', false, false, '^[0-9]{6,30}$'),
    ('whatsapp_graph_version', false, false, '^v[0-9]{2}\.[0-9]$'),
    ('whatsapp_access_token', true, false, '^\S{20,}$'),
    ('whatsapp_app_secret', true, false, '^[A-Za-z0-9]{16,64}$'),
    ('whatsapp_verify_token', true, false, '^\S{8,}$'),
    ('ads_feed_user', false, false, '^[A-Za-z0-9._-]{3,64}$'),
    ('ads_feed_password', true, false, '^\S{12,}$'),
    ('ads_conversion_qualified', false, false, '^.{2,100}$'),
    ('ads_conversion_meeting', false, false, '^.{2,100}$'),
    ('ads_conversion_won', false, false, '^.{2,100}$'),
    ('cron_secret', true, false, '^\S{24,}$')
$$;

-- Lo que necesita el navegador (sin sesión).
create or replace function public.public_tag_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb)
    from public.integration_settings s
    join public.integration_catalog() c on c.key = s.key
   where c.is_public and s.value is not null
$$;

-- Qué está configurado (sin valores), para las pantallas del equipo.
create or replace function public.integration_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_employee() then
    coalesce(jsonb_object_agg(key, true), '{}'::jsonb)
  end
    from public.integration_settings
   where value is not null or secret_id is not null
$$;

-- Para el administrador: valores no secretos y pista de los secretos.
create or replace function public.admin_get_integrations()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_object_agg(s.key, jsonb_build_object(
             'value', case when c.secret then null else s.value end,
             'set', s.value is not null or s.secret_id is not null,
             'hint', s.hint,
             'updated_at', s.updated_at,
             'updated_by', p.full_name))
      from public.integration_settings s
      join public.integration_catalog() c on c.key = s.key
      left join public.profiles p on p.id = s.updated_by
  ), '{}'::jsonb);
end;
$$;

create or replace function public.admin_set_integration(p_key text, p_value text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  cat record;
  current public.integration_settings;
  v text := nullif(btrim(coalesce(p_value, '')), '');
  sid uuid;
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into cat from public.integration_catalog() c where c.key = p_key;
  if cat.key is null then
    raise exception 'unknown_key' using errcode = '22023';
  end if;
  if v is not null and v !~ cat.pattern then
    raise exception 'invalid_format' using errcode = '22023';
  end if;

  select * into current from public.integration_settings where key = p_key;

  -- Borrar
  if v is null then
    if current.secret_id is not null then
      delete from vault.secrets where id = current.secret_id;
    end if;
    delete from public.integration_settings where key = p_key;
    return;
  end if;

  if cat.secret then
    if current.secret_id is not null then
      perform vault.update_secret(current.secret_id, v);
      sid := current.secret_id;
    else
      sid := vault.create_secret(v, 'integration:' || p_key, 'Engynex: ' || p_key);
    end if;
    insert into public.integration_settings (key, value, secret_id, hint, updated_at, updated_by)
    values (p_key, null, sid, right(v, 4), now(), auth.uid())
    on conflict (key) do update
      set value = null, secret_id = excluded.secret_id, hint = excluded.hint,
          updated_at = now(), updated_by = auth.uid();
  else
    insert into public.integration_settings (key, value, updated_at, updated_by)
    values (p_key, v, now(), auth.uid())
    on conflict (key) do update
      set value = excluded.value, secret_id = null, hint = null, updated_at = now(), updated_by = auth.uid();
  end if;
end;
$$;

-- Todo, con secretos descifrados: solo el servidor (clave secreta).
create or replace function public.integration_config()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_object_agg(s.key, coalesce(s.value, d.decrypted_secret))
      from public.integration_settings s
      left join vault.decrypted_secrets d on d.id = s.secret_id
  ), '{}'::jsonb);
end;
$$;

revoke all on function public.public_tag_config() from public;
revoke all on function public.integration_status() from public, anon;
revoke all on function public.admin_get_integrations() from public, anon;
revoke all on function public.admin_set_integration(text, text) from public, anon;
revoke all on function public.integration_config() from public, anon, authenticated;
grant execute on function public.public_tag_config() to anon, authenticated;
grant execute on function public.integration_status() to authenticated;
grant execute on function public.admin_get_integrations() to authenticated;
grant execute on function public.admin_set_integration(text, text) to authenticated;
grant execute on function public.integration_config() to service_role;
