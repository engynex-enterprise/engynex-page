-- =============================================================================
-- Automatizaciones PRO
--   * 40 disparadores: ventas, reuniones, soporte, chat, tareas, negocios y
--     clientes (instantáneos y por tiempo).
--   * Condiciones nuevas: fuente, puntaje mínimo, con/sin responsable, horario
--     laboral, etiquetas, tema, etapa, tipo de cuenta, valor, calificación.
--   * Acciones nuevas: nota, prioridad, etiqueta (en todo), etapa, inscribir o
--     sacar de la secuencia, crear negocio, webhook, correo a una persona.
--   * Esperar antes de actuar (retraso), límite de ejecuciones por día,
--     carpeta, vista previa sobre un elemento real y ejecución manual.
--   * Estadísticas y muchas reglas listas para usar.
-- =============================================================================

alter table public.automation_rules drop constraint automation_rules_trigger_check;
alter table public.automation_rules add constraint automation_rules_trigger_check check (trigger in (
  -- Ventas
  'lead_created', 'lead_not_contacted', 'lead_stale', 'lead_won', 'lead_lost', 'lead_status_changed',
  'lead_assigned', 'lead_no_meeting', 'lead_reengage', 'email_clicked', 'email_bounced',
  -- Reuniones
  'appointment_booked', 'appointment_upcoming', 'appointment_cancelled', 'appointment_done',
  'appointment_no_show', 'appointment_after',
  -- Soporte
  'ticket_created', 'ticket_no_reply', 'ticket_staff_reply', 'ticket_customer_reply', 'ticket_resolved',
  'ticket_reopened', 'ticket_rated', 'ticket_sla_breached', 'ticket_waiting_customer', 'ticket_assigned',
  -- Chat
  'chat_started', 'chat_unanswered', 'chat_reply_offline', 'chat_closed', 'chat_rated',
  -- Tareas
  'task_completed', 'task_overdue',
  -- Negocios
  'deal_created', 'deal_stage_changed', 'deal_close_overdue',
  -- Clientes
  'account_created', 'account_renewal', 'account_inactive', 'document_uploaded'
));

alter table public.automation_rules
  add column delay_minutes integer not null default 0 check (delay_minutes between 0 and 43200),
  add column max_per_day integer check (max_per_day between 1 and 10000),
  add column folder text check (char_length(folder) <= 40);

-- Reglas con retraso: la ejecución queda en espera hasta su hora.
create table public.automation_pending (
  id bigint generated always as identity primary key,
  rule_id uuid not null references public.automation_rules (id) on delete cascade,
  entity text not null,
  entity_id text not null,
  run_key text not null,
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (rule_id, run_key)
);
create index automation_pending_due_idx on public.automation_pending (due_at);
alter table public.automation_pending enable row level security;
create policy "automation_pending: equipo comercial lee" on public.automation_pending
  for select to authenticated using ((select public.has_role(array['admin', 'sales', 'marketing']::public.app_role[])));
create policy "automation_pending: admin y marketing cancelan" on public.automation_pending
  for delete to authenticated using ((select public.has_role(array['admin', 'marketing']::public.app_role[])));

-- -----------------------------------------------------------------------------
-- Datos del elemento (variables y condiciones)
-- -----------------------------------------------------------------------------

create or replace function public.automation_context(p_entity text, p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ctx jsonb;
  site constant text := 'https://engynex.com/es/portal/';
begin
  if p_entity = 'lead' then
    select jsonb_build_object(
      'lead_id', l.id, 'owner', l.assigned_to, 'asesor', coalesce(o.full_name, ''), 'nombre', l.name,
      'primer_nombre', split_part(l.name, ' ', 1), 'empresa', coalesce(l.company, ''), 'correo', l.email,
      'telefono', coalesce(l.phone, ''), 'puntaje', l.score, 'color', l.tier::text, 'tier', l.tier::text,
      'status', l.status::text, 'etapa', l.status::text, 'problem', l.problem_category, 'problema', coalesce(l.problem_text, ''),
      'source', coalesce(l.source, 'web'), 'fuente', coalesce(l.source, 'web'), 'valor', coalesce(l.value_cop, 0),
      'locale', coalesce(l.locale, 'es'), 'email_token', l.email_token, 'opted_out', l.email_opt_out_at is not null,
      'contact_email', l.email, 'contact_phone', l.phone, 'motivo_perdida', coalesce(l.lost_reason, ''),
      'enlace', site || 'crm/' || l.id)
      into ctx from public.leads l left join public.profiles o on o.id = l.assigned_to where l.id = p_id::uuid;
  elsif p_entity = 'appointment' then
    select jsonb_build_object(
      'lead_id', l.id, 'appointment_id', a.id, 'owner', coalesce(a.host_id, l.assigned_to), 'asesor', coalesce(o.full_name, ''),
      'nombre', l.name, 'primer_nombre', split_part(l.name, ' ', 1), 'empresa', coalesce(l.company, ''), 'correo', l.email,
      'telefono', coalesce(l.phone, ''), 'tier', l.tier::text, 'color', l.tier::text, 'status', l.status::text,
      'problem', l.problem_category, 'source', coalesce(l.source, 'web'), 'puntaje', l.score,
      'locale', coalesce(l.locale, 'es'), 'email_token', l.email_token,
      'opted_out', l.email_opt_out_at is not null, 'contact_email', l.email, 'contact_phone', l.phone,
      'canal', case a.channel::text when 'meet' then 'videollamada' when 'call' then 'llamada' when 'whatsapp' then 'WhatsApp' else 'reunión presencial' end,
      'channel', a.channel::text,
      'fecha', to_char(a.starts_at at time zone 'America/Bogota', 'DD/MM/YYYY HH12:MI AM'),
      'enlace_reunion', coalesce(a.meeting_url, ''), 'resultado', coalesce(a.outcome, ''),
      'enlace_agenda', 'https://engynex.com/' || coalesce(l.locale, 'es') || '/agendar?t=' || l.booking_token,
      'enlace', site || 'crm/' || l.id)
      into ctx
      from public.appointments a join public.leads l on l.id = a.lead_id
      left join public.profiles o on o.id = coalesce(a.host_id, l.assigned_to)
     where a.id = p_id::uuid;
  elsif p_entity = 'ticket' then
    select jsonb_build_object(
      'ticket_id', t.id, 'owner', t.assigned_to, 'asesor', coalesce(o.full_name, ''), 'nombre', t.name,
      'primer_nombre', split_part(t.name, ' ', 1), 'empresa', coalesce(t.company, ''), 'correo', t.email,
      'telefono', coalesce(t.phone, ''), 'numero', t.number, 'asunto', t.subject, 'priority', t.priority::text,
      'prioridad', case t.priority::text when 'critical' then 'crítica' when 'high' then 'alta' when 'medium' then 'media' else 'baja' end,
      'status', t.status::text, 'category', t.category, 'tags', to_jsonb(t.tags), 'source', t.source,
      'calificacion', t.csat_rating, 'comentario', coalesce(t.csat_comment, ''), 'account_id', t.requester_id,
      'lead_id', t.lead_id, 'contact_email', t.email, 'contact_phone', t.phone, 'locale', 'es',
      'ultima_respuesta', coalesce((select m.body from public.ticket_messages m
                                     where m.ticket_id = t.id and m.author_kind = 'staff' and not m.internal
                                     order by m.id desc limit 1), ''),
      'ultimo_mensaje', coalesce((select m.body from public.ticket_messages m
                                   where m.ticket_id = t.id and m.author_kind = 'requester'
                                   order by m.id desc limit 1), t.description),
      'enlace', site || 'soporte/' || t.id,
      'enlace_cliente', site || 'soporte/' || t.id,
      'enlace_encuesta', 'https://engynex.com/es/soporte/encuesta?t=' || t.csat_token)
      into ctx from public.tickets t left join public.profiles o on o.id = t.assigned_to where t.id = p_id::uuid;
  elsif p_entity = 'chat' then
    select jsonb_build_object(
      'chat_id', c.id, 'lead_id', c.lead_id, 'owner', c.assigned_to, 'asesor', coalesce(o.full_name, ''), 'nombre', c.name,
      'primer_nombre', split_part(c.name, ' ', 1), 'correo', coalesce(c.email, ''), 'telefono', coalesce(c.phone, ''),
      'channel', c.channel, 'canal', c.channel, 'mensaje', coalesce(c.last_message, ''), 'tags', to_jsonb(c.tags),
      'calificacion', c.rating, 'comentario', coalesce(c.rating_comment, ''), 'status', c.status,
      'contact_email', c.email, 'contact_phone', coalesce(c.wa_phone, c.phone), 'locale', coalesce(c.locale, 'es'),
      'ultima_respuesta', coalesce((select m.body from public.chat_messages m
                                     where m.conversation_id = c.id and m.sender = 'agent' and not m.internal
                                     order by m.id desc limit 1), ''),
      'enlace', site || 'chat?c=' || c.id)
      into ctx from public.chat_conversations c left join public.profiles o on o.id = c.assigned_to where c.id = p_id::uuid;
  elsif p_entity = 'task' then
    select jsonb_build_object(
      'task_id', t.id, 'lead_id', t.lead_id, 'ticket_id', t.ticket_id, 'owner', t.assigned_to, 'asesor', coalesce(o.full_name, ''),
      'titulo', t.title, 'nombre', coalesce(l.name, t.title), 'primer_nombre', split_part(coalesce(l.name, ''), ' ', 1),
      'empresa', coalesce(l.company, ''), 'priority', t.priority, 'status', t.status, 'tags', to_jsonb(t.tags),
      'vence', coalesce(to_char(t.due_at at time zone 'America/Bogota', 'DD/MM/YYYY HH12:MI AM'), ''),
      'contact_email', null, 'contact_phone', null, 'locale', 'es',
      'enlace', site || 'tareas?t=' || t.id)
      into ctx
      from public.tasks t left join public.leads l on l.id = t.lead_id left join public.profiles o on o.id = t.assigned_to
     where t.id = p_id::uuid;
  elsif p_entity = 'deal' then
    select jsonb_build_object(
      'deal_id', d.id, 'lead_id', d.lead_id, 'owner', coalesce(d.owner_id, l.assigned_to), 'asesor', coalesce(o.full_name, ''),
      'titulo', d.title, 'valor', d.value_cop, 'stage', d.stage, 'etapa', d.stage, 'probabilidad', d.probability,
      'cierre', coalesce(to_char(d.expected_close, 'DD/MM/YYYY'), ''), 'nombre', l.name, 'primer_nombre', split_part(l.name, ' ', 1),
      'empresa', coalesce(l.company, ''), 'correo', l.email, 'telefono', coalesce(l.phone, ''), 'tier', l.tier::text,
      'source', coalesce(l.source, 'web'), 'contact_email', l.email, 'contact_phone', l.phone,
      'opted_out', l.email_opt_out_at is not null, 'email_token', l.email_token, 'locale', coalesce(l.locale, 'es'),
      'enlace', site || 'crm/' || l.id)
      into ctx
      from public.deals d join public.leads l on l.id = d.lead_id left join public.profiles o on o.id = coalesce(d.owner_id, l.assigned_to)
     where d.id = p_id::uuid;
  elsif p_entity = 'account' then
    select jsonb_build_object(
      'account_id', p.id, 'owner', d.owner_id, 'asesor', coalesce(o.full_name, ''), 'nombre', coalesce(p.full_name, p.email),
      'primer_nombre', split_part(coalesce(p.full_name, ''), ' ', 1), 'empresa', coalesce(p.company, ''), 'correo', p.email,
      'telefono', coalesce(p.phone, ''), 'kind', p.kind::text, 'stage', d.stage, 'etapa', d.stage, 'tags', to_jsonb(d.tags),
      'plan', coalesce(d.plan, ''), 'valor', d.monthly_value, 'valor_mensual', d.monthly_value,
      'renovacion', coalesce(to_char(d.renewal_date, 'DD/MM/YYYY'), ''), 'lead_id', d.lead_id,
      'documento', coalesce((select x.title from public.documents x where x.owner_id = p.id order by x.created_at desc limit 1), ''),
      'contact_email', p.email, 'contact_phone', p.phone, 'locale', 'es',
      'enlace', site || 'clientes/' || p.id)
      into ctx
      from public.profiles p join public.account_details d on d.profile_id = p.id left join public.profiles o on o.id = d.owner_id
     where p.id = p_id::uuid;
  end if;
  return ctx;
end;
$$;
revoke all on function public.automation_context(text, text) from public, anon, authenticated;

-- ¿Cumple las condiciones? Cada lista vacía o ausente = "cualquiera".
create or replace function public.automation_matches(p_conditions jsonb, p_ctx jsonb)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  pair record;
  field text;
  local timestamp := now() at time zone 'America/Bogota';
begin
  for pair in select * from jsonb_each(coalesce(p_conditions, '{}'::jsonb)) loop
    field := case pair.key
      when 'tiers' then 'tier' when 'statuses' then 'status' when 'problems' then 'problem'
      when 'priorities' then 'priority' when 'channels' then 'channel' when 'sources' then 'source'
      when 'categories' then 'category' when 'stages' then 'stage' when 'kinds' then 'kind' end;
    if field is not null then
      if jsonb_typeof(pair.value) = 'array' and jsonb_array_length(pair.value) > 0
         and not coalesce((p_ctx ->> field) in (select jsonb_array_elements_text(pair.value)), false) then
        return false;
      end if;
    elsif pair.key = 'tags_any' then
      if jsonb_typeof(pair.value) = 'array' and jsonb_array_length(pair.value) > 0
         and not coalesce((p_ctx -> 'tags') ?| array(select jsonb_array_elements_text(pair.value)), false) then
        return false;
      end if;
    elsif pair.key = 'min_score' and jsonb_typeof(pair.value) = 'number' then
      if coalesce((p_ctx ->> 'puntaje')::numeric, -1) < (pair.value #>> '{}')::numeric then return false; end if;
    elsif pair.key = 'min_value' and jsonb_typeof(pair.value) = 'number' then
      if coalesce((p_ctx ->> 'valor')::numeric, 0) < (pair.value #>> '{}')::numeric then return false; end if;
    elsif pair.key = 'max_rating' and jsonb_typeof(pair.value) = 'number' then
      if (p_ctx ->> 'calificacion') is null or (p_ctx ->> 'calificacion')::numeric > (pair.value #>> '{}')::numeric then return false; end if;
    elsif pair.key = 'owner' and jsonb_typeof(pair.value) = 'string' then
      if (pair.value #>> '{}') = 'assigned' and (p_ctx ->> 'owner') is null then return false; end if;
      if (pair.value #>> '{}') = 'unassigned' and (p_ctx ->> 'owner') is not null then return false; end if;
    elsif pair.key = 'business_hours' and pair.value = 'true'::jsonb then
      if extract(isodow from local) > 5 or local::time < time '08:00' or local::time >= time '18:00' then return false; end if;
    elsif pair.key = 'outside_hours' and pair.value = 'true'::jsonb then
      if not (extract(isodow from local) > 5 or local::time < time '08:00' or local::time >= time '18:00') then return false; end if;
    end if;
  end loop;
  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- Acciones
-- -----------------------------------------------------------------------------

-- Ejecuta las acciones sobre ctx; devuelve la lista de lo hecho.
create or replace function public.automation_apply(p_rule public.automation_rules, p_entity text, p_ctx jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ctx jsonb := p_ctx;
  act jsonb;
  done jsonb := '[]'::jsonb;
  agent uuid;
  target uuid;
  roles public.app_role[];
  title text;
  body text;
  v_tag text;
  v_email text;
  req bigint;
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
        elsif p_entity = 'task' then
          update public.tasks set assigned_to = agent where id = (ctx ->> 'task_id')::uuid and (assigned_to is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'deal' then
          update public.deals set owner_id = agent where id = (ctx ->> 'deal_id')::uuid and (owner_id is null or coalesce((act ->> 'force')::boolean, false));
        elsif p_entity = 'account' then
          update public.account_details set owner_id = agent where profile_id = (ctx ->> 'account_id')::uuid and (owner_id is null or coalesce((act ->> 'force')::boolean, false));
        end if;
        ctx := ctx || jsonb_build_object('owner', agent);
        done := done || jsonb_build_object('type', 'assign', 'to', agent);
      end if;

    when 'task' then
      target := case act ->> 'assign_to' when 'user' then nullif(act ->> 'user_id', '')::uuid else (ctx ->> 'owner')::uuid end;
      title := left(public.automation_render(coalesce(act ->> 'title', 'Seguimiento'), ctx), 200);
      insert into public.tasks (lead_id, ticket_id, title, description, due_at, assigned_to, priority, type)
      values (nullif(ctx ->> 'lead_id', '')::uuid, nullif(ctx ->> 'ticket_id', '')::uuid, title,
              nullif(left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 2000), ''),
              now() + make_interval(mins => coalesce((act ->> 'due_minutes')::int, 1440)), target,
              case when act ->> 'priority' in ('urgent', 'high', 'medium', 'low') then act ->> 'priority' else 'medium' end,
              case when act ->> 'task_type' in ('call', 'email', 'whatsapp', 'meeting', 'follow_up', 'other') then act ->> 'task_type' else 'follow_up' end);
      if target is not null then
        perform public.notify(null, target, 'task', title, 'Tarea creada por una automatización', ctx ->> 'enlace');
      end if;
      done := done || jsonb_build_object('type', 'task');

    when 'notify' then
      title := left(public.automation_render(coalesce(act ->> 'title', p_rule.name), ctx), 200);
      body := left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 500);
      if act ->> 'to' = 'owner' then
        if (ctx ->> 'owner') is not null then
          perform public.notify(null, (ctx ->> 'owner')::uuid, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
        else
          -- Sin responsable: avisa al equipo elegido (o a gerencia).
          perform public.notify(roles, null, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
        end if;
      elsif act ->> 'to' = 'user' and nullif(act ->> 'user_id', '') is not null then
        perform public.notify(null, (act ->> 'user_id')::uuid, coalesce(act ->> 'kind', p_entity), title, nullif(body, ''), ctx ->> 'enlace');
      else
        perform public.notify(roles, null, coalesce(act ->> 'kind', case p_entity when 'appointment' then 'meeting' else p_entity end), title, nullif(body, ''), ctx ->> 'enlace');
      end if;
      done := done || jsonb_build_object('type', 'notify');

    when 'email' then
      if act ->> 'to' in ('team', 'user', 'owner') then
        v_email := case act ->> 'to'
          when 'user' then (select email from public.profiles where id = nullif(act ->> 'user_id', '')::uuid)
          when 'owner' then (select email from public.profiles where id = (ctx ->> 'owner')::uuid)
          else null end;
        if act ->> 'to' = 'team' or v_email is not null then
          insert into public.email_queue (kind, lead_id, to_email, payload)
          values ('custom', nullif(ctx ->> 'lead_id', '')::uuid, v_email, jsonb_build_object(
            'subject', public.automation_render(act ->> 'subject', ctx), 'body', public.automation_render(act ->> 'body', ctx),
            'cta_label', 'Abrir en el portal', 'cta_url', ctx ->> 'enlace', 'internal', true));
        end if;
      elsif nullif(ctx ->> 'contact_email', '') is not null and not coalesce((ctx ->> 'opted_out')::boolean, false) then
        insert into public.email_queue (kind, lead_id, to_email, payload)
        values ('custom', nullif(ctx ->> 'lead_id', '')::uuid, ctx ->> 'contact_email', jsonb_build_object(
          'subject', public.automation_render(act ->> 'subject', ctx), 'body', public.automation_render(act ->> 'body', ctx),
          'cta_label', nullif(public.automation_render(act ->> 'cta_label', ctx), ''), 'cta_url', nullif(public.automation_render(act ->> 'cta_url', ctx), ''),
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
      if p_entity in ('lead', 'appointment', 'deal') and act ->> 'status' in ('new', 'contacted', 'meeting', 'proposal', 'won', 'lost') then
        update public.leads set status = (act ->> 'status')::public.lead_status where id = (ctx ->> 'lead_id')::uuid;
      elsif p_entity = 'ticket' and act ->> 'status' in ('open', 'in_progress', 'waiting', 'resolved', 'closed') then
        update public.tickets set status = (act ->> 'status')::public.ticket_status where id = (ctx ->> 'ticket_id')::uuid;
      elsif p_entity = 'task' and act ->> 'status' in ('todo', 'in_progress', 'waiting', 'done') then
        update public.tasks set status = act ->> 'status' where id = (ctx ->> 'task_id')::uuid;
      elsif p_entity = 'chat' and act ->> 'status' in ('open', 'closed') then
        update public.chat_conversations set status = act ->> 'status', closed_at = case when act ->> 'status' = 'closed' then now() end
         where id = (ctx ->> 'chat_id')::uuid;
      end if;
      done := done || jsonb_build_object('type', 'status');

    when 'stage' then
      if p_entity = 'account' and act ->> 'stage' in ('onboarding', 'active', 'at_risk', 'paused', 'churned') then
        update public.account_details set stage = act ->> 'stage' where profile_id = (ctx ->> 'account_id')::uuid;
      elsif p_entity = 'deal' and act ->> 'stage' in ('prospecting', 'proposal', 'negotiation', 'won', 'lost') then
        update public.deals set stage = act ->> 'stage' where id = (ctx ->> 'deal_id')::uuid;
      elsif p_entity = 'ticket' and (ctx ->> 'account_id') is not null and act ->> 'stage' in ('onboarding', 'active', 'at_risk', 'paused', 'churned') then
        update public.account_details set stage = act ->> 'stage' where profile_id = (ctx ->> 'account_id')::uuid;
      end if;
      done := done || jsonb_build_object('type', 'stage');

    when 'priority' then
      if p_entity = 'ticket' and act ->> 'priority' in ('critical', 'high', 'medium', 'low') then
        update public.tickets set priority = (act ->> 'priority')::public.ticket_priority where id = (ctx ->> 'ticket_id')::uuid;
      elsif p_entity = 'task' and act ->> 'priority' in ('urgent', 'high', 'medium', 'low') then
        update public.tasks set priority = act ->> 'priority' where id = (ctx ->> 'task_id')::uuid;
      end if;
      done := done || jsonb_build_object('type', 'priority');

    when 'tag' then
      v_tag := left(lower(btrim(coalesce(act ->> 'tag', ''))), 30);
      if v_tag <> '' then
        if p_entity = 'chat' then
          update public.chat_conversations set tags = array(select distinct unnest(tags || array[v_tag])) where id = (ctx ->> 'chat_id')::uuid;
        elsif p_entity = 'ticket' then
          update public.tickets set tags = array(select distinct unnest(tags || array[v_tag])) where id = (ctx ->> 'ticket_id')::uuid;
        elsif p_entity = 'task' then
          update public.tasks set tags = array(select distinct unnest(tags || array[v_tag])) where id = (ctx ->> 'task_id')::uuid;
        elsif p_entity = 'account' then
          update public.account_details set tags = array(select distinct unnest(tags || array[v_tag])) where profile_id = (ctx ->> 'account_id')::uuid;
        end if;
      end if;
      done := done || jsonb_build_object('type', 'tag');

    when 'note' then
      body := left(public.automation_render(coalesce(act ->> 'body', ''), ctx), 4000);
      if body <> '' then
        if p_entity = 'ticket' then
          insert into public.ticket_messages (ticket_id, author_kind, body, internal)
          values ((ctx ->> 'ticket_id')::uuid, 'system', '🤖 ' || body, true);
        elsif p_entity = 'account' then
          insert into public.account_notes (profile_id, author_id, kind, body) values ((ctx ->> 'account_id')::uuid, null, 'note', '🤖 ' || body);
        elsif nullif(ctx ->> 'lead_id', '') is not null then
          insert into public.lead_activities (lead_id, type, body, meta)
          values ((ctx ->> 'lead_id')::uuid, 'note', '🤖 ' || body, jsonb_build_object('automation', p_rule.id));
        end if;
      end if;
      done := done || jsonb_build_object('type', 'note');

    when 'followup' then
      if nullif(ctx ->> 'lead_id', '') is not null then
        if act ->> 'mode' = 'stop' then
          update public.email_queue set status = 'cancelled', error = 'automation'
           where lead_id = (ctx ->> 'lead_id')::uuid and status = 'queued' and kind like 'followup_%';
        elsif not coalesce((ctx ->> 'opted_out')::boolean, false) and nullif(ctx ->> 'contact_email', '') is not null then
          update public.email_queue set status = 'cancelled', error = 'automation'
           where lead_id = (ctx ->> 'lead_id')::uuid and status = 'queued' and kind like 'followup_%';
          perform public.followup_enqueue((ctx ->> 'lead_id')::uuid, ctx ->> 'contact_email');
        end if;
      end if;
      done := done || jsonb_build_object('type', 'followup', 'mode', coalesce(act ->> 'mode', 'enroll'));

    when 'deal' then
      if nullif(ctx ->> 'lead_id', '') is not null
         and not exists (select 1 from public.deals d where d.lead_id = (ctx ->> 'lead_id')::uuid and d.stage not in ('won', 'lost')) then
        insert into public.deals (lead_id, title, value_cop, stage, probability, expected_close, owner_id)
        values ((ctx ->> 'lead_id')::uuid,
                left(public.automation_render(coalesce(nullif(act ->> 'title', ''), '{empresa} · {nombre}'), ctx), 160),
                greatest(0, coalesce((act ->> 'value')::bigint, (ctx ->> 'valor')::bigint, 0)),
                'prospecting', 20, current_date + coalesce((act ->> 'close_days')::int, 30),
                nullif(ctx ->> 'owner', '')::uuid);
      end if;
      done := done || jsonb_build_object('type', 'deal');

    when 'webhook' then
      if coalesce(act ->> 'url', '') ~ '^https://' then
        select net.http_post(
          url := act ->> 'url',
          body := jsonb_build_object('rule', p_rule.name, 'rule_id', p_rule.id, 'trigger', p_rule.trigger, 'entity', p_entity,
                                     'data', ctx - 'email_token' - 'owner', 'sent_at', now()),
          headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'Engynex-Automations'),
          timeout_milliseconds := 5000)
          into req;
        done := done || jsonb_build_object('type', 'webhook', 'request', req);
      end if;
    else
      null;
    end case;
  end loop;
  return done;
end;
$$;
revoke all on function public.automation_apply(public.automation_rules, text, jsonb) from public, anon, authenticated;

-- Ejecuta (o deja en espera si la regla tiene retraso) una sola vez por run_key.
create or replace function public.automation_run(p_rule public.automation_rules, p_entity text, p_id text, p_run_key text, p_now boolean default false)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ctx jsonb := public.automation_context(p_entity, p_id);
  run_id bigint;
  done jsonb := '[]'::jsonb;
begin
  if ctx is null or not public.automation_matches(p_rule.conditions, ctx) then
    return false;
  end if;

  if p_rule.delay_minutes > 0 and not p_now then
    insert into public.automation_pending (rule_id, entity, entity_id, run_key, due_at)
    values (p_rule.id, p_entity, p_id, p_run_key, now() + make_interval(mins => p_rule.delay_minutes))
    on conflict (rule_id, run_key) do nothing;
    return false;
  end if;

  if p_rule.max_per_day is not null and (
       select count(*) from public.automation_runs r
        where r.rule_id = p_rule.id and r.created_at >= date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota'
     ) >= p_rule.max_per_day then
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
    done := public.automation_apply(p_rule, p_entity, ctx);
    update public.automation_runs set detail = jsonb_build_object('actions', done) where id = run_id;
  exception when others then
    update public.automation_runs set status = 'failed', detail = jsonb_build_object('error', sqlerrm) where id = run_id;
  end;

  update public.automation_rules set runs = runs + 1, last_run_at = now() where id = p_rule.id;
  return true;
end;
$$;
revoke all on function public.automation_run(public.automation_rules, text, text, text, boolean) from public, anon, authenticated;

-- Compatibilidad: el nombre de siempre.
create or replace function public.automation_execute(p_rule public.automation_rules, p_entity text, p_id text, p_run_key text)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  select public.automation_run(p_rule, p_entity, p_id, p_run_key, false)
$$;
revoke all on function public.automation_execute(public.automation_rules, text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Disparadores instantáneos
-- -----------------------------------------------------------------------------

create or replace function public.automation_stamp()
returns text
language sql
stable
set search_path = ''
as $$
  select to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS')
$$;

create or replace function public.automations_on_lead()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.automation_fire('lead_created', 'lead', new.id::text, 'created');
    return new;
  end if;
  if new.status is distinct from old.status then
    perform public.automation_fire('lead_status_changed', 'lead', new.id::text, 'st:' || new.status || ':' || public.automation_stamp());
    if new.status = 'won' then
      perform public.automation_fire('lead_won', 'lead', new.id::text, 'won');
    elsif new.status = 'lost' then
      perform public.automation_fire('lead_lost', 'lead', new.id::text, 'lost:' || public.automation_stamp());
    end if;
  end if;
  if new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to then
    perform public.automation_fire('lead_assigned', 'lead', new.id::text, 'as:' || new.assigned_to || ':' || public.automation_stamp());
  end if;
  return new;
end;
$$;
drop trigger if exists zz_automations on public.leads;
create trigger zz_automations after insert or update of status, assigned_to on public.leads
  for each row execute function public.automations_on_lead();

create or replace function public.automations_on_appointment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.automation_fire('appointment_booked', 'appointment', new.id::text, 'booked');
  elsif new.status is distinct from old.status then
    if new.status = 'cancelled' then
      perform public.automation_fire('appointment_cancelled', 'appointment', new.id::text, 'cancelled');
    elsif new.status = 'done' then
      perform public.automation_fire('appointment_done', 'appointment', new.id::text, 'done');
    elsif new.status = 'no_show' then
      perform public.automation_fire('appointment_no_show', 'appointment', new.id::text, 'no_show');
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists zz_automations on public.appointments;
create trigger zz_automations after insert or update of status on public.appointments
  for each row execute function public.automations_on_appointment();

create or replace function public.automations_on_ticket()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.automation_fire('ticket_created', 'ticket', new.id::text, 'created');
    return new;
  end if;
  if new.status is distinct from old.status then
    if new.status = 'resolved' then
      perform public.automation_fire('ticket_resolved', 'ticket', new.id::text, 'resolved:' || public.automation_stamp());
    elsif new.status in ('open', 'in_progress') and old.status in ('resolved', 'closed') then
      perform public.automation_fire('ticket_reopened', 'ticket', new.id::text, 'reopened:' || public.automation_stamp());
    end if;
  end if;
  if new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to then
    perform public.automation_fire('ticket_assigned', 'ticket', new.id::text, 'as:' || new.assigned_to || ':' || public.automation_stamp());
  end if;
  if new.csat_rating is not null and new.csat_rating is distinct from old.csat_rating then
    perform public.automation_fire('ticket_rated', 'ticket', new.id::text, 'rated:' || public.automation_stamp());
  end if;
  return new;
end;
$$;
drop trigger if exists zz_automations on public.tickets;
create trigger zz_automations after insert or update of status, assigned_to, csat_rating on public.tickets
  for each row execute function public.automations_on_ticket();

create or replace function public.automations_on_ticket_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.author_kind = 'staff' and not new.internal then
    perform public.automation_fire('ticket_staff_reply', 'ticket', new.ticket_id::text, 'reply:' || new.id);
  elsif new.author_kind = 'requester' then
    perform public.automation_fire('ticket_customer_reply', 'ticket', new.ticket_id::text, 'creply:' || new.id);
  end if;
  return new;
end;
$$;

create or replace function public.automations_on_chat()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.automation_fire('chat_started', 'chat', new.id::text, 'started');
    return new;
  end if;
  if new.status = 'closed' and old.status is distinct from 'closed' then
    perform public.automation_fire('chat_closed', 'chat', new.id::text, 'closed:' || public.automation_stamp());
  end if;
  if new.rating is not null and new.rating is distinct from old.rating then
    perform public.automation_fire('chat_rated', 'chat', new.id::text, 'rated:' || public.automation_stamp());
  end if;
  return new;
end;
$$;
drop trigger if exists zz_automations on public.chat_conversations;
create trigger zz_automations after insert or update of status, rating on public.chat_conversations
  for each row execute function public.automations_on_chat();

create or replace function public.automations_on_task()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.done and not old.done then
    perform public.automation_fire('task_completed', 'task', new.id::text, 'done:' || public.automation_stamp());
  end if;
  return new;
end;
$$;
create trigger zz_automations after update of done on public.tasks
  for each row execute function public.automations_on_task();

create or replace function public.automations_on_deal()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.automation_fire('deal_created', 'deal', new.id::text, 'created');
  elsif new.stage is distinct from old.stage then
    perform public.automation_fire('deal_stage_changed', 'deal', new.id::text, 'st:' || new.stage || ':' || public.automation_stamp());
  end if;
  return new;
end;
$$;
create trigger zz_automations after insert or update of stage on public.deals
  for each row execute function public.automations_on_deal();

create or replace function public.automations_on_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind in ('client', 'provider') then
    perform public.automation_fire('account_created', 'account', new.id::text, 'created');
  end if;
  return new;
end;
$$;
create trigger zz_automations after insert on public.profiles
  for each row execute function public.automations_on_account();

create or replace function public.automations_on_document()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.automation_fire('document_uploaded', 'account', new.owner_id::text, 'doc:' || new.id);
  return new;
end;
$$;
create trigger zz_automations after insert on public.documents
  for each row execute function public.automations_on_document();

create or replace function public.automations_on_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.lead_id is null then
    return new;
  end if;
  if new.clicked_at is not null and old.clicked_at is null then
    perform public.automation_fire('email_clicked', 'lead', new.lead_id::text, 'click:' || new.id);
  end if;
  if new.bounced_at is not null and old.bounced_at is null then
    perform public.automation_fire('email_bounced', 'lead', new.lead_id::text, 'bounce:' || new.id);
  end if;
  return new;
end;
$$;
create trigger zz_automations after update of clicked_at, bounced_at on public.email_queue
  for each row execute function public.automations_on_email();

-- -----------------------------------------------------------------------------
-- Disparadores por tiempo + ejecuciones en espera (cada 5 minutos)
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
  ok boolean;
begin
  -- 1) Las que estaban esperando su hora.
  for rec in
    delete from public.automation_pending p
     where p.id in (select id from public.automation_pending where due_at <= now() order by due_at limit 500 for update skip locked)
    returning p.*
  loop
    select * into r from public.automation_rules where id = rec.rule_id and enabled;
    if r.id is not null then
      begin
        ok := public.automation_run(r, rec.entity, rec.entity_id, rec.run_key, true);
        if ok then n := n + 1; end if;
      exception when others then
        raise warning 'automatización % falló: %', r.id, sqlerrm;
      end;
    end if;
  end loop;

  -- 2) Reglas por tiempo.
  for r in select * from public.automation_rules where enabled and trigger in (
    'lead_not_contacted', 'lead_stale', 'lead_no_meeting', 'lead_reengage', 'appointment_upcoming', 'appointment_after',
    'ticket_no_reply', 'ticket_sla_breached', 'ticket_waiting_customer', 'chat_unanswered', 'chat_reply_offline',
    'task_overdue', 'deal_close_overdue', 'account_renewal', 'account_inactive'
  ) loop
    minutes := coalesce((r.params ->> 'minutes')::int, 15);
    hours := coalesce((r.params ->> 'hours')::int, 24);
    days := coalesce((r.params ->> 'days')::int, 7);

    begin
      if r.trigger = 'lead_not_contacted' then
        for rec in
          select l.id from public.leads l
           where l.status = 'new' and l.created_at < now() - make_interval(mins => minutes)
             and l.created_at > now() - interval '3 days' and l.created_at > r.created_at
             and not exists (select 1 from public.lead_activities a where a.lead_id = l.id and a.author_id is not null)
        loop
          if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':nc') then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'lead_stale' then
        for rec in
          select l.id, l.last_activity_at from public.leads l
           where l.status in ('new', 'contacted', 'meeting', 'proposal')
             and l.last_activity_at < now() - make_interval(days => days)
             and l.last_activity_at + make_interval(days => days) > r.created_at
        loop
          if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':stale:' || to_char(rec.last_activity_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'lead_no_meeting' then
        for rec in
          select l.id from public.leads l
           where l.status in ('new', 'contacted') and l.created_at < now() - make_interval(days => days)
             and l.created_at + make_interval(days => days) > r.created_at
             and not exists (select 1 from public.appointments a where a.lead_id = l.id)
        loop
          if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':nm') then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'lead_reengage' then
        for rec in
          select l.id, l.last_activity_at from public.leads l
           where l.status = 'lost' and l.last_activity_at < now() - make_interval(days => days)
             and l.last_activity_at + make_interval(days => days) > r.created_at
        loop
          if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':re:' || to_char(rec.last_activity_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'appointment_upcoming' then
        for rec in
          select a.id from public.appointments a
           where a.status = 'scheduled' and a.starts_at > now()
             and a.starts_at <= now() + make_interval(hours => hours)
             and a.created_at < a.starts_at - make_interval(hours => hours)
        loop
          if public.automation_execute(r, 'appointment', rec.id::text, 'appointment:' || rec.id || ':h' || hours) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'appointment_after' then
        for rec in
          select a.id from public.appointments a
           where a.status in ('scheduled', 'done') and a.ends_at < now() - make_interval(hours => hours)
             and a.ends_at > now() - interval '7 days'
             and a.ends_at + make_interval(hours => hours) > r.created_at
        loop
          if public.automation_execute(r, 'appointment', rec.id::text, 'appointment:' || rec.id || ':after' || hours) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'ticket_no_reply' then
        for rec in
          select t.id, coalesce(max(m.created_at) filter (where m.author_kind = 'requester'), t.created_at) as asked_at
            from public.tickets t
            left join public.ticket_messages m on m.ticket_id = t.id
           where t.status in ('open', 'in_progress') and t.created_at > r.created_at and t.merged_into is null
           group by t.id
          having coalesce(max(m.created_at) filter (where m.author_kind = 'requester'), t.created_at) < now() - make_interval(hours => hours)
             and coalesce(max(m.created_at) filter (where m.author_kind = 'staff' and not m.internal), '-infinity')
                 < coalesce(max(m.created_at) filter (where m.author_kind = 'requester'), t.created_at)
        loop
          if public.automation_execute(r, 'ticket', rec.id::text, 'ticket:' || rec.id || ':nr:' || to_char(rec.asked_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'ticket_sla_breached' then
        for rec in
          select t.id, case when t.first_response_at is null and t.first_response_due < now() then 'f' else 'r' end as which
            from public.tickets t
           where t.status in ('open', 'in_progress', 'waiting') and t.merged_into is null and t.created_at > r.created_at
             and ((t.first_response_at is null and t.first_response_due < now()) or t.resolve_due < now())
        loop
          if public.automation_execute(r, 'ticket', rec.id::text, 'ticket:' || rec.id || ':sla:' || rec.which) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'ticket_waiting_customer' then
        for rec in
          select t.id, t.last_activity_at from public.tickets t
           where t.status = 'waiting' and t.last_activity_at < now() - make_interval(days => days)
             and t.last_activity_at + make_interval(days => days) > r.created_at
        loop
          if public.automation_execute(r, 'ticket', rec.id::text, 'ticket:' || rec.id || ':wait:' || to_char(rec.last_activity_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'chat_unanswered' then
        for rec in
          select c.id from public.chat_conversations c
           where c.status = 'open' and c.first_response_at is null
             and c.created_at < now() - make_interval(mins => minutes)
             and c.created_at > now() - interval '2 days' and c.created_at > r.created_at
        loop
          if public.automation_execute(r, 'chat', rec.id::text, 'chat:' || rec.id || ':unanswered') then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'chat_reply_offline' then
        for rec in
          select c.id, max(m.id) as last_reply
            from public.chat_conversations c
            join public.chat_messages m on m.conversation_id = c.id and m.sender = 'agent' and not m.internal
           where c.channel = 'web' and c.email is not null
           group by c.id, c.visitor_seen_at
          having max(m.created_at) < now() - interval '3 minutes'
             and max(m.created_at) > now() - interval '2 days'
             and c.visitor_seen_at < max(m.created_at)
             and max(m.created_at) > r.created_at
        loop
          if public.automation_execute(r, 'chat', rec.id::text, 'chat:' || rec.id || ':offline:' || rec.last_reply) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'task_overdue' then
        for rec in
          select t.id, t.due_at from public.tasks t
           where not t.done and t.due_at < now() - make_interval(mins => minutes)
             and t.due_at + make_interval(mins => minutes) > r.created_at
             and t.due_at > now() - interval '30 days'
        loop
          if public.automation_execute(r, 'task', rec.id::text, 'task:' || rec.id || ':od:' || to_char(rec.due_at, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'deal_close_overdue' then
        for rec in
          select d.id, d.expected_close from public.deals d
           where d.stage not in ('won', 'lost') and d.expected_close is not null
             and d.expected_close < (now() at time zone 'America/Bogota')::date - days
             and d.expected_close + days >= (r.created_at at time zone 'America/Bogota')::date
        loop
          if public.automation_execute(r, 'deal', rec.id::text, 'deal:' || rec.id || ':co:' || rec.expected_close) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'account_renewal' then
        for rec in
          select d.profile_id, d.renewal_date from public.account_details d
            join public.profiles p on p.id = d.profile_id and p.active
           where d.stage <> 'churned' and d.renewal_date is not null
             and d.renewal_date between (now() at time zone 'America/Bogota')::date
                                    and (now() at time zone 'America/Bogota')::date + days
        loop
          if public.automation_execute(r, 'account', rec.profile_id::text, 'account:' || rec.profile_id || ':rn:' || rec.renewal_date || ':' || days) then n := n + 1; end if;
        end loop;

      elsif r.trigger = 'account_inactive' then
        for rec in
          select p.id, coalesce(p.last_seen_at, p.created_at) as seen from public.profiles p
            join public.account_details d on d.profile_id = p.id
           where p.kind = 'client' and p.active and d.stage in ('onboarding', 'active')
             and coalesce(p.last_seen_at, p.created_at) < now() - make_interval(days => days)
             and coalesce(p.last_seen_at, p.created_at) + make_interval(days => days) > r.created_at
        loop
          if public.automation_execute(r, 'account', rec.id::text, 'account:' || rec.id || ':in:' || to_char(rec.seen, 'YYYYMMDDHH24MI')) then n := n + 1; end if;
        end loop;
      end if;
    exception when others then
      raise warning 'automatización % falló: %', r.id, sqlerrm;
    end;
  end loop;
  return n;
end;
$$;
revoke all on function public.automations_tick() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Desde el portal: vista previa, ejecución manual, estadísticas
-- -----------------------------------------------------------------------------

-- Entidad de cada disparador.
create or replace function public.automation_entity(p_trigger text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_trigger like 'lead_%' or p_trigger like 'email_%' then 'lead'
    when p_trigger like 'appointment_%' then 'appointment'
    when p_trigger like 'ticket_%' then 'ticket'
    when p_trigger like 'chat_%' then 'chat'
    when p_trigger like 'task_%' then 'task'
    when p_trigger like 'deal_%' then 'deal'
    else 'account' end
$$;

-- Vista previa sobre un elemento real: ¿cumple? y cómo quedan los textos.
-- No ejecuta nada. Recibe la regla como JSON (lo que hay en el editor).
create or replace function public.automation_preview(p_rule jsonb, p_entity_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_entity text := public.automation_entity(p_rule ->> 'trigger');
  ctx jsonb;
  act jsonb;
  out jsonb := '[]'::jsonb;
begin
  if not public.has_role(array['admin', 'marketing', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  ctx := public.automation_context(v_entity, p_entity_id);
  if ctx is null then
    return jsonb_build_object('found', false);
  end if;
  for act in select * from jsonb_array_elements(coalesce(p_rule -> 'actions', '[]'::jsonb)) loop
    out := out || jsonb_build_object(
      'type', act ->> 'type',
      'title', public.automation_render(coalesce(act ->> 'title', act ->> 'subject', ''), ctx),
      'body', public.automation_render(coalesce(act ->> 'body', ''), ctx));
  end loop;
  return jsonb_build_object(
    'found', true, 'entity', v_entity,
    'matches', public.automation_matches(coalesce(p_rule -> 'conditions', '{}'::jsonb), ctx),
    'vars', ctx - 'email_token' - 'owner' - 'opted_out',
    'actions', out);
end;
$$;
revoke all on function public.automation_preview(jsonb, text) from public, anon;
grant execute on function public.automation_preview(jsonb, text) to authenticated;

-- Elementos recientes para elegir en la vista previa.
create or replace function public.automation_samples(p_trigger text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_entity text := public.automation_entity(p_trigger);
begin
  if not public.has_role(array['admin', 'marketing', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce(case v_entity
    when 'lead' then (select jsonb_agg(jsonb_build_object('id', id, 'label', name || coalesce(' · ' || company, ''))) from (select * from public.leads order by created_at desc limit 15) x)
    when 'appointment' then (select jsonb_agg(jsonb_build_object('id', a.id, 'label', l.name || ' · ' || to_char(a.starts_at at time zone 'America/Bogota', 'DD/MM HH24:MI'))) from (select * from public.appointments order by starts_at desc limit 15) a join public.leads l on l.id = a.lead_id)
    when 'ticket' then (select jsonb_agg(jsonb_build_object('id', id, 'label', '#' || number || ' · ' || subject)) from (select * from public.tickets order by created_at desc limit 15) x)
    when 'chat' then (select jsonb_agg(jsonb_build_object('id', id, 'label', name || ' · ' || channel)) from (select * from public.chat_conversations order by created_at desc limit 15) x)
    when 'task' then (select jsonb_agg(jsonb_build_object('id', id, 'label', title)) from (select * from public.tasks order by created_at desc limit 15) x)
    when 'deal' then (select jsonb_agg(jsonb_build_object('id', id, 'label', title)) from (select * from public.deals order by created_at desc limit 15) x)
    else (select jsonb_agg(jsonb_build_object('id', id, 'label', coalesce(full_name, email) || coalesce(' · ' || company, ''))) from (select * from public.profiles where kind in ('client', 'provider') order by created_at desc limit 15) x)
  end, '[]'::jsonb);
end;
$$;
revoke all on function public.automation_samples(text) from public, anon;
grant execute on function public.automation_samples(text) to authenticated;

-- Ejecutar ya una regla sobre un elemento (sin esperar y aunque ya haya corrido).
create or replace function public.automation_run_manual(p_rule uuid, p_entity_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.automation_rules;
  ok boolean;
begin
  if not public.has_role(array['admin', 'marketing']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into r from public.automation_rules where id = p_rule;
  if r.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  ok := public.automation_run(r, public.automation_entity(r.trigger), p_entity_id, 'manual:' || p_entity_id || ':' || public.automation_stamp(), true);
  return jsonb_build_object('ran', ok, 'run', (select to_jsonb(x) from public.automation_runs x where x.rule_id = r.id order by x.id desc limit 1));
end;
$$;
revoke all on function public.automation_run_manual(uuid, text) from public, anon;
grant execute on function public.automation_run_manual(uuid, text) to authenticated;

-- Estadísticas: por día y por regla.
create or replace function public.automation_stats(p_days integer default 30, p_rule uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 1), 365);
  since timestamptz := (date_trunc('day', now() at time zone 'America/Bogota') - make_interval(days => d - 1)) at time zone 'America/Bogota';
begin
  if not public.has_role(array['admin', 'marketing', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total', (select count(*) from public.automation_runs where created_at >= since and (p_rule is null or rule_id = p_rule)),
    'failed', (select count(*) from public.automation_runs where created_at >= since and status = 'failed' and (p_rule is null or rule_id = p_rule)),
    'pending', (select count(*) from public.automation_pending where p_rule is null or rule_id = p_rule),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'day', g::date,
               'done', (select count(*) from public.automation_runs r where r.status = 'done' and (r.created_at at time zone 'America/Bogota')::date = g::date and (p_rule is null or r.rule_id = p_rule)),
               'failed', (select count(*) from public.automation_runs r where r.status = 'failed' and (r.created_at at time zone 'America/Bogota')::date = g::date and (p_rule is null or r.rule_id = p_rule))
             ) order by g)
        from generate_series((since at time zone 'America/Bogota')::date, (now() at time zone 'America/Bogota')::date, interval '1 day') g
    ),
    'by_rule', coalesce((
      select jsonb_agg(jsonb_build_object('rule_id', rule_id, 'runs', n, 'failed', f) order by n desc)
        from (select rule_id, count(*) n, count(*) filter (where status = 'failed') f
                from public.automation_runs where created_at >= since and (p_rule is null or rule_id = p_rule) group by rule_id) x
    ), '[]'::jsonb),
    'by_action', coalesce((
      select jsonb_object_agg(t, n) from (
        select a ->> 'type' t, count(*) n
          from public.automation_runs r, jsonb_array_elements(coalesce(r.detail -> 'actions', '[]'::jsonb)) a
         where r.created_at >= since and (p_rule is null or r.rule_id = p_rule)
         group by 1) x
    ), '{}'::jsonb)
  );
end;
$$;
revoke all on function public.automation_stats(integer, uuid) from public, anon;
grant execute on function public.automation_stats(integer, uuid) to authenticated;

-- Duplicar una regla (queda pausada).
create or replace function public.automation_duplicate(p_rule uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.has_role(array['admin', 'marketing']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.automation_rules (name, description, trigger, params, conditions, actions, enabled, delay_minutes, max_per_day, folder, created_by)
  select left(name || ' (copia)', 120), description, trigger, params, conditions, actions, false, delay_minutes, max_per_day, folder, auth.uid()
    from public.automation_rules where id = p_rule
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.automation_duplicate(uuid) from public, anon;
grant execute on function public.automation_duplicate(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Carpetas de las reglas que ya existían
-- -----------------------------------------------------------------------------

update public.automation_rules set folder = case
  when trigger like 'lead_%' or trigger like 'email_%' or trigger like 'deal_%' then 'Ventas'
  when trigger like 'appointment_%' then 'Reuniones'
  when trigger like 'ticket_%' then 'Soporte'
  when trigger like 'chat_%' then 'Chat'
  when trigger like 'task_%' then 'Tareas'
  else 'Clientes' end
where folder is null;

-- -----------------------------------------------------------------------------
-- Reglas listas para usar. Las internas (avisos, tareas, asignaciones) quedan
-- activas; las que escriben al cliente quedan en pausa para revisarlas antes.
-- -----------------------------------------------------------------------------

insert into public.automation_rules (template_key, folder, name, description, trigger, params, conditions, actions, enabled, delay_minutes, created_by) values
-- Ventas
('yellow_assign', 'Ventas', 'Lead amarillo: asignar y crear tarea',
 'Reparte los leads amarillos y deja una tarea de llamada para el mismo día.',
 'lead_created', '{}', '{"tiers":["yellow"]}',
 '[{"type":"assign","roles":["sales","admin"]},{"type":"task","assign_to":"owner","title":"Llamar a {nombre} ({empresa})","due_minutes":240,"priority":"high","task_type":"call"}]', true, 0, null),
('lead_after_hours', 'Ventas', 'Lead fuera de horario: respuesta automática',
 'Si el lead llega de noche o el fin de semana, le confirmamos que lo contactaremos el siguiente día hábil.',
 'lead_created', '{}', '{"outside_hours":true}',
 '[{"type":"email","to":"contact","subject":"Recibimos tu solicitud, {primer_nombre}","body":"Hola {primer_nombre}, gracias por escribirnos.\n\nNuestro equipo atiende de lunes a viernes de 8:00 a. m. a 6:00 p. m. (hora de Colombia). Te contactaremos el siguiente día hábil.\n\nSi prefieres, puedes elegir de una vez el día y la hora para conversar.","cta_label":"Agendar una reunión","cta_url":"https://engynex.com/es/agendar"}]', false, 0, null),
('lead_assigned_notify', 'Ventas', 'Aviso al asesor cuando le asignan un lead',
 'El asesor recibe una notificación con el enlace al lead.',
 'lead_assigned', '{}', '{}',
 '[{"type":"notify","to":"owner","kind":"lead","title":"Te asignaron a {nombre}","body":"{empresa} · color {color} · puntaje {puntaje}"}]', true, 0, null),
('lead_no_meeting_3d', 'Ventas', 'Lead verde sin reunión en 3 días',
 'Tarea para el asesor e invitación a agendar si un lead verde no tiene reunión.',
 'lead_no_meeting', '{"days":3}', '{"tiers":["green"]}',
 '[{"type":"task","assign_to":"owner","title":"Conseguir reunión con {nombre}","due_minutes":1440,"priority":"high","task_type":"follow_up"},{"type":"notify","to":"owner","kind":"lead","title":"{nombre} sigue sin reunión","body":"Lead verde de hace 3 días. Envíale el enlace de la agenda."}]', true, 0, null),
('lead_proposal_followup', 'Ventas', 'Propuesta sin respuesta en 5 días',
 'Tarea para hacer seguimiento a la propuesta enviada.',
 'lead_stale', '{"days":5}', '{"statuses":["proposal"]}',
 '[{"type":"task","assign_to":"owner","title":"Seguimiento a la propuesta de {nombre}","due_minutes":1440,"priority":"high","task_type":"call"},{"type":"note","body":"Propuesta sin respuesta hace 5 días: se creó una tarea de seguimiento."}]', true, 0, null),
('lead_won_deal', 'Ventas', 'Venta ganada: bienvenida y tarea de inicio',
 'Correo de bienvenida al cliente y tarea para el arranque del proyecto.',
 'lead_won', '{}', '{}',
 '[{"type":"email","to":"contact","subject":"¡Bienvenido a Engynex, {primer_nombre}!","body":"Hola {primer_nombre},\n\nGracias por confiar en nosotros. En las próximas 24 horas tu asesor {asesor} te escribirá para coordinar el arranque.\n\nMientras tanto, cualquier duda puedes responder este correo."},{"type":"task","assign_to":"owner","title":"Reunión de arranque con {nombre}","due_minutes":1440,"priority":"high","task_type":"meeting"},{"type":"followup","mode":"stop"}]', false, 0, null),
('lead_lost_reason', 'Ventas', 'Venta perdida: registrar motivo',
 'Recuerda al asesor dejar el motivo de la pérdida y detiene los seguimientos.',
 'lead_lost', '{}', '{}',
 '[{"type":"followup","mode":"stop"},{"type":"task","assign_to":"owner","title":"Registrar por qué perdimos a {nombre}","due_minutes":1440,"priority":"low","task_type":"other"}]', true, 0, null),
('lead_reengage_90', 'Ventas', 'Recuperar leads perdidos a los 90 días',
 'Correo amable para retomar la conversación con leads perdidos hace 3 meses.',
 'lead_reengage', '{"days":90}', '{}',
 '[{"type":"email","to":"contact","subject":"¿Cómo va todo, {primer_nombre}?","body":"Hola {primer_nombre},\n\nHace un tiempo conversamos sobre {problema}. Quería saber cómo les ha ido y si hay algo en lo que podamos ayudar ahora.\n\nSi te sirve, agenda 20 minutos y lo revisamos sin compromiso.","cta_label":"Agendar una llamada","cta_url":"https://engynex.com/es/agendar"},{"type":"note","body":"Se envió el correo de recuperación (90 días después de perdido)."}]', false, 0, null),
('email_clicked_hot', 'Ventas', 'Lead hizo clic en un correo: avisar',
 'Señal de interés: el asesor recibe un aviso para llamar mientras está caliente.',
 'email_clicked', '{}', '{"statuses":["new","contacted","proposal"]}',
 '[{"type":"notify","to":"owner","kind":"lead","title":"🔥 {nombre} abrió el enlace de tu correo","body":"Buen momento para llamar: {telefono}"}]', true, 0, null),
('email_bounced_fix', 'Ventas', 'Correo rebotado: corregir el dato',
 'Si un correo rebota, se crea una tarea para conseguir el correo correcto.',
 'email_bounced', '{}', '{}',
 '[{"type":"task","assign_to":"owner","title":"Corregir el correo de {nombre} (rebotó)","due_minutes":1440,"priority":"medium","task_type":"call"},{"type":"followup","mode":"stop"}]', true, 0, null),
('deal_big_notify', 'Ventas', 'Negocio grande creado: avisar a gerencia',
 'Avisa a gerencia cuando se crea un negocio de 20 millones o más.',
 'deal_created', '{}', '{"min_value":20000000}',
 '[{"type":"notify","to":"roles","roles":["admin"],"kind":"lead","title":"💼 Negocio grande: {titulo}","body":"{empresa} · {valor} COP · asesor {asesor}"}]', true, 0, null),
('deal_overdue', 'Ventas', 'Negocio con fecha de cierre vencida',
 'Tarea para actualizar la fecha o la etapa de un negocio atrasado.',
 'deal_close_overdue', '{"days":1}', '{}',
 '[{"type":"task","assign_to":"owner","title":"Actualizar el negocio «{titulo}» (cierre vencido)","due_minutes":1440,"priority":"medium","task_type":"follow_up"}]', true, 0, null),
-- Reuniones
('meeting_reminder_1h_wa', 'Reuniones', 'Recordatorio 1 hora antes (equipo)',
 'Aviso al asesor una hora antes de la reunión.',
 'appointment_upcoming', '{"hours":1}', '{}',
 '[{"type":"notify","to":"owner","kind":"meeting","title":"📅 En 1 hora: reunión con {nombre}","body":"{fecha} · {canal}"}]', true, 0, null),
('meeting_cancelled', 'Reuniones', 'Reunión cancelada: reprogramar',
 'Le enviamos al cliente el enlace para elegir otro horario y avisamos al asesor.',
 'appointment_cancelled', '{}', '{}',
 '[{"type":"notify","to":"owner","kind":"meeting","title":"Se canceló la reunión con {nombre}","body":"{fecha}"},{"type":"email","to":"contact","subject":"Reprogramemos tu reunión, {primer_nombre}","body":"Hola {primer_nombre}, vimos que la reunión del {fecha} se canceló.\n\nElige el horario que mejor te quede y la retomamos.","cta_label":"Elegir otro horario","cta_url":"{enlace_agenda}"}]', false, 0, null),
('meeting_no_show', 'Reuniones', 'No asistió: tarea y correo',
 'Tarea para llamar y correo para reagendar cuando el cliente no se conecta.',
 'appointment_no_show', '{}', '{}',
 '[{"type":"task","assign_to":"owner","title":"Llamar a {nombre}: no asistió a la reunión","due_minutes":240,"priority":"high","task_type":"call"},{"type":"email","to":"contact","subject":"Te esperamos hoy, {primer_nombre}","body":"Hola {primer_nombre}, hoy no pudimos conectarnos. ¿Elegimos otro horario?","cta_label":"Reagendar","cta_url":"{enlace_agenda}"}]', false, 0, null),
('meeting_done_thanks', 'Reuniones', 'Después de la reunión: agradecer y proponer siguiente paso',
 'Correo de agradecimiento 2 horas después de una reunión realizada.',
 'appointment_done', '{}', '{}',
 '[{"type":"email","to":"contact","subject":"Gracias por tu tiempo, {primer_nombre}","body":"Hola {primer_nombre},\n\nGracias por la reunión de hoy. En breve te compartimos el resumen y la propuesta con los siguientes pasos.\n\nCualquier duda, responde este correo."}]', false, 120, null),
('meeting_outcome', 'Reuniones', 'Registrar el resultado de la reunión',
 'Si 2 horas después la reunión sigue sin cerrar, se crea una tarea para registrar el resultado.',
 'appointment_after', '{"hours":2}', '{}',
 '[{"type":"task","assign_to":"owner","title":"Registrar el resultado de la reunión con {nombre}","due_minutes":240,"priority":"medium","task_type":"follow_up"}]', true, 0, null),
-- Soporte
('ticket_critical_priority', 'Soporte', 'Solicitud crítica: asignar y avisar al instante',
 'Asigna por turnos en soporte y avisa a gerencia.',
 'ticket_created', '{}', '{"priorities":["critical"]}',
 '[{"type":"assign","roles":["support"]},{"type":"notify","to":"roles","roles":["admin"],"kind":"ticket","title":"🚨 Crítica #{numero}: {asunto}","body":"{nombre} · {empresa}"},{"type":"tag","tag":"urgente"}]', true, 0, null),
('ticket_received_email', 'Soporte', 'Confirmación de recibido al cliente',
 'Correo al cliente con el número de su solicitud.',
 'ticket_created', '{}', '{}',
 '[{"type":"email","to":"contact","subject":"Recibimos tu solicitud #{numero}","body":"Hola {primer_nombre},\n\nRecibimos tu solicitud «{asunto}» con prioridad {prioridad}. Te responderemos por este medio y en tu portal.","cta_label":"Ver la solicitud","cta_url":"{enlace_cliente}"}]', false, 0, null),
('ticket_customer_reply_notify', 'Soporte', 'El cliente respondió: avisar al responsable',
 'Aviso inmediato cuando el cliente escribe en su solicitud.',
 'ticket_customer_reply', '{}', '{}',
 '[{"type":"notify","to":"owner","roles":["support","admin"],"kind":"ticket","title":"💬 {nombre} respondió en #{numero}","body":"{ultimo_mensaje}"}]', true, 0, null),
('ticket_sla_alert', 'Soporte', 'SLA vencido: avisar a gerencia',
 'Además del aviso al responsable, gerencia sabe qué solicitudes van tarde.',
 'ticket_sla_breached', '{}', '{"priorities":["critical","high"]}',
 '[{"type":"notify","to":"roles","roles":["admin"],"kind":"ticket","title":"⏱️ #{numero} fuera de tiempo","body":"{asunto} · responsable {asesor}"}]', true, 0, null),
('ticket_waiting_reminder', 'Soporte', 'Esperando al cliente 3 días: recordatorio',
 'Correo al cliente si lleva 3 días sin responder lo que le pedimos.',
 'ticket_waiting_customer', '{"days":3}', '{}',
 '[{"type":"email","to":"contact","subject":"¿Seguimos con tu solicitud #{numero}?","body":"Hola {primer_nombre}, quedamos atentos a tu respuesta para avanzar con «{asunto}».\n\nSi ya no lo necesitas, no hace falta responder: la cerraremos en unos días.","cta_label":"Responder","cta_url":"{enlace_cliente}"}]', false, 0, null),
('ticket_low_csat', 'Soporte', 'Calificación baja: tarea de recuperación',
 'Si el cliente califica con 1 o 2, gerencia recibe una tarea para llamarlo.',
 'ticket_rated', '{}', '{"max_rating":2}',
 '[{"type":"task","assign_to":"owner","title":"Llamar a {nombre}: calificó #{numero} con {calificacion}/5","body":"Comentario: {comentario}","due_minutes":1440,"priority":"high","task_type":"call"},{"type":"notify","to":"roles","roles":["admin"],"kind":"ticket","title":"😟 #{numero} calificada con {calificacion}/5","body":"{comentario}"},{"type":"stage","stage":"at_risk"}]', true, 0, null),
('ticket_reopened_notify', 'Soporte', 'Solicitud reabierta: avisar',
 'Avisa al responsable cuando una solicitud resuelta vuelve a abrirse.',
 'ticket_reopened', '{}', '{}',
 '[{"type":"notify","to":"owner","roles":["support","admin"],"kind":"ticket","title":"↩️ Se reabrió #{numero}","body":"{asunto}"}]', true, 0, null),
-- Chat
('chat_after_hours', 'Chat', 'Chat fuera de horario: etiquetar y crear tarea',
 'Conversaciones fuera de horario quedan etiquetadas y con tarea para el día siguiente.',
 'chat_started', '{}', '{"outside_hours":true}',
 '[{"type":"tag","tag":"fuera-de-horario"},{"type":"task","assign_to":"owner","title":"Responder el chat de {nombre}","due_minutes":720,"priority":"medium","task_type":"follow_up"}]', false, 0, null),
('chat_low_rating', 'Chat', 'Chat con calificación baja',
 'Gerencia recibe un aviso para revisar la conversación.',
 'chat_rated', '{}', '{"max_rating":2}',
 '[{"type":"notify","to":"roles","roles":["admin"],"kind":"chat","title":"😟 Chat calificado con {calificacion}/5: {nombre}","body":"{comentario}"}]', true, 0, null),
-- Tareas
('task_overdue_notify', 'Tareas', 'Tarea vencida: recordar al responsable',
 'Aviso una hora después del vencimiento.',
 'task_overdue', '{"minutes":60}', '{}',
 '[{"type":"notify","to":"owner","kind":"task","title":"⏰ Tarea vencida: {titulo}","body":"Venció el {vence}"}]', true, 0, null),
('task_overdue_escalate', 'Tareas', 'Tarea urgente vencida un día: escalar',
 'Si una tarea urgente o alta lleva un día vencida, avisa a gerencia.',
 'task_overdue', '{"minutes":1440}', '{"priorities":["urgent","high"]}',
 '[{"type":"notify","to":"roles","roles":["admin"],"kind":"task","title":"Tarea atrasada de {asesor}: {titulo}","body":"Venció el {vence}"}]', true, 0, null),
-- Clientes
('account_welcome', 'Clientes', 'Cliente nuevo: bienvenida al portal',
 'Etapa de incorporación, tarea de llamada de bienvenida y correo con el acceso al portal.',
 'account_created', '{}', '{"kinds":["client"]}',
 '[{"type":"stage","stage":"onboarding"},{"type":"assign","roles":["sales","admin"]},{"type":"task","assign_to":"owner","title":"Llamada de bienvenida a {nombre}","due_minutes":1440,"priority":"high","task_type":"call"}]', true, 0, null),
('account_renewal_30', 'Clientes', 'Renovación en 30 días',
 'Tarea para el responsable de la cuenta un mes antes de la renovación.',
 'account_renewal', '{"days":30}', '{}',
 '[{"type":"task","assign_to":"owner","title":"Preparar la renovación de {nombre} ({renovacion})","due_minutes":4320,"priority":"high","task_type":"meeting"},{"type":"notify","to":"owner","kind":"lead","title":"🔁 {nombre} renueva el {renovacion}","body":"Plan {plan} · {valor_mensual} COP al mes"}]', true, 0, null),
('account_inactive_30', 'Clientes', 'Cliente sin entrar al portal en 30 días',
 'Marca la cuenta en riesgo y crea una tarea para contactarlo.',
 'account_inactive', '{"days":30}', '{}',
 '[{"type":"tag","tag":"inactivo"},{"type":"task","assign_to":"owner","title":"Contactar a {nombre}: 30 días sin entrar al portal","due_minutes":2880,"priority":"medium","task_type":"call"}]', true, 0, null),
('document_uploaded_notify', 'Clientes', 'Documento nuevo en una cuenta: avisar',
 'El responsable de la cuenta sabe cuando aparece un documento nuevo.',
 'document_uploaded', '{}', '{}',
 '[{"type":"notify","to":"owner","roles":["admin"],"kind":"lead","title":"📄 Documento nuevo de {nombre}","body":"{documento}"}]', true, 0, null)
on conflict (template_key) do nothing;
