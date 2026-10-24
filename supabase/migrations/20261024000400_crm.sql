-- =============================================================================
-- Fase 3 — CRM: historial de actividad, tareas, valor del negocio y tiempo real
-- =============================================================================

alter table public.leads
  add column value_cop bigint check (value_cop is null or value_cop >= 0),
  add column lost_reason text check (char_length(lost_reason) <= 500),
  add column last_activity_at timestamptz not null default now();

create index leads_status_idx on public.leads (status, created_at desc);
create index leads_assigned_idx on public.leads (assigned_to);

-- -----------------------------------------------------------------------------
-- Actividad (línea de tiempo de cada lead)
-- -----------------------------------------------------------------------------

create type public.activity_type as enum (
  'note', 'call', 'whatsapp', 'email', 'meeting',
  'status_change', 'assignment', 'created', 'appointment'
);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  type public.activity_type not null,
  body text check (char_length(body) <= 5000),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Tareas
-- -----------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 300),
  due_at timestamptz,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assigned_idx on public.tasks (assigned_to, done, due_at);
create index tasks_lead_idx on public.tasks (lead_id);

create trigger tasks_touch
  before update on public.tasks
  for each row execute function public.touch_updated_at();

create or replace function public.tasks_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done and not old.done then new.completed_at := now(); end if;
  if not new.done then new.completed_at := null; end if;
  return new;
end;
$$;

create trigger tasks_set_completed
  before update of done on public.tasks
  for each row execute function public.tasks_completed_at();

-- -----------------------------------------------------------------------------
-- Actividad automática
-- -----------------------------------------------------------------------------

-- Lead nuevo: deja constancia del puntaje y crea la tarea de seguimiento
-- según el color.
create or replace function public.leads_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lead_activities (lead_id, type, body, meta)
  values (
    new.id, 'created', null,
    jsonb_build_object('score', new.score, 'tier', new.tier, 'source_page', new.source_page)
  );
  if new.tier = 'green' then
    insert into public.tasks (lead_id, title, due_at, created_by)
    values (new.id, 'Contactar lead verde', now() + interval '1 hour', null);
  elsif new.tier = 'yellow' then
    insert into public.tasks (lead_id, title, due_at, created_by)
    values (new.id, 'Enviar información y hacer seguimiento', now() + interval '1 day', null);
  end if;
  return new;
end;
$$;

create trigger leads_log_insert
  after insert on public.leads
  for each row execute function public.leads_after_insert();

-- Cambios de estado o de asesor: quedan en el historial con su autor.
create or replace function public.leads_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_activities (lead_id, author_id, type, meta)
    values (new.id, auth.uid(), 'status_change',
            jsonb_build_object('from', old.status, 'to', new.status,
                               'lost_reason', new.lost_reason));
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into public.lead_activities (lead_id, author_id, type, meta)
    values (new.id, auth.uid(), 'assignment',
            jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to));
    -- Las tareas abiertas sin responsable pasan al nuevo asesor.
    update public.tasks set assigned_to = new.assigned_to
     where lead_id = new.id and not done and assigned_to is null;
  end if;
  return new;
end;
$$;

create trigger leads_log_update
  after update of status, assigned_to on public.leads
  for each row execute function public.leads_after_update();

-- Cita agendada desde el formulario: también va al historial.
create or replace function public.appointments_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lead_activities (lead_id, type, meta)
  values (new.lead_id, 'appointment',
          jsonb_build_object('starts_at', new.starts_at, 'channel', new.channel));
  return new;
end;
$$;

create trigger appointments_log_insert
  after insert on public.appointments
  for each row execute function public.appointments_after_insert();

-- La última actividad sube el lead en las listas.
create or replace function public.activity_touch_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.leads set last_activity_at = new.created_at where id = new.lead_id;
  return new;
end;
$$;

create trigger lead_activities_touch
  after insert on public.lead_activities
  for each row execute function public.activity_touch_lead();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.lead_activities enable row level security;
alter table public.tasks enable row level security;

create policy "lead_activities: empleados leen" on public.lead_activities
  for select to authenticated using ((select public.is_employee()));

-- Ventas, soporte y admin registran notas/llamadas a su nombre. Los tipos
-- automáticos (status_change, assignment, created, appointment) solo los
-- escriben los triggers.
create policy "lead_activities: registrar a su nombre" on public.lead_activities
  for insert to authenticated
  with check (
    (select public.has_role(array['admin', 'sales', 'support']::public.app_role[]))
    and author_id = (select auth.uid())
    and type in ('note', 'call', 'whatsapp', 'email', 'meeting')
  );

create policy "lead_activities: autor o admin borra" on public.lead_activities
  for delete to authenticated
  using (
    type in ('note', 'call', 'whatsapp', 'email', 'meeting')
    and (author_id = (select auth.uid())
         or (select public.has_role(array['admin']::public.app_role[])))
  );

create policy "tasks: empleados leen" on public.tasks
  for select to authenticated using ((select public.is_employee()));

create policy "tasks: ventas y admin crean" on public.tasks
  for insert to authenticated
  with check ((select public.has_role(array['admin', 'sales', 'support']::public.app_role[])));

create policy "tasks: responsable, ventas o admin editan" on public.tasks
  for update to authenticated
  using (
    assigned_to = (select auth.uid())
    or (select public.has_role(array['admin', 'sales']::public.app_role[]))
  )
  with check (
    assigned_to = (select auth.uid())
    or (select public.has_role(array['admin', 'sales']::public.app_role[]))
  );

create policy "tasks: admin borra" on public.tasks
  for delete to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[])));

-- -----------------------------------------------------------------------------
-- Tiempo real (el embudo y las alertas se actualizan solos; Realtime respeta
-- las mismas reglas RLS).
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.lead_activities;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.appointments;
