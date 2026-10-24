-- =============================================================================
-- Fase 5 — Chat en vivo (visitante ↔ asesor) con Supabase Realtime
--
-- El visitante no tiene cuenta: al abrir un chat recibe un token secreto que
-- guarda su navegador. Todo lo que hace pasa por funciones que validan ese
-- token; nunca lee ni escribe las tablas directamente.
--
-- Avisos en vivo:
-- * Asesores (con sesión): postgres_changes sobre las tablas, filtrado por RLS.
-- * Visitante: un "ping" por Broadcast en un canal con nombre secreto. El ping
--   no trae el mensaje, solo avisa; el navegador vuelve a pedir los mensajes
--   con su token. Así, aunque alguien adivinara el canal, no podría leer ni
--   inyectar mensajes.
-- =============================================================================

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  topic text not null unique,
  visitor_id text references public.visitors (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text check (email is null or (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text check (phone is null or char_length(phone) <= 40),
  page text check (char_length(page) <= 500),
  locale text check (char_length(locale) <= 5),
  status text not null default 'open' check (status in ('open', 'closed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  unread_agent integer not null default 0,
  last_message text,
  last_message_at timestamptz not null default now(),
  visitor_seen_at timestamptz not null default now(),
  agent_seen_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chat_contact check (email is not null or phone is not null)
);

create index chat_conversations_inbox_idx on public.chat_conversations (status, last_message_at desc);
create index chat_conversations_lead_idx on public.chat_conversations (lead_id);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender text not null check (sender in ('visitor', 'agent', 'system')),
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_messages_conv_idx on public.chat_messages (conversation_id, id);

-- Quién atiende el chat.
create or replace function public.is_chat_agent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'sales', 'support']::public.app_role[])
$$;

-- -----------------------------------------------------------------------------
-- Al llegar un mensaje: resumen de la conversación, aviso al visitante y, si
-- es la primera vez que escribe, actividad en el lead.
-- -----------------------------------------------------------------------------

create or replace function public.chat_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
begin
  update public.chat_conversations
     set last_message = left(new.body, 160),
         last_message_at = new.created_at,
         unread_agent = case when new.sender = 'visitor' then unread_agent + 1 else 0 end,
         agent_seen_at = case when new.sender = 'agent' then now() else agent_seen_at end
   where id = new.conversation_id
  returning * into conv;

  perform realtime.send(jsonb_build_object('id', new.id), 'message', conv.topic, false);
  return new;
end;
$$;

create trigger chat_after_message
  after insert on public.chat_messages
  for each row execute function public.chat_after_message();

-- Cambios de estado (cerrado / reabierto / asignado): también se avisa.
create or replace function public.chat_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status or new.assigned_to is distinct from old.assigned_to then
    perform realtime.send(jsonb_build_object('status', new.status), 'status', new.topic, false);
  end if;
  return new;
end;
$$;

create trigger chat_after_update
  after update on public.chat_conversations
  for each row execute function public.chat_after_update();

-- -----------------------------------------------------------------------------
-- Funciones del visitante (públicas)
-- -----------------------------------------------------------------------------

create or replace function public.chat_hash(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
$$;

create or replace function public.chat_start(p jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_topic text := 'chat-' || encode(extensions.gen_random_bytes(16), 'hex');
  v_name text := nullif(btrim(p ->> 'name'), '');
  v_email text := nullif(lower(btrim(p ->> 'email')), '');
  v_phone text := nullif(btrim(p ->> 'phone'), '');
  v_body text := nullif(btrim(p ->> 'message'), '');
  v_visitor text := p ->> 'visitor_id';
  v_lead uuid;
  conv_id uuid;
begin
  -- Trampa para robots: el campo oculto debe venir vacío.
  if coalesce(p ->> 'website', '') <> '' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if v_name is null or v_body is null or (v_email is null and v_phone is null) then
    raise exception 'invalid' using errcode = '22023';
  end if;
  -- Límite anti-abuso global: 40 chats nuevos cada 10 minutos.
  if (select count(*) from public.chat_conversations where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if v_visitor is not null and not exists (select 1 from public.visitors where id = v_visitor) then
    v_visitor := null;
  end if;

  -- ¿Ya es un lead? Por su recorrido o por su correo.
  select lead_id into v_lead from public.visitors where id = v_visitor and lead_id is not null;
  if v_lead is null and v_email is not null then
    select id into v_lead from public.leads where lower(email) = v_email order by created_at desc limit 1;
  end if;

  insert into public.chat_conversations (token_hash, topic, visitor_id, lead_id, name, email, phone, page, locale)
  values (
    public.chat_hash(v_token), v_topic, v_visitor, v_lead, left(v_name, 120), v_email, left(v_phone, 40),
    left(p ->> 'page', 500), left(p ->> 'locale', 5)
  )
  returning id into conv_id;

  insert into public.chat_messages (conversation_id, sender, body)
  values (conv_id, 'visitor', left(v_body, 2000));

  if v_lead is not null then
    insert into public.lead_activities (lead_id, type, body, meta)
    values (v_lead, 'chat', left(v_body, 500), jsonb_build_object('conversation_id', conv_id));
  end if;

  return jsonb_build_object('token', v_token, 'topic', v_topic);
end;
$$;

-- Mensajes nuevos (después de p_after) y estado. Marca al visitante como visto.
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
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id,
               'sender', m.sender,
               'body', m.body,
               'created_at', m.created_at,
               -- Solo el nombre de pila del asesor.
               'agent', case when m.sender = 'agent' then split_part(coalesce(pr.full_name, ''), ' ', 1) end
             ) order by m.id)
      from (
        select * from public.chat_messages
         where conversation_id = conv.id and id > coalesce(p_after, 0)
         order by id
         limit 200
      ) m
      left join public.profiles pr on pr.id = m.author_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.chat_send(p_token text, p_body text)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  v_body text := nullif(btrim(p_body), '');
  new_id bigint;
begin
  select * into conv from public.chat_conversations where token_hash = public.chat_hash(p_token);
  if conv.id is null or v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  -- 20 mensajes por minuto por conversación.
  if (select count(*) from public.chat_messages
      where conversation_id = conv.id and sender = 'visitor' and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if conv.status = 'closed' then
    update public.chat_conversations set status = 'open', closed_at = null where id = conv.id;
  end if;

  insert into public.chat_messages (conversation_id, sender, body)
  values (conv.id, 'visitor', left(v_body, 2000))
  returning id into new_id;
  return new_id;
end;
$$;

-- El visitante termina la conversación.
create or replace function public.chat_end(p_token text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv_id uuid;
begin
  update public.chat_conversations
     set status = 'closed', closed_at = now()
   where token_hash = public.chat_hash(p_token) and status = 'open'
  returning id into conv_id;
  if conv_id is not null then
    insert into public.chat_messages (conversation_id, sender, body)
    values (conv_id, 'system', 'visitor_ended');
  end if;
end;
$$;

revoke all on function public.chat_start(jsonb) from public;
revoke all on function public.chat_fetch(text, bigint) from public;
revoke all on function public.chat_send(text, text) from public;
revoke all on function public.chat_end(text) from public;
grant execute on function public.chat_start(jsonb) to anon, authenticated;
grant execute on function public.chat_fetch(text, bigint) to anon, authenticated;
grant execute on function public.chat_send(text, text) to anon, authenticated;
grant execute on function public.chat_end(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Funciones del asesor
-- -----------------------------------------------------------------------------

create or replace function public.chat_agent_send(p_conversation uuid, p_body text)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_body text := nullif(btrim(p_body), '');
  new_id bigint;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;

  -- Quien responde primero se queda con la conversación; responder la reabre.
  update public.chat_conversations
     set assigned_to = coalesce(assigned_to, auth.uid()),
         status = 'open',
         closed_at = null
   where id = p_conversation;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  insert into public.chat_messages (conversation_id, sender, author_id, body)
  values (p_conversation, 'agent', auth.uid(), left(v_body, 2000))
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.chat_agent_read(p_conversation uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.chat_conversations
     set unread_agent = 0, agent_seen_at = now()
   where id = p_conversation and public.is_chat_agent()
$$;

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
    update public.chat_conversations
       set assigned_to = nullif(p ->> 'assigned_to', '')::uuid
     where id = conv.id;
  end if;

  if p ? 'lead_id' then
    update public.chat_conversations
       set lead_id = nullif(p ->> 'lead_id', '')::uuid
     where id = conv.id;
    if nullif(p ->> 'lead_id', '') is not null then
      insert into public.lead_activities (lead_id, author_id, type, body, meta)
      values ((p ->> 'lead_id')::uuid, auth.uid(), 'chat', conv.last_message, jsonb_build_object('conversation_id', conv.id));
    end if;
  end if;
end;
$$;

revoke all on function public.chat_agent_send(uuid, text) from public, anon;
revoke all on function public.chat_agent_read(uuid) from public, anon;
revoke all on function public.chat_agent_update(uuid, jsonb) from public, anon;
grant execute on function public.chat_agent_send(uuid, text) to authenticated;
grant execute on function public.chat_agent_read(uuid) to authenticated;
grant execute on function public.chat_agent_update(uuid, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS: los asesores leen; nadie escribe directo.
-- -----------------------------------------------------------------------------

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_conversations: asesores leen" on public.chat_conversations
  for select to authenticated using ((select public.is_chat_agent()));
create policy "chat_messages: asesores leen" on public.chat_messages
  for select to authenticated using ((select public.is_chat_agent()));

-- El token solo existe en el navegador del visitante; aquí se guarda su hash
-- (SHA-256 de 24 bytes aleatorios), que no sirve para suplantarlo.

alter publication supabase_realtime add table public.chat_conversations, public.chat_messages;

-- Conservación: chats cerrados sin lead, 13 meses.
create or replace function public.purge_old_chats()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.chat_conversations
   where lead_id is null and status = 'closed' and last_message_at < now() - interval '13 months'
$$;
revoke all on function public.purge_old_chats() from public, anon, authenticated;

select cron.schedule('purge-old-chats', '40 8 * * *', 'select public.purge_old_chats()');
