-- =============================================================================
-- CRM: favoritos, menciones y reacciones en notas, negocios, documentos del
-- lead, origen, métricas con series diarias, lead manual, importación y
-- agendar desde la ficha.
-- =============================================================================

alter table public.leads add column source text not null default 'web'
  check (source in ('web', 'chat', 'whatsapp', 'manual', 'import', 'referral'));

-- -----------------------------------------------------------------------------
-- Favoritos (por usuario)
-- -----------------------------------------------------------------------------
create table public.lead_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lead_id)
);
alter table public.lead_favorites enable row level security;
create policy "lead_favorites: propios" on public.lead_favorites
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and (select public.is_employee()));

-- -----------------------------------------------------------------------------
-- Notas: menciones (@persona) y reacciones
-- -----------------------------------------------------------------------------
alter table public.lead_activities add column mentions uuid[] not null default '{}';

create or replace function public.lead_activities_notify_mentions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m uuid;
  author text;
  lead_name text;
begin
  if coalesce(array_length(new.mentions, 1), 0) = 0 then
    return new;
  end if;
  select coalesce(full_name, email) into author from public.profiles where id = new.author_id;
  select name into lead_name from public.leads where id = new.lead_id;
  foreach m in array new.mentions loop
    if m is distinct from new.author_id then
      perform public.notify(null, m, 'lead', coalesce(author, 'Alguien') || ' te mencionó en ' || coalesce(lead_name, 'un lead'),
                            left(new.body, 300), 'https://engynex.com/es/portal/crm/' || new.lead_id);
    end if;
  end loop;
  return new;
end;
$$;
create trigger lead_activities_mentions after insert on public.lead_activities
  for each row execute function public.lead_activities_notify_mentions();

create table public.activity_reactions (
  activity_id uuid not null references public.lead_activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id, emoji)
);
alter table public.activity_reactions enable row level security;
create policy "activity_reactions: empleados leen" on public.activity_reactions
  for select to authenticated using ((select public.is_employee()));
create policy "activity_reactions: propias" on public.activity_reactions
  for insert to authenticated with check (user_id = (select auth.uid()) and (select public.is_employee()));
create policy "activity_reactions: quitar propias" on public.activity_reactions
  for delete to authenticated using (user_id = (select auth.uid()));
alter publication supabase_realtime add table public.activity_reactions;

-- -----------------------------------------------------------------------------
-- Negocios (varios por lead, con valor y probabilidad)
-- -----------------------------------------------------------------------------
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  value_cop bigint not null default 0 check (value_cop >= 0),
  stage text not null default 'prospecting' check (stage in ('prospecting', 'proposal', 'negotiation', 'won', 'lost')),
  probability smallint not null default 20 check (probability between 0 and 100),
  expected_close date,
  owner_id uuid references public.profiles (id) on delete set null default auth.uid(),
  notes text check (char_length(notes) <= 2000),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deals_lead_idx on public.deals (lead_id);
create index deals_stage_idx on public.deals (stage, expected_close);
alter table public.deals enable row level security;
create policy "deals: empleados leen" on public.deals for select to authenticated using ((select public.is_employee()));
create policy "deals: ventas crean" on public.deals for insert to authenticated with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));
create policy "deals: ventas editan" on public.deals for update to authenticated
  using ((select public.has_role(array['admin', 'sales']::public.app_role[]))) with check ((select public.has_role(array['admin', 'sales']::public.app_role[])));
create policy "deals: ventas borran" on public.deals for delete to authenticated using ((select public.has_role(array['admin', 'sales']::public.app_role[])));

create or replace function public.deals_on_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.probability := case new.stage when 'won' then 100 when 'lost' then 0 else new.probability end;
  new.closed_at := case when new.stage in ('won', 'lost') then coalesce(old.closed_at, now()) end;
  return new;
end;
$$;
create trigger deals_on_change before insert or update on public.deals
  for each row execute function public.deals_on_change();

-- Al ganar un negocio, el lead también queda ganado (y suma su valor).
create or replace function public.deals_sync_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stage = 'won' and (tg_op = 'INSERT' or old.stage is distinct from 'won') then
    update public.leads
       set status = 'won',
           value_cop = coalesce((select sum(value_cop) from public.deals where lead_id = new.lead_id and stage = 'won'), 0)
     where id = new.lead_id;
  end if;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  select new.lead_id, auth.uid(), 'note',
         case when tg_op = 'INSERT' then 'Negocio creado: ' else 'Negocio actualizado: ' end || new.title,
         jsonb_build_object('deal_id', new.id, 'stage', new.stage, 'value', new.value_cop, 'auto', true)
   where tg_op = 'INSERT' or old.stage is distinct from new.stage;
  return new;
end;
$$;
create trigger deals_sync_lead after insert or update of stage on public.deals
  for each row execute function public.deals_sync_lead();

-- -----------------------------------------------------------------------------
-- Documentos del lead (Storage: portal-docs/leads/<lead>/...)
-- -----------------------------------------------------------------------------
create table public.lead_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  path text not null unique check (path like 'leads/%'),
  size bigint not null default 0,
  mime text,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.lead_documents enable row level security;
create policy "lead_documents: empleados leen" on public.lead_documents for select to authenticated using ((select public.is_employee()));
create policy "lead_documents: equipo sube" on public.lead_documents for insert to authenticated
  with check ((select public.is_support_staff()) and uploaded_by = (select auth.uid()));
create policy "lead_documents: equipo borra" on public.lead_documents for delete to authenticated using ((select public.is_support_staff()));

-- -----------------------------------------------------------------------------
-- Métricas del CRM con series diarias (para las minigráficas)
-- -----------------------------------------------------------------------------
create or replace function public.crm_kpis(p_days integer default 14)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d integer := least(greatest(p_days, 7), 90);
  v_from timestamptz := now() - make_interval(days => d);
  v_prev timestamptz := now() - make_interval(days => d * 2);
  result jsonb;
begin
  if not public.is_employee() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with resp as (
    select l.id, l.created_at, l.tier, l.score,
           (select min(a.created_at) from public.lead_activities a where a.lead_id = l.id and a.author_id is not null) as first_touch
      from public.leads l
     where l.created_at >= v_prev
  ), days as (
    select g::date as day from generate_series((v_from at time zone 'America/Bogota')::date, (now() at time zone 'America/Bogota')::date, interval '1 day') g
  )
  select jsonb_build_object(
    'new', (select count(*) from resp where created_at >= v_from),
    'new_prev', (select count(*) from resp where created_at < v_from),
    'qualified', (select count(*) from resp where created_at >= v_from and tier = 'green'),
    'qualified_prev', (select count(*) from resp where created_at < v_from and tier = 'green'),
    'response_h', (select round((avg(extract(epoch from first_touch - created_at)) / 3600)::numeric, 1) from resp where created_at >= v_from and first_touch is not null),
    'response_h_prev', (select round((avg(extract(epoch from first_touch - created_at)) / 3600)::numeric, 1) from resp where created_at < v_from and first_touch is not null),
    'hot', (select count(*) from public.leads where score >= 80 and status in ('new', 'contacted', 'meeting', 'proposal')),
    'hot_prev', (select count(*) from resp where created_at < v_from and score >= 80),
    'series', (select jsonb_agg(jsonb_build_object(
        'day', days.day,
        'new', (select count(*) from resp where (created_at at time zone 'America/Bogota')::date = days.day),
        'qualified', (select count(*) from resp where tier = 'green' and (created_at at time zone 'America/Bogota')::date = days.day),
        'response_h', (select round((avg(extract(epoch from first_touch - created_at)) / 3600)::numeric, 1) from resp
                        where first_touch is not null and (created_at at time zone 'America/Bogota')::date = days.day),
        'hot', (select count(*) from resp where score >= 80 and (created_at at time zone 'America/Bogota')::date = days.day)
      ) order by days.day) from days)
  ) into result;
  return result;
end;
$$;
revoke all on function public.crm_kpis(integer) from public, anon;
grant execute on function public.crm_kpis(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Lead manual e importación (con el mismo puntaje del formulario)
-- -----------------------------------------------------------------------------
create or replace function public.staff_create_lead(p jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(nullif(btrim(p ->> 'email'), ''));
  v_name text := nullif(btrim(p ->> 'name'), '');
  v_phone text := coalesce(nullif(btrim(p ->> 'phone'), ''), '');
  v_category text := coalesce(nullif(p ->> 'problem_category', ''), 'other');
  v_budget text := coalesce(nullif(p ->> 'budget', ''), 'unknown');
  v_decision text := coalesce(nullif(p ->> 'decision', ''), 'other');
  v_timeline text := coalesce(nullif(p ->> 'timeline', ''), 'month');
  v_source text := coalesce(nullif(p ->> 'source', ''), 'manual');
  result jsonb;
  new_id uuid;
begin
  if not public.has_role(array['admin', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_name is null or v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if v_category not in ('sales', 'web', 'automation', 'system', 'support', 'other', 'none') then v_category := 'other'; end if;
  if v_budget not in ('lt2', '2to5', '5to15', '15to40', 'gt40', 'monthly', 'unknown') then v_budget := 'unknown'; end if;
  if v_decision not in ('self', 'shared', 'other') then v_decision := 'other'; end if;
  if v_timeline not in ('week', 'month', 'browsing') then v_timeline := 'month'; end if;
  if v_source not in ('manual', 'import', 'referral', 'web', 'chat', 'whatsapp') then v_source := 'manual'; end if;

  result := public.score_lead(v_category, nullif(btrim(p ->> 'problem_text'), ''), v_budget, v_decision, v_timeline);
  insert into public.leads (
    name, email, phone, company, problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown, locale, source_page, consent_at, assigned_to, source, utm
  ) values (
    left(v_name, 120), v_email, left(v_phone, 40), nullif(btrim(p ->> 'company'), ''),
    v_category, left(nullif(btrim(p ->> 'problem_text'), ''), 2000), v_budget, v_decision, v_timeline,
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier, result -> 'breakdown',
    'es', v_source, now(), coalesce(nullif(p ->> 'assigned_to', '')::uuid, auth.uid()), v_source,
    case when nullif(p ->> 'utm_source', '') is not null then jsonb_build_object('utm_source', p ->> 'utm_source') end
  )
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.import_leads(p_rows jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r jsonb;
  inserted integer := 0;
  skipped integer := 0;
begin
  if not public.has_role(array['admin', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 2000 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    if exists (select 1 from public.leads where lower(email) = lower(btrim(r ->> 'email'))) then
      skipped := skipped + 1;
      continue;
    end if;
    begin
      perform public.staff_create_lead(r || jsonb_build_object('source', 'import'));
      inserted := inserted + 1;
    exception when others then
      skipped := skipped + 1;
    end;
  end loop;
  return jsonb_build_object('inserted', inserted, 'skipped', skipped);
end;
$$;

-- Agendar desde la ficha (el asesor elige día, hora y canal).
create or replace function public.staff_book_appointment(p_lead uuid, p_start timestamptz, p_channel public.meeting_channel, p_notes text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  dur integer := coalesce((select duration_min from public.booking_settings limit 1), 30);
  new_id uuid;
begin
  if not public.has_role(array['admin', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_start <= now() then
    raise exception 'past' using errcode = '22023';
  end if;
  insert into public.appointments (lead_id, starts_at, ends_at, channel, status, notes, host_id)
  values (p_lead, p_start, p_start + make_interval(mins => dur), p_channel, 'scheduled', left(p_notes, 500), auth.uid())
  returning id into new_id;
  update public.leads set status = 'meeting' where id = p_lead and status in ('new', 'contacted');
  insert into public.lead_activities (lead_id, author_id, type, meta)
  values (p_lead, auth.uid(), 'appointment', jsonb_build_object('starts_at', p_start, 'channel', p_channel));
  return new_id;
exception when exclusion_violation then
  raise exception 'slot_taken' using errcode = 'P0001';
end;
$$;

revoke all on function public.staff_create_lead(jsonb) from public, anon;
revoke all on function public.import_leads(jsonb) from public, anon;
revoke all on function public.staff_book_appointment(uuid, timestamptz, public.meeting_channel, text) from public, anon;
grant execute on function public.staff_create_lead(jsonb) to authenticated;
grant execute on function public.import_leads(jsonb) to authenticated;
grant execute on function public.staff_book_appointment(uuid, timestamptz, public.meeting_channel, text) to authenticated;
