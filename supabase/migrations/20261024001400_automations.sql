-- =============================================================================
-- Centro de automatizaciones (estilo Meta Business Suite)
--   Reglas "cuando pase X → haz Y" que el equipo crea sin programar.
--   * Disparadores instantáneos (triggers de la base) y por tiempo (pg_cron
--     cada 5 minutos, sin depender del servidor web).
--   * Acciones: asignar por turnos, crear tarea, avisar al equipo (campana),
--     enviar correo o WhatsApp, cambiar estado, etiquetar.
--   * Cada regla se ejecuta una sola vez por elemento (automation_runs).
-- =============================================================================

-- Correo libre (lo arma la regla) y WhatsApp fuera de campañas.
alter table public.email_queue drop constraint email_queue_kind_check;
alter table public.email_queue add constraint email_queue_kind_check check (kind in (
  'followup_1', 'followup_2', 'followup_3', 'booking_confirmation',
  'new_lead_alert', 'abandoned', 'weekly_report', 'custom'
));
alter table public.email_queue add column payload jsonb;

alter table public.wa_messages alter column campaign_id drop not null;
alter table public.wa_messages add column template_id uuid references public.wa_templates (id) on delete set null;

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 300),
  trigger text not null check (trigger in (
    'lead_created', 'lead_not_contacted', 'lead_stale', 'lead_won',
    'appointment_booked', 'appointment_upcoming',
    'ticket_created', 'ticket_no_reply', 'ticket_staff_reply',
    'chat_started', 'chat_unanswered', 'chat_reply_offline'
  )),
  params jsonb not null default '{}' check (jsonb_typeof(params) = 'object'),
  conditions jsonb not null default '{}' check (jsonb_typeof(conditions) = 'object'),
  actions jsonb not null default '[]' check (jsonb_typeof(actions) = 'array'),
  enabled boolean not null default true,
  template_key text unique,
  runs integer not null default 0,
  last_run_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_runs (
  id bigint generated always as identity primary key,
  rule_id uuid not null references public.automation_rules (id) on delete cascade,
  entity text not null,
  entity_id text not null,
  run_key text not null,
  status text not null default 'done' check (status in ('done', 'failed')),
  detail jsonb,
  created_at timestamptz not null default now(),
  unique (rule_id, run_key)
);

create index automation_runs_rule_idx on public.automation_runs (rule_id, created_at desc);

alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;

create policy "automation_rules: equipo comercial lee" on public.automation_rules
  for select to authenticated using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));
create policy "automation_rules: admin y marketing crean" on public.automation_rules
  for insert to authenticated with check ((select public.has_role(array['admin', 'marketing']::public.app_role[])));
create policy "automation_rules: admin y marketing editan" on public.automation_rules
  for update to authenticated
  using ((select public.has_role(array['admin', 'marketing']::public.app_role[])))
  with check ((select public.has_role(array['admin', 'marketing']::public.app_role[])));
create policy "automation_rules: admin y marketing borran" on public.automation_rules
  for delete to authenticated using ((select public.has_role(array['admin', 'marketing']::public.app_role[])));
create policy "automation_runs: equipo comercial lee" on public.automation_runs
  for select to authenticated using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));

create trigger automation_rules_touch before update on public.automation_rules
  for each row execute function public.wa_touch_campaign();

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------

-- {nombre}, {empresa}… → valor.
create or replace function public.automation_render(p_text text, p_vars jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  k text;
  out text := coalesce(p_text, '');
begin
  for k in select jsonb_object_keys(p_vars) loop
    out := replace(out, '{' || k || '}', coalesce(p_vars ->> k, ''));
  end loop;
  return out;
end;
$$;

-- Siguiente asesor por turnos: el que menos elementos recibió en 30 días.
create or replace function public.automation_pick_agent(p_roles public.app_role[])
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
    from public.profiles p
   where p.active and p.kind = 'employee' and p.role = any (p_roles)
   order by (select count(*) from public.leads l where l.assigned_to = p.id and l.created_at > now() - interval '30 days')
          + (select count(*) from public.tickets t where t.assigned_to = p.id and t.created_at > now() - interval '30 days'),
            random()
   limit 1
$$;

-- Datos del elemento para condiciones y textos.
create or replace function public.automation_context(p_entity text, p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ctx jsonb;
begin
  if p_entity = 'lead' then
    select jsonb_build_object(
      'lead_id', l.id, 'owner', l.assigned_to, 'nombre', l.name, 'primer_nombre', split_part(l.name, ' ', 1),
      'empresa', coalesce(l.company, ''), 'correo', l.email, 'telefono', l.phone, 'puntaje', l.score,
      'color', l.tier::text, 'tier', l.tier::text, 'status', l.status::text, 'problem', l.problem_category,
      'problema', coalesce(l.problem_text, ''), 'locale', coalesce(l.locale, 'es'), 'email_token', l.email_token,
      'opted_out', l.email_opt_out_at is not null, 'contact_email', l.email, 'contact_phone', l.phone,
      'enlace', 'https://engynex.com/es/portal/crm/' || l.id)
      into ctx from public.leads l where l.id = p_id::uuid;
  elsif p_entity = 'appointment' then
    select jsonb_build_object(
      'lead_id', l.id, 'appointment_id', a.id, 'owner', coalesce(a.host_id, l.assigned_to), 'nombre', l.name,
      'primer_nombre', split_part(l.name, ' ', 1), 'empresa', coalesce(l.company, ''), 'correo', l.email,
      'telefono', l.phone, 'tier', l.tier::text, 'color', l.tier::text, 'status', l.status::text,
      'problem', l.problem_category, 'locale', coalesce(l.locale, 'es'), 'email_token', l.email_token,
      'opted_out', l.email_opt_out_at is not null, 'contact_email', l.email, 'contact_phone', l.phone,
      'canal', case a.channel::text when 'meet' then 'videollamada' when 'call' then 'llamada' when 'whatsapp' then 'WhatsApp' else 'reunión presencial' end,
      'fecha', to_char(a.starts_at at time zone 'America/Bogota', 'DD/MM/YYYY HH12:MI AM'),
      'enlace', 'https://engynex.com/es/portal/crm/' || l.id)
      into ctx from public.appointments a join public.leads l on l.id = a.lead_id where a.id = p_id::uuid;
  elsif p_entity = 'ticket' then
    select jsonb_build_object(
      'ticket_id', t.id, 'owner', t.assigned_to, 'nombre', t.name, 'primer_nombre', split_part(t.name, ' ', 1),
      'empresa', coalesce(t.company, ''), 'correo', t.email, 'telefono', coalesce(t.phone, ''),
      'numero', t.number, 'asunto', t.subject, 'priority', t.priority::text, 'prioridad', t.priority::text,
      'status', t.status::text, 'contact_email', t.email, 'contact_phone', t.phone, 'locale', 'es',
      'ultima_respuesta', coalesce((select m.body from public.ticket_messages m
                                     where m.ticket_id = t.id and m.author_kind = 'staff' and not m.internal
                                     order by m.id desc limit 1), ''),
      'enlace', 'https://engynex.com/es/portal/soporte/' || t.id)
      into ctx from public.tickets t where t.id = p_id::uuid;
  elsif p_entity = 'chat' then
    select jsonb_build_object(
      'chat_id', c.id, 'lead_id', c.lead_id, 'owner', c.assigned_to, 'nombre', c.name,
      'primer_nombre', split_part(c.name, ' ', 1), 'correo', coalesce(c.email, ''), 'telefono', coalesce(c.phone, ''),
      'channel', c.channel, 'canal', c.channel, 'mensaje', coalesce(c.last_message, ''), 'contact_email', c.email,
      'contact_phone', coalesce(c.wa_phone, c.phone), 'locale', coalesce(c.locale, 'es'),
      'ultima_respuesta', coalesce((select m.body from public.chat_messages m
                                     where m.conversation_id = c.id and m.sender = 'agent' and not m.internal
                                     order by m.id desc limit 1), ''),
      'enlace', 'https://engynex.com/es/portal/chat?c=' || c.id)
      into ctx from public.chat_conversations c where c.id = p_id::uuid;
  end if;
  return ctx;
end;
$$;

-- ¿Cumple las condiciones de la regla?
create or replace function public.automation_matches(p_conditions jsonb, p_ctx jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    (coalesce(jsonb_array_length(p_conditions -> 'tiers'), 0) = 0 or (p_ctx ->> 'tier') in (select jsonb_array_elements_text(p_conditions -> 'tiers')))
    and (coalesce(jsonb_array_length(p_conditions -> 'statuses'), 0) = 0 or (p_ctx ->> 'status') in (select jsonb_array_elements_text(p_conditions -> 'statuses')))
    and (coalesce(jsonb_array_length(p_conditions -> 'problems'), 0) = 0 or (p_ctx ->> 'problem') in (select jsonb_array_elements_text(p_conditions -> 'problems')))
    and (coalesce(jsonb_array_length(p_conditions -> 'priorities'), 0) = 0 or (p_ctx ->> 'priority') in (select jsonb_array_elements_text(p_conditions -> 'priorities')))
    and (coalesce(jsonb_array_length(p_conditions -> 'channels'), 0) = 0 or (p_ctx ->> 'channel') in (select jsonb_array_elements_text(p_conditions -> 'channels')))
$$;

-- -----------------------------------------------------------------------------
-- Ejecutar una regla sobre un elemento (una sola vez por run_key)
-- -----------------------------------------------------------------------------

create or replace function public.automation_execute(p_rule public.automation_rules, p_entity text, p_id text, p_run_key text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ctx jsonb := public.automation_context(p_entity, p_id);
  act jsonb;
  done jsonb := '[]'::jsonb;
  run_id bigint;
  agent uuid;
  target uuid;
  roles public.app_role[];
  title text;
  body text;
begin
  if ctx is null or not public.automation_matches(p_rule.conditions, ctx) then
    return false;
  end if;

  insert into public.automation_runs (rule_id, entity, entity_id, run_key)
  values (p_rule.id, p_entity, p_id, p_run_key)
  on conflict (rule_id, run_key) do nothing
  returning id into run_id;
  if run_id is null then
    return false; -- ya se ejecutó
  end if;

  begin
    for act in select * from jsonb_array_elements(p_rule.actions) loop
      roles := coalesce((select array_agg(x::public.app_role) from jsonb_array_elements_text(act -> 'roles') x), array['admin']::public.app_role[]);

      case act ->> 'type'
      when 'assign' then
        agent := coalesce(nullif(act ->> 'user_id', '')::uuid, public.automation_pick_agent(roles));
        if agent is not null then
          if p_entity in ('lead', 'appointment') then
            update public.leads set assigned_to = agent where id = (ctx ->> 'lead_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
          elsif p_entity = 'ticket' then
            update public.tickets set assigned_to = agent where id = (ctx ->> 'ticket_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
          elsif p_entity = 'chat' then
            update public.chat_conversations set assigned_to = agent where id = (ctx ->> 'chat_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
          end if;
          ctx := ctx || jsonb_build_object('owner', agent);
          done := done || jsonb_build_object('type', 'assign', 'to', agent);
        end if;

      when 'task' then
        target := case act ->> 'assign_to' when 'user' then nullif(act ->> 'user_id', '')::uuid else (ctx ->> 'owner')::uuid end;
        insert into public.tasks (lead_id, title, due_at, assigned_to)
        values (nullif(ctx ->> 'lead_id', '')::uuid,
                left(public.automation_render(coalesce(act ->> 'title', 'Seguimiento'), ctx), 200),
                now() + make_interval(mins => coalesce((act ->> 'due_minutes')::int, 1440)),
                target);
        if target is not null then
          perform public.notify(null, target, 'task', left(public.automation_render(coalesce(act ->> 'title', 'Seguimiento'), ctx), 200), 'Tarea creada por una automatización', ctx ->> 'enlace');
        end if;
        done := done || jsonb_build_object('type', 'task');

      when 'notify' then
        title := left(public.automation_render(coalesce(act ->> 'title', p_rule.name), ctx), 200);
        body := left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 500);
        if act ->> 'to' = 'owner' and (ctx ->> 'owner') is not null then
          perform public.notify(null, (ctx ->> 'owner')::uuid, coalesce(act ->> 'kind', split_part(p_entity, '_', 1)), title, nullif(body, ''), ctx ->> 'enlace');
        elsif act ->> 'to' = 'user' and nullif(act ->> 'user_id', '') is not null then
          perform public.notify(null, (act ->> 'user_id')::uuid, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
        else
          perform public.notify(roles, null, coalesce(act ->> 'kind', case p_entity when 'appointment' then 'meeting' else p_entity end), title, nullif(body, ''), ctx ->> 'enlace');
        end if;
        done := done || jsonb_build_object('type', 'notify');

      when 'email' then
        if act ->> 'to' = 'team' then
          insert into public.email_queue (kind, lead_id, to_email, payload)
          values ('custom', nullif(ctx ->> 'lead_id', '')::uuid, null, jsonb_build_object(
            'subject', public.automation_render(act ->> 'subject', ctx), 'body', public.automation_render(act ->> 'body', ctx),
            'cta_label', 'Abrir en el portal', 'cta_url', ctx ->> 'enlace', 'internal', true));
        elsif nullif(ctx ->> 'contact_email', '') is not null and not coalesce((ctx ->> 'opted_out')::boolean, false) then
          insert into public.email_queue (kind, lead_id, to_email, payload)
          values ('custom', nullif(ctx ->> 'lead_id', '')::uuid, ctx ->> 'contact_email', jsonb_build_object(
            'subject', public.automation_render(act ->> 'subject', ctx), 'body', public.automation_render(act ->> 'body', ctx),
            'cta_label', act ->> 'cta_label', 'cta_url', public.automation_render(act ->> 'cta_url', ctx),
            'locale', ctx ->> 'locale', 'email_token', ctx ->> 'email_token'));
        end if;
        done := done || jsonb_build_object('type', 'email');

      when 'whatsapp' then
        if nullif(ctx ->> 'contact_phone', '') is not null and nullif(act ->> 'template_id', '') is not null
           and public.wa_phone(ctx ->> 'contact_phone') is not null then
          insert into public.wa_messages (campaign_id, template_id, lead_id, phone, name, params)
          values (null, (act ->> 'template_id')::uuid, nullif(ctx ->> 'lead_id', '')::uuid,
                  public.wa_phone(ctx ->> 'contact_phone'), ctx ->> 'nombre',
                  coalesce((select jsonb_agg(public.automation_render(x, ctx)) from jsonb_array_elements_text(act -> 'params') x), '[]'::jsonb));
        end if;
        done := done || jsonb_build_object('type', 'whatsapp');

      when 'status' then
        if p_entity in ('lead', 'appointment') and act ->> 'status' in ('new', 'contacted', 'meeting', 'proposal', 'won', 'lost') then
          update public.leads set status = (act ->> 'status')::public.lead_status where id = (ctx ->> 'lead_id')::uuid;
        elsif p_entity = 'ticket' and act ->> 'status' in ('open', 'in_progress', 'waiting', 'resolved', 'closed') then
          update public.tickets set status = (act ->> 'status')::public.ticket_status where id = (ctx ->> 'ticket_id')::uuid;
        end if;
        done := done || jsonb_build_object('type', 'status');

      when 'tag' then
        if p_entity = 'chat' and nullif(act ->> 'tag', '') is not null then
          update public.chat_conversations set tags = array(select distinct unnest(tags || array[lower(act ->> 'tag')]))
           where id = (ctx ->> 'chat_id')::uuid;
        end if;
        done := done || jsonb_build_object('type', 'tag');
      else
        null;
      end case;
    end loop;

    update public.automation_runs set detail = jsonb_build_object('actions', done) where id = run_id;
  exception when others then
    update public.automation_runs set status = 'failed', detail = jsonb_build_object('error', sqlerrm, 'actions', done) where id = run_id;
  end;

  update public.automation_rules set runs = runs + 1, last_run_at = now() where id = p_rule.id;
  return true;
end;
$$;

-- Disparadores instantáneos.
create or replace function public.automation_fire(p_trigger text, p_entity text, p_id text, p_key text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.automation_rules;
begin
  for r in select * from public.automation_rules where enabled and trigger = p_trigger order by created_at loop
    perform public.automation_execute(r, p_entity, p_id, p_entity || ':' || p_id || ':' || p_key);
  end loop;
end;
$$;

create or replace function public.automations_on_lead()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.automation_fire('lead_created', 'lead', new.id::text, 'created');
  elsif new.status = 'won' and old.status is distinct from 'won' then
    perform public.automation_fire('lead_won', 'lead', new.id::text, 'won');
  end if;
  return new;
end;
$$;
create or replace function public.automations_on_appointment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.automation_fire('appointment_booked', 'appointment', new.id::text, 'booked');
  return new;
end;
$$;
create or replace function public.automations_on_ticket()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.automation_fire('ticket_created', 'ticket', new.id::text, 'created');
  return new;
end;
$$;
create or replace function public.automations_on_ticket_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.author_kind = 'staff' and not new.internal then
    perform public.automation_fire('ticket_staff_reply', 'ticket', new.ticket_id::text, 'reply:' || new.id);
  end if;
  return new;
end;
$$;
create or replace function public.automations_on_chat()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.automation_fire('chat_started', 'chat', new.id::text, 'started');
  return new;
end;
$$;

-- "zz_" para que corran después de los demás triggers (orden alfabético).
create trigger zz_automations after insert or update of status on public.leads
  for each row execute function public.automations_on_lead();
create trigger zz_automations after insert on public.appointments
  for each row execute function public.automations_on_appointment();
create trigger zz_automations after insert on public.tickets
  for each row execute function public.automations_on_ticket();
create trigger zz_automations after insert on public.ticket_messages
  for each row execute function public.automations_on_ticket_message();
create trigger zz_automations after insert on public.chat_conversations
  for each row execute function public.automations_on_chat();

-- -----------------------------------------------------------------------------
-- Disparadores por tiempo (cada 5 minutos con pg_cron)
-- -----------------------------------------------------------------------------

create or replace function public.automations_tick()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.automation_rules;
  rec record;
  n integer := 0;
  minutes int;
  hours int;
  days int;
begin
  for r in select * from public.automation_rules where enabled and trigger in (
    'lead_not_contacted', 'lead_stale', 'appointment_upcoming', 'ticket_no_reply', 'chat_unanswered', 'chat_reply_offline'
  ) loop
    minutes := coalesce((r.params ->> 'minutes')::int, 15);
    hours := coalesce((r.params ->> 'hours')::int, 24);
    days := coalesce((r.params ->> 'days')::int, 7);

    if r.trigger = 'lead_not_contacted' then
      for rec in
        select l.id from public.leads l
         where l.status = 'new' and l.created_at < now() - make_interval(mins => minutes)
           and l.created_at > now() - interval '3 days'
           and not exists (select 1 from public.lead_activities a where a.lead_id = l.id and a.author_id is not null)
      loop
        if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':nc') then n := n + 1; end if;
      end loop;

    elsif r.trigger = 'lead_stale' then
      for rec in
        select l.id, l.last_activity_at from public.leads l
         where l.status in ('new', 'contacted', 'meeting', 'proposal')
           and l.last_activity_at < now() - make_interval(days => days)
      loop
        if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':stale:' || to_char(rec.last_activity_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
      end loop;

    elsif r.trigger = 'appointment_upcoming' then
      for rec in
        select a.id from public.appointments a
         where a.status = 'scheduled' and a.starts_at > now()
           and a.starts_at <= now() + make_interval(hours => hours)
           -- Si se agendó dentro de la ventana, el recordatorio ya no tiene sentido.
           and a.created_at < a.starts_at - make_interval(hours => hours)
      loop
        if public.automation_execute(r, 'appointment', rec.id::text, 'appointment:' || rec.id || ':h' || hours) then n := n + 1; end if;
      end loop;

    elsif r.trigger = 'ticket_no_reply' then
      for rec in
        select t.id, coalesce(max(m.created_at) filter (where m.author_kind = 'requester'), t.created_at) as asked_at
          from public.tickets t
          left join public.ticket_messages m on m.ticket_id = t.id
         where t.status in ('open', 'in_progress')
         group by t.id
        having coalesce(max(m.created_at) filter (where m.author_kind = 'requester'), t.created_at) < now() - make_interval(hours => hours)
           and coalesce(max(m.created_at) filter (where m.author_kind = 'staff' and not m.internal), '-infinity')
               < coalesce(max(m.created_at) filter (where m.author_kind = 'requester'), t.created_at)
      loop
        if public.automation_execute(r, 'ticket', rec.id::text, 'ticket:' || rec.id || ':nr:' || to_char(rec.asked_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
      end loop;

    elsif r.trigger = 'chat_unanswered' then
      for rec in
        select c.id from public.chat_conversations c
         where c.status = 'open' and c.first_response_at is null
           and c.created_at < now() - make_interval(mins => minutes)
           and c.created_at > now() - interval '2 days'
      loop
        if public.automation_execute(r, 'chat', rec.id::text, 'chat:' || rec.id || ':unanswered') then n := n + 1; end if;
      end loop;

    elsif r.trigger = 'chat_reply_offline' then
      -- El asesor respondió y el visitante no volvió a ver el chat.
      for rec in
        select c.id, max(m.id) as last_reply
          from public.chat_conversations c
          join public.chat_messages m on m.conversation_id = c.id and m.sender = 'agent' and not m.internal
         where c.channel = 'web' and c.email is not null
         group by c.id, c.visitor_seen_at
        having max(m.created_at) < now() - interval '3 minutes'
           and max(m.created_at) > now() - interval '2 days'
           and c.visitor_seen_at < max(m.created_at)
      loop
        if public.automation_execute(r, 'chat', rec.id::text, 'chat:' || rec.id || ':offline:' || rec.last_reply) then n := n + 1; end if;
      end loop;
    end if;
  end loop;
  return n;
end;
$$;

revoke all on function public.automation_execute(public.automation_rules, text, text, text) from public, anon, authenticated;
revoke all on function public.automation_fire(text, text, text, text) from public, anon, authenticated;
revoke all on function public.automations_tick() from public, anon, authenticated;
revoke all on function public.automation_pick_agent(public.app_role[]) from public, anon, authenticated;
revoke all on function public.automation_context(text, text) from public, anon, authenticated;

select cron.schedule('automations-tick', '*/5 * * * *', 'select public.automations_tick()');

-- WhatsApp fuera de campañas: la plantilla viene en el mensaje.
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
    where c.status = 'scheduled' and c.scheduled_at <= now();
  update public.wa_messages m set status = 'queued'
   where m.status = 'sending' and m.wa_message_id is null and m.created_at < now() - interval '10 minutes'
     and m.sent_at is null;

  return query
  with picked as (
    select m.id from public.wa_messages m
     where m.status = 'queued'
     order by m.id
     limit greatest(1, least(p_limit, 1000))
     for update skip locked
  ), claimed as (
    update public.wa_messages m set status = 'sending', sent_at = null
      from picked where m.id = picked.id
    returning m.*
  )
  select c.id, c.phone, c.params, t.name, t.language
    from claimed c
    left join public.wa_campaigns camp on camp.id = c.campaign_id
    join public.wa_templates t on t.id = coalesce(c.template_id, camp.template_id);
end;
$$;
revoke all on function public.wa_claim_batch(integer) from public, anon, authenticated;
grant execute on function public.wa_claim_batch(integer) to service_role;

-- Prueba manual desde el portal: ejecutar una regla de tiempo ya.
create or replace function public.automations_run_now()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin', 'marketing']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public.automations_tick();
end;
$$;
revoke all on function public.automations_run_now() from public, anon;
grant execute on function public.automations_run_now() to authenticated;
