-- La cola entrega también el contenido de los correos de las automatizaciones.
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
