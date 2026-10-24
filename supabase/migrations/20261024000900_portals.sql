-- =============================================================================
-- Fase 8 — Portal de clientes y proveedores
--
-- * Solicitudes (tickets) con número y conversación. Se crean desde el centro
--   de soporte público o desde el portal; el cliente sigue su estado y
--   responde, el equipo las gestiona (estado, prioridad, responsable, notas
--   internas que el cliente no ve).
-- * Documentos privados por cuenta (Storage), visibles solo para su dueño y
--   el equipo.
-- * Reuniones del cliente (las que agendó con su correo).
-- =============================================================================

create type public.ticket_status as enum ('open', 'in_progress', 'waiting', 'resolved', 'closed');
create type public.ticket_priority as enum ('critical', 'high', 'medium', 'low');

create sequence public.ticket_number_seq start 1001;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique default nextval('public.ticket_number_seq'),
  requester_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  company text check (char_length(company) <= 160),
  category text not null check (char_length(category) <= 40),
  priority public.ticket_priority not null default 'medium',
  affected text check (char_length(affected) <= 120),
  subject text not null check (char_length(subject) between 1 and 200),
  description text not null check (char_length(description) between 1 and 5000),
  status public.ticket_status not null default 'open',
  assigned_to uuid references public.profiles (id) on delete set null,
  source text not null default 'web' check (source in ('web', 'portal')),
  last_activity_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.ticket_number_seq owned by public.tickets.number;
create index tickets_queue_idx on public.tickets (status, last_activity_at desc);
create index tickets_requester_idx on public.tickets (requester_id, created_at desc);

create table public.ticket_messages (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_kind text not null check (author_kind in ('requester', 'staff', 'system')),
  body text not null check (char_length(body) between 1 and 5000),
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, id);

create or replace function public.is_support_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'support', 'sales']::public.app_role[])
$$;

-- -----------------------------------------------------------------------------
-- Crear y responder
-- -----------------------------------------------------------------------------

create or replace function public.submit_ticket(p jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  v_email text := lower(btrim(coalesce(p ->> 'email', '')));
  v_desc text := nullif(btrim(p ->> 'description'), '');
  v_priority public.ticket_priority;
  v_subject text := nullif(btrim(p ->> 'subject'), '');
  t public.tickets;
begin
  if auth.uid() is not null then
    select * into me from public.profiles where id = auth.uid() and active;
  end if;
  if me.id is not null then
    v_email := me.email;
  end if;

  if coalesce(nullif(btrim(coalesce(p ->> 'name', me.full_name)), ''), '') = ''
     or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or v_desc is null
     or nullif(btrim(p ->> 'category'), '') is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  begin
    v_priority := coalesce(nullif(p ->> 'priority', ''), 'medium')::public.ticket_priority;
  exception when invalid_text_representation then
    v_priority := 'medium';
  end;

  -- Anti-abuso: 5 por correo por hora y 60 en total cada 10 minutos.
  if (select count(*) from public.tickets where email = v_email and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.tickets where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.tickets (
    requester_id, name, email, phone, company, category, priority, affected, subject, description, source
  ) values (
    -- Solo se une a una cuenta si la persona inició sesión (no por el correo:
    -- cualquiera podría escribir el correo de otro).
    me.id,
    left(coalesce(nullif(btrim(p ->> 'name'), ''), me.full_name, me.email), 120),
    v_email,
    left(coalesce(nullif(btrim(p ->> 'phone'), ''), me.phone), 40),
    left(coalesce(nullif(btrim(p ->> 'company'), ''), me.company), 160),
    left(btrim(p ->> 'category'), 40),
    v_priority,
    left(nullif(btrim(p ->> 'affected'), ''), 120),
    left(coalesce(v_subject, split_part(v_desc, E'\n', 1)), 200),
    left(v_desc, 5000),
    case when me.id is not null then 'portal' else 'web' end
  )
  returning * into t;

  return jsonb_build_object('id', t.id, 'number', t.number);
end;
$$;

create or replace function public.ticket_reply(p_ticket uuid, p_body text, p_internal boolean default false)
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
  new_id bigint;
begin
  select * into t from public.tickets where id = p_ticket;
  if t.id is null or v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if not staff and (auth.uid() is null or t.requester_id is distinct from auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.ticket_messages (ticket_id, author_id, author_kind, body, internal)
  values (p_ticket, auth.uid(), case when staff then 'staff' else 'requester' end, left(v_body, 5000),
          staff and coalesce(p_internal, false))
  returning id into new_id;

  update public.tickets
     set last_activity_at = now(),
         assigned_to = case when staff and not coalesce(p_internal, false) then coalesce(assigned_to, auth.uid()) else assigned_to end,
         -- El cliente responde: vuelve a "abierta" si estaba esperando o resuelta.
         status = case
           when not staff and status in ('waiting', 'resolved', 'closed') then 'open'
           when staff and not coalesce(p_internal, false) and status = 'open' then 'in_progress'
           else status end
   where id = p_ticket;
  return new_id;
end;
$$;

-- Cambios de estado: fecha de resolución, mensaje visible y fecha de edición.
create or replace function public.tickets_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    new.resolved_at := case when new.status in ('resolved', 'closed') then coalesce(old.resolved_at, now()) end;
    new.last_activity_at := now();
    insert into public.ticket_messages (ticket_id, author_id, author_kind, body)
    values (new.id, auth.uid(), 'system', 'status:' || new.status::text);
  end if;
  return new;
end;
$$;

create trigger tickets_on_update before update on public.tickets
  for each row execute function public.tickets_on_update();

-- El cliente no puede cambiar nada del ticket directamente (solo responder).
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

create policy "tickets: equipo o solicitante leen" on public.tickets
  for select to authenticated
  using ((select public.is_support_staff()) or requester_id = (select auth.uid()));
create policy "tickets: equipo gestiona" on public.tickets
  for update to authenticated
  using ((select public.is_support_staff())) with check ((select public.is_support_staff()));
create policy "tickets: admin borra" on public.tickets
  for delete to authenticated using ((select public.has_role(array['admin']::public.app_role[])));

create policy "ticket_messages: equipo o solicitante (sin notas internas)" on public.ticket_messages
  for select to authenticated
  using (
    (select public.is_support_staff())
    or (not internal and exists (
      select 1 from public.tickets t where t.id = ticket_id and t.requester_id = (select auth.uid())
    ))
  );

revoke all on function public.submit_ticket(jsonb) from public;
revoke all on function public.ticket_reply(uuid, text, boolean) from public, anon;
grant execute on function public.submit_ticket(jsonb) to anon, authenticated;
grant execute on function public.ticket_reply(uuid, text, boolean) to authenticated;

alter publication supabase_realtime add table public.tickets, public.ticket_messages;

-- -----------------------------------------------------------------------------
-- Documentos
-- -----------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  kind text not null default 'other'
    check (kind in ('proposal', 'contract', 'invoice', 'deliverable', 'report', 'purchase_order', 'other')),
  path text not null unique,
  size bigint not null default 0,
  mime text,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index documents_owner_idx on public.documents (owner_id, created_at desc);

alter table public.documents enable row level security;

create policy "documents: dueño o equipo leen" on public.documents
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_support_staff()));
create policy "documents: dueño o equipo suben" on public.documents
  for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (owner_id = (select auth.uid()) or (select public.is_support_staff()))
    and split_part(path, '/', 1) = owner_id::text
  );
create policy "documents: equipo o quien lo subió borran" on public.documents
  for delete to authenticated
  using ((select public.is_support_staff()) or (owner_id = (select auth.uid()) and uploaded_by = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portal-docs', 'portal-docs', false, 26214400, array[
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword', 'application/vnd.ms-excel', 'text/plain', 'text/csv', 'application/zip'
])
on conflict (id) do nothing;

-- Archivos en portal-docs/<id del dueño>/<archivo>.
create policy "portal-docs: leer propios o equipo" on storage.objects
  for select to authenticated
  using (bucket_id = 'portal-docs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_support_staff())
  ));
create policy "portal-docs: subir propios o equipo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portal-docs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_support_staff())
  ));
create policy "portal-docs: borrar propios o equipo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portal-docs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_support_staff())
  ));

-- -----------------------------------------------------------------------------
-- Reuniones del cliente (agendadas con su mismo correo)
-- -----------------------------------------------------------------------------

create or replace function public.my_appointments()
returns table (id uuid, starts_at timestamptz, ends_at timestamptz, channel public.meeting_channel, status public.appointment_status)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.starts_at, a.ends_at, a.channel, a.status
    from public.appointments a
    join public.leads l on l.id = a.lead_id
    join public.profiles p on p.id = auth.uid()
   where lower(l.email) = lower(p.email)
   order by a.starts_at desc
   limit 50
$$;
revoke all on function public.my_appointments() from public, anon;
grant execute on function public.my_appointments() to authenticated;
