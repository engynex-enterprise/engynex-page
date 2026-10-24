-- =============================================================================
-- Clientes y proveedores PRO
--   * Ficha comercial de cada cuenta: responsable, etapa, plan, valor mensual,
--     renovación, NIT, dirección, sitio web, etiquetas y notas.
--   * Contactos adicionales y notas con fecha (línea de tiempo).
--   * Salud de la cuenta (0-100) y métricas para la lista.
-- =============================================================================

create table public.account_details (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete set null,
  stage text not null default 'active' check (stage in ('onboarding', 'active', 'at_risk', 'paused', 'churned')),
  plan text check (char_length(plan) <= 80),
  services text[] not null default '{}',
  monthly_value bigint not null default 0 check (monthly_value >= 0),
  contract_start date,
  renewal_date date,
  tax_id text check (char_length(tax_id) <= 40),
  website text check (char_length(website) <= 200),
  address text check (char_length(address) <= 200),
  city text check (char_length(city) <= 80),
  industry text check (char_length(industry) <= 80),
  tags text[] not null default '{}',
  notes text check (char_length(notes) <= 4000),
  lead_id uuid references public.leads (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid()
);
create index account_details_owner_idx on public.account_details (owner_id);
create index account_details_tags_idx on public.account_details using gin (tags);

create table public.account_contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  role text check (char_length(role) <= 80),
  email text check (char_length(email) <= 160),
  phone text check (char_length(phone) <= 40),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index account_contacts_profile_idx on public.account_contacts (profile_id);

create table public.account_notes (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  kind text not null default 'note' check (kind in ('note', 'call', 'meeting', 'email', 'visit')),
  body text not null check (char_length(body) between 1 and 4000),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index account_notes_profile_idx on public.account_notes (profile_id, created_at desc);

alter table public.account_details enable row level security;
alter table public.account_contacts enable row level security;
alter table public.account_notes enable row level security;

-- El equipo comercial y de soporte gestiona; el cliente no ve su ficha interna.
create policy "account_details: equipo" on public.account_details for all to authenticated
  using ((select public.is_support_staff())) with check ((select public.is_support_staff()));
create policy "account_contacts: equipo" on public.account_contacts for all to authenticated
  using ((select public.is_support_staff())) with check ((select public.is_support_staff()));
create policy "account_notes: equipo lee" on public.account_notes for select to authenticated
  using ((select public.is_support_staff()));
create policy "account_notes: equipo escribe" on public.account_notes for insert to authenticated
  with check ((select public.is_support_staff()) and author_id = (select auth.uid()));
create policy "account_notes: autor o admin edita" on public.account_notes for update to authenticated
  using (author_id = (select auth.uid()) or (select public.has_role(array['admin']::public.app_role[])));
create policy "account_notes: autor o admin borra" on public.account_notes for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.has_role(array['admin']::public.app_role[])));

create or replace function public.account_details_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  new.tags := coalesce((select array_agg(distinct left(lower(btrim(x)), 30)) from unnest(new.tags) x where btrim(x) <> ''), '{}');
  return new;
end;
$$;
create trigger account_details_touch before insert or update on public.account_details
  for each row execute function public.account_details_touch();

-- Cada cuenta de cliente o proveedor tiene su ficha (las nuevas y las de hoy).
create or replace function public.profiles_account_details()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind in ('client', 'provider') then
    insert into public.account_details (profile_id, lead_id, contract_start)
    values (new.id, (select id from public.leads where lower(email) = lower(new.email) order by created_at desc limit 1), current_date)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger profiles_account_details after insert on public.profiles
  for each row execute function public.profiles_account_details();

insert into public.account_details (profile_id, lead_id, contract_start)
select p.id, (select id from public.leads l where lower(l.email) = lower(p.email) order by created_at desc limit 1), p.created_at::date
  from public.profiles p where p.kind in ('client', 'provider')
on conflict (profile_id) do nothing;

-- -----------------------------------------------------------------------------
-- Lista con métricas y salud
-- -----------------------------------------------------------------------------

-- Salud 0-100: parte de 100 y resta por solicitudes abiertas o vencidas,
-- calificaciones bajas, inactividad en el portal, renovación cercana y la
-- etapa marcada a mano.
create or replace function public.accounts_list()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_support_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.name)
    from (
      select p.id, coalesce(p.full_name, p.email) as name, p.email, p.phone, p.company, p.kind, p.active, p.last_seen_at, p.created_at,
             d.owner_id, d.stage, d.plan, d.services, d.monthly_value, d.renewal_date, d.tags, d.city, d.industry, d.lead_id,
             m.open_tickets, m.breached, m.csat, m.docs, m.last_ticket_at, m.won_value,
             greatest(0, least(100,
               100
               - least(30, m.open_tickets * 8)
               - least(30, m.breached * 15)
               - case when m.csat is null then 0 when m.csat < 3 then 25 when m.csat < 4 then 10 else 0 end
               - case when p.last_seen_at is null then 10 when p.last_seen_at < now() - interval '60 days' then 15 when p.last_seen_at < now() - interval '30 days' then 5 else 0 end
               - case when d.renewal_date is not null and d.renewal_date < current_date + 30 then 10 else 0 end
               - case d.stage when 'at_risk' then 30 when 'paused' then 15 when 'churned' then 60 else 0 end
             ))::int as health
        from public.profiles p
        join public.account_details d on d.profile_id = p.id
        cross join lateral (
          select (select count(*) from public.tickets t where t.requester_id = p.id and t.status in ('open', 'in_progress', 'waiting') and t.merged_into is null)::int as open_tickets,
                 (select count(*) from public.tickets t where t.requester_id = p.id and t.status in ('open', 'in_progress', 'waiting') and t.merged_into is null
                    and ((t.first_response_at is null and t.first_response_due < now()) or t.resolve_due < now()))::int as breached,
                 (select round(avg(t.csat_rating)::numeric, 1) from public.tickets t where t.requester_id = p.id and t.csat_at > now() - interval '180 days') as csat,
                 (select count(*) from public.documents o where o.owner_id = p.id)::int as docs,
                 (select max(t.created_at) from public.tickets t where t.requester_id = p.id) as last_ticket_at,
                 coalesce((select sum(dl.value_cop) from public.deals dl where dl.lead_id = d.lead_id and dl.stage = 'won'), 0)::bigint as won_value
        ) m
       where p.kind in ('client', 'provider')
    ) x
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.accounts_list() from public, anon;
grant execute on function public.accounts_list() to authenticated;

-- Línea de tiempo de una cuenta: notas, solicitudes, documentos, reuniones,
-- correos y ventas, en orden.
create or replace function public.account_timeline(p_account uuid, p_limit integer default 60)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d public.account_details;
  em text;
begin
  if not public.is_support_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into d from public.account_details where profile_id = p_account;
  select lower(email) into em from public.profiles where id = p_account;
  return coalesce((
    select jsonb_agg(e order by e.at desc)
    from (
      (select 'note' as type, n.created_at as at, n.kind as sub, n.body as title, null::text as ref, n.author_id as actor, n.id::text as id, n.pinned
         from public.account_notes n where n.profile_id = p_account)
      union all
      (select 'ticket', t.created_at, t.status::text, '#' || t.number || ' · ' || t.subject, t.id::text, null, t.id::text, false
         from public.tickets t where t.requester_id = p_account or (t.requester_id is null and lower(t.email) = em))
      union all
      (select 'document', o.created_at, o.kind::text, o.title, o.id::text, o.uploaded_by, o.id::text, false
         from public.documents o where o.owner_id = p_account)
      union all
      (select 'meeting', a.starts_at, a.status::text, a.channel::text, a.id::text, null, a.id::text, false
         from public.appointments a where d.lead_id is not null and a.lead_id = d.lead_id)
      union all
      (select 'email', q.created_at, q.kind::text, coalesce(q.payload ->> 'subject', q.kind::text), q.id::text, q.created_by, q.id::text, false
         from public.email_queue q where lower(q.to_email) = em and q.status = 'sent')
      union all
      (select 'deal', dl.created_at, dl.stage, dl.title || ' · ' || dl.value_cop, dl.id::text, dl.owner_id, dl.id::text, false
         from public.deals dl where d.lead_id is not null and dl.lead_id = d.lead_id)
      order by 2 desc
      limit least(greatest(coalesce(p_limit, 60), 1), 300)
    ) e
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.account_timeline(uuid, integer) from public, anon;
grant execute on function public.account_timeline(uuid, integer) to authenticated;
