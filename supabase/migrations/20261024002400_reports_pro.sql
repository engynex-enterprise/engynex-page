-- =============================================================================
-- Reportes PRO
--   * Informe de cualquier periodo comparado con el anterior (ventas,
--     marketing, atención y operación) y retorno por fuente.
--   * Rendimiento por asesor, tendencias de 12 meses y pronóstico del pipeline.
--   * Informes guardados semanales y ahora también mensuales; reenvío por correo.
-- =============================================================================

-- Más métricas para el periodo (complementan report_data).
create or replace function public.report_extra(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with l as (select * from public.leads where created_at >= p_from and created_at < p_to),
       won as (
         select le.*, a.created_at as won_at
           from public.leads le
           join lateral (select created_at from public.lead_activities x
                          where x.lead_id = le.id and x.type = 'status_change' and x.meta ->> 'to' = 'won'
                            and x.created_at >= p_from and x.created_at < p_to
                          order by x.created_at limit 1) a on true
       ),
       first_touch as (
         select l.id, min(a.created_at) - l.created_at as wait
           from l join public.lead_activities a on a.lead_id = l.id
          where a.author_id is not null and a.type <> 'created'
          group by l.id, l.created_at
       ),
       ap as (select * from public.appointments where starts_at >= p_from and starts_at < p_to)
  select jsonb_build_object(
    'green', (select count(*) from l where tier = 'green'),
    'qualified', (select count(*) from l where tier in ('green', 'yellow')),
    'contacted', (select count(*) from l where status <> 'new'),
    'first_contact_h', (select round((extract(epoch from percentile_cont(0.5) within group (order by wait)) / 3600)::numeric, 1) from first_touch),
    'avg_deal', (select round(avg(nullif(value_cop, 0))) from won),
    'cycle_days', (select round(avg(extract(epoch from won_at - created_at) / 86400)::numeric, 1) from won),
    'lost', (select count(*) from public.lead_activities where type = 'status_change' and meta ->> 'to' = 'lost' and created_at >= p_from and created_at < p_to),
    'meetings_done', (select count(*) from ap where status = 'done'),
    'meetings_no_show', (select count(*) from ap where status = 'no_show'),
    'tasks_done', (select count(*) from public.tasks where completed_at >= p_from and completed_at < p_to),
    'tasks_overdue', (select count(*) from public.tasks where not done and due_at < least(p_to, now())),
    'emails_opened', (select count(opened_at) from public.email_queue where sent_at >= p_from and sent_at < p_to),
    'campaigns', (select count(*) from public.wa_campaigns where started_at >= p_from and started_at < p_to),
    'conversion', (select round(100.0 * (select count(*) from l where visitor_id is not null) /
                     nullif((select count(distinct visitor_id) from public.page_views where created_at >= p_from and created_at < p_to), 0), 1))
  )
$$;
revoke all on function public.report_extra(timestamptz, timestamptz) from public, anon, authenticated;

create or replace function public.report_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])
$$;

-- Informe del periodo y del periodo anterior de igual duración.
create or replace function public.report_live(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  span interval := p_to - p_from;
begin
  if not public.report_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'current', public.report_data(p_from, p_to) || public.report_extra(p_from, p_to),
    'prev', public.report_data(p_from - span, p_from) || public.report_extra(p_from - span, p_from),
    'sources', coalesce((
      select jsonb_agg(row_to_json(x) order by x.leads desc) from (
        select s.origin as source, count(*) leads,
               count(*) filter (where s.tier = 'green') green,
               count(*) filter (where exists (select 1 from public.appointments a where a.lead_id = s.id)) meetings,
               count(*) filter (where s.status = 'won') won,
               coalesce(sum(s.value_cop) filter (where s.status = 'won'), 0) won_value
          from (
            select ld.*, public.analytics_source(coalesce(vi.first_utm, ld.utm), coalesce(vi.first_gclid, ld.gclid), coalesce(vi.first_referrer, ld.referrer)) as origin
              from public.leads ld left join public.visitors vi on vi.id = ld.visitor_id
             where ld.created_at >= p_from and ld.created_at < p_to
          ) s
         group by s.origin order by count(*) desc limit 15
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- Rendimiento por asesor.
create or replace function public.report_team(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.report_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(row_to_json(t) order by t.won_value desc, t.leads desc) from (
      select p.id, coalesce(p.full_name, p.email) as name, p.role,
             (select count(*) from public.leads l where l.assigned_to = p.id and l.created_at >= p_from and l.created_at < p_to) as leads,
             (select count(*) from public.leads l where l.assigned_to = p.id and l.created_at >= p_from and l.created_at < p_to and l.status <> 'new') as contacted,
             (select count(*) from public.appointments a where a.host_id = p.id and a.starts_at >= p_from and a.starts_at < p_to and a.status <> 'cancelled') as meetings,
             (select count(*) from public.lead_activities a join public.leads l on l.id = a.lead_id
               where l.assigned_to = p.id and a.type = 'status_change' and a.meta ->> 'to' = 'won' and a.created_at >= p_from and a.created_at < p_to) as won,
             (select coalesce(sum(l.value_cop), 0) from public.leads l
               where l.assigned_to = p.id and l.status = 'won' and exists (
                 select 1 from public.lead_activities a where a.lead_id = l.id and a.type = 'status_change' and a.meta ->> 'to' = 'won'
                    and a.created_at >= p_from and a.created_at < p_to)) as won_value,
             (select count(*) from public.lead_activities a where a.author_id = p.id and a.created_at >= p_from and a.created_at < p_to
                 and a.type in ('note', 'call', 'whatsapp', 'email', 'meeting')) as activities,
             (select count(*) from public.tasks t where t.assigned_to = p.id and t.completed_at >= p_from and t.completed_at < p_to) as tasks_done,
             (select count(*) from public.tasks t where t.assigned_to = p.id and not t.done and t.due_at < now()) as tasks_overdue,
             (select count(*) from public.chat_conversations c where c.assigned_to = p.id and c.created_at >= p_from and c.created_at < p_to) as chats,
             (select round(extract(epoch from percentile_cont(0.5) within group (order by c.first_response_at - c.created_at)))
                from public.chat_conversations c where c.assigned_to = p.id and c.created_at >= p_from and c.created_at < p_to and c.first_response_at is not null) as chat_first_s,
             (select count(*) from public.tickets k where k.assigned_to = p.id and k.resolved_at >= p_from and k.resolved_at < p_to) as tickets_resolved
        from public.profiles p
       where p.active and p.kind = 'employee' and p.role in ('admin', 'sales', 'support', 'marketing')
    ) t
  ), '[]'::jsonb);
end;
$$;

-- Tendencias por mes (hora de Colombia).
create or replace function public.report_trends(p_months integer default 12)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  n int := least(greatest(coalesce(p_months, 12), 3), 36);
begin
  if not public.report_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (
    select jsonb_agg(jsonb_build_object(
             'month', to_char(m, 'YYYY-MM'),
             'visitors', (select count(distinct visitor_id) from public.page_views where created_at >= m_from and created_at < m_to),
             'leads', (select count(*) from public.leads where created_at >= m_from and created_at < m_to),
             'green', (select count(*) from public.leads where tier = 'green' and created_at >= m_from and created_at < m_to),
             'meetings', (select count(*) from public.appointments where created_at >= m_from and created_at < m_to),
             'won', (select count(*) from public.lead_activities where type = 'status_change' and meta ->> 'to' = 'won' and created_at >= m_from and created_at < m_to),
             'won_value', (select coalesce(sum(le.value_cop), 0) from public.leads le where le.status = 'won' and exists (
                             select 1 from public.lead_activities a where a.lead_id = le.id and a.type = 'status_change' and a.meta ->> 'to' = 'won'
                                and a.created_at >= m_from and a.created_at < m_to))
           ) order by m)
      from (
        select m, (m::timestamp at time zone 'America/Bogota') as m_from, ((m + interval '1 month')::timestamp at time zone 'America/Bogota') as m_to
          from generate_series(date_trunc('month', (now() at time zone 'America/Bogota')::date) - make_interval(months => n - 1),
                               date_trunc('month', (now() at time zone 'America/Bogota')::date), interval '1 month') m
      ) x
  );
end;
$$;

-- Pipeline abierto y pronóstico (negocios + leads activos).
create or replace function public.report_pipeline()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  month_end date := (date_trunc('month', (now() at time zone 'America/Bogota')::date) + interval '1 month')::date;
begin
  if not public.report_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'stages', coalesce((
      select jsonb_agg(jsonb_build_object('stage', stage, 'deals', n, 'value', v, 'weighted', w) order by ord) from (
        select stage, count(*) n, coalesce(sum(value_cop), 0) v, coalesce(sum(value_cop * probability / 100), 0) w,
               array_position(array['prospecting', 'proposal', 'negotiation'], stage) ord
          from public.deals where stage in ('prospecting', 'proposal', 'negotiation') group by stage
      ) x
    ), '[]'::jsonb),
    'open_value', (select coalesce(sum(value_cop), 0) from public.deals where stage in ('prospecting', 'proposal', 'negotiation')),
    'weighted', (select coalesce(sum(value_cop * probability / 100), 0) from public.deals where stage in ('prospecting', 'proposal', 'negotiation')),
    'closing_month', (select coalesce(sum(value_cop * probability / 100), 0) from public.deals
                       where stage in ('prospecting', 'proposal', 'negotiation') and expected_close < month_end),
    'overdue_close', (select count(*) from public.deals where stage in ('prospecting', 'proposal', 'negotiation') and expected_close < (now() at time zone 'America/Bogota')::date),
    'leads_by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.leads group by status) x), '{}'::jsonb),
    'win_rate', (select round(100.0 * count(*) filter (where stage = 'won') / nullif(count(*) filter (where stage in ('won', 'lost')), 0)) from public.deals)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Informes guardados: también mensuales
-- -----------------------------------------------------------------------------

alter table public.weekly_reports add column kind text not null default 'week' check (kind in ('week', 'month'));
alter table public.weekly_reports drop constraint weekly_reports_week_start_key;
alter table public.weekly_reports add constraint weekly_reports_period_key unique (kind, week_start);

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
  insert into public.weekly_reports (kind, week_start, data)
  values ('week', p_week_start, public.report_data(v_from, v_from + interval '7 days') || public.report_extra(v_from, v_from + interval '7 days'))
  on conflict (kind, week_start) do update set data = excluded.data, created_at = now()
  returning id into rid;
  if p_email then
    insert into public.email_queue (kind, report_id, to_email) values ('weekly_report', rid, null);
  end if;
  return rid;
end;
$$;

create or replace function public.report_generate_month(p_month_start date, p_email boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_start date := date_trunc('month', p_month_start)::date;
  v_from timestamptz := (v_start::timestamp at time zone 'America/Bogota');
  v_to timestamptz := ((v_start + interval '1 month')::timestamp at time zone 'America/Bogota');
  rid uuid;
begin
  if not (public.is_service() or public.has_role(array['admin']::public.app_role[])) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.weekly_reports (kind, week_start, data)
  values ('month', v_start, public.report_data(v_from, v_to) || public.report_extra(v_from, v_to))
  on conflict (kind, week_start) do update set data = excluded.data, created_at = now()
  returning id into rid;
  if p_email then
    insert into public.email_queue (kind, report_id, to_email) values ('weekly_report', rid, null);
  end if;
  return rid;
end;
$$;

-- El día 1 desde las 8 a.m.: informe del mes anterior (una vez).
create or replace function public.jobs_monthly_report()
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  local_now timestamp := now() at time zone 'America/Bogota';
  last_month date := (date_trunc('month', local_now) - interval '1 month')::date;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if extract(hour from local_now) < 8 or exists (select 1 from public.weekly_reports where kind = 'month' and week_start = last_month) then
    return null;
  end if;
  return public.report_generate_month(last_month, true);
end;
$$;

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
  if extract(hour from local_now) < 8 or exists (select 1 from public.weekly_reports where kind = 'week' and week_start = last_monday) then
    return null;
  end if;
  return public.report_generate(last_monday, true);
end;
$$;

-- Reenviar un informe guardado al equipo.
create or replace function public.report_send(p_report uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.email_queue (kind, report_id, to_email, created_by) values ('weekly_report', p_report, null, auth.uid());
end;
$$;

-- El correo del informe sabe si es semanal o mensual.
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
         case when r.id is null then null else jsonb_build_object('week_start', r.week_start, 'kind', r.kind, 'data', r.data) end,
         c.payload
    from claimed c
    left join public.leads l on l.id = c.lead_id
    left join public.lead_drafts d on d.id = c.draft_id
    left join public.weekly_reports r on r.id = c.report_id;
end;
$$;
revoke all on function public.email_claim(integer) from public, anon, authenticated;
grant execute on function public.email_claim(integer) to service_role;

revoke all on function public.report_live(timestamptz, timestamptz) from public, anon;
revoke all on function public.report_team(timestamptz, timestamptz) from public, anon;
revoke all on function public.report_trends(integer) from public, anon;
revoke all on function public.report_pipeline() from public, anon;
revoke all on function public.report_generate_month(date, boolean) from public, anon;
revoke all on function public.jobs_monthly_report() from public, anon, authenticated;
revoke all on function public.report_send(uuid) from public, anon;
grant execute on function public.report_live(timestamptz, timestamptz) to authenticated;
grant execute on function public.report_team(timestamptz, timestamptz) to authenticated;
grant execute on function public.report_trends(integer) to authenticated;
grant execute on function public.report_pipeline() to authenticated;
grant execute on function public.report_generate_month(date, boolean) to authenticated;
grant execute on function public.jobs_monthly_report() to service_role;
grant execute on function public.report_send(uuid) to authenticated;
