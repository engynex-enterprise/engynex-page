-- =============================================================================
-- Fase 6 — Campañas de WhatsApp (WhatsApp Business Cloud API)
--
-- * Solo se escribe a quien lo aceptó (casilla aparte en el formulario) y se
--   respeta la baja (responder BAJA / STOP).
-- * Las campañas usan plantillas aprobadas por Meta (se sincronizan desde Meta).
-- * Las respuestas llegan al chat en vivo del portal, como conversaciones de
--   canal "whatsapp"; el asesor responde desde ahí dentro de la ventana de 24 h.
-- * Los envíos y el webhook corren en el servidor con la clave secreta
--   (service_role); el portal solo autoriza y muestra.
-- =============================================================================

alter table public.leads
  add column whatsapp_opt_in_at timestamptz,
  add column whatsapp_opt_out_at timestamptz;

-- Número en formato internacional, solo dígitos (Colombia por defecto).
create or replace function public.wa_phone(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d is null or length(d) < 8 then null
    when length(d) = 10 and left(d, 1) = '3' then '57' || d
    else d
  end
  from (select nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '') as d) x
$$;

create index leads_wa_phone_idx on public.leads (public.wa_phone(phone));

-- El formulario guarda el consentimiento de WhatsApp.
CREATE OR REPLACE FUNCTION public.submit_lead(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_name text := btrim(p ->> 'name');
  v_email text := lower(btrim(p ->> 'email'));
  v_phone text := btrim(p ->> 'phone');
  v_category text := p ->> 'problem_category';
  v_text text := nullif(btrim(p ->> 'problem_text'), '');
  v_budget text := p ->> 'budget';
  v_decision text := p ->> 'decision';
  v_timeline text := p ->> 'timeline';
  result jsonb;
  new_lead public.leads;
begin
  -- Validación de opciones (las mismas del formulario).
  if v_category is null or v_category not in
     ('sales', 'web', 'automation', 'system', 'support', 'other', 'none') then
    raise exception 'invalid_category' using errcode = '22023';
  end if;
  if v_budget not in ('lt2', '2to5', '5to15', '15to40', 'gt40', 'monthly', 'unknown') then
    raise exception 'invalid_budget' using errcode = '22023';
  end if;
  if v_decision not in ('self', 'shared', 'other') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  if v_timeline not in ('week', 'month', 'browsing') then
    raise exception 'invalid_timeline' using errcode = '22023';
  end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  -- Límite anti-abuso: 3 envíos por correo cada 10 minutos y 60 en total
  -- por minuto.
  if (select count(*) from public.leads
      where lower(email) = v_email and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.leads
         where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  result := public.score_lead(v_category, v_text, v_budget, v_decision, v_timeline);

  insert into public.leads (
    name, email, phone, company,
    problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown,
    locale, source_page, referrer, utm, gclid, visitor_id, consent_at, whatsapp_opt_in_at
  ) values (
    v_name, v_email, v_phone, nullif(btrim(p ->> 'company'), ''),
    v_category, v_text, v_budget, v_decision, v_timeline,
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier,
    result -> 'breakdown',
    left(p ->> 'locale', 5), left(p ->> 'source_page', 500), left(p ->> 'referrer', 500),
    case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end,
    left(p ->> 'gclid', 200), left(p ->> 'visitor_id', 100), now(),
    case when coalesce((p ->> 'whatsapp_opt_in')::boolean, false) then now() end
  )
  returning * into new_lead;

  return jsonb_build_object(
    'id', new_lead.id,
    'tier', new_lead.tier,
    'category', new_lead.problem_category,
    -- El token de agenda solo sale para los leads verdes.
    'booking_token', case when new_lead.tier = 'green' then new_lead.booking_token end
  );
end;
$function$;

-- -----------------------------------------------------------------------------
-- Conversaciones de WhatsApp dentro del chat del portal
-- -----------------------------------------------------------------------------

alter table public.chat_conversations
  add column channel text not null default 'web' check (channel in ('web', 'whatsapp')),
  add column wa_phone text,
  -- Ventana de atención: 24 h desde el último mensaje del cliente.
  add column wa_window_until timestamptz;

create unique index chat_conversations_wa_phone_idx
  on public.chat_conversations (wa_phone) where channel = 'whatsapp';

alter table public.chat_messages
  add column external_id text unique,
  add column delivery text check (delivery in ('sent', 'delivered', 'read', 'failed'));

-- -----------------------------------------------------------------------------
-- Plantillas, campañas y destinatarios
-- -----------------------------------------------------------------------------

create table public.wa_templates (
  id uuid primary key default gen_random_uuid(),
  meta_id text unique,
  name text not null,
  language text not null,
  category text,
  status text not null,
  header text,
  body text not null,
  footer text,
  variables smallint not null default 0,
  synced_at timestamptz not null default now(),
  unique (name, language)
);

create table public.wa_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  template_id uuid references public.wa_templates (id) on delete restrict,
  -- Un valor por variable {{n}}: {"source": "first_name|name|company|static", "value": "..."}
  params jsonb not null default '[]' check (jsonb_typeof(params) = 'array'),
  -- {"tiers": [...], "statuses": [...], "problems": [...], "days": 90}
  segment jsonb not null default '{}' check (jsonb_typeof(segment) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  total integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wa_campaigns_status_idx on public.wa_campaigns (status, scheduled_at);

create table public.wa_messages (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.wa_campaigns (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  phone text not null,
  name text,
  params jsonb not null default '[]',
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'delivered', 'read', 'failed')),
  wa_message_id text unique,
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, phone)
);

create index wa_messages_queue_idx on public.wa_messages (status, id);
create index wa_messages_phone_idx on public.wa_messages (phone, sent_at desc);

create or replace function public.is_marketer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'marketing']::public.app_role[])
$$;

create or replace function public.is_service()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role'
$$;

alter table public.wa_templates enable row level security;
alter table public.wa_campaigns enable row level security;
alter table public.wa_messages enable row level security;

create policy "wa_templates: marketing lee" on public.wa_templates
  for select to authenticated using ((select public.is_marketer()));
create policy "wa_campaigns: marketing lee" on public.wa_campaigns
  for select to authenticated using ((select public.is_marketer()));
create policy "wa_campaigns: marketing crea" on public.wa_campaigns
  for insert to authenticated with check ((select public.is_marketer()) and status in ('draft', 'scheduled'));
-- Solo se editan antes de empezar a enviar.
create policy "wa_campaigns: marketing edita borradores" on public.wa_campaigns
  for update to authenticated
  using ((select public.is_marketer()) and status in ('draft', 'scheduled'))
  with check ((select public.is_marketer()) and status in ('draft', 'scheduled', 'cancelled'));
create policy "wa_campaigns: marketing borra borradores" on public.wa_campaigns
  for delete to authenticated using ((select public.is_marketer()) and status in ('draft', 'cancelled'));
create policy "wa_messages: marketing lee" on public.wa_messages
  for select to authenticated using ((select public.is_marketer()));

create or replace function public.wa_touch_campaign()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger wa_campaigns_touch before update on public.wa_campaigns
  for each row execute function public.wa_touch_campaign();

-- -----------------------------------------------------------------------------
-- Audiencia
-- -----------------------------------------------------------------------------

create or replace function public.wa_audience(p_segment jsonb)
returns table (lead_id uuid, name text, company text, phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_marketer() or public.is_service()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select distinct on (public.wa_phone(l.phone))
         l.id, l.name, l.company, public.wa_phone(l.phone)
    from public.leads l
   where l.whatsapp_opt_in_at is not null
     and l.whatsapp_opt_out_at is null
     and public.wa_phone(l.phone) is not null
     and (coalesce(jsonb_array_length(p_segment -> 'tiers'), 0) = 0
          or l.tier::text in (select jsonb_array_elements_text(p_segment -> 'tiers')))
     and (coalesce(jsonb_array_length(p_segment -> 'statuses'), 0) = 0
          or l.status::text in (select jsonb_array_elements_text(p_segment -> 'statuses')))
     and (coalesce(jsonb_array_length(p_segment -> 'problems'), 0) = 0
          or l.problem_category in (select jsonb_array_elements_text(p_segment -> 'problems')))
     and (nullif(p_segment ->> 'days', '') is null
          or l.created_at > now() - make_interval(days => (p_segment ->> 'days')::int))
     -- Nadie que haya pedido la baja con otro registro del mismo número.
     and not exists (
       select 1 from public.leads o
        where public.wa_phone(o.phone) = public.wa_phone(l.phone) and o.whatsapp_opt_out_at is not null
     )
   order by public.wa_phone(l.phone), l.created_at desc;
end;
$$;

create or replace function public.wa_audience_count(p_segment jsonb)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.wa_audience(p_segment)
$$;

-- Arma la lista de destinatarios con sus variables y pasa a "enviando".
create or replace function public.wa_campaign_queue(p_campaign uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  camp public.wa_campaigns;
  tpl public.wa_templates;
  n integer;
begin
  if not (public.is_marketer() or public.is_service()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into camp from public.wa_campaigns where id = p_campaign for update;
  if camp.id is null or camp.status not in ('draft', 'scheduled') then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  select * into tpl from public.wa_templates where id = camp.template_id;
  if tpl.id is null or tpl.status <> 'APPROVED' then
    raise exception 'template_not_approved' using errcode = 'P0001';
  end if;
  if jsonb_array_length(camp.params) < tpl.variables then
    raise exception 'missing_params' using errcode = 'P0001';
  end if;

  insert into public.wa_messages (campaign_id, lead_id, phone, name, params)
  select camp.id, a.lead_id, a.phone, a.name,
         coalesce((
           select jsonb_agg(
                    left(coalesce(nullif(case p ->> 'source'
                      when 'first_name' then split_part(btrim(a.name), ' ', 1)
                      when 'name' then a.name
                      when 'company' then a.company
                      else p ->> 'value'
                    end, ''), p ->> 'fallback', '-'), 200)
                    order by ord)
             from jsonb_array_elements(camp.params) with ordinality as e(p, ord)
            where ord <= tpl.variables
         ), '[]'::jsonb)
    from public.wa_audience(camp.segment) a
  on conflict (campaign_id, phone) do nothing;
  get diagnostics n = row_count;

  update public.wa_campaigns
     set status = case when n = 0 then 'sent' else 'sending' end,
         started_at = now(),
         finished_at = case when n = 0 then now() end,
         total = n
   where id = camp.id;
  return n;
end;
$$;

-- -----------------------------------------------------------------------------
-- Envío (solo servidor)
-- -----------------------------------------------------------------------------

-- Toma un lote de mensajes pendientes (sin que dos procesos tomen el mismo).
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

  -- Campañas programadas que ya tocan.
  perform public.wa_campaign_queue(c.id)
     from public.wa_campaigns c
    where c.status = 'scheduled' and c.scheduled_at <= now();

  -- Mensajes "enviando" atascados más de 10 minutos vuelven a la cola.
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
  )
  update public.wa_messages m
     set status = 'sending', sent_at = null
    from picked, public.wa_campaigns c, public.wa_templates t
   where m.id = picked.id and c.id = m.campaign_id and t.id = c.template_id
  returning m.id, m.phone, m.params, t.name, t.language;
end;
$$;

-- Resultado del envío de un mensaje de campaña.
create or replace function public.wa_mark_sent(p_id bigint, p_wa_id text, p_error text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  msg public.wa_messages;
  camp_name text;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.wa_messages
     set status = case when p_error is null then 'sent' else 'failed' end,
         wa_message_id = p_wa_id,
         error = left(p_error, 500),
         sent_at = case when p_error is null then now() end
   where id = p_id
  returning * into msg;

  if msg.id is not null and p_error is null and msg.lead_id is not null then
    select name into camp_name from public.wa_campaigns where id = msg.campaign_id;
    insert into public.lead_activities (lead_id, type, body, meta)
    values (msg.lead_id, 'whatsapp', camp_name,
            jsonb_build_object('campaign_id', msg.campaign_id, 'kind', 'campaign'));
  end if;

  -- ¿Terminó la campaña?
  update public.wa_campaigns c
     set status = 'sent', finished_at = now()
   where c.id = msg.campaign_id and c.status = 'sending'
     and not exists (select 1 from public.wa_messages m
                      where m.campaign_id = c.id and m.status in ('queued', 'sending'));
end;
$$;

-- Estados que informa Meta (enviado → entregado → leído; o fallido).
create or replace function public.wa_status_update(p_wa_id text, p_status text, p_error text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  rank_new int := array_position(array['sent', 'delivered', 'read'], p_status);
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status = 'failed' then
    update public.wa_messages set status = 'failed', error = left(coalesce(p_error, 'failed'), 500)
     where wa_message_id = p_wa_id;
    update public.chat_messages set delivery = 'failed' where external_id = p_wa_id;
    return;
  end if;
  if rank_new is null then
    return;
  end if;

  update public.wa_messages
     set status = p_status,
         delivered_at = case when rank_new >= 2 then coalesce(delivered_at, now()) else delivered_at end,
         read_at = case when rank_new = 3 then coalesce(read_at, now()) else read_at end
   where wa_message_id = p_wa_id
     and coalesce(array_position(array['sent', 'delivered', 'read'], status), 0) < rank_new;

  update public.chat_messages
     set delivery = p_status
   where external_id = p_wa_id
     and coalesce(array_position(array['sent', 'delivered', 'read'], delivery), 0) < rank_new;
end;
$$;

-- Mensaje entrante de WhatsApp → conversación del chat del portal.
create or replace function public.wa_inbound(p_phone text, p_name text, p_body text, p_wa_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_phone text := public.wa_phone(p_phone);
  v_body text := left(coalesce(nullif(btrim(p_body), ''), '[mensaje]'), 2000);
  v_lead uuid;
  conv public.chat_conversations;
  opted_out boolean := false;
  new_conv boolean := false;
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_phone is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  -- Ya procesado (Meta reintenta los webhooks).
  if exists (select 1 from public.chat_messages where external_id = p_wa_id) then
    return jsonb_build_object('duplicate', true);
  end if;

  select id into v_lead from public.leads
   where public.wa_phone(phone) = v_phone order by created_at desc limit 1;

  -- Baja
  if upper(btrim(v_body)) in ('BAJA', 'STOP', 'CANCELAR', 'SALIR', 'UNSUBSCRIBE', 'DETENER') then
    update public.leads set whatsapp_opt_out_at = now()
     where public.wa_phone(phone) = v_phone and whatsapp_opt_out_at is null;
    opted_out := true;
  end if;

  select * into conv from public.chat_conversations where channel = 'whatsapp' and wa_phone = v_phone;
  if conv.id is null then
    insert into public.chat_conversations (
      token_hash, topic, channel, wa_phone, lead_id, name, phone, page, locale
    ) values (
      'wa:' || v_phone, 'chat-wa-' || encode(extensions.gen_random_bytes(16), 'hex'), 'whatsapp', v_phone, v_lead,
      left(coalesce(nullif(btrim(p_name), ''), '+' || v_phone), 120), '+' || v_phone, 'WhatsApp', 'es'
    )
    returning * into conv;
    new_conv := true;
  end if;

  update public.chat_conversations
     set wa_window_until = now() + interval '24 hours',
         status = 'open',
         closed_at = null,
         lead_id = coalesce(lead_id, v_lead)
   where id = conv.id;

  insert into public.chat_messages (conversation_id, sender, body, external_id)
  values (conv.id, 'visitor', v_body, p_wa_id);

  -- Respuesta a una campaña reciente.
  update public.wa_messages m set replied_at = now()
   where m.id = (select id from public.wa_messages
                  where phone = v_phone and sent_at > now() - interval '7 days' and replied_at is null
                  order by sent_at desc limit 1);

  if coalesce(conv.lead_id, v_lead) is not null and (new_conv or opted_out) then
    insert into public.lead_activities (lead_id, type, body, meta)
    values (coalesce(conv.lead_id, v_lead), 'whatsapp', left(v_body, 500),
            jsonb_build_object('conversation_id', conv.id, 'kind', case when opted_out then 'opt_out' else 'inbound' end));
  end if;

  return jsonb_build_object('conversation_id', conv.id, 'opted_out', opted_out);
end;
$$;

-- Respuesta del asesor por WhatsApp (el servidor ya la envió a Meta).
create or replace function public.wa_agent_message(p_conversation uuid, p_author uuid, p_body text, p_wa_id text)
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
   where id = p_conversation and channel = 'whatsapp';
  insert into public.chat_messages (conversation_id, sender, author_id, body, external_id, delivery)
  values (p_conversation, 'agent', p_author, left(p_body, 2000), p_wa_id, 'sent')
  returning id into new_id;
  return new_id;
end;
$$;

-- El chat web no puede "responder" una conversación de WhatsApp sin enviarla.
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
  if exists (select 1 from public.chat_conversations where id = p_conversation and channel = 'whatsapp') then
    raise exception 'use_whatsapp_api' using errcode = 'P0001';
  end if;

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

revoke all on function public.wa_audience(jsonb) from public, anon;
revoke all on function public.wa_audience_count(jsonb) from public, anon;
revoke all on function public.wa_campaign_queue(uuid) from public, anon;
revoke all on function public.wa_claim_batch(integer) from public, anon, authenticated;
revoke all on function public.wa_mark_sent(bigint, text, text) from public, anon, authenticated;
revoke all on function public.wa_status_update(text, text, text) from public, anon, authenticated;
revoke all on function public.wa_inbound(text, text, text, text) from public, anon, authenticated;
revoke all on function public.wa_agent_message(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.wa_audience(jsonb) to authenticated, service_role;
grant execute on function public.wa_audience_count(jsonb) to authenticated, service_role;
grant execute on function public.wa_campaign_queue(uuid) to authenticated, service_role;
grant execute on function public.wa_claim_batch(integer) to service_role;
grant execute on function public.wa_mark_sent(bigint, text, text) to service_role;
grant execute on function public.wa_status_update(text, text, text) to service_role;
grant execute on function public.wa_inbound(text, text, text, text) to service_role;
grant execute on function public.wa_agent_message(uuid, uuid, text, text) to service_role;

alter publication supabase_realtime add table public.wa_campaigns;
