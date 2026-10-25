-- =============================================================================
-- Portal del cliente PRO
--   * Proyectos: hitos (con aprobación del cliente), novedades y avance.
--   * Facturación: facturas con IVA, pago en línea (Wompi, referencia INV-),
--     datos de facturación del cliente.
--   * Reuniones del cliente (enlace, reprogramar, cancelar).
--   * Referidos: el cliente recomienda empresas (crean leads).
--   * Preferencias de notificación.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Proyectos
-- -----------------------------------------------------------------------------

create table public.client_projects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 2000),
  service_slug text,
  status text not null default 'planning' check (status in ('planning', 'in_progress', 'review', 'delivered', 'paused', 'cancelled')),
  progress smallint not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  manager_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_projects_account_idx on public.client_projects (account_id, status);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 2000),
  position integer not null default 0,
  due_date date,
  done_at timestamptz,
  -- Entregables que el cliente aprueba
  needs_approval boolean not null default false,
  approval_status text check (approval_status in ('pending', 'approved', 'changes_requested')),
  client_comment text check (char_length(client_comment) <= 2000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_milestones_project_idx on public.project_milestones (project_id, position);

create table public.project_updates (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.client_projects (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  kind text not null default 'update' check (kind in ('update', 'delivery', 'question', 'client')),
  body text not null check (char_length(body) between 1 and 4000),
  link_url text check (char_length(link_url) <= 500),
  visible_to_client boolean not null default true,
  created_at timestamptz not null default now()
);
create index project_updates_project_idx on public.project_updates (project_id, created_at desc);

alter table public.client_projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_updates enable row level security;

create policy "client_projects: cliente o equipo leen" on public.client_projects for select to authenticated
  using (account_id = (select auth.uid()) or (select public.is_employee()));
create policy "client_projects: equipo gestiona" on public.client_projects for all to authenticated
  using ((select public.is_support_staff())) with check ((select public.is_support_staff()));
create policy "project_milestones: cliente o equipo leen" on public.project_milestones for select to authenticated
  using ((select public.is_employee()) or exists (select 1 from public.client_projects p where p.id = project_id and p.account_id = (select auth.uid())));
create policy "project_milestones: equipo gestiona" on public.project_milestones for all to authenticated
  using ((select public.is_support_staff())) with check ((select public.is_support_staff()));
create policy "project_updates: cliente ve las visibles" on public.project_updates for select to authenticated
  using ((select public.is_employee()) or (visible_to_client and exists (select 1 from public.client_projects p where p.id = project_id and p.account_id = (select auth.uid()))));
create policy "project_updates: equipo gestiona" on public.project_updates for all to authenticated
  using ((select public.is_support_staff())) with check ((select public.is_support_staff()));

create trigger client_projects_touch before update on public.client_projects
  for each row execute function public.domain_orders_touch();

-- El avance se recalcula con los hitos cumplidos.
create or replace function public.project_recalc_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.project_id, old.project_id);
begin
  update public.client_projects p
     set progress = coalesce((select round(100.0 * count(*) filter (where m.done_at is not null) / nullif(count(*), 0))
                                from public.project_milestones m where m.project_id = pid), p.progress)
   where p.id = pid;
  return null;
end;
$$;
create trigger project_milestones_progress after insert or update of done_at or delete on public.project_milestones
  for each row execute function public.project_recalc_progress();

-- El cliente aprueba un entregable o pide cambios.
create or replace function public.project_milestone_review(p_milestone uuid, p_decision text, p_comment text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  m public.project_milestones;
  p public.client_projects;
begin
  select * into m from public.project_milestones where id = p_milestone;
  select * into p from public.client_projects where id = m.project_id;
  if p.id is null or p.account_id <> auth.uid() or not m.needs_approval then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'invalid' using errcode = '22023';
  end if;
  update public.project_milestones
     set approval_status = p_decision, client_comment = left(nullif(btrim(p_comment), ''), 2000), reviewed_at = now(),
         done_at = case when p_decision = 'approved' then coalesce(done_at, now()) else done_at end
   where id = m.id;
  insert into public.project_updates (project_id, author_id, kind, body)
  values (p.id, auth.uid(), 'client',
          case when p_decision = 'approved' then 'Aprobó «' || m.title || '»' else 'Pidió cambios en «' || m.title || '»' end
          || coalesce(': ' || nullif(btrim(p_comment), ''), ''));
  perform public.notify(null, coalesce(p.manager_id, p.created_by), 'ticket',
    case when p_decision = 'approved' then '✅ Aprobado: ' else '✏️ Cambios pedidos: ' end || m.title,
    p.name || coalesce(' · ' || left(nullif(btrim(p_comment), ''), 200), ''), '/es/portal/clientes/' || p.account_id || '?tab=projects');
end;
$$;
revoke all on function public.project_milestone_review(uuid, text, text) from public, anon;
grant execute on function public.project_milestone_review(uuid, text, text) to authenticated;

-- El cliente escribe en su proyecto (pregunta o comentario).
create or replace function public.project_client_comment(p_project uuid, p_body text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p public.client_projects;
begin
  select * into p from public.client_projects where id = p_project;
  if p.id is null or p.account_id <> auth.uid() or nullif(btrim(p_body), '') is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.project_updates (project_id, author_id, kind, body) values (p.id, auth.uid(), 'client', left(btrim(p_body), 4000));
  perform public.notify(null, coalesce(p.manager_id, p.created_by), 'ticket', '💬 Comentario del cliente: ' || p.name, left(btrim(p_body), 300),
                        '/es/portal/clientes/' || p.account_id || '?tab=projects');
end;
$$;
revoke all on function public.project_client_comment(uuid, text) from public, anon;
grant execute on function public.project_client_comment(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Facturación
-- -----------------------------------------------------------------------------

create table public.client_billing (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  tax_id text not null check (char_length(tax_id) between 4 and 30),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  address text check (char_length(address) <= 200),
  city text check (char_length(city) <= 80),
  updated_at timestamptz not null default now()
);
alter table public.client_billing enable row level security;
create policy "client_billing: dueño o equipo leen" on public.client_billing for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_employee()));
create policy "client_billing: dueño guarda" on public.client_billing for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "client_billing: dueño edita" on public.client_billing for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create sequence public.client_invoices_number_seq start 1001;
create table public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique default nextval('public.client_invoices_number_seq'),
  account_id uuid not null references public.profiles (id) on delete restrict,
  project_id uuid references public.client_projects (id) on delete set null,
  concept text not null check (char_length(concept) between 2 and 200),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  subtotal bigint not null default 0 check (subtotal >= 0),
  tax_rate numeric(5, 2) not null default 19,
  tax bigint not null default 0 check (tax >= 0),
  total bigint not null default 0 check (total >= 0),
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  issued_at timestamptz,
  due_date date,
  paid_at timestamptz,
  payment_reference text unique,
  payment_id text,
  receipt jsonb,
  is_test boolean not null default false,
  notes text check (char_length(notes) <= 1000),
  reminded_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_invoices_account_idx on public.client_invoices (account_id, status);
alter table public.client_invoices enable row level security;
-- El cliente ve sus facturas emitidas (no los borradores).
create policy "client_invoices: cliente ve las suyas" on public.client_invoices for select to authenticated
  using ((account_id = (select auth.uid()) and status <> 'draft') or (select public.is_employee()));
create policy "client_invoices: equipo gestiona" on public.client_invoices for all to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[])))
  with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));
create trigger client_invoices_touch before update on public.client_invoices
  for each row execute function public.domain_orders_touch();

-- Totales desde los ítems [{description, quantity, unit_price}] e IVA.
create or replace function public.client_invoices_totals()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.subtotal := coalesce((select sum(round(coalesce((i ->> 'quantity')::numeric, 1) * coalesce((i ->> 'unit_price')::numeric, 0)))
                              from jsonb_array_elements(new.items) i), 0);
  new.tax := round(new.subtotal * coalesce(new.tax_rate, 0) / 100);
  new.total := new.subtotal + new.tax;
  if new.status = 'issued' and new.issued_at is null then new.issued_at := now(); end if;
  if new.payment_reference is null then
    new.payment_reference := 'INV-' || new.number || '-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
  end if;
  return new;
end;
$$;
create trigger client_invoices_totals before insert or update of items, tax_rate, status on public.client_invoices
  for each row execute function public.client_invoices_totals();

-- Al emitir: aviso al cliente (campana y correo).
create or replace function public.client_invoices_issued()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  acc public.profiles;
begin
  if new.status = 'issued' and (tg_op = 'INSERT' or old.status is distinct from 'issued') then
    select * into acc from public.profiles where id = new.account_id;
    perform public.notify(null, new.account_id, 'ticket', '🧾 Nueva factura #' || new.number, new.concept || ' · $' || to_char(new.total, 'FM999G999G999') || ' COP', '/es/portal/facturacion');
    insert into public.email_queue (kind, to_email, payload)
    values ('custom', coalesce((select email from public.client_billing where user_id = new.account_id), acc.email), jsonb_build_object(
      'subject', 'Factura #' || new.number || ' de Engynex',
      'body', 'Hola ' || split_part(coalesce(acc.full_name, acc.email), ' ', 1) || E',\n\nTe compartimos la factura #' || new.number || ' por «' || new.concept
              || '» por $' || to_char(new.total, 'FM999G999G999') || ' COP' || coalesce(', con vencimiento el ' || to_char(new.due_date, 'DD/MM/YYYY'), '')
              || E'.\n\nPuedes pagarla en línea (PSE, tarjeta o Nequi) desde tu portal.',
      'cta_label', 'Ver y pagar la factura', 'cta_url', 'https://engynex.com/es/portal/facturacion', 'locale', 'es'));
  end if;
  return new;
end;
$$;
create trigger client_invoices_issued after insert or update of status on public.client_invoices
  for each row execute function public.client_invoices_issued();

-- -----------------------------------------------------------------------------
-- Reuniones del cliente
-- -----------------------------------------------------------------------------

drop function if exists public.my_appointments();
create or replace function public.my_appointments()
returns table (id uuid, starts_at timestamptz, ends_at timestamptz, channel public.meeting_channel, status public.appointment_status,
               meeting_url text, location text, kind text, host_name text, booking_token uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.starts_at, a.ends_at, a.channel, a.status, a.meeting_url, a.location, a.kind,
         coalesce(h.full_name, h.email), l.booking_token
    from public.appointments a
    join public.leads l on l.id = a.lead_id
    join public.profiles p on p.id = auth.uid()
    left join public.profiles h on h.id = coalesce(a.host_id, l.assigned_to)
   where lower(l.email) = lower(p.email)
   order by a.starts_at desc
   limit 100
$$;
revoke all on function public.my_appointments() from public, anon;
grant execute on function public.my_appointments() to authenticated;

-- Enlace para agendar una reunión nueva (lead del cliente; se crea si no hay).
create or replace function public.my_booking_token()
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  tok uuid;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select l.booking_token into tok from public.leads l where lower(l.email) = lower(p.email) order by l.created_at desc limit 1;
  if tok is not null then
    update public.leads set booking_invite_until = now() + interval '30 days' where booking_token = tok;
    return tok;
  end if;
  insert into public.leads (name, email, phone, company, problem_category, budget, decision, timeline, score, tier, score_breakdown,
                            status, source, consent_at, booking_invite_until)
  values (coalesce(p.full_name, p.email), p.email, coalesce(nullif(p.phone, ''), '0000000'), p.company, 'other', 'unknown', 'self', 'month',
          30, 'red', '{}', 'contacted', 'manual', now(), now() + interval '30 days')
  returning booking_token into tok;
  return tok;
end;
$$;
revoke all on function public.my_booking_token() from public, anon;
grant execute on function public.my_booking_token() to authenticated;

-- -----------------------------------------------------------------------------
-- Referidos
-- -----------------------------------------------------------------------------

create table public.client_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  company text check (char_length(company) <= 160),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  note text check (char_length(note) <= 1000),
  reward_status text not null default 'pending' check (reward_status in ('pending', 'eligible', 'paid', 'not_eligible')),
  created_at timestamptz not null default now()
);
create index client_referrals_referrer_idx on public.client_referrals (referrer_id, created_at desc);
alter table public.client_referrals enable row level security;
create policy "client_referrals: dueño o equipo leen" on public.client_referrals for select to authenticated
  using (referrer_id = (select auth.uid()) or (select public.is_employee()));
create policy "client_referrals: equipo gestiona" on public.client_referrals for update to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[]))) with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));

-- El cliente recomienda una empresa: se crea el lead (fuente referido).
create or replace function public.client_refer(p jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  v_email text := lower(btrim(coalesce(p ->> 'email', '')));
  lid uuid;
  rid uuid;
begin
  select * into me from public.profiles where id = auth.uid() and active;
  if me.id is null or me.kind not in ('client', 'provider') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(btrim(coalesce(p ->> 'name', ''))) < 2 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if (select count(*) from public.client_referrals where referrer_id = me.id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.leads (name, email, phone, company, problem_category, problem_text, budget, decision, timeline, score, tier,
                            score_breakdown, status, source, consent_at, utm)
  values (left(btrim(p ->> 'name'), 120), v_email, coalesce(nullif(btrim(p ->> 'phone'), ''), '0000000'), nullif(btrim(p ->> 'company'), ''),
          'other', left('Referido por ' || coalesce(me.full_name, me.email) || coalesce(' (' || me.company || ')', '') || coalesce(E'\n' || nullif(btrim(p ->> 'note'), ''), ''), 2000),
          'unknown', 'other', 'month', 70, 'green', '{}', 'new', 'referral', now(),
          jsonb_build_object('referred_by', me.id))
  returning id into lid;
  insert into public.client_referrals (referrer_id, lead_id, name, company, email, phone, note)
  values (me.id, lid, left(btrim(p ->> 'name'), 120), nullif(btrim(p ->> 'company'), ''), v_email, nullif(btrim(p ->> 'phone'), ''), nullif(btrim(p ->> 'note'), ''))
  returning id into rid;
  return rid;
end;
$$;
revoke all on function public.client_refer(jsonb) from public, anon;
grant execute on function public.client_refer(jsonb) to authenticated;

-- Estado de los referidos del cliente (sin exponer el CRM completo).
create or replace function public.my_referrals()
returns table (id uuid, name text, company text, email text, created_at timestamptz, lead_status text, reward_status text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.name, r.company, r.email, r.created_at, coalesce(l.status::text, 'new'), r.reward_status
    from public.client_referrals r left join public.leads l on l.id = r.lead_id
   where r.referrer_id = auth.uid()
   order by r.created_at desc
$$;
revoke all on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;

-- -----------------------------------------------------------------------------
-- Preferencias de notificación
-- -----------------------------------------------------------------------------

alter table public.profiles add column notify_prefs jsonb not null default '{}';
