-- =============================================================================
-- Chat en vivo: más funciones
--   notas internas, etiquetas, calificación del visitante, tiempo de primera
--   respuesta, respuesta automática fuera de línea, respuestas guardadas,
--   crear lead desde el chat y métricas.
-- =============================================================================

alter table public.chat_messages
  add column internal boolean not null default false;

alter table public.chat_conversations
  add column tags text[] not null default '{}',
  add column rating smallint check (rating between 1 and 5),
  add column rating_comment text check (char_length(rating_comment) <= 1000),
  add column rated_at timestamptz,
  add column first_response_at timestamptz;

create index chat_conversations_tags_idx on public.chat_conversations using gin (tags);

-- Las notas internas no cambian el resumen ni avisan al visitante.
create or replace function public.chat_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
begin
  if new.internal then
    return new;
  end if;
  update public.chat_conversations
     set last_message = left(new.body, 160),
         last_message_at = new.created_at,
         unread_agent = case when new.sender = 'visitor' then unread_agent + 1 else 0 end,
         agent_seen_at = case when new.sender = 'agent' then now() else agent_seen_at end,
         first_response_at = case when new.sender = 'agent' then coalesce(first_response_at, new.created_at) else first_response_at end
   where id = new.conversation_id
  returning * into conv;

  perform realtime.send(jsonb_build_object('id', new.id), 'message', conv.topic, false);
  return new;
end;
$$;

-- El visitante nunca recibe notas internas; recibe si ya calificó.
create or replace function public.chat_fetch(p_token text, p_after bigint default 0)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
begin
  update public.chat_conversations set visitor_seen_at = now()
   where token_hash = public.chat_hash(p_token)
  returning * into conv;
  if conv.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'topic', conv.topic,
    'status', conv.status,
    'name', conv.name,
    'agent_seen_at', conv.agent_seen_at,
    'rated', conv.rating is not null,
    'has_agent_reply', conv.first_response_at is not null,
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id,
               'sender', m.sender,
               'body', m.body,
               'created_at', m.created_at,
               'agent', case when m.sender = 'agent' then split_part(coalesce(pr.full_name, ''), ' ', 1) end
             ) order by m.id)
      from (
        select * from public.chat_messages
         where conversation_id = conv.id and id > coalesce(p_after, 0) and not internal
         order by id
         limit 200
      ) m
      left join public.profiles pr on pr.id = m.author_id
    ), '[]'::jsonb)
  );
end;
$$;

-- Primer mensaje + aviso automático si no hay asesores conectados.
create or replace function public.chat_offline_notice(p_token text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv_id uuid;
begin
  select id into conv_id from public.chat_conversations
   where token_hash = public.chat_hash(p_token) and first_response_at is null;
  if conv_id is not null and not exists (
    select 1 from public.chat_messages where conversation_id = conv_id and sender = 'system' and body = 'offline_auto'
  ) then
    insert into public.chat_messages (conversation_id, sender, body) values (conv_id, 'system', 'offline_auto');
  end if;
end;
$$;

-- Calificación del visitante (una vez, después de que un asesor respondió).
create or replace function public.chat_rate(p_token text, p_rating integer, p_comment text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_rating not between 1 and 5 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  update public.chat_conversations
     set rating = p_rating,
         rating_comment = left(nullif(btrim(p_comment), ''), 1000),
         rated_at = now()
   where token_hash = public.chat_hash(p_token)
     and rating is null
     and first_response_at is not null;
end;
$$;

-- Respuesta del asesor (o nota interna).
drop function if exists public.chat_agent_send(uuid, text);
create or replace function public.chat_agent_send(p_conversation uuid, p_body text, p_internal boolean default false)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_body text := nullif(btrim(p_body), '');
  conv public.chat_conversations;
  new_id bigint;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if conv.channel = 'whatsapp' and not coalesce(p_internal, false) then
    raise exception 'use_whatsapp_api' using errcode = 'P0001';
  end if;

  if not coalesce(p_internal, false) then
    update public.chat_conversations
       set assigned_to = coalesce(assigned_to, auth.uid()), status = 'open', closed_at = null
     where id = p_conversation;
  end if;

  insert into public.chat_messages (conversation_id, sender, author_id, body, internal)
  values (p_conversation, 'agent', auth.uid(), left(v_body, 2000), coalesce(p_internal, false))
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.chat_agent_send(uuid, text, boolean) from public, anon;
grant execute on function public.chat_agent_send(uuid, text, boolean) to authenticated;

-- Etiquetas: se agregan a lo que ya permitía chat_agent_update.
create or replace function public.chat_agent_update(p_conversation uuid, p jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if p ? 'status' and p ->> 'status' in ('open', 'closed') and p ->> 'status' <> conv.status then
    update public.chat_conversations
       set status = p ->> 'status',
           closed_at = case when p ->> 'status' = 'closed' then now() end
     where id = conv.id;
    insert into public.chat_messages (conversation_id, sender, author_id, body)
    values (conv.id, 'system', auth.uid(), case when p ->> 'status' = 'closed' then 'agent_closed' else 'agent_reopened' end);
  end if;

  if p ? 'assigned_to' then
    update public.chat_conversations set assigned_to = nullif(p ->> 'assigned_to', '')::uuid where id = conv.id;
  end if;

  if p ? 'tags' and jsonb_typeof(p -> 'tags') = 'array' then
    update public.chat_conversations
       set tags = (select coalesce(array_agg(distinct left(lower(btrim(x)), 30)), '{}')
                     from jsonb_array_elements_text(p -> 'tags') x where btrim(x) <> '')
     where id = conv.id;
  end if;

  if p ? 'lead_id' then
    update public.chat_conversations set lead_id = nullif(p ->> 'lead_id', '')::uuid where id = conv.id;
    if nullif(p ->> 'lead_id', '') is not null then
      insert into public.lead_activities (lead_id, author_id, type, body, meta)
      values ((p ->> 'lead_id')::uuid, auth.uid(), 'chat', conv.last_message, jsonb_build_object('conversation_id', conv.id));
    end if;
  end if;
end;
$$;

-- Crear un lead desde la conversación, con el mismo puntaje del formulario.
create or replace function public.chat_create_lead(p_conversation uuid, p jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  v_text text;
  result jsonb;
  new_id uuid;
  v_email text := lower(nullif(btrim(p ->> 'email'), ''));
  v_phone text := nullif(btrim(p ->> 'phone'), '');
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if conv.lead_id is not null then
    return conv.lead_id;
  end if;
  v_email := coalesce(v_email, conv.email);
  v_phone := coalesce(v_phone, conv.phone);
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or v_phone is null then
    raise exception 'contact_required' using errcode = '22023';
  end if;
  if coalesce(p ->> 'problem_category', '') not in ('sales', 'web', 'automation', 'system', 'support', 'other', 'none')
     or coalesce(p ->> 'budget', '') not in ('lt2', '2to5', '5to15', '15to40', 'gt40', 'monthly', 'unknown')
     or coalesce(p ->> 'decision', '') not in ('self', 'shared', 'other')
     or coalesce(p ->> 'timeline', '') not in ('week', 'month', 'browsing') then
    raise exception 'invalid' using errcode = '22023';
  end if;

  -- El problema: lo que escribió el visitante (sus primeros mensajes).
  select left(string_agg(body, E'\n' order by id), 2000) into v_text
    from (select id, body from public.chat_messages
           where conversation_id = conv.id and sender = 'visitor' and not internal
           order by id limit 5) x;
  v_text := coalesce(nullif(btrim(p ->> 'problem_text'), ''), v_text);

  result := public.score_lead(p ->> 'problem_category', v_text, p ->> 'budget', p ->> 'decision', p ->> 'timeline');

  insert into public.leads (
    name, email, phone, company, problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown, locale, source_page, visitor_id, consent_at, assigned_to,
    whatsapp_opt_in_at
  ) values (
    conv.name, v_email, v_phone, nullif(btrim(p ->> 'company'), ''),
    p ->> 'problem_category', v_text, p ->> 'budget', p ->> 'decision', p ->> 'timeline',
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier, result -> 'breakdown',
    conv.locale, coalesce(conv.page, 'chat'), conv.visitor_id,
    -- Aceptó el tratamiento de datos al iniciar el chat (o escribió por WhatsApp).
    conv.created_at, coalesce(conv.assigned_to, auth.uid()),
    case when conv.channel = 'whatsapp' then conv.created_at end
  )
  returning id into new_id;

  update public.chat_conversations set lead_id = new_id where id = conv.id;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (new_id, auth.uid(), 'chat', conv.last_message, jsonb_build_object('conversation_id', conv.id));
  return new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Respuestas guardadas
-- -----------------------------------------------------------------------------

create table public.chat_saved_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  shortcut text not null unique check (shortcut ~ '^[a-z0-9_-]{2,30}$'),
  body text not null check (char_length(body) between 1 and 2000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_saved_replies enable row level security;
create policy "chat_saved_replies: asesores leen" on public.chat_saved_replies
  for select to authenticated using ((select public.is_chat_agent()));
create policy "chat_saved_replies: asesores crean" on public.chat_saved_replies
  for insert to authenticated with check ((select public.is_chat_agent()));
create policy "chat_saved_replies: asesores editan" on public.chat_saved_replies
  for update to authenticated using ((select public.is_chat_agent())) with check ((select public.is_chat_agent()));
create policy "chat_saved_replies: asesores borran" on public.chat_saved_replies
  for delete to authenticated using ((select public.is_chat_agent()));

insert into public.chat_saved_replies (title, shortcut, body, created_by) values
  ('Saludo', 'hola', '¡Hola {nombre}! Soy {asesor} de Engynex. ¿En qué te puedo ayudar?', null),
  ('Agendar reunión', 'agendar', 'Con gusto lo revisamos en una reunión corta de 20 minutos. Elige el horario que te sirva aquí: https://engynex.com/es/cotizar', null),
  ('Pedir detalles', 'detalles', 'Para darte una propuesta precisa, ¿me cuentas un poco más del proyecto, qué resultado esperas y para cuándo lo necesitas?', null),
  ('Planes', 'planes', 'Puedes ver nuestros planes y qué incluye cada uno aquí: https://engynex.com/es/planes. ¿Te ayudo a elegir?', null),
  ('Horario', 'horario', 'Nuestro horario es de lunes a viernes de 7:00 a.m. a 5:00 p.m. y sábados de 8:00 a.m. a 4:00 p.m. (hora de Colombia).', null),
  ('Despedida', 'gracias', '¡Gracias por escribirnos, {nombre}! Quedo atento si te surge algo más.', null);

-- -----------------------------------------------------------------------------
-- Métricas
-- -----------------------------------------------------------------------------

create or replace function public.chat_stats(p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with c as (
    select * from public.chat_conversations
     where created_at > now() - make_interval(days => greatest(p_days, 1))
  )
  select jsonb_build_object(
    'open', (select count(*) from public.chat_conversations where status = 'open'),
    'unanswered', (select count(*) from public.chat_conversations where status = 'open' and first_response_at is null),
    'conversations', (select count(*) from c),
    'answered_pct', (select round(100.0 * count(*) filter (where first_response_at is not null) / nullif(count(*), 0)) from c),
    'median_first_response_s', (
      select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at)))
        from c where first_response_at is not null),
    'rating_avg', (select round(avg(rating)::numeric, 1) from c where rating is not null),
    'ratings', (select count(rating) from c)
  ) into result;
  return result;
end;
$$;

revoke all on function public.chat_offline_notice(text) from public;
revoke all on function public.chat_rate(text, integer, text) from public;
revoke all on function public.chat_create_lead(uuid, jsonb) from public, anon;
revoke all on function public.chat_stats(integer) from public, anon;
grant execute on function public.chat_offline_notice(text) to anon, authenticated;
grant execute on function public.chat_rate(text, integer, text) to anon, authenticated;
grant execute on function public.chat_create_lead(uuid, jsonb) to authenticated;
grant execute on function public.chat_stats(integer) to authenticated;
