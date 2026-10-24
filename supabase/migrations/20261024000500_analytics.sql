-- =============================================================================
-- Fase 4 — Analítica de visitantes (propia, solo con consentimiento)
--
-- El navegador solo envía datos si el visitante aceptó cookies de analítica.
-- No se guardan IP ni datos personales: un identificador aleatorio por
-- navegador, la página, el origen y métricas de lectura. Cuando la persona
-- llena el formulario, su recorrido queda unido al lead.
-- =============================================================================

create table public.visitors (
  id text primary key check (id ~ '^[0-9a-f-]{36}$'),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  first_landing text,
  first_referrer text,
  first_utm jsonb,
  first_gclid text,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  country text check (char_length(country) <= 2),
  lead_id uuid references public.leads (id) on delete set null,
  page_views integer not null default 0
);

create index visitors_last_seen_idx on public.visitors (last_seen desc);
create index visitors_lead_idx on public.visitors (lead_id);

create table public.page_views (
  id bigint generated always as identity primary key,
  visitor_id text not null references public.visitors (id) on delete cascade,
  session_id text not null check (char_length(session_id) <= 64),
  path text not null check (char_length(path) <= 500),
  title text check (char_length(title) <= 300),
  referrer text check (char_length(referrer) <= 500),
  utm jsonb,
  locale text check (char_length(locale) <= 5),
  device text,
  country text,
  duration_ms integer check (duration_ms between 0 and 86400000),
  max_scroll smallint check (max_scroll between 0 and 100),
  created_at timestamptz not null default now()
);

create index page_views_created_idx on public.page_views (created_at desc);
create index page_views_visitor_idx on public.page_views (visitor_id, created_at desc);
create index page_views_path_idx on public.page_views (path, created_at desc);

-- -----------------------------------------------------------------------------
-- Registro (público, a través de /api/t)
-- -----------------------------------------------------------------------------

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
  -- Límite anti-abuso: 120 vistas por visitante por hora.
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
    visitor_id, session_id, path, title, referrer, utm, locale, device, country
  ) values (
    v_visitor, left(p ->> 'session_id', 64), v_path, left(p ->> 'title', 300),
    left(p ->> 'referrer', 500),
    case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end,
    left(p ->> 'locale', 5),
    case when p ->> 'device' in ('mobile', 'tablet', 'desktop') then p ->> 'device' end,
    left(upper(p ->> 'country'), 2)
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Al salir de la página: tiempo y scroll. Solo actualiza la vista del mismo
-- visitante, y solo hacia arriba.
create or replace function public.track_page_leave(p jsonb)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.page_views
     set duration_ms = greatest(coalesce(duration_ms, 0), least((p ->> 'duration_ms')::int, 86400000)),
         max_scroll = greatest(coalesce(max_scroll, 0), least((p ->> 'max_scroll')::smallint, 100))
   where id = (p ->> 'view_id')::bigint
     and visitor_id = p ->> 'visitor_id'
     and created_at > now() - interval '1 day'
$$;

-- El visitante retira el consentimiento: se borra su rastro.
create or replace function public.forget_visitor(p_visitor text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.visitors where id = p_visitor and lead_id is null
$$;

revoke all on function public.track_page_view(jsonb) from public;
revoke all on function public.track_page_leave(jsonb) from public;
revoke all on function public.forget_visitor(text) from public;
grant execute on function public.track_page_view(jsonb) to anon, authenticated;
grant execute on function public.track_page_leave(jsonb) to anon, authenticated;
grant execute on function public.forget_visitor(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Unir el recorrido al lead
-- -----------------------------------------------------------------------------

create or replace function public.leads_link_visitor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visitor_id is not null then
    update public.visitors set lead_id = new.id
     where id = new.visitor_id and lead_id is null;
  end if;
  return new;
end;
$$;

create trigger leads_link_visitor
  after insert on public.leads
  for each row execute function public.leads_link_visitor();

-- -----------------------------------------------------------------------------
-- Tablero (solo empleados)
-- -----------------------------------------------------------------------------

create or replace function public.analytics_summary(p_from timestamptz, p_to timestamptz)
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
    select * from public.page_views where created_at >= p_from and created_at < p_to
  ),
  lds as (
    select * from public.leads where created_at >= p_from and created_at < p_to
  ),
  sources as (
    select coalesce(
             v.first_utm ->> 'utm_source',
             case when v.first_gclid is not null then 'google-ads' end,
             nullif(split_part(split_part(v.first_referrer, '://', 2), '/', 1), ''),
             'direct'
           ) as source,
           v.id, v.lead_id
    from public.visitors v
    where v.first_seen >= p_from and v.first_seen < p_to
  )
  select jsonb_build_object(
    'visitors', (select count(distinct visitor_id) from pv),
    'sessions', (select count(distinct session_id) from pv),
    'page_views', (select count(*) from pv),
    'avg_duration_ms', (select coalesce(avg(duration_ms) filter (where duration_ms > 0), 0)::int from pv),
    'leads', (select count(*) from lds),
    'leads_by_tier', (select coalesce(jsonb_object_agg(tier, n), '{}') from (select tier, count(*) n from lds group by tier) t),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors, 'views', views, 'leads', leads) order by day), '[]')
      from (
        select d::date as day,
               (select count(distinct visitor_id) from pv where (pv.created_at at time zone 'America/Bogota')::date = d::date) as visitors,
               (select count(*) from pv where (pv.created_at at time zone 'America/Bogota')::date = d::date) as views,
               (select count(*) from lds where (lds.created_at at time zone 'America/Bogota')::date = d::date) as leads
        from generate_series((p_from at time zone 'America/Bogota')::date, (p_to at time zone 'America/Bogota')::date - 1, interval '1 day') d
      ) x
    ),
    'top_pages', (
      select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', views, 'visitors', visitors, 'avg_scroll', avg_scroll) order by views desc), '[]')
      from (
        select path, count(*) views, count(distinct visitor_id) visitors, coalesce(round(avg(max_scroll)), 0)::int avg_scroll
        from pv group by path order by count(*) desc limit 15
      ) x
    ),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('source', source, 'visitors', visitors, 'leads', leads) order by visitors desc), '[]')
      from (
        select source, count(*) visitors, count(lead_id) leads
        from sources group by source order by count(*) desc limit 12
      ) x
    ),
    'devices', (
      select coalesce(jsonb_object_agg(coalesce(device, 'unknown'), n), '{}')
      from (select device, count(distinct visitor_id) n from pv group by device) x
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('country', country, 'visitors', n) order by n desc), '[]')
      from (select country, count(distinct visitor_id) n from pv where country is not null group by country order by n desc limit 10) x
    ),
    'lead_pages', (
      select coalesce(jsonb_agg(jsonb_build_object('path', source_page, 'leads', n, 'green', g) order by n desc), '[]')
      from (select source_page, count(*) n, count(*) filter (where tier = 'green') g from lds group by source_page order by n desc limit 10) x
    ),
    'live', (select count(distinct visitor_id) from public.page_views where created_at > now() - interval '5 minutes')
  ) into result;

  return result;
end;
$$;

revoke all on function public.analytics_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_summary(timestamptz, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS: solo empleados leen; nadie escribe directo (todo pasa por funciones).
-- -----------------------------------------------------------------------------

alter table public.visitors enable row level security;
alter table public.page_views enable row level security;

create policy "visitors: empleados leen" on public.visitors
  for select to authenticated using ((select public.is_employee()));
create policy "page_views: empleados leen" on public.page_views
  for select to authenticated using ((select public.is_employee()));

-- Conservación: vistas de más de 13 meses se borran (ejecutar periódicamente).
create or replace function public.purge_old_analytics()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.page_views where created_at < now() - interval '13 months';
  delete from public.visitors where last_seen < now() - interval '13 months' and lead_id is null;
$$;
revoke all on function public.purge_old_analytics() from public, anon, authenticated;
