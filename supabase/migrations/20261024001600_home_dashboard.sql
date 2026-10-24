-- Datos del inicio del portal: series diarias por color, métricas con el
-- periodo anterior, embudo por etapa y origen de los leads.
create or replace function public.home_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d integer := least(greatest(p_days, 7), 180);
  v_from timestamptz := now() - make_interval(days => d);
  v_prev timestamptz := now() - make_interval(days => d * 2);
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with l as (
    select id, created_at, tier, status, value_cop, score, source, utm, gclid, referrer from public.leads where created_at >= v_prev
  ), cur as (select * from l where created_at >= v_from),
  prv as (select * from l where created_at < v_from),
  won as (
    select a.lead_id, a.created_at, coalesce(le.value_cop, 0) as value
      from public.lead_activities a join public.leads le on le.id = a.lead_id
     where a.type = 'status_change' and a.meta ->> 'to' = 'won' and a.created_at >= v_prev
  ),
  days as (
    select g::date as day from generate_series((v_from at time zone 'America/Bogota')::date + 1, (now() at time zone 'America/Bogota')::date, interval '1 day') g
  ),
  visitors as (
    select count(distinct visitor_id) filter (where created_at >= v_from) as cur,
           count(distinct visitor_id) filter (where created_at < v_from) as prv
      from public.page_views where created_at >= v_prev
  )
  select jsonb_build_object(
    'days', d,
    'kpis', jsonb_build_object(
      'leads', (select count(*) from cur), 'leads_prev', (select count(*) from prv),
      'qualified', (select count(*) from cur where tier = 'green'), 'qualified_prev', (select count(*) from prv where tier = 'green'),
      'meetings', (select count(*) from public.appointments where created_at >= v_from),
      'meetings_prev', (select count(*) from public.appointments where created_at >= v_prev and created_at < v_from),
      'won_value', (select coalesce(sum(value), 0) from won where created_at >= v_from),
      'won_value_prev', (select coalesce(sum(value), 0) from won where created_at < v_from),
      'won', (select count(*) from won where created_at >= v_from),
      'visitors', (select cur from visitors), 'visitors_prev', (select prv from visitors)
    ),
    'daily', (select jsonb_agg(jsonb_build_object(
        'day', days.day,
        'green', (select count(*) from cur where tier = 'green' and (created_at at time zone 'America/Bogota')::date = days.day),
        'yellow', (select count(*) from cur where tier = 'yellow' and (created_at at time zone 'America/Bogota')::date = days.day),
        'red', (select count(*) from cur where tier = 'red' and (created_at at time zone 'America/Bogota')::date = days.day),
        'meetings', (select count(*) from public.appointments ap where (ap.created_at at time zone 'America/Bogota')::date = days.day),
        'won_value', (select coalesce(sum(value), 0) from won where (won.created_at at time zone 'America/Bogota')::date = days.day)
      ) order by days.day) from days),
    'funnel', (select coalesce(jsonb_object_agg(status, n), '{}') from (
        select status::text, count(*) n from public.leads group by status) x),
    'funnel_value', (select coalesce(jsonb_object_agg(status, v), '{}') from (
        select status::text, coalesce(sum(value_cop), 0) v from public.leads group by status) x),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', s, 'leads', n, 'green', g) order by n desc), '[]') from (
        select case
                 when source <> 'web' then source
                 when gclid is not null then 'google_ads'
                 when utm ->> 'utm_source' is not null then lower(utm ->> 'utm_source')
                 when referrer ~* 'google\.' then 'Google'
                 when referrer ~* 'facebook|fb\.' then 'Facebook'
                 when referrer ~* 'instagram' then 'Instagram'
                 when referrer ~* 'linkedin|lnkd' then 'LinkedIn'
                 else 'web' end as s,
               count(*) n, count(*) filter (where tier = 'green') g
          from cur group by 1 order by 2 desc limit 6) x)
  ) into result;
  return result;
end;
$$;
revoke all on function public.home_dashboard(integer) from public, anon;
grant execute on function public.home_dashboard(integer) to authenticated;
