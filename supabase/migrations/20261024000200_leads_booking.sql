-- =============================================================================
-- Fase 1 — Formulario calificado, puntaje y agenda
--
-- El formulario público NO escribe en las tablas: llama a funciones
-- (security definer) que validan los datos, calculan el puntaje con la
-- configuración guardada aquí y deciden el color. Así nadie puede enviar un
-- puntaje o un color falsos, ni reservar una cita sin ser un lead verde.
-- =============================================================================

create extension if not exists btree_gist with schema extensions;

create type public.lead_tier as enum ('green', 'yellow', 'red');
create type public.lead_status as enum (
  'new', 'contacted', 'meeting', 'proposal', 'won', 'lost'
);
create type public.meeting_channel as enum ('meet', 'call', 'whatsapp', 'in_person');
create type public.appointment_status as enum ('scheduled', 'cancelled', 'done', 'no_show');

-- -----------------------------------------------------------------------------
-- Configuración del puntaje (una sola fila, editable desde el portal)
-- -----------------------------------------------------------------------------

create table public.scoring_config (
  id smallint primary key default 1 check (id = 1),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

comment on table public.scoring_config is
  'Puntos por respuesta y umbrales de color del formulario de calificación.';

insert into public.scoring_config (config) values ($json$
{
  "thresholds": { "green": 70, "yellow": 40 },
  "problem": { "described": 25, "category_only": 15, "none": 0, "min_text_length": 15 },
  "budget": {
    "lt2": 5, "2to5": 15, "5to15": 25, "15to40": 30, "gt40": 30,
    "monthly": 20, "unknown": 10
  },
  "decision": { "self": 15, "shared": 10, "other": 4 },
  "timeline": { "week": 30, "month": 20, "browsing": 0 },
  "rules": {
    "no_problem_is_red": true,
    "browsing_max_tier": "yellow"
  }
}
$json$::jsonb);

-- -----------------------------------------------------------------------------
-- Leads
-- -----------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Contacto
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  phone text not null check (char_length(phone) between 7 and 30),
  company text check (char_length(company) <= 160),

  -- Respuestas de calificación
  problem_category text not null,
  problem_text text check (char_length(problem_text) <= 2000),
  budget text not null,
  decision text not null,
  timeline text not null,

  -- Resultado
  score smallint not null check (score between 0 and 100),
  tier public.lead_tier not null,
  score_breakdown jsonb not null,

  -- Gestión (CRM)
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,

  -- Origen
  locale text,
  source_page text,
  referrer text,
  utm jsonb,
  gclid text,
  visitor_id text,

  consent_at timestamptz not null,
  -- Permite al lead (sin cuenta) ver huecos y reservar. Solo sirve si es verde.
  booking_token uuid not null default gen_random_uuid() unique
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_tier_idx on public.leads (tier, status);
create index leads_email_idx on public.leads (lower(email));

create trigger leads_touch
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Agenda
-- -----------------------------------------------------------------------------

create table public.booking_settings (
  id smallint primary key default 1 check (id = 1),
  timezone text not null default 'America/Bogota',
  duration_min smallint not null default 30 check (duration_min between 10 and 240),
  buffer_min smallint not null default 15 check (buffer_min between 0 and 120),
  notice_hours smallint not null default 2 check (notice_hours between 0 and 168),
  horizon_days smallint not null default 14 check (horizon_days between 1 and 60),
  updated_at timestamptz not null default now()
);
insert into public.booking_settings default values;

-- Franjas semanales en las que se agendan reuniones (hora local).
create table public.availability (
  id bigint generated always as identity primary key,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

insert into public.availability (weekday, start_time, end_time) values
  (1, '08:00', '12:00'), (1, '14:00', '17:00'),
  (2, '08:00', '12:00'), (2, '14:00', '17:00'),
  (3, '08:00', '12:00'), (3, '14:00', '17:00'),
  (4, '08:00', '12:00'), (4, '14:00', '17:00'),
  (5, '08:00', '12:00'), (5, '14:00', '17:00'),
  (6, '08:00', '12:00');

-- Bloqueos puntuales (festivos, vacaciones, reuniones internas).
create table public.availability_blocks (
  id bigint generated always as identity primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  channel public.meeting_channel not null,
  status public.appointment_status not null default 'scheduled',
  notes text check (char_length(notes) <= 1000),
  host_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Dos citas activas nunca se cruzan (protege también de reservas
  -- simultáneas del mismo hueco).
  constraint appointments_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'scheduled')
);

-- Un lead tiene como máximo una cita activa.
create unique index appointments_one_active_per_lead
  on public.appointments (lead_id) where (status = 'scheduled');
create index appointments_starts_idx on public.appointments (starts_at);

create trigger appointments_touch
  before update on public.appointments
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Puntaje
-- -----------------------------------------------------------------------------

create or replace function public.score_lead(
  p_category text,
  p_problem_text text,
  p_budget text,
  p_decision text,
  p_timeline text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cfg jsonb;
  problem_pts int;
  budget_pts int;
  decision_pts int;
  timeline_pts int;
  total int;
  tier text;
  reason text := null;
begin
  select config into cfg from public.scoring_config where id = 1;

  if p_category = 'none' then
    problem_pts := (cfg #>> '{problem,none}')::int;
  elsif char_length(coalesce(btrim(p_problem_text), '')) >= (cfg #>> '{problem,min_text_length}')::int then
    problem_pts := (cfg #>> '{problem,described}')::int;
  else
    problem_pts := (cfg #>> '{problem,category_only}')::int;
  end if;

  budget_pts := coalesce((cfg -> 'budget' ->> p_budget)::int, 0);
  decision_pts := coalesce((cfg -> 'decision' ->> p_decision)::int, 0);
  timeline_pts := coalesce((cfg -> 'timeline' ->> p_timeline)::int, 0);
  total := least(100, problem_pts + budget_pts + decision_pts + timeline_pts);

  if total >= (cfg #>> '{thresholds,green}')::int then
    tier := 'green';
  elsif total >= (cfg #>> '{thresholds,yellow}')::int then
    tier := 'yellow';
  else
    tier := 'red';
  end if;

  -- Reglas que mandan sobre el puntaje.
  if p_category = 'none' and coalesce((cfg #>> '{rules,no_problem_is_red}')::boolean, true) then
    tier := 'red';
    reason := 'no_problem';
  elsif p_timeline = 'browsing' and tier = 'green'
        and (cfg #>> '{rules,browsing_max_tier}') = 'yellow' then
    tier := 'yellow';
    reason := 'browsing';
  end if;

  return jsonb_build_object(
    'score', total,
    'tier', tier,
    'breakdown', jsonb_build_object(
      'problem', problem_pts,
      'budget', budget_pts,
      'decision', decision_pts,
      'timeline', timeline_pts,
      'rule', reason
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Envío del formulario (público)
-- -----------------------------------------------------------------------------

create or replace function public.submit_lead(p jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p ->> 'name');
  v_email text := lower(btrim(p ->> 'email'));
  v_phone text := btrim(p ->> 'phone');
  v_category text := p ->> 'problem_category';
  v_text text := nullif(btrim(p ->> 'problem_text'), '');
  v_budget text := p ->> 'budget';
  v_decision text := p ->> 'decision';
  v_timeline text := p ->> 'timeline';
  result jsonb;
  new_lead public.leads;
begin
  -- Validación de opciones (las mismas del formulario).
  if v_category is null or v_category not in
     ('sales', 'web', 'automation', 'system', 'support', 'other', 'none') then
    raise exception 'invalid_category' using errcode = '22023';
  end if;
  if v_budget not in ('lt2', '2to5', '5to15', '15to40', 'gt40', 'monthly', 'unknown') then
    raise exception 'invalid_budget' using errcode = '22023';
  end if;
  if v_decision not in ('self', 'shared', 'other') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  if v_timeline not in ('week', 'month', 'browsing') then
    raise exception 'invalid_timeline' using errcode = '22023';
  end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  -- Límite anti-abuso: 3 envíos por correo cada 10 minutos y 60 en total
  -- por minuto.
  if (select count(*) from public.leads
      where lower(email) = v_email and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.leads
         where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  result := public.score_lead(v_category, v_text, v_budget, v_decision, v_timeline);

  insert into public.leads (
    name, email, phone, company,
    problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown,
    locale, source_page, referrer, utm, gclid, visitor_id, consent_at
  ) values (
    v_name, v_email, v_phone, nullif(btrim(p ->> 'company'), ''),
    v_category, v_text, v_budget, v_decision, v_timeline,
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier,
    result -> 'breakdown',
    left(p ->> 'locale', 5), left(p ->> 'source_page', 500), left(p ->> 'referrer', 500),
    case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end,
    left(p ->> 'gclid', 200), left(p ->> 'visitor_id', 100), now()
  )
  returning * into new_lead;

  return jsonb_build_object(
    'id', new_lead.id,
    'tier', new_lead.tier,
    'category', new_lead.problem_category,
    -- El token de agenda solo sale para los leads verdes.
    'booking_token', case when new_lead.tier = 'green' then new_lead.booking_token end
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Huecos disponibles y reserva (públicos, solo con token de lead verde)
-- -----------------------------------------------------------------------------

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
    and tier = 'green'
    and created_at > now() - interval '7 days';
  if l.id is null then
    raise exception 'invalid_token' using errcode = '28000';
  end if;
  return l;
end;
$$;

create or replace function public.available_slots(p_token uuid)
returns table (starts_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.booking_settings;
begin
  perform public.lead_for_booking(p_token);
  select * into s from public.booking_settings where id = 1;

  return query
  with days as (
    select ((now() at time zone s.timezone)::date + d) as day
    from generate_series(0, s.horizon_days) as d
  ),
  candidates as (
    select (gs at time zone s.timezone) as slot_start
    from days
    join public.availability a on a.weekday = extract(dow from days.day)
    cross join lateral generate_series(
      days.day + a.start_time,
      days.day + a.end_time - make_interval(mins => s.duration_min),
      make_interval(mins => s.duration_min + s.buffer_min)
    ) as gs
  )
  select c.slot_start
  from candidates c
  where c.slot_start >= now() + make_interval(hours => s.notice_hours)
    and not exists (
      select 1 from public.appointments ap
      where ap.status = 'scheduled'
        and tstzrange(ap.starts_at - make_interval(mins => s.buffer_min),
                      ap.ends_at + make_interval(mins => s.buffer_min))
            && tstzrange(c.slot_start, c.slot_start + make_interval(mins => s.duration_min))
    )
    and not exists (
      select 1 from public.availability_blocks b
      where tstzrange(b.starts_at, b.ends_at)
            && tstzrange(c.slot_start, c.slot_start + make_interval(mins => s.duration_min))
    )
  order by c.slot_start;
end;
$$;

create or replace function public.book_appointment(
  p_token uuid,
  p_start timestamptz,
  p_channel text,
  p_notes text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  l public.leads;
  s public.booking_settings;
  appt public.appointments;
begin
  l := public.lead_for_booking(p_token);
  select * into s from public.booking_settings where id = 1;

  if p_channel not in ('meet', 'call', 'whatsapp', 'in_person') then
    raise exception 'invalid_channel' using errcode = '22023';
  end if;
  if not exists (select 1 from public.available_slots(p_token) a where a.starts_at = p_start) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  -- Si ya tenía una cita activa, se reemplaza (reprogramación).
  update public.appointments set status = 'cancelled'
  where lead_id = l.id and status = 'scheduled';

  begin
    insert into public.appointments (lead_id, starts_at, ends_at, channel, notes)
    values (
      l.id, p_start, p_start + make_interval(mins => s.duration_min),
      p_channel::public.meeting_channel, nullif(btrim(left(p_notes, 1000)), '')
    )
    returning * into appt;
  exception when exclusion_violation then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end;

  update public.leads set status = 'meeting'
  where id = l.id and status in ('new', 'contacted');

  return jsonb_build_object(
    'id', appt.id,
    'starts_at', appt.starts_at,
    'ends_at', appt.ends_at,
    'channel', appt.channel,
    'timezone', s.timezone
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------

revoke all on function public.score_lead(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.lead_for_booking(uuid) from public, anon, authenticated;
revoke all on function public.submit_lead(jsonb) from public;
revoke all on function public.available_slots(uuid) from public;
revoke all on function public.book_appointment(uuid, timestamptz, text, text) from public;

grant execute on function public.submit_lead(jsonb) to anon, authenticated;
grant execute on function public.available_slots(uuid) to anon, authenticated;
grant execute on function public.book_appointment(uuid, timestamptz, text, text) to anon, authenticated;
grant execute on function public.score_lead(text, text, text, text, text) to authenticated;

-- RLS: el público no lee ni escribe tablas; todo pasa por las funciones.
alter table public.scoring_config enable row level security;
alter table public.leads enable row level security;
alter table public.booking_settings enable row level security;
alter table public.availability enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.appointments enable row level security;

create policy "scoring_config: empleados leen" on public.scoring_config
  for select to authenticated using ((select public.is_employee()));
create policy "scoring_config: admin edita" on public.scoring_config
  for update to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

create policy "leads: empleados leen" on public.leads
  for select to authenticated using ((select public.is_employee()));
create policy "leads: ventas y admin editan" on public.leads
  for update to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[])))
  with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));
create policy "leads: admin borra" on public.leads
  for delete to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])));

create policy "booking_settings: empleados leen" on public.booking_settings
  for select to authenticated using ((select public.is_employee()));
create policy "booking_settings: admin edita" on public.booking_settings
  for update to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

create policy "availability: empleados leen" on public.availability
  for select to authenticated using ((select public.is_employee()));
create policy "availability: admin gestiona" on public.availability
  for all to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

create policy "availability_blocks: empleados leen" on public.availability_blocks
  for select to authenticated using ((select public.is_employee()));
create policy "availability_blocks: admin y ventas gestionan" on public.availability_blocks
  for all to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[])))
  with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));

create policy "appointments: empleados leen" on public.appointments
  for select to authenticated using ((select public.is_employee()));
create policy "appointments: ventas y admin gestionan" on public.appointments
  for update to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[])))
  with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));
