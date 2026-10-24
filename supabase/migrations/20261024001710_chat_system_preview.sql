-- Los avisos del sistema (cerrado, reabierto, cierre automático…) no
-- reemplazan el último mensaje que se ve en la bandeja.
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
  if new.sender = 'system' then
    select * into conv from public.chat_conversations where id = new.conversation_id;
  else
    update public.chat_conversations
       set last_message = left(new.body, 160),
           last_message_at = new.created_at,
           unread_agent = case new.sender when 'visitor' then unread_agent + 1 when 'agent' then 0 else unread_agent end,
           agent_seen_at = case when new.sender = 'agent' then now() else agent_seen_at end,
           first_response_at = case when new.sender = 'agent' then coalesce(first_response_at, new.created_at) else first_response_at end
     where id = new.conversation_id
    returning * into conv;
  end if;

  perform realtime.send(jsonb_build_object('id', new.id), 'message', conv.topic, false);
  return new;
end;
$$;

-- Reparar las conversaciones cuyo último mensaje quedó en un aviso del sistema.
update public.chat_conversations c
   set last_message = (
     select left(body, 160) from public.chat_messages
      where conversation_id = c.id and sender <> 'system' and not internal
      order by id desc limit 1
   )
 where c.last_message in ('visitor_ended', 'agent_closed', 'agent_reopened', 'offline_auto', 'auto_closed');
