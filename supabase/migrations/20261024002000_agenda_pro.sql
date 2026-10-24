-- =============================================================================
-- Agenda PRO
--   * Reuniones con tipo, enlace de videollamada, lugar, duración propia,
--     anfitrión, resultado y motivo de cancelación.
--   * Agendar, reprogramar, cancelar (avisando al cliente) y cerrar la reunión
--     (realizada / no asistió) con tarea de seguimiento.
--   * Enlace de agenda para cualquier lead (no solo verdes recién llegados).
--   * Huecos libres de un día para el equipo y métricas de la agenda.
-- =============================================================================

alter table public.appointments
  add column kind text not null default 'discovery' check (kind in ('discovery', 'demo', 'proposal', 'followup', 'support', 'other')),
  add column meeting_url text check (char_length(meeting_url) <= 500),
  add column location text check (char_length(location) <= 300),
  add column outcome text check (char_length(outcome) <= 2000),
  add column cancel_reason text check (char_length(cancel_reason) <= 500),
  add column reschedule_count smallint not null default 0;

alter table public.leads add column booking_invite_until timestamptz;

-- El enlace de agenda sirve a los leads verdes nuevos o a quien el equipo invitó.
create or replace function public.lead_for_booking(p_token uuid)
returns public.leads
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  l public.leads;
begin
  select * into l from public.leads
   where booking_token = p_token
     and ((tier = 'green' and created_at > now() - interval '7 days') or booking_invite_until > now());
  if l.id is null then
    raise exception 'invalid_token' using errcode = '28000';
  end if;
  return l;
end;
$$;

-- Nombre de pila del lead para la página pública de agenda.
create or replace function public.booking_lead(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  l public.leads;
begin
  l := public.lead_for_booking(p_token);
  return jsonb_build_object(
    'name', split_part(l.name, ' ', 1),
    'locale', coalesce(l.locale, 'es'),
    'appointment', (select jsonb_build_object('starts_at', a.starts_at, 'channel', a.channel)
                      from public.appointments a where a.lead_id = l.id and a.status = 'scheduled' and a.starts_at > now()
                      order by a.starts_at limit 1)
  );
end;
$$;
revoke all on function public.booking_lead(uuid) from public;
grant execute on function public.booking_lead(uuid) to anon, authenticated;

create or replace function public.agenda_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'sales']::public.app_role[])
$$;

-- Invitar a un lead a agendar (7 días): devuelve su token.
create or replace function public.booking_invite(p_lead uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token uuid;
begin
  if not public.agenda_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.leads set booking_invite_until = now() + interval '7 days'
   where id = p_lead
  returning booking_token into v_token;
  if v_token is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (p_lead, auth.uid(), 'appointment', 'Enlace de agenda enviado', jsonb_build_object('kind', 'invite'));
  return v_token;
end;
$$;

-- Huecos libres de un día (sin la anticipación mínima: es para el equipo).
create or replace function public.staff_free_slots(p_day date, p_duration integer default null)
returns table (starts_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.booking_settings;
  dur int;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into s from public.booking_settings where id = 1;
  dur := coalesce(p_duration, s.duration_min);
  return query
  select (gs at time zone s.timezone)
    from public.availability a
    cross join lateral generate_series(
      p_day + a.start_time,
      p_day + a.end_time - make_interval(mins => dur),
      make_interval(mins => 30)
    ) gs
   where a.weekday = extract(dow from p_day)
     and (gs at time zone s.timezone) > now()
     and not exists (
       select 1 from public.appointments ap
        where ap.status = 'scheduled'
          and tstzrange(ap.starts_at - make_interval(mins => s.buffer_min), ap.ends_at + make_interval(mins => s.buffer_min))
              && tstzrange(gs at time zone s.timezone, (gs at time zone s.timezone) + make_interval(mins => dur)))
     and not exists (
       select 1 from public.availability_blocks b
        where tstzrange(b.starts_at, b.ends_at) && tstzrange(gs at time zone s.timezone, (gs at time zone s.timezone) + make_interval(mins => dur)))
   order by 1;
end;
$$;

-- Correo al cliente cuando el equipo cambia o cancela la reunión.
create or replace function public.appointment_email(p_appt public.appointments, p_subject text, p_body text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l public.leads;
begin
  select * into l from public.leads where id = p_appt.lead_id;
  if l.id is null or l.email_opt_out_at is not null then
    return;
  end if;
  insert into public.email_queue (kind, lead_id, to_email, payload, created_by)
  values ('custom', l.id, l.email, jsonb_build_object(
    'subject', p_subject, 'body', p_body,
    'cta_label', case when coalesce(l.locale, 'es') = 'en' then 'Pick another time' else 'Elegir otro horario' end,
    'cta_url', 'https://engynex.com/' || coalesce(l.locale, 'es') || '/agendar?t=' || l.booking_token,
    'locale', l.locale, 'email_token', l.email_token), auth.uid());
end;
$$;
revoke all on function public.appointment_email(public.appointments, text, text) from public, anon, authenticated;

-- Agendar desde el portal (más opciones que staff_book_appointment).
create or replace function public.staff_book(p jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_lead uuid := (p ->> 'lead_id')::uuid;
  v_start timestamptz := (p ->> 'starts_at')::timestamptz;
  dur int := coalesce((p ->> 'duration')::int, (select duration_min from public.booking_settings where id = 1), 30);
  new_id uuid;
begin
  if not public.agenda_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_start is null or v_start <= now() then
    raise exception 'past' using errcode = '22023';
  end if;
  if dur not between 10 and 480 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  -- Si el lead ya tenía una cita activa, se reemplaza.
  update public.appointments set status = 'cancelled', cancel_reason = 'Reemplazada por una nueva reunión'
   where lead_id = v_lead and status = 'scheduled';
  insert into public.appointments (lead_id, starts_at, ends_at, channel, status, notes, host_id, kind, meeting_url, location)
  values (v_lead, v_start, v_start + make_interval(mins => dur),
          coalesce(nullif(p ->> 'channel', ''), 'meet')::public.meeting_channel, 'scheduled',
          left(nullif(btrim(p ->> 'notes'), ''), 1000),
          coalesce(nullif(p ->> 'host_id', '')::uuid, auth.uid()),
          coalesce(nullif(p ->> 'kind', ''), 'discovery'),
          left(nullif(btrim(p ->> 'meeting_url'), ''), 500),
          left(nullif(btrim(p ->> 'location'), ''), 300))
  returning id into new_id;
  update public.leads set status = 'meeting' where id = v_lead and status in ('new', 'contacted');
  insert into public.lead_activities (lead_id, author_id, type, meta)
  values (v_lead, auth.uid(), 'appointment', jsonb_build_object('starts_at', v_start, 'channel', p ->> 'channel'));
  return new_id;
exception when exclusion_violation then
  raise exception 'slot_taken' using errcode = 'P0001';
end;
$$;

create or replace function public.staff_reschedule(p_id uuid, p_start timestamptz, p_notify boolean default true)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.appointments;
begin
  if not public.agenda_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_start <= now() then
    raise exception 'past' using errcode = '22023';
  end if;
  update public.appointments
     set starts_at = p_start, ends_at = p_start + (ends_at - starts_at), reschedule_count = reschedule_count + 1
   where id = p_id and status = 'scheduled'
  returning * into a;
  if a.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (a.lead_id, auth.uid(), 'appointment', 'Reunión reprogramada', jsonb_build_object('starts_at', p_start, 'channel', a.channel, 'kind', 'rescheduled'));
  if p_notify then
    -- La confirmación se arma con la cita activa: sale con la nueva hora.
    insert into public.email_queue (kind, lead_id, to_email, created_by)
    select 'booking_confirmation', l.id, l.email, auth.uid() from public.leads l where l.id = a.lead_id and l.email_opt_out_at is null;
  end if;
exception when exclusion_violation then
  raise exception 'slot_taken' using errcode = 'P0001';
end;
$$;

create or replace function public.staff_cancel(p_id uuid, p_reason text default null, p_notify boolean default true)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.appointments;
  l public.leads;
  en boolean;
  stamp text;
begin
  if not public.agenda_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.appointments set status = 'cancelled', cancel_reason = left(nullif(btrim(p_reason), ''), 500)
   where id = p_id and status = 'scheduled'
  returning * into a;
  if a.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (a.lead_id, auth.uid(), 'appointment', coalesce('Reunión cancelada: ' || nullif(btrim(p_reason), ''), 'Reunión cancelada'),
          jsonb_build_object('kind', 'cancelled'));
  -- Ya no hay reunión pendiente: se cancelan los recordatorios en cola.
  update public.email_queue set status = 'cancelled', error = 'manual'
   where lead_id = a.lead_id and status = 'queued' and kind = 'booking_confirmation';
  if p_notify then
    select * into l from public.leads where id = a.lead_id;
    en := coalesce(l.locale, 'es') = 'en';
    stamp := to_char(a.starts_at at time zone 'America/Bogota', 'DD/MM/YYYY HH24:MI');
    perform public.appointment_email(a,
      case when en then 'Your meeting with Engynex was cancelled' else 'Cancelamos tu reunión con Engynex' end,
      case when en
        then 'Hi ' || split_part(l.name, ' ', 1) || E',\n\nWe had to cancel our meeting on ' || stamp || ' (Colombia time).' ||
             coalesce(E'\n\nReason: ' || nullif(btrim(p_reason), ''), '') || E'\n\nSorry for the inconvenience. You can pick a new time with the button below.'
        else 'Hola ' || split_part(l.name, ' ', 1) || E',\n\nTuvimos que cancelar la reunión del ' || stamp || ' (hora de Colombia).' ||
             coalesce(E'\n\nMotivo: ' || nullif(btrim(p_reason), ''), '') || E'\n\nDisculpa el inconveniente. Puedes elegir un nuevo horario con el botón de abajo.'
      end);
    update public.leads set booking_invite_until = greatest(coalesce(booking_invite_until, now()), now() + interval '7 days') where id = a.lead_id;
  end if;
end;
$$;

-- Cerrar la reunión: realizada o no asistió, con resultado y seguimiento.
create or replace function public.appointment_close(p_id uuid, p_status public.appointment_status, p_outcome text default null, p_followup_days integer default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  a public.appointments;
  l public.leads;
begin
  if not public.agenda_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('done', 'no_show') then
    raise exception 'invalid' using errcode = '22023';
  end if;
  update public.appointments set status = p_status, outcome = left(nullif(btrim(p_outcome), ''), 2000)
   where id = p_id
  returning * into a;
  if a.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select * into l from public.leads where id = a.lead_id;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (a.lead_id, auth.uid(), 'meeting',
          case p_status when 'done' then coalesce('Reunión realizada: ' || nullif(btrim(p_outcome), ''), 'Reunión realizada')
                        else 'El cliente no asistió a la reunión' end,
          jsonb_build_object('kind', p_status, 'appointment_id', a.id));
  if p_followup_days is not null and p_followup_days between 0 and 90 then
    insert into public.tasks (lead_id, title, due_at, assigned_to, created_by, type, priority)
    values (a.lead_id,
            left(case p_status when 'done' then 'Seguimiento de la reunión con ' else 'Reagendar con ' end || l.name, 300),
            (date_trunc('day', now() at time zone 'America/Bogota') + make_interval(days => p_followup_days) + interval '9 hours') at time zone 'America/Bogota',
            coalesce(a.host_id, auth.uid()), auth.uid(), case p_status when 'done' then 'follow_up' else 'call' end,
            case p_status when 'done' then 'high' else 'medium' end);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Métricas
-- -----------------------------------------------------------------------------

create or replace function public.agenda_kpis(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 1), 365);
  since timestamptz := now() - make_interval(days => d);
  day_start timestamptz := date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'today', (select count(*) from public.appointments where status = 'scheduled' and starts_at >= day_start and starts_at < day_start + interval '1 day'),
    'week', (select count(*) from public.appointments where status = 'scheduled' and starts_at >= now() and starts_at < now() + interval '7 days'),
    'booked', (select count(*) from public.appointments where created_at >= since),
    'booked_prev', (select count(*) from public.appointments where created_at >= since - make_interval(days => d) and created_at < since),
    'done', (select count(*) from public.appointments where status = 'done' and starts_at >= since),
    'no_show', (select count(*) from public.appointments where status = 'no_show' and starts_at >= since),
    'cancelled', (select count(*) from public.appointments where status = 'cancelled' and starts_at >= since),
    'to_close', (select count(*) from public.appointments where status = 'scheduled' and ends_at < now()),
    'won', (select count(distinct a.lead_id) from public.appointments a join public.leads l on l.id = a.lead_id
             where a.status = 'done' and a.starts_at >= since and l.status = 'won'),
    'by_channel', coalesce((select jsonb_object_agg(channel, n) from (
                    select channel, count(*) n from public.appointments where created_at >= since group by channel) x), '{}'::jsonb),
    'daily', (
      select jsonb_agg(jsonb_build_object('day', g::date, 'n', (
               select count(*) from public.appointments where (created_at at time zone 'America/Bogota')::date = g::date)) order by g)
        from generate_series((now() at time zone 'America/Bogota')::date - 13, (now() at time zone 'America/Bogota')::date, interval '1 day') g
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.booking_invite(uuid) from public, anon;
revoke all on function public.staff_free_slots(date, integer) from public, anon;
revoke all on function public.staff_book(jsonb) from public, anon;
revoke all on function public.staff_reschedule(uuid, timestamptz, boolean) from public, anon;
revoke all on function public.staff_cancel(uuid, text, boolean) from public, anon;
revoke all on function public.appointment_close(uuid, public.appointment_status, text, integer) from public, anon;
revoke all on function public.agenda_kpis(integer) from public, anon;
grant execute on function public.booking_invite(uuid) to authenticated;
grant execute on function public.staff_free_slots(date, integer) to authenticated;
grant execute on function public.staff_book(jsonb) to authenticated;
grant execute on function public.staff_reschedule(uuid, timestamptz, boolean) to authenticated;
grant execute on function public.staff_cancel(uuid, text, boolean) to authenticated;
grant execute on function public.appointment_close(uuid, public.appointment_status, text, integer) to authenticated;
grant execute on function public.agenda_kpis(integer) to authenticated;
