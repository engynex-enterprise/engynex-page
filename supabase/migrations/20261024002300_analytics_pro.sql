-- =============================================================================
-- Analítica PRO
--   * Eventos (clics a WhatsApp, llamadas, correo, enlaces externos, botones,
--     formulario iniciado/pasos/enviado, chat, reunión) — solo con consentimiento.
--   * Navegador y sistema operativo en cada vista.
--   * Canales (directo, orgánico, pago, social, correo, referidos), campañas
--     UTM, páginas de entrada/salida, rebote, embudo, horas y "en vivo".
--   Todo compara con el periodo anterior de la misma duración.
-- =============================================================================

alter table public.page_views
  add column browser text check (char_length(browser) <= 30),
  add column os text check (char_length(os) <= 30);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  visitor_id text not null references public.visitors (id) on delete cascade,
  session_id text check (char_length(session_id) <= 64),
  name text not null check (name ~ '^[a-z_]{2,40}$'),
  label text check (char_length(label) <= 200),
  path text check (char_length(path) <= 500),
  created_at timestamptz not null default now()
);
create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_name_idx on public.analytics_events (name, created_at desc);

alter table public.analytics_events enable row level security;
create policy "analytics_events: empleados leen" on public.analytics_events
  for select to authenticated using ((select public.is_employee()));

create or replace function public.track_event(p jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_visitor text := p ->> 'visitor_id';
begin
  if v_visitor is null or v_visitor !~ '^[0-9a-f-]{36}$' or coalesce(p ->> 'name', '') !~ '^[a-z_]{2,40}$' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if not exists (select 1 from public.visitors where id = v_visitor) then
    return;
  end if;
  -- Límite anti-abuso: 200 eventos por visitante por hora.
  if (select count(*) from public.analytics_events where visitor_id = v_visitor and created_at > now() - interval '1 hour') >= 200 then
    return;
  end if;
  insert into public.analytics_events (visitor_id, session_id, name, label, path)
  values (v_visitor, left(p ->> 'session_id', 64), p ->> 'name', left(p ->> 'label', 200), left(p ->> 'path', 500));
end;
$$;
revoke all on function public.track_event(jsonb) from public;
grant execute on function public.track_event(jsonb) to anon, authenticated;

-- Vistas: guarda también navegador y sistema.
create or replace function public.track_page_view(p jsonb)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_visitor text := p ->> 'visitor_id';
  v_path text := left(p ->> 'path', 500);
  new_id bigint;
begin
  if v_visitor is null or v_visitor !~ '^[0-9a-f-]{36}$' or v_path is null or left(v_path, 1) <> '/' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if (select count(*) from public.page_views
      where visitor_id = v_visitor and created_at > now() - interval '1 hour') >= 120 then
    return null;
  end if;

  insert into public.visitors as v (
    id, first_landing, first_referrer, first_utm, first_gclid, device, country, page_views
  ) values (
    v_visitor, v_path, left(p ->> 'referrer', 500),
    case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end,
    left(p ->> 'gclid', 200),
    case when p ->> 'device' in ('mobile', 'tablet', 'desktop') then p ->> 'device' end,
    left(upper(p ->> 'country'), 2), 1
  )
  on conflict (id) do update
    set last_seen = now(),
        page_views = v.page_views + 1,
        device = coalesce(excluded.device, v.device),
        country = coalesce(v.country, excluded.country);

  insert into public.page_views (
    visitor_id, session_id, path, title, referrer, utm, locale, device, country, browser, os
  ) values (
    v_visitor, left(p ->> 'session_id', 64), v_path, left(p ->> 'title', 300),
    left(p ->> 'referrer', 500),
    case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end,
    left(p ->> 'locale', 5),
    case when p ->> 'device' in ('mobile', 'tablet', 'desktop') then p ->> 'device' end,
    left(upper(p ->> 'country'), 2),
    left(p ->> 'browser', 30), left(p ->> 'os', 30)
  )
  returning id into new_id;
  return new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Clasificación del origen
-- -----------------------------------------------------------------------------

create or replace function public.analytics_channel(p_utm jsonb, p_gclid text, p_referrer text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_gclid is not null or lower(coalesce(p_utm ->> 'utm_medium', '')) in ('cpc', 'ppc', 'paid', 'paidsocial', 'paid_social', 'ads', 'display') then 'paid'
    when lower(coalesce(p_utm ->> 'utm_medium', '')) in ('email', 'e-mail', 'newsletter') then 'email'
    when lower(coalesce(p_utm ->> 'utm_source', '')) ~ '(facebook|instagram|linkedin|tiktok|twitter|^x$|youtube|whatsapp)'
      or lower(coalesce(p_referrer, '')) ~ '(facebook\.|instagram\.|linkedin\.|lnkd\.in|tiktok\.|t\.co/|twitter\.|x\.com|youtube\.|whatsapp\.|wa\.me)' then 'social'
    when lower(coalesce(p_referrer, '')) ~ '(google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|baidu\.|yandex\.)' then 'organic'
    when p_utm ->> 'utm_source' is not null then 'campaign'
    when coalesce(p_referrer, '') = '' then 'direct'
    else 'referral'
  end
$$;

create or replace function public.analytics_source(p_utm jsonb, p_gclid text, p_referrer text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    lower(p_utm ->> 'utm_source'),
    case when p_gclid is not null then 'google-ads' end,
    nullif(regexp_replace(split_part(split_part(p_referrer, '://', 2), '/', 1), '^www\.', ''), ''),
    'direct'
  )
$$;

-- -----------------------------------------------------------------------------
-- Resumen con comparación
-- -----------------------------------------------------------------------------

create or replace function public.analytics_kpis(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with pv as (select * from public.page_views where created_at >= p_from and created_at < p_to),
       s as (select session_id, count(*) n, sum(coalesce(duration_ms, 0)) dur from pv group by session_id),
       lds as (select * from public.leads where created_at >= p_from and created_at < p_to)
  select jsonb_build_object(
    'visitors', (select count(distinct visitor_id) from pv),
    'new_visitors', (select count(*) from public.visitors where first_seen >= p_from and first_seen < p_to),
    'sessions', (select count(*) from s),
    'page_views', (select count(*) from pv),
    'pages_per_session', (select round(avg(n)::numeric, 1) from s),
    'avg_session_ms', (select coalesce(round(avg(dur)), 0)::bigint from s),
    'avg_duration_ms', (select coalesce(avg(duration_ms) filter (where duration_ms > 0), 0)::int from pv),
    'bounce_rate', (select round(100.0 * count(*) filter (where n = 1) / nullif(count(*), 0)) from s),
    'leads', (select count(*) from lds),
    'green', (select count(*) from lds where tier = 'green'),
    'tracked_leads', (select count(*) from lds where visitor_id is not null and exists (select 1 from pv where pv.visitor_id = lds.visitor_id)),
    'events', (select count(*) from public.analytics_events where created_at >= p_from and created_at < p_to)
  )
$$;
revoke all on function public.analytics_kpis(timestamptz, timestamptz) from public, anon, authenticated;

create or replace function public.analytics_overview(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  span interval := p_to - p_from;
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'kpis', public.analytics_kpis(p_from, p_to),
    'prev', public.analytics_kpis(p_from - span, p_from),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'day', d::date,
               'visitors', (select count(distinct visitor_id) from public.page_views
                             where (created_at at time zone 'America/Bogota')::date = d::date),
               'views', (select count(*) from public.page_views where (created_at at time zone 'America/Bogota')::date = d::date),
               'prev_visitors', (select count(distinct visitor_id) from public.page_views
                                  where (created_at at time zone 'America/Bogota')::date = (d - span)::date),
               'leads', (select count(*) from public.leads where (created_at at time zone 'America/Bogota')::date = d::date),
               'green', (select count(*) from public.leads where tier = 'green' and (created_at at time zone 'America/Bogota')::date = d::date)
             ) order by d), '[]'::jsonb)
        from generate_series((p_from at time zone 'America/Bogota')::date, (p_to at time zone 'America/Bogota')::date - 1, interval '1 day') d
    ),
    'live', (select count(distinct visitor_id) from public.page_views where created_at > now() - interval '5 minutes')
  ) into result;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Adquisición
-- -----------------------------------------------------------------------------

create or replace function public.analytics_acquisition(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with v as (
    select vi.id, vi.lead_id,
           public.analytics_channel(vi.first_utm, vi.first_gclid, vi.first_referrer) as channel,
           public.analytics_source(vi.first_utm, vi.first_gclid, vi.first_referrer) as source,
           lower(vi.first_utm ->> 'utm_medium') as medium,
           vi.first_utm ->> 'utm_campaign' as campaign
      from public.visitors vi
     where vi.first_seen >= p_from and vi.first_seen < p_to
  ),
  -- Leads del periodo con su origen (por su visitante o por lo que trajo el formulario).
  l as (
    select ld.id, ld.tier, ld.status, ld.value_cop,
           coalesce(public.analytics_channel(vi.first_utm, vi.first_gclid, vi.first_referrer),
                    public.analytics_channel(ld.utm, ld.gclid, ld.referrer)) as channel,
           coalesce(public.analytics_source(vi.first_utm, vi.first_gclid, vi.first_referrer),
                    public.analytics_source(ld.utm, ld.gclid, ld.referrer)) as source,
           coalesce(vi.first_utm ->> 'utm_campaign', ld.utm ->> 'utm_campaign') as campaign
      from public.leads ld
      left join public.visitors vi on vi.id = ld.visitor_id
     where ld.created_at >= p_from and ld.created_at < p_to
  ),
  views as (
    select pv.visitor_id, count(*) n, count(distinct session_id) sessions,
           count(*) filter (where true) as views
      from public.page_views pv where pv.created_at >= p_from and pv.created_at < p_to group by pv.visitor_id
  )
  select jsonb_build_object(
    'channels', coalesce((
      select jsonb_agg(row_to_json(x) order by x.visitors desc) from (
        select c.channel,
               (select count(*) from v where v.channel = c.channel) as visitors,
               (select coalesce(sum(views.sessions), 0) from v join views on views.visitor_id = v.id where v.channel = c.channel) as sessions,
               (select count(*) from l where l.channel = c.channel) as leads,
               (select count(*) from l where l.channel = c.channel and l.tier = 'green') as green,
               (select coalesce(sum(value_cop), 0) from l where l.channel = c.channel and l.status = 'won') as won_value
          from (select channel from v union select channel from l) c
      ) x
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(row_to_json(x) order by x.visitors desc, x.leads desc) from (
        select s.source,
               (select count(*) from v where v.source = s.source) as visitors,
               (select count(*) from l where l.source = s.source) as leads,
               (select count(*) from l where l.source = s.source and l.tier = 'green') as green
          from (select source from v union select source from l) s
         limit 25
      ) x
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(row_to_json(x) order by x.visitors desc, x.leads desc) from (
        select c.campaign,
               (select count(*) from v where v.campaign = c.campaign) as visitors,
               (select count(*) from l where l.campaign = c.campaign) as leads,
               (select count(*) from l where l.campaign = c.campaign and l.tier = 'green') as green,
               (select coalesce(sum(value_cop), 0) from l where l.campaign = c.campaign and l.status = 'won') as won_value
          from (select campaign from v where campaign is not null union select campaign from l where campaign is not null) c
         limit 30
      ) x
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Comportamiento
-- -----------------------------------------------------------------------------

create or replace function public.analytics_behavior(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with pv as (
    select p.*,
           row_number() over (partition by session_id order by created_at) as pos,
           count(*) over (partition by session_id) as session_views,
           row_number() over (partition by session_id order by created_at desc) as rpos
      from public.page_views p where created_at >= p_from and created_at < p_to
  ),
  lead_sessions as (
    select distinct pv.session_id from pv join public.leads ld on ld.visitor_id = pv.visitor_id
     where ld.created_at >= p_from and ld.created_at < p_to
  )
  select jsonb_build_object(
    'pages', coalesce((
      select jsonb_agg(row_to_json(x) order by x.views desc) from (
        select path, count(*) views, count(distinct visitor_id) visitors,
               coalesce(round(avg(duration_ms) filter (where duration_ms > 0)), 0)::int as avg_ms,
               coalesce(round(avg(max_scroll)), 0)::int as scroll,
               count(*) filter (where pos = 1) as entries,
               count(*) filter (where rpos = 1) as exits,
               round(100.0 * count(*) filter (where pos = 1 and session_views = 1) / nullif(count(*) filter (where pos = 1), 0)) as bounce
          from pv group by path order by count(*) desc limit 40
      ) x
    ), '[]'::jsonb),
    'landings', coalesce((
      select jsonb_agg(row_to_json(x) order by x.sessions desc) from (
        select path, count(*) sessions,
               round(100.0 * count(*) filter (where session_views = 1) / nullif(count(*), 0)) as bounce,
               count(*) filter (where session_id in (select session_id from lead_sessions)) as leads
          from pv where pos = 1 group by path order by count(*) desc limit 20
      ) x
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(row_to_json(x) order by x.count desc) from (
        select name, count(*) count, count(distinct visitor_id) visitors
          from public.analytics_events where created_at >= p_from and created_at < p_to
         group by name order by count(*) desc
      ) x
    ), '[]'::jsonb),
    'event_labels', coalesce((
      select jsonb_agg(row_to_json(x) order by x.count desc) from (
        select name, label, count(*) count
          from public.analytics_events where created_at >= p_from and created_at < p_to and label is not null
         group by name, label order by count(*) desc limit 30
      ) x
    ), '[]'::jsonb),
    'heat', coalesce((
      select jsonb_agg(jsonb_build_object('dow', dow, 'hour', hour, 'n', n)) from (
        select extract(isodow from created_at at time zone 'America/Bogota')::int as dow,
               extract(hour from created_at at time zone 'America/Bogota')::int as hour,
               count(distinct visitor_id) n
          from pv group by 1, 2
      ) h
    ), '[]'::jsonb),
    'devices', coalesce((select jsonb_object_agg(coalesce(device, 'unknown'), n) from (select device, count(distinct visitor_id) n from pv group by device) x), '{}'::jsonb),
    'browsers', coalesce((
      select jsonb_agg(jsonb_build_object('name', browser, 'visitors', n) order by n desc) from (
        select coalesce(browser, 'Otro') browser, count(distinct visitor_id) n from pv group by 1 order by 2 desc limit 8) x
    ), '[]'::jsonb),
    'os', coalesce((
      select jsonb_agg(jsonb_build_object('name', os, 'visitors', n) order by n desc) from (
        select coalesce(os, 'Otro') os, count(distinct visitor_id) n from pv group by 1 order by 2 desc limit 8) x
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('country', country, 'visitors', n) order by n desc) from (
        select country, count(distinct visitor_id) n from pv where country is not null group by country order by n desc limit 12) x
    ), '[]'::jsonb),
    'languages', coalesce((select jsonb_object_agg(coalesce(locale, '—'), n) from (select locale, count(distinct visitor_id) n from pv group by locale) x), '{}'::jsonb)
  ) into result;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Embudo de conversión
-- -----------------------------------------------------------------------------

create or replace function public.analytics_funnel(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with pv as (select * from public.page_views where created_at >= p_from and created_at < p_to),
       ev as (select * from public.analytics_events where created_at >= p_from and created_at < p_to),
       lds as (select * from public.leads where created_at >= p_from and created_at < p_to)
  select jsonb_build_object(
    'visitors', (select count(distinct visitor_id) from pv),
    'engaged', (select count(distinct visitor_id) from pv where path ~ '/(servicios|productos|planes|portafolio|cotizar)'),
    'quote_page', (select count(distinct visitor_id) from pv where path ~ '/cotizar'),
    'form_start', (select count(distinct visitor_id) from ev where name = 'form_start'),
    'leads', (select count(*) from lds),
    'qualified', (select count(*) from lds where tier in ('green', 'yellow')),
    'meetings', (select count(distinct a.lead_id) from public.appointments a join lds on lds.id = a.lead_id),
    'won', (select count(*) from lds where status = 'won'),
    'contacts', jsonb_build_object(
      'whatsapp', (select count(*) from ev where name = 'whatsapp_click'),
      'phone', (select count(*) from ev where name = 'phone_click'),
      'email', (select count(*) from ev where name = 'email_click'),
      'chat', (select count(*) from public.chat_conversations where created_at >= p_from and created_at < p_to and channel = 'web')
    ),
    'form_steps', coalesce((
      select jsonb_agg(jsonb_build_object('step', label, 'visitors', n) order by label) from (
        select label, count(distinct visitor_id) n from ev where name = 'form_step' group by label) x
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- En vivo (últimos 30 minutos)
-- -----------------------------------------------------------------------------

create or replace function public.analytics_live()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with pv as (select * from public.page_views where created_at > now() - interval '30 minutes')
  select jsonb_build_object(
    'now', (select count(distinct visitor_id) from pv where created_at > now() - interval '5 minutes'),
    'minutes', (
      select jsonb_agg(jsonb_build_object('m', m, 'n', (
               select count(distinct visitor_id) from pv
                where created_at >= now() - make_interval(mins => 30 - m) and created_at < now() - make_interval(mins => 29 - m))) order by m)
        from generate_series(0, 29) m
    ),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'visitors', n) order by n desc) from (
        select path, count(distinct visitor_id) n from pv where created_at > now() - interval '5 minutes' group by path order by n desc limit 15) x
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(row_to_json(x) order by x.created_at desc) from (
        select pv.created_at, pv.path, pv.device, pv.country, pv.browser, vi.lead_id, ld.name as lead_name,
               public.analytics_channel(vi.first_utm, vi.first_gclid, vi.first_referrer) as channel
          from pv join public.visitors vi on vi.id = pv.visitor_id
          left join public.leads ld on ld.id = vi.lead_id
         order by pv.created_at desc limit 30
      ) x
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(row_to_json(x) order by x.created_at desc) from (
        select created_at, name, label, path from public.analytics_events where created_at > now() - interval '30 minutes'
         order by created_at desc limit 20
      ) x
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.analytics_overview(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_acquisition(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_behavior(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_funnel(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_live() from public, anon;
grant execute on function public.analytics_overview(timestamptz, timestamptz) to authenticated;
grant execute on function public.analytics_acquisition(timestamptz, timestamptz) to authenticated;
grant execute on function public.analytics_behavior(timestamptz, timestamptz) to authenticated;
grant execute on function public.analytics_funnel(timestamptz, timestamptz) to authenticated;
grant execute on function public.analytics_live() to authenticated;

-- Los eventos se conservan lo mismo que las vistas.
create or replace function public.purge_old_analytics()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.page_views where created_at < now() - interval '13 months';
  delete from public.analytics_events where created_at < now() - interval '13 months';
  delete from public.visitors where last_seen < now() - interval '13 months' and lead_id is null;
$$;
