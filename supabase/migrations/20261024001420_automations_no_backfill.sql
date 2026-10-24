-- Las reglas por tiempo solo actúan sobre lo que pase después de crearlas
-- (no rellenan el pasado) y la prioridad del ticket va en español.
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
      'numero', t.number, 'asunto', t.subject, 'priority', t.priority::text,
      'prioridad', case t.priority::text when 'critical' then 'crítica' when 'high' then 'alta' when 'medium' then 'media' else 'baja' end,
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
           and l.created_at > r.created_at
           and not exists (select 1 from public.lead_activities a where a.lead_id = l.id and a.author_id is not null)
      loop
        if public.automation_execute(r, 'lead', rec.id::text, 'lead:' || rec.id || ':nc') then n := n + 1; end if;
      end loop;

    elsif r.trigger = 'lead_stale' then
      for rec in
        select l.id, l.last_activity_at from public.leads l
         where l.status in ('new', 'contacted', 'meeting', 'proposal')
           and l.last_activity_at < now() - make_interval(days => days)
           -- Se volvió inactivo después de crear la regla (no rellena el pasado).
           and l.last_activity_at + make_interval(days => days) > r.created_at
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
         where t.status in ('open', 'in_progress') and t.created_at > r.created_at
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
           and c.created_at > r.created_at
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
           and max(m.created_at) > r.created_at
      loop
        if public.automation_execute(r, 'chat', rec.id::text, 'chat:' || rec.id || ':offline:' || rec.last_reply) then n := n + 1; end if;
      end loop;
    end if;
  end loop;
  return n;
end;
$$;
revoke all on function public.automations_tick() from public, anon, authenticated;
revoke all on function public.automation_context(text, text) from public, anon, authenticated;
