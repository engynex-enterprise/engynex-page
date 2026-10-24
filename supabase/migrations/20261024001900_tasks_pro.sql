-- =============================================================================
-- Tareas PRO
--   * Estado (por hacer, en curso, en espera, hecha), prioridad, tipo,
--     descripción, etiquetas, lista de pasos, ticket relacionado.
--   * Recordatorios (aviso en la campana) y tareas que se repiten.
--   * Comentarios con aviso al responsable; aviso al asignar.
--   * Métricas de la página de tareas.
-- =============================================================================

alter table public.tasks
  add column description text check (char_length(description) <= 5000),
  add column status text not null default 'todo' check (status in ('todo', 'in_progress', 'waiting', 'done')),
  add column priority text not null default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  add column type text not null default 'other' check (type in ('call', 'email', 'whatsapp', 'meeting', 'follow_up', 'other')),
  add column tags text[] not null default '{}',
  add column checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  add column ticket_id uuid references public.tickets (id) on delete set null,
  add column reminder_at timestamptz,
  add column reminded_at timestamptz,
  add column recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
  add column parent_id uuid references public.tasks (id) on delete set null;

update public.tasks set status = 'done' where done;

create index tasks_status_idx on public.tasks (status, due_at);
create index tasks_reminder_idx on public.tasks (reminder_at) where reminder_at is not null and reminded_at is null;
create index tasks_ticket_idx on public.tasks (ticket_id);

-- "done" y "status" siempre de acuerdo (el código viejo usa done).
create or replace function public.tasks_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.done is distinct from old.done and new.status is not distinct from old.status then
    new.status := case when new.done then 'done' else 'todo' end;
  end if;
  new.done := new.status = 'done';
  if new.done and (tg_op = 'INSERT' or not old.done) then
    new.completed_at := now();
  end if;
  if not new.done then
    new.completed_at := null;
  end if;
  -- Al cambiar la fecha o el recordatorio, el aviso vuelve a quedar pendiente.
  if tg_op = 'UPDATE' and new.reminder_at is distinct from old.reminder_at then
    new.reminded_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_set_completed on public.tasks;
create trigger tasks_set_completed before insert or update on public.tasks
  for each row execute function public.tasks_completed_at();

-- Quien creó la tarea también puede editarla.
drop policy if exists "tasks: responsable, ventas o admin editan" on public.tasks;
create policy "tasks: responsable, creador, ventas o admin editan" on public.tasks
  for update to authenticated
  using (assigned_to = (select auth.uid()) or created_by = (select auth.uid()) or (select public.has_role(array['admin', 'sales']::public.app_role[])))
  with check ((select public.is_employee()));
drop policy if exists "tasks: admin borra" on public.tasks;
create policy "tasks: creador, ventas o admin borran" on public.tasks
  for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.has_role(array['admin', 'sales']::public.app_role[])));

-- -----------------------------------------------------------------------------
-- Avisos: al asignar y al repetir
-- -----------------------------------------------------------------------------

create or replace function public.tasks_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text;
  next_due timestamptz;
begin
  -- Asignada a otra persona: aviso en su campana (sin duplicar el de las automatizaciones).
  if new.assigned_to is not null
     and new.assigned_to is distinct from auth.uid()
     and (tg_op = 'INSERT' or new.assigned_to is distinct from old.assigned_to)
     and not exists (
       select 1 from public.notifications n
        where n.user_id = new.assigned_to and n.kind = 'task' and n.title = left(new.title, 200)
          and n.created_at > now() - interval '10 seconds'
     ) then
    select coalesce(full_name, email) into me from public.profiles where id = auth.uid();
    perform public.notify(null, new.assigned_to, 'task',
      left(new.title, 200),
      case when me is null then 'Te asignaron una tarea' else me || ' te asignó una tarea' end,
      '/es/portal/tareas?t=' || new.id);
  end if;

  -- Tarea que se repite: al completarla nace la siguiente.
  if tg_op = 'UPDATE' and new.done and not old.done and new.recurrence <> 'none' then
    next_due := coalesce(new.due_at, now());
    loop
      next_due := case new.recurrence
        when 'daily' then next_due + interval '1 day'
        when 'weekdays' then next_due + interval '1 day'
        when 'weekly' then next_due + interval '7 days'
        else next_due + interval '1 month' end;
      exit when new.recurrence <> 'weekdays' or extract(isodow from next_due at time zone 'America/Bogota') < 6;
    end loop;
    insert into public.tasks (lead_id, ticket_id, title, description, due_at, assigned_to, created_by, priority, type, tags,
                              checklist, recurrence, parent_id, reminder_at)
    values (new.lead_id, new.ticket_id, new.title, new.description, next_due, new.assigned_to, new.created_by, new.priority,
            new.type, new.tags,
            (select coalesce(jsonb_agg(item || jsonb_build_object('done', false)), '[]'::jsonb) from jsonb_array_elements(new.checklist) item),
            new.recurrence, coalesce(new.parent_id, new.id),
            case when new.reminder_at is not null and new.due_at is not null then next_due - (new.due_at - new.reminder_at) end);
  end if;
  return new;
end;
$$;

create trigger tasks_after_change after insert or update on public.tasks
  for each row execute function public.tasks_after_change();

-- -----------------------------------------------------------------------------
-- Recordatorios (cada 5 minutos)
-- -----------------------------------------------------------------------------

create or replace function public.tasks_remind()
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
  for r in
    update public.tasks set reminded_at = now()
     where reminder_at <= now() and reminded_at is null and not done
    returning id, title, assigned_to, created_by, due_at
  loop
    if coalesce(r.assigned_to, r.created_by) is not null then
      perform public.notify(null, coalesce(r.assigned_to, r.created_by), 'task', '⏰ ' || left(r.title, 190),
        case when r.due_at is null then 'Recordatorio de tarea'
             else 'Vence ' || to_char(r.due_at at time zone 'America/Bogota', 'DD/MM HH24:MI') end,
        '/es/portal/tareas?t=' || r.id);
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;
revoke all on function public.tasks_remind() from public, anon, authenticated;
select cron.schedule('tasks-remind', '*/5 * * * *', 'select public.tasks_remind()');

-- -----------------------------------------------------------------------------
-- Comentarios
-- -----------------------------------------------------------------------------

create table public.task_comments (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments (task_id, id);

alter table public.task_comments enable row level security;
create policy "task_comments: empleados leen" on public.task_comments
  for select to authenticated using ((select public.is_employee()));
create policy "task_comments: empleados comentan" on public.task_comments
  for insert to authenticated with check ((select public.is_employee()) and author_id = (select auth.uid()));
create policy "task_comments: autor borra" on public.task_comments
  for delete to authenticated using (author_id = (select auth.uid()));

alter publication supabase_realtime add table public.task_comments;

create or replace function public.task_comments_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.tasks;
  me text;
  who uuid;
begin
  select * into t from public.tasks where id = new.task_id;
  select coalesce(full_name, email) into me from public.profiles where id = new.author_id;
  for who in select distinct x from unnest(array[t.assigned_to, t.created_by]) x where x is not null and x <> new.author_id loop
    perform public.notify(null, who, 'task', '💬 ' || coalesce(me, 'Alguien') || ' comentó: ' || left(t.title, 150),
                          left(new.body, 300), '/es/portal/tareas?t=' || t.id);
  end loop;
  return new;
end;
$$;
create trigger task_comments_notify after insert on public.task_comments
  for each row execute function public.task_comments_notify();

-- -----------------------------------------------------------------------------
-- Métricas
-- -----------------------------------------------------------------------------

create or replace function public.tasks_kpis()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  day_start timestamptz := date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  week_start timestamptz := date_trunc('week', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'mine_open', (select count(*) from public.tasks where not done and assigned_to = me),
    'mine_overdue', (select count(*) from public.tasks where not done and assigned_to = me and due_at < now()),
    'mine_today', (select count(*) from public.tasks where not done and assigned_to = me and due_at >= day_start and due_at < day_start + interval '1 day'),
    'overdue', (select count(*) from public.tasks where not done and due_at < now()),
    'unassigned', (select count(*) from public.tasks where not done and assigned_to is null),
    'done_week', (select count(*) from public.tasks where done and completed_at >= week_start),
    'done_prev_week', (select count(*) from public.tasks where done and completed_at >= week_start - interval '7 days' and completed_at < week_start),
    'on_time_pct', (select round(100.0 * count(*) filter (where due_at is null or completed_at <= due_at) / nullif(count(*), 0))
                      from public.tasks where done and completed_at >= now() - interval '30 days'),
    'daily_done', (
      select jsonb_agg(jsonb_build_object('day', d::date, 'done', (
               select count(*) from public.tasks where done and (completed_at at time zone 'America/Bogota')::date = d::date)) order by d)
        from generate_series((now() at time zone 'America/Bogota')::date - 13, (now() at time zone 'America/Bogota')::date, interval '1 day') d
    ),
    'workload', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', coalesce(p.full_name, p.email), 'open', w.open, 'overdue', w.overdue) order by w.open desc)
        from (
          select assigned_to, count(*) open, count(*) filter (where due_at < now()) overdue
            from public.tasks where not done and assigned_to is not null group by assigned_to
        ) w join public.profiles p on p.id = w.assigned_to
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.tasks_kpis() from public, anon;
grant execute on function public.tasks_kpis() to authenticated;
