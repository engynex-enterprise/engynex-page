-- =============================================================================
-- Fase 9 — Automatización de ventas
--   * Correos (Resend): secuencia para leads amarillos, confirmación de
--     reunión, aviso interno de leads verdes, recuperación de formularios
--     abandonados (solo con permiso) e informe semanal.
--   * Lectura con IA del problema del lead (opcional; no cambia el puntaje).
--   * Ejecución programada desde la propia base (pg_cron + pg_net).
-- La cola guarda QUÉ enviar y CUÁNDO; el servidor arma el correo al enviarlo.
-- =============================================================================

-- Nuevas claves de integración.
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
    ('cron_secret', true, false, '^\S{24,}$'),
    ('resend_api_key', true, false, '^re_\S{10,}$'),
    ('email_from', false, false, '^.{3,160}$'),
    ('notify_emails', false, false, '^[^,\s@]+@[^,\s@]+\.[^,\s@]+(\s*,\s*[^,\s@]+@[^,\s@]+\.[^,\s@]+)*$'),
    ('anthropic_api_key', true, false, '^sk-ant-\S{20,}$'),
    ('ai_lead_insights', false, false, '^(on|off)$'),
    ('followup_sequence', false, false, '^(on|off)$'),
    ('abandoned_recovery', false, false, '^(on|off)$'),
    ('weekly_report', false, false, '^(on|off)$')
$$;

-- -----------------------------------------------------------------------------
-- Leads: baja de correos e IA
-- -----------------------------------------------------------------------------

alter table public.leads
  add column email_token uuid not null default gen_random_uuid(),
  add column email_opt_out_at timestamptz,
  add column ai_insights jsonb,
  add column ai_analyzed_at timestamptz,
  add column ai_error text;

create unique index leads_email_token_idx on public.leads (email_token);

-- -----------------------------------------------------------------------------
-- Cola de correos
-- -----------------------------------------------------------------------------

create table public.email_queue (
  id bigint generated always as identity primary key,
  kind text not null check (kind in (
    'followup_1', 'followup_2', 'followup_3', 'booking_confirmation',
    'new_lead_alert', 'abandoned', 'weekly_report'
  )),
  lead_id uuid references public.leads (id) on delete cascade,
  draft_id uuid,
  report_id uuid,
  -- null = destinatarios internos (notify_emails)
  to_email text,
  send_at timestamptz not null default now(),
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'cancelled')),
  error text,
  provider_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index email_queue_due_idx on public.email_queue (status, send_at);
create index email_queue_lead_idx on public.email_queue (lead_id);

alter table public.email_queue enable row level security;
create policy "email_queue: ventas y marketing leen" on public.email_queue
  for select to authenticated
  using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));

-- Encolar la secuencia y los avisos al crear el lead.
create or replace function public.leads_enqueue_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tier = 'yellow' then
    insert into public.email_queue (kind, lead_id, to_email, send_at) values
      ('followup_1', new.id, new.email, now() + interval '10 minutes'),
      ('followup_2', new.id, new.email, now() + interval '3 days'),
      ('followup_3', new.id, new.email, now() + interval '7 days');
  elsif new.tier = 'green' then
    insert into public.email_queue (kind, lead_id, to_email) values ('new_lead_alert', new.id, null);
  end if;
  -- Si venía de un formulario a medias, ya no está abandonado.
  update public.lead_drafts set completed_at = now()
   where lower(email) = lower(new.email) and completed_at is null;
  return new;
end;
$$;

-- La secuencia se detiene sola cuando ventas avanza el lead o se da de baja.
create or replace function public.leads_stop_followups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status <> 'new'
     or new.tier is distinct from old.tier
     or new.email_opt_out_at is not null and old.email_opt_out_at is null then
    update public.email_queue set status = 'cancelled', error = 'stopped'
     where lead_id = new.id and status = 'queued' and kind like 'followup_%';
  end if;
  return new;
end;
$$;

create or replace function public.appointments_enqueue_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.email_queue (kind, lead_id, to_email)
  select 'booking_confirmation', l.id, l.email from public.leads l where l.id = new.lead_id;
  update public.email_queue set status = 'cancelled', error = 'booked'
   where lead_id = new.lead_id and status = 'queued' and kind like 'followup_%';
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Formularios a medias (solo con permiso del visitante)
-- -----------------------------------------------------------------------------

create table public.lead_drafts (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  name text check (char_length(name) <= 120),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  company text check (char_length(company) <= 160),
  step smallint not null default 0,
  answers jsonb not null default '{}',
  locale text check (char_length(locale) <= 5),
  source_page text check (char_length(source_page) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  reminded_at timestamptz
);

create index lead_drafts_pending_idx on public.lead_drafts (updated_at) where completed_at is null;

alter table public.lead_drafts enable row level security;
create policy "lead_drafts: ventas y marketing leen" on public.lead_drafts
  for select to authenticated
  using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));

create trigger leads_enqueue_emails after insert on public.leads
  for each row execute function public.leads_enqueue_emails();
create trigger leads_stop_followups after update on public.leads
  for each row execute function public.leads_stop_followups();
create trigger appointments_enqueue_email after insert on public.appointments
  for each row execute function public.appointments_enqueue_email();

create or replace function public.save_lead_draft(p jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token uuid;
  v_email text := lower(nullif(btrim(p ->> 'email'), ''));
begin
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  begin
    v_token := nullif(p ->> 'token', '')::uuid;
  exception when invalid_text_representation then
    v_token := null;
  end;
  -- Límite: 30 borradores nuevos por minuto en total.
  if v_token is null and (select count(*) from public.lead_drafts where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  update public.lead_drafts
     set name = left(p ->> 'name', 120), email = v_email, phone = left(p ->> 'phone', 40),
         company = left(p ->> 'company', 160), step = least(greatest(coalesce((p ->> 'step')::int, 0), 0), 10),
         answers = case when jsonb_typeof(p -> 'answers') = 'object' then p -> 'answers' else answers end,
         updated_at = now()
   where token = v_token and completed_at is null
  returning token into v_token;

  if v_token is null then
    insert into public.lead_drafts (name, email, phone, company, step, answers, locale, source_page)
    values (left(p ->> 'name', 120), v_email, left(p ->> 'phone', 40), left(p ->> 'company', 160),
            least(greatest(coalesce((p ->> 'step')::int, 0), 0), 10),
            case when jsonb_typeof(p -> 'answers') = 'object' then p -> 'answers' else '{}'::jsonb end,
            left(p ->> 'locale', 5), left(p ->> 'source_page', 500))
    returning token into v_token;
  end if;
  return v_token;
end;
$$;

create or replace function public.get_lead_draft(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('name', name, 'email', email, 'phone', phone, 'company', company, 'step', step, 'answers', answers)
    from public.lead_drafts
   where token = p_token and completed_at is null and created_at > now() - interval '30 days'
$$;

-- Baja de correos (enlace en cada correo).
create or replace function public.email_unsubscribe(p_token uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.leads set email_opt_out_at = coalesce(email_opt_out_at, now()) where email_token = p_token;
  return found;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tareas del servidor (solo service_role)
-- -----------------------------------------------------------------------------

-- Formularios abandonados con permiso → recordatorio (una vez, tras 1 hora).
create or replace function public.jobs_enqueue_abandoned()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with picked as (
    update public.lead_drafts d set reminded_at = now()
     where d.completed_at is null and d.reminded_at is null
       and d.updated_at < now() - interval '1 hour'
       and d.created_at > now() - interval '7 days'
       and not exists (select 1 from public.leads l where lower(l.email) = lower(d.email) and l.created_at > now() - interval '30 days')
    returning d.id, d.email
  )
  insert into public.email_queue (kind, draft_id, to_email) select 'abandoned', id, email from picked;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Toma los correos que tocan, con lo necesario para armarlos.
create or replace function public.email_claim(p_limit integer default 50)
returns table (
  id bigint, kind text, to_email text, lead_id uuid, report_id uuid,
  lead jsonb, draft jsonb, report jsonb
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- "Enviando" atascados más de 15 minutos vuelven a la cola.
  update public.email_queue q set status = 'queued'
   where q.status = 'sending' and q.send_at < now() - interval '15 minutes';

  return query
  with picked as (
    select q.id from public.email_queue q
     where q.status = 'queued' and q.send_at <= now()
     order by q.send_at
     limit greatest(1, least(p_limit, 200))
     for update skip locked
  ), claimed as (
    update public.email_queue q set status = 'sending'
      from picked where q.id = picked.id
    returning q.*
  )
  select c.id, c.kind, c.to_email, c.lead_id, c.report_id,
         case when l.id is null then null else jsonb_build_object(
           'id', l.id, 'name', l.name, 'email', l.email, 'phone', l.phone, 'company', l.company,
           'locale', l.locale, 'tier', l.tier, 'score', l.score, 'status', l.status,
           'problem_category', l.problem_category, 'problem_text', l.problem_text,
           'booking_token', l.booking_token, 'email_token', l.email_token,
           'opted_out', l.email_opt_out_at is not null,
           'appointment', (select jsonb_build_object('starts_at', a.starts_at, 'channel', a.channel)
                             from public.appointments a where a.lead_id = l.id and a.status = 'scheduled'
                             order by a.created_at desc limit 1)
         ) end,
         case when d.id is null then null else jsonb_build_object(
           'name', d.name, 'email', d.email, 'token', d.token, 'locale', d.locale, 'completed', d.completed_at is not null
         ) end,
         case when r.id is null then null else jsonb_build_object('week_start', r.week_start, 'data', r.data) end
    from claimed c
    left join public.leads l on l.id = c.lead_id
    left join public.lead_drafts d on d.id = c.draft_id
    left join public.weekly_reports r on r.id = c.report_id;
end;
$$;

create or replace function public.email_mark(p_id bigint, p_status text, p_error text default null, p_provider_id text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.email_queue
     set status = p_status, error = left(p_error, 500), provider_id = p_provider_id,
         sent_at = case when p_status = 'sent' then now() end
   where id = p_id;
  -- El seguimiento enviado queda en el historial del lead.
  insert into public.lead_activities (lead_id, type, body, meta)
  select q.lead_id, 'email', q.kind, jsonb_build_object('kind', q.kind, 'auto', true)
    from public.email_queue q
   where q.id = p_id and p_status = 'sent' and q.lead_id is not null and q.kind like 'followup_%';
end;
$$;

-- Equipo: cancelar un correo programado.
create or replace function public.email_cancel(p_id bigint)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.email_queue set status = 'cancelled', error = 'manual'
   where id = p_id and status = 'queued'
     and public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])
$$;

-- -----------------------------------------------------------------------------
-- Informe semanal
-- -----------------------------------------------------------------------------

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.weekly_reports enable row level security;
create policy "weekly_reports: equipo comercial lee" on public.weekly_reports
  for select to authenticated
  using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));

create or replace function public.report_data(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with l as (select * from public.leads where created_at >= p_from and created_at < p_to),
       pv as (select * from public.page_views where created_at >= p_from and created_at < p_to),
       ch as (select * from public.chat_conversations where created_at >= p_from and created_at < p_to),
       tk as (select * from public.tickets where created_at >= p_from and created_at < p_to),
       wm as (select * from public.wa_messages where sent_at >= p_from and sent_at < p_to)
  select jsonb_build_object(
    'from', p_from, 'to', p_to,
    'visitors', (select count(distinct visitor_id) from pv),
    'leads', (select count(*) from l),
    'leads_prev', (select count(*) from public.leads where created_at >= p_from - (p_to - p_from) and created_at < p_from),
    'by_tier', (select coalesce(jsonb_object_agg(tier, n), '{}') from (select tier, count(*) n from l group by tier) x),
    'meetings', (select count(*) from public.appointments where created_at >= p_from and created_at < p_to),
    'won', (select count(*) from public.lead_activities where type = 'status_change' and meta ->> 'to' = 'won' and created_at >= p_from and created_at < p_to),
    'won_value', (select coalesce(sum(le.value_cop), 0) from public.leads le
                   where le.status = 'won' and exists (select 1 from public.lead_activities a where a.lead_id = le.id
                     and a.type = 'status_change' and a.meta ->> 'to' = 'won' and a.created_at >= p_from and a.created_at < p_to)),
    'pipeline_open', (select count(*) from public.leads where status in ('new', 'contacted', 'meeting', 'proposal')),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', s, 'leads', n) order by n desc), '[]') from (
                  select coalesce(utm ->> 'utm_source', case when gclid is not null then 'google-ads' end,
                                  nullif(split_part(split_part(referrer, '://', 2), '/', 1), ''), 'direct') s, count(*) n
                    from l group by 1 order by 2 desc limit 5) x),
    'chats', (select count(*) from ch),
    'chats_answered_pct', (select round(100.0 * count(*) filter (where first_response_at is not null) / nullif(count(*), 0)) from ch),
    'chat_first_response_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at)))
                                from ch where first_response_at is not null),
    'chat_rating', (select round(avg(rating)::numeric, 1) from ch where rating is not null),
    'tickets_opened', (select count(*) from tk),
    'tickets_resolved', (select count(*) from public.tickets where resolved_at >= p_from and resolved_at < p_to),
    'tickets_open', (select count(*) from public.tickets where status in ('open', 'in_progress', 'waiting')),
    'wa_sent', (select count(*) from wm),
    'wa_read', (select count(*) from wm where status = 'read'),
    'wa_replied', (select count(*) from wm where replied_at is not null),
    'emails_sent', (select count(*) from public.email_queue where sent_at >= p_from and sent_at < p_to)
  )
$$;

-- Genera (o rehace) el informe de una semana; con correo opcional.
create or replace function public.report_generate(p_week_start date, p_email boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_from timestamptz := (p_week_start::timestamp at time zone 'America/Bogota');
  rid uuid;
begin
  if not (public.is_service() or public.has_role(array['admin']::public.app_role[])) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.weekly_reports (week_start, data)
  values (p_week_start, public.report_data(v_from, v_from + interval '7 days'))
  on conflict (week_start) do update set data = excluded.data, created_at = now()
  returning id into rid;
  if p_email then
    insert into public.email_queue (kind, report_id, to_email) values ('weekly_report', rid, null);
  end if;
  return rid;
end;
$$;

-- Lunes desde las 8 a.m. (Colombia): informe de la semana anterior, una vez.
create or replace function public.jobs_weekly_report()
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  local_now timestamp := now() at time zone 'America/Bogota';
  last_monday date := (date_trunc('week', local_now) - interval '7 days')::date;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if extract(hour from local_now) < 8 or exists (select 1 from public.weekly_reports where week_start = last_monday) then
    return null;
  end if;
  return public.report_generate(last_monday, true);
end;
$$;

-- -----------------------------------------------------------------------------
-- IA: leads pendientes de lectura
-- -----------------------------------------------------------------------------

create or replace function public.ai_pending_leads(p_limit integer default 5)
returns table (id uuid, name text, company text, problem_category text, problem_text text, budget text, decision text, timeline text, tier text, locale text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select l.id, l.name, l.company, l.problem_category, l.problem_text, l.budget, l.decision, l.timeline, l.tier::text, l.locale
    from public.leads l
   where l.ai_analyzed_at is null and l.problem_text is not null and char_length(l.problem_text) >= 15
     and l.created_at > now() - interval '14 days'
   order by l.created_at desc
   limit greatest(1, least(p_limit, 20));
end;
$$;

create or replace function public.ai_store(p_lead uuid, p_insights jsonb, p_error text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.leads
     set ai_insights = coalesce(p_insights, ai_insights), ai_error = left(p_error, 500), ai_analyzed_at = now()
   where id = p_lead;
end;
$$;

-- Volver a analizar un lead (botón en la ficha).
create or replace function public.ai_reset(p_lead uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.leads set ai_analyzed_at = null, ai_error = null
   where id = p_lead and public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])
$$;

-- -----------------------------------------------------------------------------
-- Ejecución automática desde la base (pg_cron + pg_net), activable en el portal
-- -----------------------------------------------------------------------------

create extension if not exists pg_net with schema extensions;

create or replace function public.admin_jobs_schedule(p_url text, p_enabled boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform cron.unschedule(jobid) from cron.job where jobname = 'engynex-jobs';
  if p_enabled then
    if p_url !~ '^https://[^\s/]+/api/jobs/run$' then
      raise exception 'invalid_url' using errcode = '22023';
    end if;
    if not exists (select 1 from public.integration_settings where key = 'cron_secret' and secret_id is not null) then
      raise exception 'missing_cron_secret' using errcode = 'P0001';
    end if;
    -- La clave se lee de Vault en cada ejecución: nunca queda escrita en el cron.
    perform cron.schedule('engynex-jobs', '*/5 * * * *', format($cmd$
      select net.http_get(
        url := %L,
        headers := jsonb_build_object('Authorization', 'Bearer ' || (
          select d.decrypted_secret from vault.decrypted_secrets d
            join public.integration_settings s on s.secret_id = d.id where s.key = 'cron_secret')),
        timeout_milliseconds := 55000)
    $cmd$, p_url));
  end if;
  return public.admin_jobs_status();
end;
$$;

create or replace function public.admin_jobs_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  j record;
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select jobid, command into j from cron.job where jobname = 'engynex-jobs';
  return jsonb_build_object(
    'enabled', j.jobid is not null,
    'url', substring(j.command from 'url := ''([^'']+)'''),
    'last_runs', coalesce((
      select jsonb_agg(jsonb_build_object('at', r.created, 'status', r.status_code, 'error', r.error_msg) order by r.created desc)
        from (select * from net._http_response order by created desc limit 5) r
    ), '[]'::jsonb)
  );
end;
$$;

-- Permisos
revoke all on function public.save_lead_draft(jsonb) from public;
revoke all on function public.get_lead_draft(uuid) from public;
revoke all on function public.email_unsubscribe(uuid) from public;
grant execute on function public.save_lead_draft(jsonb) to anon, authenticated;
grant execute on function public.get_lead_draft(uuid) to anon, authenticated;
grant execute on function public.email_unsubscribe(uuid) to anon, authenticated;

revoke all on function public.jobs_enqueue_abandoned() from public, anon, authenticated;
revoke all on function public.email_claim(integer) from public, anon, authenticated;
revoke all on function public.email_mark(bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.jobs_weekly_report() from public, anon, authenticated;
revoke all on function public.ai_pending_leads(integer) from public, anon, authenticated;
revoke all on function public.ai_store(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.report_data(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.jobs_enqueue_abandoned() to service_role;
grant execute on function public.email_claim(integer) to service_role;
grant execute on function public.email_mark(bigint, text, text, text) to service_role;
grant execute on function public.jobs_weekly_report() to service_role;
grant execute on function public.ai_pending_leads(integer) to service_role;
grant execute on function public.ai_store(uuid, jsonb, text) to service_role;

revoke all on function public.email_cancel(bigint) from public, anon;
revoke all on function public.report_generate(date, boolean) from public, anon;
revoke all on function public.ai_reset(uuid) from public, anon;
revoke all on function public.admin_jobs_schedule(text, boolean) from public, anon;
revoke all on function public.admin_jobs_status() from public, anon;
grant execute on function public.email_cancel(bigint) to authenticated;
grant execute on function public.report_generate(date, boolean) to authenticated, service_role;
grant execute on function public.ai_reset(uuid) to authenticated;
grant execute on function public.admin_jobs_schedule(text, boolean) to authenticated;
grant execute on function public.admin_jobs_status() to authenticated;
