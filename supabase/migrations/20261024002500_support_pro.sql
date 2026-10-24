-- =============================================================================
-- Soporte PRO (mesa de ayuda)
--   * Acuerdos de servicio (SLA) por prioridad: primera respuesta y resolución,
--     con vencimientos calculados y avisos.
--   * Etiquetas, adjuntos (bucket privado ticket-files), respuestas rápidas
--     (macros), unir duplicados, encuesta de satisfacción (CSAT) y cierre
--     automático de resueltas.
--   * Métricas de soporte.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ajustes (una sola fila)
-- -----------------------------------------------------------------------------

create table public.support_settings (
  id boolean primary key default true check (id),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
insert into public.support_settings (id, config) values (true, $json${
  "sla": {
    "critical": { "first_h": 1, "resolve_h": 8 },
    "high": { "first_h": 4, "resolve_h": 24 },
    "medium": { "first_h": 8, "resolve_h": 72 },
    "low": { "first_h": 24, "resolve_h": 120 }
  },
  "auto_close_days": 5,
  "csat": true
}$json$::jsonb);

alter table public.support_settings enable row level security;
create policy "support_settings: equipo lee" on public.support_settings
  for select to authenticated using ((select public.is_support_staff()));
create policy "support_settings: admin edita" on public.support_settings
  for update to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

create or replace function public.support_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select config from public.support_settings where id), '{}'::jsonb)
$$;
revoke all on function public.support_config() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Columnas nuevas
-- -----------------------------------------------------------------------------

alter table public.tickets
  add column tags text[] not null default '{}',
  add column first_response_at timestamptz,
  add column first_response_due timestamptz,
  add column resolve_due timestamptz,
  add column csat_rating smallint check (csat_rating between 1 and 5),
  add column csat_comment text check (char_length(csat_comment) <= 1000),
  add column csat_at timestamptz,
  add column csat_token uuid not null default gen_random_uuid(),
  add column merged_into uuid references public.tickets (id) on delete set null,
  add column lead_id uuid references public.leads (id) on delete set null;
create index tickets_tags_idx on public.tickets using gin (tags);
create unique index tickets_csat_token_idx on public.tickets (csat_token);

alter table public.ticket_messages add column attachment jsonb;

-- Vencimientos según la prioridad (al crear y al cambiar la prioridad).
create or replace function public.tickets_sla()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sla jsonb := public.support_config() -> 'sla' -> new.priority::text;
begin
  if tg_op = 'INSERT' or new.priority is distinct from old.priority then
    new.first_response_due := case when new.first_response_at is null and sla ? 'first_h'
                                    then new.created_at + make_interval(hours => (sla ->> 'first_h')::int) end;
    new.resolve_due := case when sla ? 'resolve_h' then new.created_at + make_interval(hours => (sla ->> 'resolve_h')::int) end;
  end if;
  -- Lead con el mismo correo (para ver el contexto comercial).
  if tg_op = 'INSERT' and new.lead_id is null then
    select id into new.lead_id from public.leads where lower(email) = lower(new.email) order by created_at desc limit 1;
  end if;
  return new;
end;
$$;
create trigger tickets_sla before insert or update of priority on public.tickets
  for each row execute function public.tickets_sla();

-- Al resolver: encuesta de satisfacción por correo (una vez).
create or replace function public.tickets_after_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb := public.support_config();
  l text;
begin
  if new.status = 'resolved' and old.status is distinct from 'resolved' and new.csat_at is null
     and coalesce((cfg ->> 'csat')::boolean, true) and new.merged_into is null then
    l := coalesce((select locale from public.leads where id = new.lead_id), 'es');
    insert into public.email_queue (kind, to_email, payload)
    values ('custom', new.email, jsonb_build_object(
      'subject', case when l = 'en' then 'How did we do with your request #' else '¿Cómo te atendimos en la solicitud #' end || new.number || '?',
      'body', case when l = 'en'
        then 'Hi ' || split_part(new.name, ' ', 1) || E',\n\nWe marked your request "' || new.subject || E'" as resolved.\n\nIt takes 10 seconds to tell us how we did. If something is still pending, just reply on the portal and we reopen it.'
        else 'Hola ' || split_part(new.name, ' ', 1) || E',\n\nMarcamos como resuelta tu solicitud «' || new.subject || E'».\n\nCuéntanos en 10 segundos cómo te atendimos. Si algo quedó pendiente, responde en el portal y la reabrimos.' end,
      'cta_label', case when l = 'en' then 'Rate the service' else 'Calificar la atención' end,
      'cta_url', 'https://engynex.com/' || l || '/soporte/encuesta?t=' || new.csat_token,
      'locale', l));
  end if;
  return new;
end;
$$;
create trigger tickets_after_status after update of status on public.tickets
  for each row execute function public.tickets_after_status();

-- Respuesta (con adjunto opcional) y primera respuesta del equipo.
drop function if exists public.ticket_reply(uuid, text, boolean);
create or replace function public.ticket_reply(p_ticket uuid, p_body text, p_internal boolean default false, p_attachment jsonb default null)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.tickets;
  staff boolean := public.is_support_staff();
  v_body text := nullif(btrim(p_body), '');
  att jsonb;
  new_id bigint;
begin
  select * into t from public.tickets where id = p_ticket;
  if t.id is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if not staff and (auth.uid() is null or t.requester_id is distinct from auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_attachment is not null then
    if coalesce(p_attachment ->> 'path', '') not like 't/' || t.id || '/%' or coalesce((p_attachment ->> 'size')::bigint, 0) not between 1 and 15728640 then
      raise exception 'invalid_attachment' using errcode = '22023';
    end if;
    att := jsonb_build_object('path', p_attachment ->> 'path', 'name', left(p_attachment ->> 'name', 160),
                              'mime', left(p_attachment ->> 'mime', 100), 'size', (p_attachment ->> 'size')::bigint);
    v_body := coalesce(v_body, '📎 ' || (att ->> 'name'));
  end if;
  if v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;

  insert into public.ticket_messages (ticket_id, author_id, author_kind, body, internal, attachment)
  values (p_ticket, auth.uid(), case when staff then 'staff' else 'requester' end, left(v_body, 5000),
          staff and coalesce(p_internal, false), att)
  returning id into new_id;

  update public.tickets
     set last_activity_at = now(),
         assigned_to = case when staff and not coalesce(p_internal, false) then coalesce(assigned_to, auth.uid()) else assigned_to end,
         first_response_at = case when staff and not coalesce(p_internal, false) then coalesce(first_response_at, now()) else first_response_at end,
         status = case
           when not staff and status in ('waiting', 'resolved', 'closed') then 'open'
           when staff and not coalesce(p_internal, false) and status = 'open' then 'in_progress'
           else status end
   where id = p_ticket;
  return new_id;
end;
$$;
revoke all on function public.ticket_reply(uuid, text, boolean, jsonb) from public, anon;
grant execute on function public.ticket_reply(uuid, text, boolean, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Adjuntos: t/<ticket>/<archivo>
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-files', 'ticket-files', false, 15728640, array[
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'video/mp4', 'video/quicktime'
])
on conflict (id) do nothing;

create or replace function public.ticket_file_allowed(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_support_staff() or exists (
    select 1 from public.tickets t where t.id::text = p_folder and t.requester_id = auth.uid())
$$;

create policy "ticket-files: equipo o solicitante suben" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ticket-files' and (storage.foldername(name))[1] = 't' and public.ticket_file_allowed((storage.foldername(name))[2]));
create policy "ticket-files: equipo o solicitante leen" on storage.objects
  for select to authenticated
  using (bucket_id = 'ticket-files' and (storage.foldername(name))[1] = 't' and public.ticket_file_allowed((storage.foldername(name))[2]));
create policy "ticket-files: equipo borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ticket-files' and (select public.is_support_staff()));

-- -----------------------------------------------------------------------------
-- Respuestas rápidas (macros)
-- -----------------------------------------------------------------------------

create table public.ticket_macros (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 5000),
  set_status public.ticket_status,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.ticket_macros enable row level security;
create policy "ticket_macros: equipo gestiona" on public.ticket_macros
  for all to authenticated using ((select public.is_support_staff())) with check ((select public.is_support_staff()));

insert into public.ticket_macros (title, body, set_status, created_by) values
  ('Recibido, lo revisamos', E'Hola {nombre},\n\nRecibimos tu solicitud #{numero} y ya la estamos revisando. Te escribimos por aquí apenas tengamos novedades.', 'in_progress', null),
  ('Pedir más información', E'Hola {nombre},\n\nPara avanzar necesitamos un poco más de información:\n\n• ¿Desde cuándo ocurre?\n• ¿Qué pasos sigues para que aparezca el problema?\n• Si puedes, adjunta una captura de pantalla.\n\nQuedamos atentos.', 'waiting', null),
  ('Solucionado', E'Hola {nombre},\n\nYa quedó solucionado. ¿Nos confirmas que todo funciona bien de tu lado? Si algo sigue pendiente, responde aquí y lo retomamos.', 'resolved', null),
  ('Programado para mantenimiento', E'Hola {nombre},\n\nProgramamos el ajuste para la próxima ventana de mantenimiento. Te avisaremos por aquí cuando esté listo.', 'waiting', null);

-- -----------------------------------------------------------------------------
-- Unir duplicados
-- -----------------------------------------------------------------------------

create or replace function public.ticket_merge(p_source uuid, p_target uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s public.tickets;
  t public.tickets;
begin
  if not public.is_support_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into s from public.tickets where id = p_source;
  select * into t from public.tickets where id = p_target;
  if s.id is null or t.id is null or s.id = t.id then
    raise exception 'invalid' using errcode = '22023';
  end if;
  -- La conversación del duplicado pasa a la principal (como nota con su descripción).
  insert into public.ticket_messages (ticket_id, author_id, author_kind, body, internal)
  values (t.id, auth.uid(), 'staff', left('Unida desde #' || s.number || ' (' || s.subject || E'):\n\n' || s.description, 5000), true);
  update public.ticket_messages set ticket_id = t.id where ticket_id = s.id and author_kind <> 'system';
  update public.tickets set tags = (select array(select distinct unnest(t.tags || s.tags))), last_activity_at = now() where id = t.id;
  update public.tickets set merged_into = t.id, status = 'closed' where id = s.id;
  insert into public.ticket_messages (ticket_id, author_id, author_kind, body)
  values (s.id, auth.uid(), 'system', 'merged:' || t.number);
end;
$$;

-- -----------------------------------------------------------------------------
-- Encuesta de satisfacción (pública, con el token del correo)
-- -----------------------------------------------------------------------------

create or replace function public.ticket_csat_info(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('number', number, 'subject', subject, 'name', split_part(name, ' ', 1), 'rated', csat_at is not null, 'rating', csat_rating)
    from public.tickets where csat_token = p_token
$$;

create or replace function public.ticket_csat(p_token uuid, p_rating integer, p_comment text default null)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.tickets;
begin
  if p_rating not between 1 and 5 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  update public.tickets
     set csat_rating = p_rating, csat_comment = left(nullif(btrim(p_comment), ''), 1000), csat_at = now()
   where csat_token = p_token
  returning * into t;
  if t.id is null then
    return false;
  end if;
  insert into public.ticket_messages (ticket_id, author_kind, body, internal)
  values (t.id, 'system', 'csat:' || p_rating, true);
  -- Calificación baja: aviso al responsable.
  if p_rating <= 2 and t.assigned_to is not null then
    perform public.notify(null, t.assigned_to, 'ticket', '😟 Calificación baja en #' || t.number,
                          coalesce(left(nullif(btrim(p_comment), ''), 300), t.subject), '/es/portal/soporte/' || t.id);
  end if;
  return true;
end;
$$;
revoke all on function public.ticket_csat_info(uuid) from public;
revoke all on function public.ticket_csat(uuid, integer, text) from public;
grant execute on function public.ticket_csat_info(uuid) to anon, authenticated;
grant execute on function public.ticket_csat(uuid, integer, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Vencimientos y cierre automático (cada 15 minutos)
-- -----------------------------------------------------------------------------

alter table public.tickets add column sla_notified_at timestamptz;

create or replace function public.support_tick()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r record;
  n int := 0;
  days int := coalesce((public.support_config() ->> 'auto_close_days')::int, 0);
begin
  -- SLA vencido (primera respuesta o resolución): un aviso por solicitud.
  for r in
    update public.tickets set sla_notified_at = now()
     where status in ('open', 'in_progress', 'waiting') and sla_notified_at is null and merged_into is null
       and ((first_response_at is null and first_response_due < now()) or resolve_due < now())
    returning id, number, subject, assigned_to
  loop
    if r.assigned_to is not null then
      perform public.notify(null, r.assigned_to, 'ticket', '⏱️ SLA vencido en #' || r.number, r.subject, '/es/portal/soporte/' || r.id);
    else
      perform public.notify(array['admin', 'support']::public.app_role[], null, 'ticket', '⏱️ SLA vencido en #' || r.number, r.subject, '/es/portal/soporte/' || r.id);
    end if;
    n := n + 1;
  end loop;
  -- Resueltas sin actividad: se cierran.
  if days > 0 then
    update public.tickets set status = 'closed'
     where status = 'resolved' and last_activity_at < now() - make_interval(days => days);
  end if;
  return n;
end;
$$;
revoke all on function public.support_tick() from public, anon, authenticated;
select cron.schedule('support-tick', '*/15 * * * *', 'select public.support_tick()');

-- -----------------------------------------------------------------------------
-- Métricas
-- -----------------------------------------------------------------------------

create or replace function public.support_kpis(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 1), 365);
  since timestamptz := (date_trunc('day', now() at time zone 'America/Bogota') - make_interval(days => d - 1)) at time zone 'America/Bogota';
  result jsonb;
begin
  if not public.is_support_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with c as (select * from public.tickets where created_at >= since and merged_into is null),
       p as (select * from public.tickets where created_at >= since - make_interval(days => d) and created_at < since and merged_into is null),
       active as (select * from public.tickets where status in ('open', 'in_progress', 'waiting') and merged_into is null)
  select jsonb_build_object(
    'open', (select count(*) from active),
    'unassigned', (select count(*) from active where assigned_to is null),
    'breached', (select count(*) from active where (first_response_at is null and first_response_due < now()) or resolve_due < now()),
    'due_soon', (select count(*) from active where not ((first_response_at is null and first_response_due < now()) or resolve_due < now())
                   and ((first_response_at is null and first_response_due < now() + interval '2 hours') or resolve_due < now() + interval '4 hours')),
    'created', (select count(*) from c),
    'created_prev', (select count(*) from p),
    'resolved', (select count(*) from public.tickets where resolved_at >= since and merged_into is null),
    'first_response_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at))) from c where first_response_at is not null),
    'first_response_prev_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at))) from p where first_response_at is not null),
    'resolution_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by resolved_at - created_at))) from c where resolved_at is not null),
    'sla_met_pct', (select round(100.0 * count(*) filter (where (first_response_at is null or first_response_at <= first_response_due or first_response_due is null)
                                                            and (resolved_at is null or resolve_due is null or resolved_at <= resolve_due))
                                 / nullif(count(*) filter (where resolved_at is not null or first_response_at is not null), 0))
                      from c where resolved_at is not null or first_response_at is not null),
    'csat', (select round(avg(csat_rating)::numeric, 1) from public.tickets where csat_at >= since),
    'csat_count', (select count(*) from public.tickets where csat_at >= since),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'day', g::date,
               'created', (select count(*) from c where (created_at at time zone 'America/Bogota')::date = g::date),
               'resolved', (select count(*) from public.tickets where (resolved_at at time zone 'America/Bogota')::date = g::date)
             ) order by g)
        from generate_series((since at time zone 'America/Bogota')::date, (now() at time zone 'America/Bogota')::date, interval '1 day') g
    ),
    'by_category', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'n', n) order by n desc) from (select category, count(*) n from c group by category) x), '[]'::jsonb),
    'by_priority', coalesce((select jsonb_object_agg(priority, n) from (select priority, count(*) n from c group by priority) x), '{}'::jsonb),
    'agents', coalesce((
      select jsonb_agg(row_to_json(a) order by a.resolved desc) from (
        select pr.id, coalesce(pr.full_name, pr.email) as name,
               (select count(*) from active t where t.assigned_to = pr.id) as open,
               (select count(*) from public.tickets t where t.assigned_to = pr.id and t.resolved_at >= since) as resolved,
               (select round(extract(epoch from percentile_cont(0.5) within group (order by t.first_response_at - t.created_at)))
                  from c t where t.assigned_to = pr.id and t.first_response_at is not null) as first_response_s,
               (select round(avg(t.csat_rating)::numeric, 1) from public.tickets t where t.assigned_to = pr.id and t.csat_at >= since) as csat
          from public.profiles pr
         where pr.active and pr.kind = 'employee' and pr.role in ('admin', 'support', 'sales')
      ) a
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.ticket_merge(uuid, uuid) from public, anon;
revoke all on function public.support_kpis(integer) from public, anon;
grant execute on function public.ticket_merge(uuid, uuid) to authenticated;
grant execute on function public.support_kpis(integer) to authenticated;

-- Fuente "chat" ya existe; las solicitudes viejas toman sus vencimientos ahora.
update public.tickets t set
  first_response_due = case when t.first_response_at is null then t.created_at + make_interval(hours => (public.support_config() -> 'sla' -> t.priority::text ->> 'first_h')::int) end,
  resolve_due = t.created_at + make_interval(hours => (public.support_config() -> 'sla' -> t.priority::text ->> 'resolve_h')::int);

-- -----------------------------------------------------------------------------
-- El equipo registra una solicitud por un cliente (llamada, correo, visita).
-- -----------------------------------------------------------------------------

create or replace function public.staff_create_ticket(p jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  acc public.profiles;
  v_email text;
  v_priority public.ticket_priority;
  t public.tickets;
begin
  if not public.is_support_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if nullif(p ->> 'requester_id', '') is not null then
    select * into acc from public.profiles where id = (p ->> 'requester_id')::uuid and kind in ('client', 'provider');
  end if;
  v_email := lower(btrim(coalesce(acc.email, p ->> 'email', '')));
  if coalesce(nullif(btrim(coalesce(p ->> 'name', acc.full_name)), ''), '') = ''
     or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or nullif(btrim(p ->> 'description'), '') is null
     or nullif(btrim(p ->> 'subject'), '') is null
     or nullif(btrim(p ->> 'category'), '') is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  begin
    v_priority := coalesce(nullif(p ->> 'priority', ''), 'medium')::public.ticket_priority;
  exception when invalid_text_representation then
    v_priority := 'medium';
  end;

  insert into public.tickets (requester_id, name, email, phone, company, category, priority, affected, subject, description,
                              source, assigned_to, tags)
  values (acc.id,
          left(coalesce(nullif(btrim(p ->> 'name'), ''), acc.full_name, v_email), 120),
          v_email,
          left(coalesce(nullif(btrim(p ->> 'phone'), ''), acc.phone), 40),
          left(coalesce(nullif(btrim(p ->> 'company'), ''), acc.company), 160),
          left(btrim(p ->> 'category'), 40),
          v_priority,
          left(nullif(btrim(p ->> 'affected'), ''), 120),
          left(btrim(p ->> 'subject'), 200),
          left(btrim(p ->> 'description'), 5000),
          'portal',
          coalesce(nullif(p ->> 'assigned_to', '')::uuid, auth.uid()),
          coalesce((select array_agg(distinct left(lower(btrim(x)), 30)) from jsonb_array_elements_text(coalesce(p -> 'tags', '[]'::jsonb)) x where btrim(x) <> ''), '{}'))
  returning * into t;

  insert into public.ticket_messages (ticket_id, author_id, author_kind, body, internal)
  values (t.id, auth.uid(), 'staff', 'Registrada por el equipo' || coalesce(' (' || nullif(p ->> 'channel', '') || ')', '') || '.', true);
  return jsonb_build_object('id', t.id, 'number', t.number);
end;
$$;
revoke all on function public.staff_create_ticket(jsonb) from public, anon;
grant execute on function public.staff_create_ticket(jsonb) to authenticated;
