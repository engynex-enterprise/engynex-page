-- =============================================================================
-- Chat en vivo PRO
--   * Ajustes del widget desde el portal (apariencia, campos, páginas, horario,
--     bot de preguntas frecuentes, asignación automática, autocierre, invitaciones).
--   * Estado de cada asesor (disponible / ocupado / ausente) y límite de chats.
--   * Adjuntos (bucket privado chat-files), transferencias con nota, susurro
--     del supervisor, resumen con IA, ticket desde el chat.
--   * Reportes del chat y vista del equipo.
--   * Messenger e Instagram en la misma bandeja.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ajustes del widget (una sola fila)
-- -----------------------------------------------------------------------------

create table public.chat_settings (
  id boolean primary key default true check (id),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.chat_settings (id, config) values (true, $json${
  "enabled": true,
  "color": "#1f2a46",
  "position": "right",
  "show_agents": true,
  "texts": {
    "es": {
      "title": "Engynex",
      "launcher": "Chatea con nosotros",
      "greeting": "¡Hola! 👋 Cuéntanos en qué te ayudamos y un asesor te responde por aquí.",
      "greeting_away": "¡Hola! 👋 Ahora no hay asesores conectados. Déjanos tu mensaje y te respondemos por aquí o por correo en cuanto volvamos.",
      "invite": "¿Tienes dudas? Escríbenos aquí, te respondemos en minutos."
    },
    "en": {
      "title": "Engynex",
      "launcher": "Chat with us",
      "greeting": "Hi! 👋 Tell us how we can help and an advisor will reply right here.",
      "greeting_away": "Hi! 👋 No advisors are online right now. Leave your message and we'll reply here or by email as soon as we're back.",
      "invite": "Questions? Write to us here, we reply within minutes."
    }
  },
  "fields": { "email": "optional", "phone": "optional" },
  "exclude_paths": ["/es/portal", "/en/portal", "/es/acceso", "/en/acceso"],
  "hours": {
    "enabled": true,
    "email_team": true,
    "days": {
      "1": ["07:00", "17:00"], "2": ["07:00", "17:00"], "3": ["07:00", "17:00"],
      "4": ["07:00", "17:00"], "5": ["07:00", "17:00"], "6": ["08:00", "16:00"]
    }
  },
  "bot": {
    "enabled": true,
    "faqs": [
      { "keywords": ["precio", "costo", "cuanto cuesta", "cuánto cuesta", "valor", "tarifa"],
        "answer": "Cada proyecto se cotiza según lo que necesitas. Puedes ver los planes en https://engynex.com/es/planes o pedir una cotización en https://engynex.com/es/cotizar. Un asesor te responde aquí en un momento." },
      { "keywords": ["horario", "atienden", "abierto", "hora"],
        "answer": "Atendemos de lunes a viernes de 7:00 a.m. a 5:00 p.m. y sábados de 8:00 a.m. a 4:00 p.m. (hora de Colombia)." },
      { "keywords": ["soporte", "falla", "error", "no funciona", "caido", "caído"],
        "answer": "Lamentamos el inconveniente. Cuéntanos qué pasa (y si puedes, adjunta una captura) y un asesor de soporte lo revisa contigo." }
    ]
  },
  "routing": { "mode": "least_busy", "max_chats": 5 },
  "auto_close_minutes": 30,
  "invites": [
    { "path": "/planes", "delay": 20, "es": "¿Dudas con los planes? Te ayudo a elegir el que te conviene.", "en": "Questions about the plans? I can help you choose." },
    { "path": "/servicios", "delay": 25, "es": "¿Te ayudo a encontrar el servicio que necesitas?", "en": "Can I help you find the right service?" },
    { "path": "/cotizar", "delay": 30, "es": "¿Te ayudo con la cotización? Escríbeme si tienes preguntas.", "en": "Need help with your quote? Ask me anything." }
  ],
  "invite_delay": 20,
  "exit_intent": true
}$json$::jsonb);

alter table public.chat_settings enable row level security;
create policy "chat_settings: asesores leen" on public.chat_settings
  for select to authenticated using ((select public.is_chat_agent()));
create policy "chat_settings: admin edita" on public.chat_settings
  for update to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

create or replace function public.chat_settings_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger chat_settings_touch before update on public.chat_settings
  for each row execute function public.chat_settings_touch();

create or replace function public.chat_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select config from public.chat_settings where id), '{}'::jsonb)
$$;
revoke all on function public.chat_config() from public, anon, authenticated;

-- ¿Estamos en horario de atención? (hora de Colombia)
create or replace function public.chat_open_now(p_config jsonb default null)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  cfg jsonb := coalesce(p_config, public.chat_config());
  local timestamp := now() at time zone 'America/Bogota';
  span jsonb := cfg -> 'hours' -> 'days' -> extract(isodow from local)::int::text;
begin
  if not coalesce((cfg -> 'hours' ->> 'enabled')::boolean, false) then
    return true;
  end if;
  if span is null or jsonb_array_length(span) < 2 then
    return false;
  end if;
  return local::time >= (span ->> 0)::time and local::time < (span ->> 1)::time;
end;
$$;

-- Lo que el widget necesita (sin nada sensible).
create or replace function public.chat_public_config(p_locale text default 'es')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cfg jsonb := public.chat_config();
  lang text := case when p_locale = 'en' then 'en' else 'es' end;
begin
  return jsonb_build_object(
    'enabled', coalesce((cfg ->> 'enabled')::boolean, true),
    'color', cfg ->> 'color',
    'position', coalesce(cfg ->> 'position', 'right'),
    'show_agents', coalesce((cfg ->> 'show_agents')::boolean, true),
    'texts', cfg -> 'texts' -> lang,
    'fields', cfg -> 'fields',
    'exclude_paths', coalesce(cfg -> 'exclude_paths', '[]'::jsonb),
    'open_now', public.chat_open_now(cfg),
    'hours', cfg -> 'hours' -> 'days',
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object('path', i ->> 'path', 'delay', (i ->> 'delay')::int, 'text', coalesce(i ->> lang, i ->> 'es')))
        from jsonb_array_elements(coalesce(cfg -> 'invites', '[]'::jsonb)) i
    ), '[]'::jsonb),
    'invite_delay', coalesce((cfg ->> 'invite_delay')::int, 20),
    'exit_intent', coalesce((cfg ->> 'exit_intent')::boolean, false)
  );
end;
$$;
revoke all on function public.chat_public_config(text) from public;
grant execute on function public.chat_public_config(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Estado de los asesores
-- -----------------------------------------------------------------------------

create table public.chat_agents (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'busy', 'away')),
  max_chats smallint check (max_chats between 1 and 50),
  sound boolean not null default true,
  last_seen_at timestamptz,
  last_assigned_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.chat_agents enable row level security;
create policy "chat_agents: asesores leen" on public.chat_agents
  for select to authenticated using ((select public.is_chat_agent()));

alter publication supabase_realtime add table public.chat_agents;

-- Latido del portal (cada minuto mientras el asesor tiene el portal abierto).
create or replace function public.chat_agent_heartbeat()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me public.chat_agents;
begin
  if not public.is_chat_agent() then
    return null;
  end if;
  insert into public.chat_agents (profile_id, last_seen_at) values (auth.uid(), now())
  on conflict (profile_id) do update set last_seen_at = now()
  returning * into me;
  return to_jsonb(me);
end;
$$;

-- Cambiar mi estado / sonido; el admin puede fijar el límite de cualquiera.
create or replace function public.chat_agent_set(p jsonb, p_profile uuid default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(p_profile, auth.uid());
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target <> auth.uid() and not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.chat_agents (profile_id) values (target) on conflict do nothing;
  update public.chat_agents
     set status = case when p ->> 'status' in ('available', 'busy', 'away') then p ->> 'status' else status end,
         sound = coalesce((p ->> 'sound')::boolean, sound),
         max_chats = case when p ? 'max_chats' then nullif(p ->> 'max_chats', '')::smallint else max_chats end,
         updated_at = now()
   where profile_id = target;
end;
$$;

revoke all on function public.chat_agent_heartbeat() from public, anon;
revoke all on function public.chat_agent_set(jsonb, uuid) from public, anon;
grant execute on function public.chat_agent_heartbeat() to authenticated;
grant execute on function public.chat_agent_set(jsonb, uuid) to authenticated;

-- Asesores conectados y con cupo, del menos ocupado al más ocupado
-- (o el que lleva más tiempo sin recibir chat, en turnos).
create or replace function public.chat_pick_agent()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with cfg as (select public.chat_config() c),
  pool as (
    select p.id, a.last_assigned_at,
           (select count(*) from public.chat_conversations x where x.assigned_to = p.id and x.status = 'open') as open_chats,
           coalesce(a.max_chats, (select (c -> 'routing' ->> 'max_chats')::int from cfg), 5) as cap
      from public.profiles p
      join public.chat_agents a on a.profile_id = p.id
     where p.active and p.kind = 'employee' and p.role in ('admin', 'sales', 'support')
       and a.status = 'available'
       and a.last_seen_at > now() - interval '3 minutes'
  )
  select id from pool
   where open_chats < cap
   order by case when (select c -> 'routing' ->> 'mode' from cfg) = 'round_robin'
                 then extract(epoch from coalesce(last_assigned_at, 'epoch'::timestamptz))
                 else open_chats end,
            coalesce(last_assigned_at, 'epoch'::timestamptz),
            random()
   limit 1
$$;
revoke all on function public.chat_pick_agent() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Columnas nuevas
-- -----------------------------------------------------------------------------

alter table public.chat_messages drop constraint chat_messages_sender_check;
alter table public.chat_messages add constraint chat_messages_sender_check
  check (sender in ('visitor', 'agent', 'system', 'bot'));
alter table public.chat_messages
  add column attachment jsonb,
  add column meta jsonb;

alter table public.chat_conversations drop constraint chat_conversations_channel_check;
alter table public.chat_conversations add constraint chat_conversations_channel_check
  check (channel in ('web', 'whatsapp', 'messenger', 'instagram'));
alter table public.chat_conversations drop constraint chat_contact;
alter table public.chat_conversations add constraint chat_contact
  check (channel in ('messenger', 'instagram') or email is not null or phone is not null);
alter table public.chat_conversations
  add column external_id text,
  add column summary text check (char_length(summary) <= 4000),
  add column summary_at timestamptz;
create unique index chat_conversations_external_idx
  on public.chat_conversations (channel, external_id) where external_id is not null;

alter table public.tickets drop constraint tickets_source_check;
alter table public.tickets add constraint tickets_source_check check (source in ('web', 'portal', 'chat'));

-- -----------------------------------------------------------------------------
-- Al crear una conversación: campos obligatorios y asignación automática
-- -----------------------------------------------------------------------------

create or replace function public.chat_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb := public.chat_config();
  agent uuid;
begin
  if new.channel = 'web' then
    if not coalesce((cfg ->> 'enabled')::boolean, true) then
      raise exception 'chat_disabled' using errcode = 'P0001';
    end if;
    if cfg -> 'fields' ->> 'email' = 'required' and new.email is null
       or cfg -> 'fields' ->> 'phone' = 'required' and new.phone is null then
      raise exception 'invalid' using errcode = '22023';
    end if;
  end if;

  if new.assigned_to is null and coalesce(cfg -> 'routing' ->> 'mode', 'off') <> 'off' then
    agent := public.chat_pick_agent();
    if agent is not null then
      new.assigned_to := agent;
      update public.chat_agents set last_assigned_at = now() where profile_id = agent;
    end if;
  end if;
  return new;
end;
$$;

create trigger chat_before_insert before insert on public.chat_conversations
  for each row execute function public.chat_before_insert();

-- -----------------------------------------------------------------------------
-- Al llegar un mensaje
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
  if new.internal then
    return new;
  end if;
  update public.chat_conversations
     set last_message = left(new.body, 160),
         last_message_at = new.created_at,
         unread_agent = case new.sender when 'visitor' then unread_agent + 1 when 'agent' then 0 else unread_agent end,
         agent_seen_at = case when new.sender = 'agent' then now() else agent_seen_at end,
         first_response_at = case when new.sender = 'agent' then coalesce(first_response_at, new.created_at) else first_response_at end
   where id = new.conversation_id
  returning * into conv;

  perform realtime.send(jsonb_build_object('id', new.id), 'message', conv.topic, false);
  return new;
end;
$$;

-- Texto sin tildes ni mayúsculas, para comparar palabras clave.
create or replace function public.chat_fold(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(lower(coalesce(p, '')), 'áéíóúüñ', 'aeiouun')
$$;

-- Bot de preguntas frecuentes y aviso fuera de horario (solo chat web, y
-- solo mientras ningún asesor haya respondido).
create or replace function public.chat_bot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb;
  conv public.chat_conversations;
  faq jsonb;
  idx int := 0;
  folded text;
  first_visitor boolean;
begin
  if new.sender <> 'visitor' then
    return new;
  end if;
  select * into conv from public.chat_conversations where id = new.conversation_id;
  if conv.channel <> 'web' or conv.first_response_at is not null then
    return new;
  end if;
  cfg := public.chat_config();
  folded := public.chat_fold(new.body);

  if coalesce((cfg -> 'bot' ->> 'enabled')::boolean, false) then
    for faq in select * from jsonb_array_elements(coalesce(cfg -> 'bot' -> 'faqs', '[]'::jsonb)) loop
      idx := idx + 1;
      if exists (
        select 1 from jsonb_array_elements_text(coalesce(faq -> 'keywords', '[]'::jsonb)) k
         where btrim(k) <> '' and position(public.chat_fold(btrim(k)) in folded) > 0
      ) and not exists (
        select 1 from public.chat_messages m
         where m.conversation_id = conv.id and m.sender = 'bot' and m.meta ->> 'faq' = idx::text
      ) then
        insert into public.chat_messages (conversation_id, sender, body, meta)
        values (conv.id, 'bot', left(coalesce(nullif(faq ->> case when conv.locale = 'en' then 'answer_en' else 'answer' end, ''), faq ->> 'answer'), 2000),
                jsonb_build_object('faq', idx));
        exit;
      end if;
    end loop;
  end if;

  -- Primer mensaje fuera de horario: aviso al visitante y correo al equipo.
  select not exists (select 1 from public.chat_messages where conversation_id = conv.id and sender = 'visitor' and id < new.id)
    into first_visitor;
  if first_visitor and not public.chat_open_now(cfg) then
    if not exists (select 1 from public.chat_messages where conversation_id = conv.id and sender = 'system' and body = 'offline_auto') then
      insert into public.chat_messages (conversation_id, sender, body) values (conv.id, 'system', 'offline_auto');
    end if;
    if coalesce((cfg -> 'hours' ->> 'email_team')::boolean, false) then
      insert into public.email_queue (kind, lead_id, to_email, payload)
      values ('custom', conv.lead_id, null, jsonb_build_object(
        'subject', 'Chat fuera de horario: ' || conv.name,
        'body', conv.name || coalesce(' (' || coalesce(conv.email, conv.phone) || ')', '') || E' escribió en el chat fuera del horario de atención:\n\n' || left(new.body, 1000),
        'cta_label', 'Responder en el portal',
        'cta_url', 'https://engynex.com/es/portal/chat?c=' || conv.id,
        'internal', true));
    end if;
  end if;
  return new;
end;
$$;

create trigger chat_bot after insert on public.chat_messages
  for each row execute function public.chat_bot();

-- -----------------------------------------------------------------------------
-- Visitante: leer (con adjuntos y bot) y enviar archivos
-- -----------------------------------------------------------------------------

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
               'attachment', m.attachment,
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

-- Archivos: carpeta v/<tema secreto de la conversación>/...
create or replace function public.chat_topic_exists(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.chat_conversations where topic = p_topic and channel = 'web')
$$;
grant execute on function public.chat_topic_exists(text) to anon, authenticated;

-- Valida y normaliza la descripción de un adjunto.
create or replace function public.chat_attachment(p_topic text, p jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p is null then
    return null;
  end if;
  if coalesce(p ->> 'path', '') not like 'v/' || p_topic || '/%'
     or coalesce(p ->> 'name', '') = ''
     or coalesce((p ->> 'size')::bigint, 0) not between 1 and 10485760 then
    raise exception 'invalid_attachment' using errcode = '22023';
  end if;
  return jsonb_build_object('path', p ->> 'path', 'name', left(p ->> 'name', 160), 'mime', left(p ->> 'mime', 100), 'size', (p ->> 'size')::bigint);
end;
$$;

create or replace function public.chat_send_file(p_token text, p jsonb)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  att jsonb;
  new_id bigint;
begin
  select * into conv from public.chat_conversations where token_hash = public.chat_hash(p_token);
  if conv.id is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if (select count(*) from public.chat_messages
      where conversation_id = conv.id and sender = 'visitor' and attachment is not null and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  att := public.chat_attachment(conv.topic, p);
  if conv.status = 'closed' then
    update public.chat_conversations set status = 'open', closed_at = null where id = conv.id;
  end if;
  insert into public.chat_messages (conversation_id, sender, body, attachment)
  values (conv.id, 'visitor', '📎 ' || (att ->> 'name'), att)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.chat_send_file(text, jsonb) from public;
grant execute on function public.chat_send_file(text, jsonb) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-files', 'chat-files', false, 10485760, array[
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip'
])
on conflict (id) do nothing;

-- Quien conoce el tema secreto de la conversación (el visitante y los
-- asesores) puede subir y leer sus archivos; nadie más.
create policy "chat-files: subir en su conversación" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'chat-files'
    and (storage.foldername(name))[1] = 'v'
    and public.chat_topic_exists((storage.foldername(name))[2])
  );
create policy "chat-files: leer en su conversación" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'chat-files'
    and ((select public.is_chat_agent())
         or ((storage.foldername(name))[1] = 'v' and public.chat_topic_exists((storage.foldername(name))[2])))
  );
create policy "chat-files: asesores borran" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-files' and (select public.is_chat_agent()));

-- -----------------------------------------------------------------------------
-- Asesor: enviar (con adjunto), transferir, resumen, ticket
-- -----------------------------------------------------------------------------

drop function if exists public.chat_agent_send(uuid, text, boolean);
create or replace function public.chat_agent_send(
  p_conversation uuid, p_body text, p_internal boolean default false, p_attachment jsonb default null
)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_body text := nullif(btrim(p_body), '');
  conv public.chat_conversations;
  att jsonb;
  new_id bigint;
  me text;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  att := public.chat_attachment(conv.topic, p_attachment);
  if att is not null then
    v_body := coalesce(v_body, '📎 ' || (att ->> 'name'));
  end if;
  if v_body is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if conv.channel <> 'web' and not coalesce(p_internal, false) then
    raise exception 'use_channel_api' using errcode = 'P0001';
  end if;

  if not coalesce(p_internal, false) then
    update public.chat_conversations
       set assigned_to = coalesce(assigned_to, auth.uid()), status = 'open', closed_at = null
     where id = p_conversation;
  end if;

  insert into public.chat_messages (conversation_id, sender, author_id, body, internal, attachment)
  values (p_conversation, 'agent', auth.uid(), left(v_body, 2000), coalesce(p_internal, false), att)
  returning id into new_id;

  -- Nota interna de otra persona (p. ej. el supervisor): avisar al asesor del chat.
  if coalesce(p_internal, false) and conv.assigned_to is not null and conv.assigned_to <> auth.uid() then
    select coalesce(full_name, email) into me from public.profiles where id = auth.uid();
    perform public.notify(null, conv.assigned_to, 'chat', '🔒 ' || me || ' dejó una nota en el chat de ' || conv.name,
                          left(v_body, 300), '/es/portal/chat?c=' || conv.id);
  end if;
  return new_id;
end;
$$;
revoke all on function public.chat_agent_send(uuid, text, boolean, jsonb) from public, anon;
grant execute on function public.chat_agent_send(uuid, text, boolean, jsonb) to authenticated;

create or replace function public.chat_transfer(p_conversation uuid, p_to uuid, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  me text;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.profiles where id = p_to and active and kind = 'employee' and role in ('admin', 'sales', 'support')) then
    raise exception 'invalid' using errcode = '22023';
  end if;
  update public.chat_conversations set assigned_to = p_to where id = conv.id;
  insert into public.chat_messages (conversation_id, sender, author_id, body, internal, meta)
  values (conv.id, 'system', auth.uid(), 'transferred', true,
          jsonb_build_object('from', conv.assigned_to, 'to', p_to, 'by', auth.uid(), 'note', left(nullif(btrim(p_note), ''), 500)));
  if p_to <> auth.uid() then
    select coalesce(full_name, email) into me from public.profiles where id = auth.uid();
    perform public.notify(null, p_to, 'chat', me || ' te transfirió el chat de ' || conv.name,
                          coalesce(left(nullif(btrim(p_note), ''), 300), conv.last_message), '/es/portal/chat?c=' || conv.id);
  end if;
end;
$$;

create or replace function public.chat_save_summary(p_conversation uuid, p_summary text)
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
  update public.chat_conversations
     set summary = left(nullif(btrim(p_summary), ''), 4000), summary_at = now()
   where id = p_conversation
  returning * into conv;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if conv.lead_id is not null and conv.summary is not null then
    insert into public.lead_activities (lead_id, author_id, type, body, meta)
    values (conv.lead_id, auth.uid(), 'chat', conv.summary, jsonb_build_object('conversation_id', conv.id, 'kind', 'summary'));
  end if;
end;
$$;

create or replace function public.chat_create_ticket(p_conversation uuid, p jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  v_email text;
  v_text text;
  t public.tickets;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  v_email := lower(coalesce(nullif(btrim(p ->> 'email'), ''), conv.email));
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email_required' using errcode = '22023';
  end if;
  select left(string_agg(
           to_char(created_at at time zone 'America/Bogota', 'DD/MM HH24:MI') || ' · ' ||
           case sender when 'visitor' then conv.name when 'bot' then 'Bot' else 'Engynex' end || ': ' || body,
           E'\n' order by id), 5000)
    into v_text
    from public.chat_messages where conversation_id = conv.id and not internal and sender <> 'system';

  insert into public.tickets (name, email, phone, category, priority, subject, description, assigned_to, source)
  values (
    conv.name, v_email, conv.phone,
    left(coalesce(nullif(p ->> 'category', ''), 'other'), 40),
    coalesce(nullif(p ->> 'priority', ''), 'medium')::public.ticket_priority,
    left(coalesce(nullif(btrim(p ->> 'subject'), ''), 'Chat: ' || conv.name), 200),
    coalesce(nullif(v_text, ''), conv.last_message, '—'),
    auth.uid(), 'chat'
  )
  returning * into t;

  insert into public.chat_messages (conversation_id, sender, author_id, body, internal, meta)
  values (conv.id, 'system', auth.uid(), 'ticket_created', true, jsonb_build_object('ticket_id', t.id, 'number', t.number));
  return jsonb_build_object('id', t.id, 'number', t.number);
end;
$$;

revoke all on function public.chat_transfer(uuid, uuid, text) from public, anon;
revoke all on function public.chat_save_summary(uuid, text) from public, anon;
revoke all on function public.chat_create_ticket(uuid, jsonb) from public, anon;
grant execute on function public.chat_transfer(uuid, uuid, text) to authenticated;
grant execute on function public.chat_save_summary(uuid, text) to authenticated;
grant execute on function public.chat_create_ticket(uuid, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Cierre automático por inactividad (cada 5 minutos)
-- -----------------------------------------------------------------------------

create or replace function public.chat_autoclose()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  minutes int := coalesce((public.chat_config() ->> 'auto_close_minutes')::int, 0);
  r record;
  n int := 0;
begin
  if minutes <= 0 then
    return 0;
  end if;
  for r in
    select id from public.chat_conversations
     where status = 'open' and channel = 'web' and first_response_at is not null
       and last_message_at < now() - make_interval(mins => minutes)
  loop
    update public.chat_conversations set status = 'closed', closed_at = now() where id = r.id;
    insert into public.chat_messages (conversation_id, sender, body) values (r.id, 'system', 'auto_closed');
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.chat_autoclose() from public, anon, authenticated;

select cron.schedule('chat-autoclose', '*/5 * * * *', 'select public.chat_autoclose()');

-- -----------------------------------------------------------------------------
-- Reportes y equipo
-- -----------------------------------------------------------------------------

create or replace function public.chat_report(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 1), 365);
  since timestamptz := (date_trunc('day', now() at time zone 'America/Bogota') - make_interval(days => d - 1)) at time zone 'America/Bogota';
  prev timestamptz := since - make_interval(days => d);
  result jsonb;
begin
  if not public.is_chat_agent() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with c as (select * from public.chat_conversations where created_at >= since),
       p as (select * from public.chat_conversations where created_at >= prev and created_at < since),
       days as (
         select (since at time zone 'America/Bogota')::date + g as day
           from generate_series(0, d - 1) g
       )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'conversations', (select count(*) from c),
      'conversations_prev', (select count(*) from p),
      'answered_pct', (select round(100.0 * count(*) filter (where first_response_at is not null) / nullif(count(*), 0)) from c),
      'median_first_response_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at))) from c where first_response_at is not null),
      'median_first_response_prev_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at))) from p where first_response_at is not null),
      'rating_avg', (select round(avg(rating)::numeric, 1) from c where rating is not null),
      'ratings', (select count(rating) from c),
      'leads', (select count(*) from c where lead_id is not null),
      'leads_pct', (select round(100.0 * count(*) filter (where lead_id is not null) / nullif(count(*), 0)) from c),
      'bot_answers', (select count(*) from public.chat_messages m join c on c.id = m.conversation_id where m.sender = 'bot'),
      'auto_closed', (select count(*) from public.chat_messages m join c on c.id = m.conversation_id where m.sender = 'system' and m.body = 'auto_closed')
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'day', days.day,
               'web', (select count(*) from c where (created_at at time zone 'America/Bogota')::date = days.day and channel = 'web'),
               'whatsapp', (select count(*) from c where (created_at at time zone 'America/Bogota')::date = days.day and channel = 'whatsapp'),
               'social', (select count(*) from c where (created_at at time zone 'America/Bogota')::date = days.day and channel in ('messenger', 'instagram')),
               'first_response_s', (select round(extract(epoch from percentile_cont(0.5) within group (order by first_response_at - created_at)))
                                      from c where (created_at at time zone 'America/Bogota')::date = days.day and first_response_at is not null)
             ) order by days.day)
        from days
    ),
    'heat', coalesce((
      select jsonb_agg(jsonb_build_object('dow', dow, 'hour', hour, 'n', n))
        from (
          select extract(isodow from m.created_at at time zone 'America/Bogota')::int as dow,
                 extract(hour from m.created_at at time zone 'America/Bogota')::int as hour,
                 count(distinct m.conversation_id) as n
            from public.chat_messages m
           where m.created_at >= since and m.sender = 'visitor'
           group by 1, 2
        ) h
    ), '[]'::jsonb),
    'agents', coalesce((
      select jsonb_agg(row_to_json(a) order by a.conversations desc)
        from (
          select pr.id, coalesce(pr.full_name, pr.email) as name,
                 count(c.id) as conversations,
                 round(avg(c.rating)::numeric, 1) as rating_avg,
                 count(c.rating) as ratings,
                 round(extract(epoch from percentile_cont(0.5) within group (order by c.first_response_at - c.created_at))) as first_response_s,
                 count(c.id) filter (where c.lead_id is not null) as leads
            from c join public.profiles pr on pr.id = c.assigned_to
           group by pr.id, pr.full_name, pr.email
        ) a
    ), '[]'::jsonb),
    'channels', coalesce((select jsonb_object_agg(channel, n) from (select channel, count(*) n from c group by channel) x), '{}'::jsonb),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by n desc)
        from (select tag, count(*) n from c, unnest(c.tags) tag group by tag order by n desc limit 8) t
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.chat_team()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_chat_agent() then coalesce(jsonb_agg(row_to_json(t) order by t.online desc, t.name), '[]'::jsonb) end
    from (
      select p.id, coalesce(p.full_name, p.email) as name, p.role,
             coalesce(a.status, 'available') as status,
             coalesce(a.max_chats, (public.chat_config() -> 'routing' ->> 'max_chats')::int, 5) as max_chats,
             a.max_chats is not null as custom_max,
             a.last_seen_at,
             coalesce(a.last_seen_at > now() - interval '3 minutes', false) as online,
             (select count(*) from public.chat_conversations c where c.assigned_to = p.id and c.status = 'open') as open_chats,
             (select count(*) from public.chat_conversations c where c.assigned_to = p.id and c.status = 'open' and c.unread_agent > 0) as waiting,
             (select count(*) from public.chat_conversations c where c.assigned_to = p.id and c.created_at > now() - interval '1 day') as today
        from public.profiles p
        left join public.chat_agents a on a.profile_id = p.id
       where p.active and p.kind = 'employee' and p.role in ('admin', 'sales', 'support')
    ) t
$$;

revoke all on function public.chat_report(integer) from public, anon;
revoke all on function public.chat_team() from public, anon;
grant execute on function public.chat_report(integer) to authenticated;
grant execute on function public.chat_team() to authenticated;

-- -----------------------------------------------------------------------------
-- Messenger e Instagram
-- -----------------------------------------------------------------------------

create or replace function public.integration_catalog()
returns table (key text, secret boolean, is_public boolean, pattern text)
language sql
immutable
set search_path = ''
as $$
  values
    ('gtm_id', false, true, '^GTM-[A-Z0-9]{4,12}$'),
    ('ga4_id', false, true, '^G-[A-Z0-9]{4,16}$'),
    ('google_ads_id', false, true, '^AW-[0-9]{6,14}$'),
    ('google_ads_lead_label', false, true, '^[A-Za-z0-9_-]{4,64}$'),
    ('google_ads_booking_label', false, true, '^[A-Za-z0-9_-]{4,64}$'),
    ('meta_pixel_id', false, true, '^[0-9]{6,20}$'),
    ('whatsapp_phone_number_id', false, false, '^[0-9]{6,30}$'),
    ('whatsapp_business_account_id', false, false, '^[0-9]{6,30}$'),
    ('whatsapp_graph_version', false, false, '^v[0-9]{2}\.[0-9]$'),
    ('whatsapp_access_token', true, false, '^\S{20,}$'),
    ('whatsapp_app_secret', true, false, '^[A-Za-z0-9]{16,64}$'),
    ('whatsapp_verify_token', true, false, '^\S{8,}$'),
    ('meta_page_id', false, false, '^[0-9]{5,30}$'),
    ('meta_page_token', true, false, '^\S{20,}$'),
    ('instagram_account_id', false, false, '^[0-9]{5,30}$'),
    ('ads_feed_user', false, false, '^[A-Za-z0-9._-]{3,64}$'),
    ('ads_feed_password', true, false, '^\S{12,}$'),
    ('ads_conversion_qualified', false, false, '^.{2,100}$'),
    ('ads_conversion_meeting', false, false, '^.{2,100}$'),
    ('ads_conversion_won', false, false, '^.{2,100}$'),
    ('cron_secret', true, false, '^\S{24,}$'),
    ('resend_api_key', true, false, '^re_\S{10,}$'),
    ('email_from', false, false, '^.{3,160}$'),
    ('notify_emails', false, false, '^[^,\s@]+@[^,\s@]+\.[^,\s@]+(\s*,\s*[^,\s@]+@[^,\s@]+\.[^,\s@]+)*$'),
    ('anthropic_api_key', true, false, '^sk-ant-\S{20,}$'),
    ('ai_lead_insights', false, false, '^(on|off)$'),
    ('followup_sequence', false, false, '^(on|off)$'),
    ('abandoned_recovery', false, false, '^(on|off)$'),
    ('weekly_report', false, false, '^(on|off)$')
$$;

-- Mensaje entrante de Messenger o Instagram → conversación del portal.
create or replace function public.meta_inbound(p_channel text, p_user text, p_name text, p_body text, p_mid text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_channel not in ('messenger', 'instagram') or coalesce(p_user, '') = '' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if exists (select 1 from public.chat_messages where external_id = p_mid) then
    return jsonb_build_object('duplicate', true);
  end if;

  select * into conv from public.chat_conversations where channel = p_channel and external_id = p_user;
  if conv.id is null then
    insert into public.chat_conversations (token_hash, topic, channel, external_id, name, page, locale)
    values (
      'm:' || p_channel || ':' || p_user, 'chat-m-' || encode(extensions.gen_random_bytes(16), 'hex'),
      p_channel, p_user, left(coalesce(nullif(btrim(p_name), ''), initcap(p_channel)), 120),
      case p_channel when 'messenger' then 'Messenger' else 'Instagram' end, 'es'
    )
    returning * into conv;
  elsif nullif(btrim(p_name), '') is not null and conv.name in ('Messenger', 'Instagram') then
    update public.chat_conversations set name = left(btrim(p_name), 120) where id = conv.id;
  end if;

  update public.chat_conversations
     set wa_window_until = now() + interval '24 hours', status = 'open', closed_at = null
   where id = conv.id;

  insert into public.chat_messages (conversation_id, sender, body, external_id)
  values (conv.id, 'visitor', left(coalesce(nullif(btrim(p_body), ''), '[mensaje]'), 2000), p_mid);

  return jsonb_build_object('conversation_id', conv.id);
end;
$$;

create or replace function public.meta_agent_message(p_conversation uuid, p_author uuid, p_body text, p_mid text)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.chat_conversations
     set assigned_to = coalesce(assigned_to, p_author), status = 'open', closed_at = null
   where id = p_conversation and channel in ('messenger', 'instagram');
  insert into public.chat_messages (conversation_id, sender, author_id, body, external_id, delivery)
  values (p_conversation, 'agent', p_author, left(p_body, 2000), p_mid, 'sent')
  returning id into new_id;
  return new_id;
end;
$$;

-- Leído / entregado (Messenger e Instagram avisan con una marca de tiempo).
create or replace function public.meta_seen(p_channel text, p_user text, p_status text, p_until timestamptz)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.chat_messages m
     set delivery = p_status
    from public.chat_conversations c
   where c.channel = p_channel and c.external_id = p_user and m.conversation_id = c.id
     and m.sender = 'agent' and m.created_at <= p_until
     and coalesce(array_position(array['sent', 'delivered', 'read'], m.delivery), 0) < array_position(array['sent', 'delivered', 'read'], p_status);
end;
$$;

revoke all on function public.meta_inbound(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.meta_agent_message(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.meta_seen(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.meta_inbound(text, text, text, text, text) to service_role;
grant execute on function public.meta_agent_message(uuid, uuid, text, text) to service_role;
grant execute on function public.meta_seen(text, text, text, timestamptz) to service_role;
