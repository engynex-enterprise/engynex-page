-- =============================================================================
-- Campañas PRO
--   * Canal correo (además de WhatsApp): asunto, texto con variables, botón con
--     UTM; salen por la cola de correos (Resend) con baja y métricas.
--   * Audiencia con más filtros (origen, responsable, sin campañas recientes),
--     vista previa de destinatarios y segmentos guardados.
--   * Pausar, reanudar, cancelar lo pendiente, reintentar fallidos y duplicar.
--   * Métricas por campaña y del módulo, con conversiones atribuidas.
-- =============================================================================

alter table public.wa_campaigns drop constraint wa_campaigns_status_check;
alter table public.wa_campaigns add constraint wa_campaigns_status_check
  check (status in ('draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled'));
alter table public.wa_campaigns
  add column channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email')),
  add column subject text check (char_length(subject) <= 200),
  add column preheader text check (char_length(preheader) <= 200),
  add column body text check (char_length(body) <= 10000),
  add column cta_label text check (char_length(cta_label) <= 80),
  add column cta_url text check (char_length(cta_url) <= 500),
  add column utm boolean not null default true;

alter table public.email_queue add column campaign_id uuid references public.wa_campaigns (id) on delete set null;
create index email_queue_campaign_idx on public.email_queue (campaign_id) where campaign_id is not null;

-- Segmentos guardados
create table public.campaign_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  segment jsonb not null check (jsonb_typeof(segment) = 'object'),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.campaign_segments enable row level security;
create policy "campaign_segments: marketing gestiona" on public.campaign_segments
  for all to authenticated using ((select public.is_marketer())) with check ((select public.is_marketer()));

-- -----------------------------------------------------------------------------
-- Audiencia (los dos canales)
-- -----------------------------------------------------------------------------

-- ¿El lead cumple el segmento? (filtros comunes a WhatsApp y correo)
create or replace function public.campaign_matches(l public.leads, p_segment jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (coalesce(jsonb_array_length(p_segment -> 'tiers'), 0) = 0
          or l.tier::text in (select jsonb_array_elements_text(p_segment -> 'tiers')))
     and (coalesce(jsonb_array_length(p_segment -> 'statuses'), 0) = 0
          or l.status::text in (select jsonb_array_elements_text(p_segment -> 'statuses')))
     and (coalesce(jsonb_array_length(p_segment -> 'problems'), 0) = 0
          or l.problem_category in (select jsonb_array_elements_text(p_segment -> 'problems')))
     and (coalesce(jsonb_array_length(p_segment -> 'sources'), 0) = 0
          or coalesce(nullif(l.source, ''), 'web') in (select jsonb_array_elements_text(p_segment -> 'sources')))
     and (coalesce(jsonb_array_length(p_segment -> 'owners'), 0) = 0
          or l.assigned_to::text in (select jsonb_array_elements_text(p_segment -> 'owners')))
     and (nullif(p_segment ->> 'days', '') is null
          or l.created_at > now() - make_interval(days => (p_segment ->> 'days')::int))
     -- Sin saturar: nadie que haya recibido una campaña en los últimos N días.
     and (nullif(p_segment ->> 'exclude_days', '') is null or not exists (
            select 1 from public.wa_messages m
             where m.lead_id = l.id and m.sent_at > now() - make_interval(days => (p_segment ->> 'exclude_days')::int)
            union all
            select 1 from public.email_queue q
             where q.lead_id = l.id and q.campaign_id is not null and q.sent_at > now() - make_interval(days => (p_segment ->> 'exclude_days')::int)))
$$;
revoke all on function public.campaign_matches(public.leads, jsonb) from public, anon, authenticated;

create or replace function public.wa_audience(p_segment jsonb)
returns table (lead_id uuid, name text, company text, phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_marketer() or public.is_service()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select distinct on (public.wa_phone(l.phone))
         l.id, l.name, l.company, public.wa_phone(l.phone)
    from public.leads l
   where l.whatsapp_opt_in_at is not null
     and l.whatsapp_opt_out_at is null
     and public.wa_phone(l.phone) is not null
     and public.campaign_matches(l, p_segment)
     and not exists (
       select 1 from public.leads o
        where public.wa_phone(o.phone) = public.wa_phone(l.phone) and o.whatsapp_opt_out_at is not null
     )
   order by public.wa_phone(l.phone), l.created_at desc;
end;
$$;

create or replace function public.email_audience(p_segment jsonb)
returns table (lead_id uuid, name text, company text, email text, locale text, email_token uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_marketer() or public.is_service()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select distinct on (lower(l.email))
         l.id, l.name, l.company, l.email, l.locale, l.email_token
    from public.leads l
   where l.email is not null
     and l.email_opt_out_at is null
     and public.campaign_matches(l, p_segment)
     -- Ni quien se dio de baja con otro registro del mismo correo, ni rebotados.
     and not exists (select 1 from public.leads o where lower(o.email) = lower(l.email) and o.email_opt_out_at is not null)
     and not exists (select 1 from public.email_queue q where lower(q.to_email) = lower(l.email) and q.bounced_at is not null)
   order by lower(l.email), l.created_at desc;
end;
$$;

create or replace function public.campaign_audience(p_segment jsonb, p_channel text, p_limit integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_marketer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_channel = 'email' then
    select jsonb_build_object(
      'count', (select count(*) from public.email_audience(p_segment)),
      'sample', coalesce((select jsonb_agg(jsonb_build_object('id', a.lead_id, 'name', a.name, 'company', a.company, 'contact', a.email))
                            from (select * from public.email_audience(p_segment) limit greatest(p_limit, 0)) a), '[]'::jsonb))
      into result;
  else
    select jsonb_build_object(
      'count', (select count(*) from public.wa_audience(p_segment)),
      'sample', coalesce((select jsonb_agg(jsonb_build_object('id', a.lead_id, 'name', a.name, 'company', a.company, 'contact', '+' || a.phone))
                            from (select * from public.wa_audience(p_segment) limit greatest(p_limit, 0)) a), '[]'::jsonb))
      into result;
  end if;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Encolar (correo); WhatsApp sigue en wa_campaign_queue
-- -----------------------------------------------------------------------------

create or replace function public.campaign_fill(p_text text, p_name text, p_company text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(replace(coalesce(p_text, ''), '{nombre}', coalesce(nullif(split_part(btrim(p_name), ' ', 1), ''), '')),
                 '{empresa}', coalesce(p_company, ''))
$$;

create or replace function public.campaign_queue(p_campaign uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  camp public.wa_campaigns;
  n integer;
  url text;
  slug text;
begin
  if not (public.is_marketer() or public.is_service()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into camp from public.wa_campaigns where id = p_campaign for update;
  if camp.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if camp.channel = 'whatsapp' then
    return public.wa_campaign_queue(p_campaign);
  end if;
  if camp.status not in ('draft', 'scheduled') then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  if coalesce(btrim(camp.subject), '') = '' or coalesce(btrim(camp.body), '') = '' then
    raise exception 'missing_content' using errcode = 'P0001';
  end if;

  url := nullif(btrim(camp.cta_url), '');
  if url is not null and camp.utm and url !~* 'utm_source=' then
    slug := trim(both '-' from regexp_replace(lower(camp.name), '[^a-z0-9]+', '-', 'g'));
    url := url || case when position('?' in url) > 0 then '&' else '?' end
               || 'utm_source=engynex&utm_medium=email&utm_campaign=' || coalesce(nullif(slug, ''), 'campana');
  end if;

  insert into public.email_queue (kind, lead_id, to_email, campaign_id, created_by, payload)
  select 'custom', a.lead_id, a.email, camp.id, camp.created_by, jsonb_build_object(
           'subject', left(public.campaign_fill(camp.subject, a.name, a.company), 200),
           'preheader', nullif(public.campaign_fill(camp.preheader, a.name, a.company), ''),
           'body', public.campaign_fill(camp.body, a.name, a.company),
           'cta_label', nullif(btrim(camp.cta_label), ''),
           'cta_url', url,
           'locale', a.locale,
           'email_token', a.email_token,
           'campaign', true)
    from public.email_audience(camp.segment) a;
  get diagnostics n = row_count;

  update public.wa_campaigns
     set status = case when n = 0 then 'sent' else 'sending' end,
         started_at = now(), finished_at = case when n = 0 then now() end, total = n
   where id = camp.id;
  return n;
end;
$$;

-- Correo de campaña enviado: historial del lead y cierre de la campaña.
create or replace function public.email_campaign_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.campaign_id is null or new.status is not distinct from old.status then
    return new;
  end if;
  if new.status = 'sent' and new.lead_id is not null then
    insert into public.lead_activities (lead_id, type, body, meta)
    select new.lead_id, 'email', c.name, jsonb_build_object('campaign_id', c.id, 'kind', 'campaign')
      from public.wa_campaigns c where c.id = new.campaign_id;
  end if;
  update public.wa_campaigns c set status = 'sent', finished_at = now()
   where c.id = new.campaign_id and c.status = 'sending'
     and not exists (select 1 from public.email_queue q where q.campaign_id = c.id and q.status in ('queued', 'sending'));
  return new;
end;
$$;
create trigger email_campaign_progress after update of status on public.email_queue
  for each row execute function public.email_campaign_progress();

-- Las campañas de correo programadas arrancan con el reloj de las automatizaciones.
create or replace function public.campaigns_tick()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r record;
  n int := 0;
begin
  for r in select id from public.wa_campaigns where channel = 'email' and status = 'scheduled' and scheduled_at <= now() loop
    perform public.campaign_queue(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.campaigns_tick() from public, anon, authenticated;
select cron.schedule('campaigns-tick', '* * * * *', $$select set_config('request.jwt.claims', '{"role":"service_role"}', false); select public.campaigns_tick()$$);

-- WhatsApp: las campañas en pausa no envían.
create or replace function public.wa_claim_batch(p_limit integer default 200)
returns table (id bigint, phone text, params jsonb, template text, language text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform public.wa_campaign_queue(c.id)
     from public.wa_campaigns c
    where c.channel = 'whatsapp' and c.status = 'scheduled' and c.scheduled_at <= now();

  update public.wa_messages m set status = 'queued'
   where m.status = 'sending' and m.wa_message_id is null and m.created_at < now() - interval '10 minutes'
     and m.sent_at is null;

  return query
  with picked as (
    select m.id from public.wa_messages m
      join public.wa_campaigns c on c.id = m.campaign_id
     where m.status = 'queued' and c.status = 'sending'
     order by m.id
     limit greatest(1, least(p_limit, 1000))
     for update of m skip locked
  )
  update public.wa_messages m
     set status = 'sending', sent_at = null
    from picked, public.wa_campaigns c, public.wa_templates t
   where m.id = picked.id and c.id = m.campaign_id and t.id = c.template_id
  returning m.id, m.phone, m.params, t.name, t.language;
end;
$$;

-- -----------------------------------------------------------------------------
-- Acciones
-- -----------------------------------------------------------------------------

-- p_action: pause | resume | cancel | retry
create or replace function public.campaign_action(p_campaign uuid, p_action text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  camp public.wa_campaigns;
  n int := 0;
begin
  if not public.is_marketer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into camp from public.wa_campaigns where id = p_campaign for update;
  if camp.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if p_action = 'pause' and camp.status = 'sending' then
    update public.wa_campaigns set status = 'paused' where id = camp.id;
    if camp.channel = 'email' then
      -- Los correos pendientes se apartan de la cola hasta reanudar.
      update public.email_queue set send_at = 'infinity' where campaign_id = camp.id and status = 'queued';
    end if;
  elsif p_action = 'resume' and camp.status = 'paused' then
    update public.wa_campaigns set status = 'sending' where id = camp.id;
    if camp.channel = 'email' then
      update public.email_queue set send_at = now() where campaign_id = camp.id and status = 'queued';
    end if;
  elsif p_action = 'cancel' and camp.status in ('sending', 'paused', 'scheduled') then
    if camp.channel = 'email' then
      update public.email_queue set status = 'cancelled', error = 'manual' where campaign_id = camp.id and status = 'queued';
    else
      update public.wa_messages set status = 'failed', error = 'cancelled' where campaign_id = camp.id and status = 'queued';
    end if;
    get diagnostics n = row_count;
    update public.wa_campaigns
       set status = case when camp.status = 'scheduled' then 'cancelled' else 'sent' end, finished_at = now()
     where id = camp.id;
  elsif p_action = 'retry' and camp.status in ('sent', 'sending', 'paused') then
    if camp.channel = 'email' then
      update public.email_queue set status = 'queued', error = null, send_at = now()
       where campaign_id = camp.id and status = 'failed' and bounced_at is null;
    else
      update public.wa_messages set status = 'queued', error = null, wa_message_id = null
       where campaign_id = camp.id and status = 'failed' and coalesce(error, '') <> 'cancelled';
    end if;
    get diagnostics n = row_count;
    if n > 0 then
      update public.wa_campaigns set status = 'sending', finished_at = null where id = camp.id;
    end if;
  else
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  return n;
end;
$$;

create or replace function public.campaign_duplicate(p_campaign uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.is_marketer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.wa_campaigns (name, template_id, params, segment, status, channel, subject, preheader, body, cta_label, cta_url, utm, created_by)
  select left(name || ' (copia)', 120), template_id, params, segment, 'draft', channel, subject, preheader, body, cta_label, cta_url, utm, auth.uid()
    from public.wa_campaigns where id = p_campaign
  returning id into new_id;
  if new_id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Métricas
-- -----------------------------------------------------------------------------

-- Una fila por campaña con su embudo (sirve para los dos canales).
create or replace function public.campaign_stats()
returns table (campaign_id uuid, sent int, delivered int, opened int, engaged int, failed int, pending int, unsubscribed int)
language sql
stable
security definer
set search_path = ''
as $$
  select m.campaign_id,
         count(*) filter (where m.status in ('sent', 'delivered', 'read'))::int,
         count(*) filter (where m.status in ('delivered', 'read'))::int,
         count(*) filter (where m.status = 'read')::int,
         count(*) filter (where m.replied_at is not null)::int,
         count(*) filter (where m.status = 'failed' and coalesce(m.error, '') <> 'cancelled')::int,
         count(*) filter (where m.status in ('queued', 'sending'))::int,
         count(*) filter (where exists (select 1 from public.leads l where l.id = m.lead_id and l.whatsapp_opt_out_at > m.sent_at))::int
    from public.wa_messages m
   where public.is_marketer()
   group by m.campaign_id
  union all
  select q.campaign_id,
         count(*) filter (where q.status = 'sent')::int,
         count(q.delivered_at)::int,
         count(q.opened_at)::int,
         count(q.clicked_at)::int,
         count(*) filter (where q.status = 'failed' or q.bounced_at is not null)::int,
         count(*) filter (where q.status in ('queued', 'sending'))::int,
         count(*) filter (where exists (select 1 from public.leads l where l.id = q.lead_id and l.email_opt_out_at > q.sent_at))::int
    from public.email_queue q
   where q.campaign_id is not null and public.is_marketer()
   group by q.campaign_id
$$;

-- Detalle de una campaña: lecturas/aperturas por hora y conversiones.
create or replace function public.campaign_report(p_campaign uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  camp public.wa_campaigns;
  result jsonb;
begin
  if not public.is_marketer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into camp from public.wa_campaigns where id = p_campaign;
  if camp.id is null or camp.started_at is null then
    return null;
  end if;
  with r as (
    select lead_id, coalesce(read_at, null) as engaged_at, sent_at from public.wa_messages where campaign_id = camp.id and camp.channel = 'whatsapp'
    union all
    select lead_id, opened_at, sent_at from public.email_queue where campaign_id = camp.id and camp.channel = 'email'
  )
  select jsonb_build_object(
    'hourly', coalesce((
      select jsonb_agg(jsonb_build_object('hour', h, 'n', n) order by h)
        from (
          select floor(extract(epoch from (engaged_at - camp.started_at)) / 3600)::int as h, count(*) n
            from r where engaged_at is not null and engaged_at < camp.started_at + interval '72 hours'
           group by 1
        ) x
    ), '[]'::jsonb),
    'meetings', (select count(distinct a.lead_id) from public.appointments a join r on r.lead_id = a.lead_id
                  where a.created_at > camp.started_at and a.created_at < camp.started_at + interval '14 days'),
    'advanced', (select count(distinct x.lead_id) from public.lead_activities x join r on r.lead_id = x.lead_id
                  where x.type = 'status_change' and x.created_at > camp.started_at and x.created_at < camp.started_at + interval '14 days'),
    'won', (select count(distinct l.id) from public.leads l join r on r.lead_id = l.id
             where l.status = 'won' and l.updated_at > camp.started_at),
    'won_value', (select coalesce(sum(distinct_value), 0) from (
                    select distinct l.id, l.value_cop as distinct_value from public.leads l join r on r.lead_id = l.id
                     where l.status = 'won' and l.updated_at > camp.started_at) w)
  ) into result;
  return result;
end;
$$;

create or replace function public.campaigns_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365));
  result jsonb;
begin
  if not public.is_marketer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with w as (select * from public.wa_messages where sent_at >= since),
       e as (select * from public.email_queue where campaign_id is not null and sent_at >= since)
  select jsonb_build_object(
    'campaigns', (select count(*) from public.wa_campaigns where started_at >= since),
    'wa_sent', (select count(*) from w where status in ('sent', 'delivered', 'read')),
    'wa_delivered', (select count(*) from w where status in ('delivered', 'read')),
    'wa_read', (select count(*) from w where status = 'read'),
    'wa_replied', (select count(*) from w where replied_at is not null),
    'email_sent', (select count(*) from e where status = 'sent'),
    'email_delivered', (select count(delivered_at) from e),
    'email_opened', (select count(opened_at) from e),
    'email_clicked', (select count(clicked_at) from e),
    'unsubscribed', (select count(*) from public.leads where (email_opt_out_at >= since or whatsapp_opt_out_at >= since)),
    'reachable_wa', (select count(*) from public.wa_audience('{}'::jsonb)),
    'reachable_email', (select count(*) from public.email_audience('{}'::jsonb))
  ) into result;
  return result;
end;
$$;

revoke all on function public.wa_audience(jsonb) from public, anon;
revoke all on function public.email_audience(jsonb) from public, anon;
revoke all on function public.campaign_audience(jsonb, text, integer) from public, anon;
revoke all on function public.campaign_queue(uuid) from public, anon;
revoke all on function public.campaign_action(uuid, text) from public, anon;
revoke all on function public.campaign_duplicate(uuid) from public, anon;
revoke all on function public.campaign_stats() from public, anon;
revoke all on function public.campaign_report(uuid) from public, anon;
revoke all on function public.campaigns_overview(integer) from public, anon;
grant execute on function public.wa_audience(jsonb) to authenticated, service_role;
grant execute on function public.email_audience(jsonb) to authenticated, service_role;
grant execute on function public.campaign_audience(jsonb, text, integer) to authenticated;
grant execute on function public.campaign_queue(uuid) to authenticated, service_role;
grant execute on function public.campaign_action(uuid, text) to authenticated;
grant execute on function public.campaign_duplicate(uuid) to authenticated;
grant execute on function public.campaign_stats() to authenticated;
grant execute on function public.campaign_report(uuid) to authenticated;
grant execute on function public.campaigns_overview(integer) to authenticated;

-- Editar también campañas en pausa no se permite (ya empezaron); sí borrar canceladas.
