-- =============================================================================
-- Integraciones PRO
--   * Nuevas claves: alertas a Slack, Microsoft Teams y Google Chat;
--     Microsoft Clarity, LinkedIn Insight, TikTok Pixel; verificación de
--     Google Search Console y Bing Webmaster.
--   * Registro de cambios de cada clave (quién y cuándo, nunca el valor).
--   * Webhooks salientes firmados (HMAC-SHA256) con registro de entregas.
--   * API REST con claves (se guardan con hash; se ven completas una vez).
--   * Calendario ICS personal (agenda + tareas) para Google, Outlook o Apple.
--   * Acción de automatización "Avisar en Slack / Teams / Google Chat".
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
    ('google_chat_webhook_url', true, false, '^https://chat\.googleapis\.com/\S+$')
$$;

-- -----------------------------------------------------------------------------
-- Registro de cambios (sin valores)
-- -----------------------------------------------------------------------------

create table public.integration_audit (
  id bigint generated always as identity primary key,
  key text not null,
  action text not null check (action in ('set', 'removed', 'test_ok', 'test_failed')),
  detail text check (char_length(detail) <= 300),
  actor uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index integration_audit_key_idx on public.integration_audit (key, created_at desc);
alter table public.integration_audit enable row level security;
create policy "integration_audit: admin lee" on public.integration_audit
  for select to authenticated using ((select public.has_role(array['admin']::public.app_role[])));
create policy "integration_audit: admin registra pruebas" on public.integration_audit
  for insert to authenticated
  with check ((select public.has_role(array['admin']::public.app_role[])) and action in ('test_ok', 'test_failed') and actor = (select auth.uid()));

create or replace function public.integration_settings_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.integration_audit (key, action, actor) values (old.key, 'removed', auth.uid());
    return old;
  end if;
  insert into public.integration_audit (key, action, actor) values (new.key, 'set', coalesce(new.updated_by, auth.uid()));
  return new;
end;
$$;
create trigger integration_settings_audit after insert or update or delete on public.integration_settings
  for each row execute function public.integration_settings_audit();

-- Un secreto descifrado (solo funciones internas).
create or replace function public.integration_secret(p_key text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(s.value, d.decrypted_secret)
    from public.integration_settings s
    left join vault.decrypted_secrets d on d.id = s.secret_id
   where s.key = p_key
$$;
revoke all on function public.integration_secret(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Alertas al chat del equipo (Slack, Teams, Google Chat)
-- -----------------------------------------------------------------------------

-- p_channels: [] = todos los configurados; o ["slack","teams","google_chat"].
create or replace function public.team_alert(p_text text, p_link text default null, p_channels jsonb default '[]'::jsonb)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  url text;
  n integer := 0;
  msg text := left(coalesce(p_text, ''), 1500);
  want jsonb := coalesce(p_channels, '[]'::jsonb);
begin
  if msg = '' then
    return 0;
  end if;
  url := public.integration_secret('slack_webhook_url');
  if url is not null and (jsonb_array_length(want) = 0 or want ? 'slack') then
    perform net.http_post(url := url,
      body := jsonb_build_object('text', msg || coalesce(E'\n<' || p_link || '|Abrir en el portal>', '')),
      headers := '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds := 5000);
    n := n + 1;
  end if;
  url := public.integration_secret('teams_webhook_url');
  if url is not null and (jsonb_array_length(want) = 0 or want ? 'teams') then
    perform net.http_post(url := url,
      body := jsonb_build_object('text', msg || coalesce(E'\n\n[Abrir en el portal](' || p_link || ')', '')),
      headers := '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds := 5000);
    n := n + 1;
  end if;
  url := public.integration_secret('google_chat_webhook_url');
  if url is not null and (jsonb_array_length(want) = 0 or want ? 'google_chat') then
    perform net.http_post(url := url,
      body := jsonb_build_object('text', msg || coalesce(E'\n<' || p_link || '|Abrir en el portal>', '')),
      headers := '{"Content-Type":"application/json; charset=UTF-8"}'::jsonb, timeout_milliseconds := 5000);
    n := n + 1;
  end if;
  return n;
end;
$$;
revoke all on function public.team_alert(text, text, jsonb) from public, anon, authenticated;

-- Prueba desde Integraciones.
create or replace function public.team_alert_test(p_channel text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public.team_alert('✅ Prueba de Engynex: las alertas del portal llegan a este canal.', 'https://engynex.com/es/portal', jsonb_build_array(p_channel)) > 0;
end;
$$;
revoke all on function public.team_alert_test(text) from public, anon;
grant execute on function public.team_alert_test(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Webhooks salientes
-- -----------------------------------------------------------------------------

create table public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (url ~ '^https://\S+$' and char_length(url) <= 500),
  events text[] not null default '{}',
  secret text not null default ('whsec_' || encode(extensions.gen_random_bytes(24), 'hex')),
  active boolean not null default true,
  failures integer not null default 0,
  last_status integer,
  last_delivery_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.webhook_deliveries (
  id bigint generated always as identity primary key,
  endpoint_id uuid not null references public.webhook_endpoints (id) on delete cascade,
  event text not null,
  payload jsonb not null,
  request_id bigint,
  status text not null default 'sent' check (status in ('sent', 'ok', 'failed')),
  status_code integer,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index webhook_deliveries_endpoint_idx on public.webhook_deliveries (endpoint_id, created_at desc);
create index webhook_deliveries_pending_idx on public.webhook_deliveries (status) where status = 'sent';

alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
create policy "webhook_endpoints: admin" on public.webhook_endpoints for all to authenticated
  using ((select public.has_role(array['admin']::public.app_role[]))) with check ((select public.has_role(array['admin']::public.app_role[])));
create policy "webhook_deliveries: admin lee" on public.webhook_deliveries for select to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])));

-- Envía un evento a cada endpoint activo suscrito ('*' = todos).
-- Firma: X-Engynex-Signature: sha256=<hex HMAC del cuerpo con el secreto>.
create or replace function public.webhook_emit(p_event text, p_data jsonb, p_endpoint uuid default null)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  e public.webhook_endpoints;
  body jsonb;
  delivery bigint;
  req bigint;
  n integer := 0;
begin
  for e in
    select * from public.webhook_endpoints
     where (p_endpoint is null and active and (p_event = any (events) or '*' = any (events)))
        or id = p_endpoint
  loop
    insert into public.webhook_deliveries (endpoint_id, event, payload) values (e.id, p_event, '{}') returning id into delivery;
    body := jsonb_build_object('id', delivery, 'event', p_event, 'created_at', now(), 'data', p_data);
    select net.http_post(
      url := e.url,
      body := body,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'User-Agent', 'Engynex-Webhooks/1.0',
        'X-Engynex-Event', p_event,
        'X-Engynex-Delivery', delivery::text,
        'X-Engynex-Signature', 'sha256=' || encode(extensions.hmac(body::text, e.secret, 'sha256'), 'hex')),
      timeout_milliseconds := 8000)
      into req;
    update public.webhook_deliveries set payload = body, request_id = req where id = delivery;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.webhook_emit(text, jsonb, uuid) from public, anon, authenticated;

-- Lee las respuestas de pg_net y marca cada entrega (cada minuto).
create or replace function public.webhook_sync()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d record;
  n integer := 0;
begin
  for d in
    select w.id, w.endpoint_id, r.status_code, r.error_msg, r.timed_out
      from public.webhook_deliveries w
      join net._http_response r on r.id = w.request_id
     where w.status = 'sent'
  loop
    update public.webhook_deliveries
       set status = case when d.status_code between 200 and 299 then 'ok' else 'failed' end,
           status_code = d.status_code,
           error = left(coalesce(d.error_msg, case when d.timed_out then 'timeout' end), 300),
           completed_at = now()
     where id = d.id;
    update public.webhook_endpoints
       set last_status = d.status_code, last_delivery_at = now(),
           failures = case when d.status_code between 200 and 299 then 0 else failures + 1 end,
           -- 20 fallos seguidos: se pausa para no insistir.
           active = case when d.status_code between 200 and 299 then active else active and failures + 1 < 20 end
     where id = d.endpoint_id;
    n := n + 1;
  end loop;
  -- Sin respuesta en 10 minutos: fallida.
  update public.webhook_deliveries set status = 'failed', error = 'sin respuesta', completed_at = now()
   where status = 'sent' and created_at < now() - interval '10 minutes';
  delete from public.webhook_deliveries where created_at < now() - interval '30 days';
  return n;
end;
$$;
revoke all on function public.webhook_sync() from public, anon, authenticated;
select cron.schedule('webhooks-sync', '* * * * *', 'select public.webhook_sync()');

create or replace function public.webhook_test(p_endpoint uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public.webhook_emit('test', jsonb_build_object('message', 'Prueba desde Engynex', 'portal', 'https://engynex.com/es/portal'), p_endpoint);
end;
$$;
revoke all on function public.webhook_test(uuid) from public, anon;
grant execute on function public.webhook_test(uuid) to authenticated;

-- Volver a enviar una entrega.
create or replace function public.webhook_redeliver(p_delivery bigint)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.webhook_deliveries;
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into d from public.webhook_deliveries where id = p_delivery;
  if d.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return public.webhook_emit(d.event, d.payload -> 'data', d.endpoint_id);
end;
$$;
revoke all on function public.webhook_redeliver(bigint) from public, anon;
grant execute on function public.webhook_redeliver(bigint) to authenticated;

-- Nuevo secreto de firma.
create or replace function public.webhook_rotate_secret(p_endpoint uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s text := 'whsec_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.webhook_endpoints set secret = s where id = p_endpoint;
  return s;
end;
$$;
revoke all on function public.webhook_rotate_secret(uuid) from public, anon;
grant execute on function public.webhook_rotate_secret(uuid) to authenticated;

-- Los eventos instantáneos de las automatizaciones también salen por webhook.
create or replace function public.automation_fire(p_trigger text, p_entity text, p_id text, p_key text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.automation_rules;
begin
  for r in select * from public.automation_rules where enabled and trigger = p_trigger order by created_at loop
    begin
      perform public.automation_execute(r, p_entity, p_id, p_entity || ':' || p_id || ':' || p_key);
    exception when others then
      raise warning 'automatización % falló: %', r.id, sqlerrm;
    end;
  end loop;
  if exists (select 1 from public.webhook_endpoints where active and (p_trigger = any (events) or '*' = any (events))) then
    begin
      perform public.webhook_emit(p_trigger, jsonb_build_object('entity', p_entity, 'id', p_id)
        || coalesce(public.automation_context(p_entity, p_id) - 'email_token' - 'opted_out' - 'owner', '{}'::jsonb));
    exception when others then
      raise warning 'webhook % falló: %', p_trigger, sqlerrm;
    end;
  end if;
end;
$$;
revoke all on function public.automation_fire(text, text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- API REST: claves
-- -----------------------------------------------------------------------------

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}' check (scopes <@ array['leads:read', 'leads:write', 'tickets:read', 'tickets:write', 'appointments:read']),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  uses integer not null default 0,
  revoked_at timestamptz
);
alter table public.api_keys enable row level security;
create policy "api_keys: admin lee" on public.api_keys for select to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])));
create policy "api_keys: admin revoca" on public.api_keys for update to authenticated
  using ((select public.has_role(array['admin']::public.app_role[]))) with check ((select public.has_role(array['admin']::public.app_role[])));

-- Crea una clave y la devuelve completa (única vez).
create or replace function public.api_key_create(p_name text, p_scopes text[])
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  k text := 'egx_' || encode(extensions.gen_random_bytes(24), 'hex');
  row public.api_keys;
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.api_keys (name, prefix, key_hash, scopes)
  values (btrim(p_name), left(k, 12), encode(extensions.digest(k, 'sha256'), 'hex'), coalesce(p_scopes, '{}'))
  returning * into row;
  return jsonb_build_object('id', row.id, 'key', k, 'prefix', row.prefix);
end;
$$;
revoke all on function public.api_key_create(text, text[]) from public, anon;
grant execute on function public.api_key_create(text, text[]) to authenticated;

-- Valida una clave (solo el servidor) y cuenta el uso. Límite: 600 por hora.
create or replace function public.api_key_check(p_key text, p_scope text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  row public.api_keys;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into row from public.api_keys
   where key_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex') and revoked_at is null;
  if row.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_key');
  end if;
  if not (p_scope = any (row.scopes)) then
    return jsonb_build_object('ok', false, 'error', 'missing_scope');
  end if;
  update public.api_keys set last_used_at = now(), uses = uses + 1 where id = row.id;
  return jsonb_build_object('ok', true, 'id', row.id, 'name', row.name);
end;
$$;
revoke all on function public.api_key_check(text, text) from public, anon, authenticated;
grant execute on function public.api_key_check(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Calendario ICS personal
-- -----------------------------------------------------------------------------

create table public.calendar_feeds (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.calendar_feeds enable row level security;
create policy "calendar_feeds: cada uno el suyo" on public.calendar_feeds for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.calendar_feed_token(p_rotate boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t uuid;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_rotate then
    delete from public.calendar_feeds where user_id = auth.uid();
  end if;
  insert into public.calendar_feeds (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select token into t from public.calendar_feeds where user_id = auth.uid();
  return t;
end;
$$;
revoke all on function public.calendar_feed_token(boolean) from public, anon;
grant execute on function public.calendar_feed_token(boolean) to authenticated;

-- Eventos del calendario para un token (solo el servidor).
create or replace function public.calendar_feed_events(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select f.user_id into uid from public.calendar_feeds f join public.profiles p on p.id = f.user_id and p.active
   where f.token = p_token;
  if uid is null then
    return null;
  end if;
  return jsonb_build_object(
    'user', (select coalesce(full_name, email) from public.profiles where id = uid),
    'appointments', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'starts_at', a.starts_at, 'ends_at', a.ends_at, 'status', a.status,
                                          'channel', a.channel, 'meeting_url', a.meeting_url, 'location', a.location,
                                          'lead', l.name, 'company', l.company, 'lead_id', l.id, 'updated_at', a.updated_at))
        from public.appointments a join public.leads l on l.id = a.lead_id
       where (a.host_id = uid or (a.host_id is null and l.assigned_to = uid))
         and a.starts_at > now() - interval '60 days' and a.status <> 'cancelled'), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'done', t.done, 'updated_at', t.updated_at))
        from public.tasks t
       where t.assigned_to = uid and t.due_at is not null and t.due_at > now() - interval '30 days'), '[]'::jsonb));
end;
$$;
revoke all on function public.calendar_feed_events(uuid) from public, anon, authenticated;
grant execute on function public.calendar_feed_events(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- Acción "Avisar en Slack / Teams / Google Chat" en las automatizaciones
-- -----------------------------------------------------------------------------

create or replace function public.automation_apply(p_rule public.automation_rules, p_entity text, p_ctx jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ctx jsonb := p_ctx;
  act jsonb;
  done jsonb := '[]'::jsonb;
  agent uuid;
  target uuid;
  roles public.app_role[];
  title text;
  body text;
  v_tag text;
  v_email text;
  req bigint;
begin
  for act in select * from jsonb_array_elements(p_rule.actions) loop
    roles := coalesce((select array_agg(x::public.app_role) from jsonb_array_elements_text(act -> 'roles') x), array['admin']::public.app_role[]);

    case act ->> 'type'
    when 'assign' then
      agent := coalesce(nullif(act ->> 'user_id', '')::uuid, public.automation_pick_agent(roles));
      if agent is not null then
        if p_entity in ('lead', 'appointment') then
          update public.leads set assigned_to = agent where id = (ctx ->> 'lead_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'ticket' then
          update public.tickets set assigned_to = agent where id = (ctx ->> 'ticket_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'chat' then
          update public.chat_conversations set assigned_to = agent where id = (ctx ->> 'chat_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'task' then
          update public.tasks set assigned_to = agent where id = (ctx ->> 'task_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'deal' then
          update public.deals set owner_id = agent where id = (ctx ->> 'deal_id')::uuid and (owner_id is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'account' then
          update public.account_details set owner_id = agent where profile_id = (ctx ->> 'account_id')::uuid and (owner_id is null or coalesce((act ->> 'force')::boolean, false));
        end if;
        ctx := ctx || jsonb_build_object('owner', agent);
        done := done || jsonb_build_object('type', 'assign', 'to', agent);
      end if;

    when 'task' then
      target := case act ->> 'assign_to' when 'user' then nullif(act ->> 'user_id', '')::uuid else (ctx ->> 'owner')::uuid end;
      title := left(public.automation_render(coalesce(act ->> 'title', 'Seguimiento'), ctx), 200);
      insert into public.tasks (lead_id, ticket_id, title, description, due_at, assigned_to, priority, type)
      values (nullif(ctx ->> 'lead_id', '')::uuid, nullif(ctx ->> 'ticket_id', '')::uuid, title,
              nullif(left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 2000), ''),
              now() + make_interval(mins => coalesce((act ->> 'due_minutes')::int, 1440)), target,
              case when act ->> 'priority' in ('urgent', 'high', 'medium', 'low') then act ->> 'priority' else 'medium' end,
              case when act ->> 'task_type' in ('call', 'email', 'whatsapp', 'meeting', 'follow_up', 'other') then act ->> 'task_type' else 'follow_up' end);
      if target is not null then
        perform public.notify(null, target, 'task', title, 'Tarea creada por una automatización', ctx ->> 'enlace');
      end if;
      done := done || jsonb_build_object('type', 'task');

    when 'notify' then
      title := left(public.automation_render(coalesce(act ->> 'title', p_rule.name), ctx), 200);
      body := left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 500);
      if act ->> 'to' = 'owner' then
        if (ctx ->> 'owner') is not null then
          perform public.notify(null, (ctx ->> 'owner')::uuid, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
        else
          -- Sin responsable: avisa al equipo elegido (o a gerencia).
          perform public.notify(roles, null, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
        end if;
      elsif act ->> 'to' = 'user' and nullif(act ->> 'user_id', '') is not null then
        perform public.notify(null, (act ->> 'user_id')::uuid, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
      else
        perform public.notify(roles, null, coalesce(act ->> 'kind', case p_entity when 'appointment' then 'meeting' else p_entity end), title, nullif(body, ''), ctx ->> 'enlace');
      end if;
      done := done || jsonb_build_object('type', 'notify');

    when 'email' then
      if act ->> 'to' in ('team', 'user', 'owner') then
        v_email := case act ->> 'to'
          when 'user' then (select email from public.profiles where id = nullif(act ->> 'user_id', '')::uuid)
          when 'owner' then (select email from public.profiles where id = (ctx ->> 'owner')::uuid)
          else null end;
        if act ->> 'to' = 'team' or v_email is not null then
          insert into public.email_queue (kind, lead_id, to_email, payload)
          values ('custom', nullif(ctx ->> 'lead_id', '')::uuid, v_email, jsonb_build_object(
            'subject', public.automation_render(act ->> 'subject', ctx), 'body', public.automation_render(act ->> 'body', ctx),
            'cta_label', 'Abrir en el portal', 'cta_url', ctx ->> 'enlace', 'internal', true));
        end if;
      elsif nullif(ctx ->> 'contact_email', '') is not null and not coalesce((ctx ->> 'opted_out')::boolean, false) then
        insert into public.email_queue (kind, lead_id, to_email, payload)
        values ('custom', nullif(ctx ->> 'lead_id', '')::uuid, ctx ->> 'contact_email', jsonb_build_object(
          'subject', public.automation_render(act ->> 'subject', ctx), 'body', public.automation_render(act ->> 'body', ctx),
          'cta_label', nullif(public.automation_render(act ->> 'cta_label', ctx), ''), 'cta_url', nullif(public.automation_render(act ->> 'cta_url', ctx), ''),
          'locale', ctx ->> 'locale', 'email_token', ctx ->> 'email_token'));
      end if;
      done := done || jsonb_build_object('type', 'email');

    when 'whatsapp' then
      if nullif(ctx ->> 'contact_phone', '') is not null and nullif(act ->> 'template_id', '') is not null
         and public.wa_phone(ctx ->> 'contact_phone') is not null then
        insert into public.wa_messages (campaign_id, template_id, lead_id, phone, name, params)
        values (null, (act ->> 'template_id')::uuid, nullif(ctx ->> 'lead_id', '')::uuid,
                public.wa_phone(ctx ->> 'contact_phone'), ctx ->> 'nombre',
                coalesce((select jsonb_agg(public.automation_render(x, ctx)) from jsonb_array_elements_text(act -> 'params') x), '[]'::jsonb));
      end if;
      done := done || jsonb_build_object('type', 'whatsapp');

    when 'status' then
      if p_entity in ('lead', 'appointment', 'deal') and act ->> 'status' in ('new', 'contacted', 'meeting', 'proposal', 'won', 'lost') then
        update public.leads set status = (act ->> 'status')::public.lead_status where id = (ctx ->> 'lead_id')::uuid;
      elsif p_entity = 'ticket' and act ->> 'status' in ('open', 'in_progress', 'waiting', 'resolved', 'closed') then
        update public.tickets set status = (act ->> 'status')::public.ticket_status where id = (ctx ->> 'ticket_id')::uuid;
      elsif p_entity = 'task' and act ->> 'status' in ('todo', 'in_progress', 'waiting', 'done') then
        update public.tasks set status = act ->> 'status' where id = (ctx ->> 'task_id')::uuid;
      elsif p_entity = 'chat' and act ->> 'status' in ('open', 'closed') then
        update public.chat_conversations set status = act ->> 'status', closed_at = case when act ->> 'status' = 'closed' then now() end
         where id = (ctx ->> 'chat_id')::uuid;
      end if;
      done := done || jsonb_build_object('type', 'status');

    when 'stage' then
      if p_entity = 'account' and act ->> 'stage' in ('onboarding', 'active', 'at_risk', 'paused', 'churned') then
        update public.account_details set stage = act ->> 'stage' where profile_id = (ctx ->> 'account_id')::uuid;
      elsif p_entity = 'deal' and act ->> 'stage' in ('prospecting', 'proposal', 'negotiation', 'won', 'lost') then
        update public.deals set stage = act ->> 'stage' where id = (ctx ->> 'deal_id')::uuid;
      elsif p_entity = 'ticket' and (ctx ->> 'account_id') is not null and act ->> 'stage' in ('onboarding', 'active', 'at_risk', 'paused', 'churned') then
        update public.account_details set stage = act ->> 'stage' where profile_id = (ctx ->> 'account_id')::uuid;
      end if;
      done := done || jsonb_build_object('type', 'stage');

    when 'priority' then
      if p_entity = 'ticket' and act ->> 'priority' in ('critical', 'high', 'medium', 'low') then
        update public.tickets set priority = (act ->> 'priority')::public.ticket_priority where id = (ctx ->> 'ticket_id')::uuid;
      elsif p_entity = 'task' and act ->> 'priority' in ('urgent', 'high', 'medium', 'low') then
        update public.tasks set priority = act ->> 'priority' where id = (ctx ->> 'task_id')::uuid;
      end if;
      done := done || jsonb_build_object('type', 'priority');

    when 'tag' then
      v_tag := left(lower(btrim(coalesce(act ->> 'tag', ''))), 30);
      if v_tag <> '' then
        if p_entity = 'chat' then
          update public.chat_conversations set tags = array(select distinct unnest(tags || array[v_tag])) where id = (ctx ->> 'chat_id')::uuid;
        elsif p_entity = 'ticket' then
          update public.tickets set tags = array(select distinct unnest(tags || array[v_tag])) where id = (ctx ->> 'ticket_id')::uuid;
        elsif p_entity = 'task' then
          update public.tasks set tags = array(select distinct unnest(tags || array[v_tag])) where id = (ctx ->> 'task_id')::uuid;
        elsif p_entity = 'account' then
          update public.account_details set tags = array(select distinct unnest(tags || array[v_tag])) where profile_id = (ctx ->> 'account_id')::uuid;
        end if;
      end if;
      done := done || jsonb_build_object('type', 'tag');

    when 'note' then
      body := left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 4000);
      if body <> '' then
        if p_entity = 'ticket' then
          insert into public.ticket_messages (ticket_id, author_kind, body, internal)
          values ((ctx ->> 'ticket_id')::uuid, 'system', '🤖 ' || body, true);
        elsif p_entity = 'account' then
          insert into public.account_notes (profile_id, author_id, kind, body) values ((ctx ->> 'account_id')::uuid, null, 'note', '🤖 ' || body);
        elsif nullif(ctx ->> 'lead_id', '') is not null then
          insert into public.lead_activities (lead_id, type, body, meta)
          values ((ctx ->> 'lead_id')::uuid, 'note', '🤖 ' || body, jsonb_build_object('automation', p_rule.id));
        end if;
      end if;
      done := done || jsonb_build_object('type', 'note');

    when 'followup' then
      if nullif(ctx ->> 'lead_id', '') is not null then
        if act ->> 'mode' = 'stop' then
          update public.email_queue set status = 'cancelled', error = 'automation'
           where lead_id = (ctx ->> 'lead_id')::uuid and status = 'queued' and kind like 'followup_%';
        elsif not coalesce((ctx ->> 'opted_out')::boolean, false) and nullif(ctx ->> 'contact_email', '') is not null then
          update public.email_queue set status = 'cancelled', error = 'automation'
           where lead_id = (ctx ->> 'lead_id')::uuid and status = 'queued' and kind like 'followup_%';
          perform public.followup_enqueue((ctx ->> 'lead_id')::uuid, ctx ->> 'contact_email');
        end if;
      end if;
      done := done || jsonb_build_object('type', 'followup', 'mode', coalesce(act ->> 'mode', 'enroll'));

    when 'deal' then
      if nullif(ctx ->> 'lead_id', '') is not null
         and not exists (select 1 from public.deals d where d.lead_id = (ctx ->> 'lead_id')::uuid and d.stage not in ('won', 'lost')) then
        insert into public.deals (lead_id, title, value_cop, stage, probability, expected_close, owner_id)
        values ((ctx ->> 'lead_id')::uuid,
                left(public.automation_render(coalesce(nullif(act ->> 'title', ''), '{empresa} · {nombre}'), ctx), 160),
                greatest(0, coalesce((act ->> 'value')::bigint, (ctx ->> 'valor')::bigint, 0)),
                'prospecting', 20, current_date + coalesce((act ->> 'close_days')::int, 30),
                nullif(ctx ->> 'owner', '')::uuid);
      end if;
      done := done || jsonb_build_object('type', 'deal');

    when 'webhook' then
      if coalesce(act ->> 'url', '') ~ '^https://' then
        select net.http_post(
          url := act ->> 'url',
          body := jsonb_build_object('rule', p_rule.name, 'rule_id', p_rule.id, 'trigger', p_rule.trigger, 'entity', p_entity,
                                     'data', ctx - 'email_token' - 'owner', 'sent_at', now()),
          headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'Engynex-Automations'),
          timeout_milliseconds := 5000)
          into req;
        done := done || jsonb_build_object('type', 'webhook', 'request', req);
      end if;
    when 'team_chat' then
      perform public.team_alert(
        left(public.automation_render(coalesce(nullif(act ->> 'body', ''), act ->> 'title', p_rule.name), ctx), 1500),
        ctx ->> 'enlace',
        coalesce(act -> 'channels', '[]'::jsonb));
      done := done || jsonb_build_object('type', 'team_chat');
    else
      null;
    end case;
  end loop;
  return done;
end;
$$;
revoke all on function public.automation_apply(public.automation_rules, text, jsonb) from public, anon, authenticated;

insert into public.automation_rules (template_key, folder, name, description, trigger, params, conditions, actions, enabled, created_by) values
('team_chat_green_lead', 'Ventas', 'Lead verde → aviso en el chat del equipo',
 'Publica en Slack, Teams o Google Chat (los que estén conectados) cada lead verde.',
 'lead_created', '{}', '{"tiers":["green"]}',
 '[{"type":"team_chat","body":"🟢 Nuevo lead verde: *{nombre}* ({empresa}) · puntaje {puntaje}\nNecesita: {problema}"}]', true, null),
('team_chat_critical_ticket', 'Soporte', 'Solicitud crítica → aviso en el chat del equipo',
 'Publica en el chat del equipo las solicitudes críticas.',
 'ticket_created', '{}', '{"priorities":["critical"]}',
 '[{"type":"team_chat","body":"🚨 Solicitud crítica #{numero}: *{asunto}*\nDe {nombre} · {empresa}"}]', true, null),
('team_chat_won', 'Ventas', 'Venta ganada → celebrar en el chat del equipo',
 'Publica cada venta ganada.',
 'lead_won', '{}', '{}',
 '[{"type":"team_chat","body":"🎉 ¡Ganamos a *{nombre}* ({empresa})! Asesor: {asesor}"}]', true, null)
on conflict (template_key) do nothing;
