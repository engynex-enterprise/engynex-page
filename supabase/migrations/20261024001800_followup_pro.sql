-- =============================================================================
-- Seguimiento PRO
--   * Secuencia editable desde el portal (hasta 5 correos, a qué colores de
--     lead, horario de envío) y textos de los correos (es/en).
--   * Métricas de Resend por webhook: entregado, abierto, clic, rebote, queja.
--   * Acciones del equipo: enviar ahora, reprogramar, reintentar, cancelar en
--     lote, inscribir/sacar un lead de la secuencia, escribir un correo,
--     recordar o borrar formularios a medias.
--   * Reporte del seguimiento.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ajustes (una sola fila). Los textos vacíos usan los predeterminados del código.
-- -----------------------------------------------------------------------------

create table public.followup_settings (
  id boolean primary key default true check (id),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.followup_settings (id, config) values (true, $json${
  "tiers": ["yellow"],
  "steps": [
    { "enabled": true, "delay_minutes": 10 },
    { "enabled": true, "delay_minutes": 4320 },
    { "enabled": true, "delay_minutes": 10080 }
  ],
  "window": { "enabled": false, "days": ["1", "2", "3", "4", "5"], "from": "08:00", "to": "18:00" },
  "abandoned_delay_minutes": 60
}$json$::jsonb);

alter table public.followup_settings enable row level security;
create policy "followup_settings: equipo comercial lee" on public.followup_settings
  for select to authenticated
  using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));
create policy "followup_settings: admin y marketing editan" on public.followup_settings
  for update to authenticated
  using ((select public.has_role(array['admin', 'marketing']::public.app_role[])))
  with check ((select public.has_role(array['admin', 'marketing']::public.app_role[])));

create or replace function public.followup_settings_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger followup_settings_touch before update on public.followup_settings
  for each row execute function public.followup_settings_touch();

create or replace function public.followup_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select config from public.followup_settings where id), '{}'::jsonb)
$$;
revoke all on function public.followup_config() from public, anon, authenticated;

-- ¿Se pueden enviar correos de la secuencia ahora? (hora de Colombia)
create or replace function public.followup_in_window()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w jsonb := public.followup_config() -> 'window';
  local timestamp := now() at time zone 'America/Bogota';
begin
  if not coalesce((w ->> 'enabled')::boolean, false) then
    return true;
  end if;
  return (w -> 'days') ? extract(isodow from local)::int::text
     and local::time >= coalesce(w ->> 'from', '00:00')::time
     and local::time < coalesce(w ->> 'to', '23:59')::time;
end;
$$;

-- -----------------------------------------------------------------------------
-- Cola: hasta 5 pasos y métricas del proveedor
-- -----------------------------------------------------------------------------

alter table public.email_queue drop constraint email_queue_kind_check;
alter table public.email_queue add constraint email_queue_kind_check check (kind in (
  'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5', 'booking_confirmation',
  'new_lead_alert', 'abandoned', 'weekly_report', 'custom'
));
alter table public.email_queue
  add column delivered_at timestamptz,
  add column opened_at timestamptz,
  add column clicked_at timestamptz,
  add column bounced_at timestamptz,
  add column complained_at timestamptz,
  add column open_count integer not null default 0,
  add column click_count integer not null default 0,
  add column created_by uuid references public.profiles (id) on delete set null;
create index email_queue_provider_idx on public.email_queue (provider_id) where provider_id is not null;
create index email_queue_sent_idx on public.email_queue (sent_at desc) where sent_at is not null;

alter publication supabase_realtime add table public.email_queue;

-- Encolar la secuencia según los ajustes (desde ahora).
create or replace function public.followup_enqueue(p_lead uuid, p_email text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  step jsonb;
  i int := 0;
  n int := 0;
begin
  for step in select * from jsonb_array_elements(coalesce(public.followup_config() -> 'steps', '[]'::jsonb)) loop
    i := i + 1;
    exit when i > 5;
    if coalesce((step ->> 'enabled')::boolean, true) then
      insert into public.email_queue (kind, lead_id, to_email, send_at, created_by)
      values ('followup_' || i, p_lead, p_email,
              now() + make_interval(mins => greatest(coalesce((step ->> 'delay_minutes')::int, 0), 0)), auth.uid());
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;
revoke all on function public.followup_enqueue(uuid, text) from public, anon, authenticated;

create or replace function public.leads_enqueue_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_opt_out_at is null
     and coalesce(public.followup_config() -> 'tiers', '["yellow"]'::jsonb) ? new.tier::text then
    perform public.followup_enqueue(new.id, new.email);
  end if;
  if new.tier = 'green' then
    insert into public.email_queue (kind, lead_id, to_email) values ('new_lead_alert', new.id, null);
  end if;
  -- Si venía de un formulario a medias, ya no está abandonado.
  update public.lead_drafts set completed_at = now()
   where lower(email) = lower(new.email) and completed_at is null;
  return new;
end;
$$;

-- Recordatorio de formularios a medias: espera configurable.
create or replace function public.jobs_enqueue_abandoned()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
  wait int := greatest(coalesce((public.followup_config() ->> 'abandoned_delay_minutes')::int, 60), 15);
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with picked as (
    update public.lead_drafts d set reminded_at = now()
     where d.completed_at is null and d.reminded_at is null and d.email is not null
       and d.updated_at < now() - make_interval(mins => wait)
       and d.created_at > now() - interval '7 days'
       and not exists (select 1 from public.leads l where lower(l.email) = lower(d.email) and l.created_at > now() - interval '30 days')
    returning d.id, d.email
  )
  insert into public.email_queue (kind, draft_id, to_email) select 'abandoned', id, email from picked;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Toma los correos que tocan (la secuencia respeta el horario de envío).
drop function if exists public.email_claim(integer);
create or replace function public.email_claim(p_limit integer default 50)
returns table (
  id bigint, kind text, to_email text, lead_id uuid, report_id uuid,
  lead jsonb, draft jsonb, report jsonb, payload jsonb
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  in_window boolean := public.followup_in_window();
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.email_queue q set status = 'queued'
   where q.status = 'sending' and q.send_at < now() - interval '15 minutes';

  return query
  with picked as (
    select q.id from public.email_queue q
     where q.status = 'queued' and q.send_at <= now()
       and (in_window or q.kind not like 'followup_%')
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
         case when r.id is null then null else jsonb_build_object('week_start', r.week_start, 'data', r.data) end,
         c.payload
    from claimed c
    left join public.leads l on l.id = c.lead_id
    left join public.lead_drafts d on d.id = c.draft_id
    left join public.weekly_reports r on r.id = c.report_id;
end;
$$;
revoke all on function public.email_claim(integer) from public, anon, authenticated;
grant execute on function public.email_claim(integer) to service_role;

-- Eventos de Resend (webhook firmado; solo el servidor).
create or replace function public.email_event(p_provider_id text, p_type text, p_at timestamptz default now())
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  q public.email_queue;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into q from public.email_queue where provider_id = p_provider_id;
  if q.id is null then
    return;
  end if;
  case p_type
    when 'email.delivered' then
      update public.email_queue set delivered_at = coalesce(delivered_at, p_at) where id = q.id;
    when 'email.opened' then
      update public.email_queue
         set opened_at = coalesce(opened_at, p_at), open_count = open_count + 1,
             delivered_at = coalesce(delivered_at, p_at)
       where id = q.id;
    when 'email.clicked' then
      update public.email_queue
         set clicked_at = coalesce(clicked_at, p_at), click_count = click_count + 1,
             opened_at = coalesce(opened_at, p_at), delivered_at = coalesce(delivered_at, p_at)
       where id = q.id;
    when 'email.bounced' then
      update public.email_queue set bounced_at = coalesce(bounced_at, p_at), error = 'bounced' where id = q.id;
      -- Correo inválido: no tiene sentido seguir la secuencia.
      if q.lead_id is not null then
        update public.email_queue set status = 'cancelled', error = 'bounced'
         where lead_id = q.lead_id and status = 'queued' and kind like 'followup_%';
      end if;
    when 'email.complained' then
      update public.email_queue set complained_at = coalesce(complained_at, p_at) where id = q.id;
      if q.lead_id is not null then
        update public.leads set email_opt_out_at = coalesce(email_opt_out_at, p_at) where id = q.lead_id;
      end if;
    else
      null;
  end case;
end;
$$;
revoke all on function public.email_event(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.email_event(text, text, timestamptz) to service_role;

-- -----------------------------------------------------------------------------
-- Acciones del equipo
-- -----------------------------------------------------------------------------

create or replace function public.followup_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])
$$;

-- p_action: send_now | cancel | retry
create or replace function public.email_bulk(p_ids bigint[], p_action text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_action = 'send_now' then
    update public.email_queue set send_at = now() where id = any (p_ids) and status = 'queued';
  elsif p_action = 'cancel' then
    update public.email_queue set status = 'cancelled', error = 'manual' where id = any (p_ids) and status = 'queued';
  elsif p_action = 'retry' then
    update public.email_queue set status = 'queued', error = null, send_at = now()
     where id = any (p_ids) and status in ('failed', 'cancelled') and bounced_at is null;
  else
    raise exception 'invalid' using errcode = '22023';
  end if;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.email_reschedule(p_id bigint, p_at timestamptz)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.email_queue set send_at = greatest(p_at, now()) where id = p_id and status = 'queued';
end;
$$;

-- Inscribir un lead en la secuencia (reemplaza lo que tuviera programado).
create or replace function public.followup_enroll(p_lead uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l public.leads;
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into l from public.leads where id = p_lead;
  if l.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if l.email_opt_out_at is not null then
    raise exception 'opted_out' using errcode = 'P0001';
  end if;
  update public.email_queue set status = 'cancelled', error = 'manual'
   where lead_id = l.id and status = 'queued' and kind like 'followup_%';
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (l.id, auth.uid(), 'email', 'Inscrito en la secuencia de seguimiento', jsonb_build_object('kind', 'followup_enrolled'));
  return public.followup_enqueue(l.id, l.email);
end;
$$;

create or replace function public.followup_stop(p_lead uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.email_queue set status = 'cancelled', error = 'manual'
   where lead_id = p_lead and status = 'queued' and kind like 'followup_%';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Correo escrito a mano para un lead (se envía con el diseño de Engynex).
create or replace function public.email_compose(p_lead uuid, p jsonb)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l public.leads;
  v_subject text := nullif(btrim(p ->> 'subject'), '');
  v_body text := nullif(btrim(p ->> 'body'), '');
  new_id bigint;
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into l from public.leads where id = p_lead;
  if l.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if l.email_opt_out_at is not null then
    raise exception 'opted_out' using errcode = 'P0001';
  end if;
  if v_subject is null or v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  insert into public.email_queue (kind, lead_id, to_email, send_at, payload, created_by)
  values ('custom', l.id, l.email, greatest(coalesce((p ->> 'send_at')::timestamptz, now()), now()),
          jsonb_build_object(
            'subject', left(v_subject, 200), 'body', left(v_body, 5000),
            'cta_label', nullif(btrim(p ->> 'cta_label'), ''), 'cta_url', nullif(btrim(p ->> 'cta_url'), ''),
            'locale', l.locale, 'email_token', l.email_token, 'manual', true),
          auth.uid())
  returning id into new_id;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (l.id, auth.uid(), 'email', left(v_subject, 200), jsonb_build_object('kind', 'manual', 'queue_id', new_id));
  return new_id;
end;
$$;

-- Formularios a medias: recordar ya (una vez) o borrar.
create or replace function public.draft_remind(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  d public.lead_drafts;
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.lead_drafts set reminded_at = now()
   where id = p_id and completed_at is null and reminded_at is null and email is not null
  returning * into d;
  if d.id is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  insert into public.email_queue (kind, draft_id, to_email, created_by) values ('abandoned', d.id, d.email, auth.uid());
end;
$$;

create or replace function public.draft_delete(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.email_queue where draft_id = p_id and status = 'queued';
  delete from public.lead_drafts where id = p_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reporte
-- -----------------------------------------------------------------------------

create or replace function public.followup_report(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 1), 365);
  since timestamptz := (date_trunc('day', now() at time zone 'America/Bogota') - make_interval(days => d - 1)) at time zone 'America/Bogota';
  prev timestamptz := since - make_interval(days => d);
  result jsonb;
begin
  if not public.followup_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with s as (select * from public.email_queue where status = 'sent' and sent_at >= since),
       p as (select * from public.email_queue where status = 'sent' and sent_at >= prev and sent_at < since),
       enrolled as (
         select q.lead_id, min(q.created_at) as at
           from public.email_queue q
          where q.kind = 'followup_1' and q.created_at >= since and q.lead_id is not null
          group by q.lead_id
       ),
       days as (select (since at time zone 'America/Bogota')::date + g as day from generate_series(0, d - 1) g)
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'sent', (select count(*) from s),
      'sent_prev', (select count(*) from p),
      'delivered', (select count(*) from s where delivered_at is not null),
      'opened', (select count(*) from s where opened_at is not null),
      'opened_prev', (select count(*) from p where opened_at is not null),
      'clicked', (select count(*) from s where clicked_at is not null),
      'bounced', (select count(*) from s where bounced_at is not null),
      'complained', (select count(*) from s where complained_at is not null),
      'tracked', (select count(*) from s where delivered_at is not null or bounced_at is not null),
      'queued', (select count(*) from public.email_queue where status = 'queued'),
      'failed', (select count(*) from public.email_queue where status = 'failed' and created_at >= since),
      'unsubscribed', (select count(*) from public.leads where email_opt_out_at >= since)
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'day', days.day,
               'sequence', (select count(*) from s where (sent_at at time zone 'America/Bogota')::date = days.day and kind like 'followup_%'),
               'automation', (select count(*) from s where (sent_at at time zone 'America/Bogota')::date = days.day and kind in ('custom', 'abandoned', 'booking_confirmation')),
               'internal', (select count(*) from s where (sent_at at time zone 'America/Bogota')::date = days.day and (kind in ('new_lead_alert', 'weekly_report') or coalesce((payload ->> 'internal')::boolean, false))),
               'opened', (select count(*) from s where (sent_at at time zone 'America/Bogota')::date = days.day and opened_at is not null)
             ) order by days.day)
        from days
    ),
    'by_kind', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind', kind, 'sent', sent, 'delivered', delivered, 'opened', opened, 'clicked', clicked, 'bounced', bounced
             ) order by sent desc)
        from (
          select case when kind = 'custom' and coalesce((payload ->> 'manual')::boolean, false) then 'manual' else kind end as kind,
                 count(*) sent, count(delivered_at) delivered, count(opened_at) opened, count(clicked_at) clicked, count(bounced_at) bounced
            from s group by 1
        ) k
    ), '[]'::jsonb),
    'sequence', jsonb_build_object(
      'enrolled', (select count(*) from enrolled),
      'steps', coalesce((
        select jsonb_agg(jsonb_build_object('step', step, 'sent', sent, 'opened', opened, 'clicked', clicked) order by step)
          from (
            select substring(q.kind from 10)::int as step, count(*) filter (where q.status = 'sent') sent,
                   count(q.opened_at) opened, count(q.clicked_at) clicked
              from public.email_queue q join enrolled e on e.lead_id = q.lead_id
             where q.kind like 'followup_%'
             group by 1
          ) x
      ), '[]'::jsonb),
      'booked', (select count(*) from enrolled e where exists (select 1 from public.appointments a where a.lead_id = e.lead_id and a.created_at >= e.at)),
      'advanced', (select count(*) from enrolled e join public.leads l on l.id = e.lead_id where l.status <> 'new'),
      'unsubscribed', (select count(*) from enrolled e join public.leads l on l.id = e.lead_id where l.email_opt_out_at is not null)
    ),
    'abandoned', jsonb_build_object(
      'drafts', (select count(*) from public.lead_drafts where created_at >= since),
      'reminded', (select count(*) from public.lead_drafts where created_at >= since and reminded_at is not null),
      'recovered', (select count(*) from public.lead_drafts where created_at >= since and reminded_at is not null and completed_at > reminded_at)
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.email_bulk(bigint[], text) from public, anon;
revoke all on function public.email_reschedule(bigint, timestamptz) from public, anon;
revoke all on function public.followup_enroll(uuid) from public, anon;
revoke all on function public.followup_stop(uuid) from public, anon;
revoke all on function public.email_compose(uuid, jsonb) from public, anon;
revoke all on function public.draft_remind(uuid) from public, anon;
revoke all on function public.draft_delete(uuid) from public, anon;
revoke all on function public.followup_report(integer) from public, anon;
grant execute on function public.email_bulk(bigint[], text) to authenticated;
grant execute on function public.email_reschedule(bigint, timestamptz) to authenticated;
grant execute on function public.followup_enroll(uuid) to authenticated;
grant execute on function public.followup_stop(uuid) to authenticated;
grant execute on function public.email_compose(uuid, jsonb) to authenticated;
grant execute on function public.draft_remind(uuid) to authenticated;
grant execute on function public.draft_delete(uuid) to authenticated;
grant execute on function public.followup_report(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Secreto del webhook de Resend
-- -----------------------------------------------------------------------------

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
    ('weekly_report', false, false, '^(on|off)$')
$$;
