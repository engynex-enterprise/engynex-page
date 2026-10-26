-- =============================================================================
-- Chat en vivo: bot por intenciones, respuestas automáticas y lead automático
--   * Intenciones con prioridad y coincidencia por palabra completa:
--     comercial (cotización, proveedor…) > soporte real > preguntas frecuentes.
--     Antes, "soporte" dentro de una solicitud comercial disparaba la FAQ de
--     soporte porque se comparaba por subcadena y ganaba la primera FAQ.
--   * La respuesta comercial nombra el servicio de la página (/servicios/<slug>).
--   * Mensaje de espera si nadie del equipo responde en N minutos (una vez).
--   * Respuestas rápidas y saludo por página para el widget.
--   * Lead automático: conversación web con correo y teléfono → lead (o se
--     vincula al lead existente con ese correo), con servicio y resumen.
--   * `bot.ai` queda reservado para la IA (piloto automático, otra migración).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------

-- Nombre legible de un servicio por su slug (content/services.ts).
create or replace function public.chat_service_name(p_slug text, p_lang text default 'es')
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_slug
    when 'desarrollo-web' then 'Desarrollo Web'
    when 'plataformas-web' then case when p_lang = 'en' then 'Web Platforms' else 'Plataformas Web' end
    when 'apps-moviles' then case when p_lang = 'en' then 'Mobile Apps' else 'Apps Móviles' end
    when 'ecommerce' then 'E-commerce'
    when 'ux-ui-branding' then case when p_lang = 'en' then 'UX/UI Design & Branding' else 'Diseño UX/UI & Branding' end
    when 'marketing-digital' then case when p_lang = 'en' then 'Digital Marketing' else 'Marketing Digital' end
    when 'produccion-audiovisual' then case when p_lang = 'en' then 'Audiovisual Production' else 'Producción Audiovisual' end
    when 'ia-automatizacion' then case when p_lang = 'en' then 'AI & Automation' else 'IA & Automatización' end
    when 'cloud-devops' then 'Cloud & DevOps'
    when 'ciberseguridad' then case when p_lang = 'en' then 'Cybersecurity' else 'Ciberseguridad' end
    when 'hosting-mantenimiento' then case when p_lang = 'en' then 'Hosting & Maintenance' else 'Hosting & Mantenimiento' end
    when 'consultoria-tech' then case when p_lang = 'en' then 'Consulting & Digital Transformation' else 'Consultoría & Transformación Digital' end
    when 'data-analytics' then 'Data & Analytics'
    when 'integraciones-apis' then case when p_lang = 'en' then 'Integrations & APIs' else 'Integraciones & APIs' end
    when 'soporte-ti' then case when p_lang = 'en' then 'IT Support & Outsourcing' else 'Soporte TI & Outsourcing' end
    when 'alquiler-equipos' then case when p_lang = 'en' then 'Equipment & Server Rental' else 'Alquiler de Equipos & Servidores' end
  end
$$;

-- Slug del servicio a partir de la página del chat (/es/servicios/<slug>).
create or replace function public.chat_page_service(p_page text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when public.chat_service_name(s) is not null then s end
    from (select substring(coalesce(p_page, '') from '/servicios/([a-z0-9-]+)') as s) x
$$;

-- Texto normalizado para buscar palabras completas: sin tildes, en minúsculas,
-- solo letras y números, separado por un espacio y con espacios en los bordes.
create or replace function public.chat_words(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select ' ' || btrim(regexp_replace(public.chat_fold(p), '[^a-z0-9]+', ' ', 'g')) || ' '
$$;

-- ¿Aparece alguna de las palabras o frases (completas) en el texto normalizado?
create or replace function public.chat_has(p_words text, p_keys text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1 from unnest(p_keys) k
     where btrim(public.chat_words(k)) <> ''
       and position(public.chat_words(k) in p_words) > 0
  )
$$;

-- Intención del mensaje: 'sales', 'support' o null.
create or replace function public.chat_intent(p_body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  w text := public.chat_words(p_body);
begin
  if public.chat_has(w, array[
       'cotizacion', 'cotizaciones', 'cotizar', 'cotizarnos', 'cotice', 'presupuesto', 'propuesta', 'propuesta comercial',
       'precio', 'precios', 'costo', 'costos', 'cuanto cuesta', 'cuanto vale', 'cuanto cobran', 'cuanto me cobran', 'tarifa', 'tarifas',
       'proveedor', 'proveedores', 'contratar', 'contratarlos', 'contratacion', 'me interesa', 'nos interesa', 'estamos interesados',
       'quote', 'quotation', 'pricing', 'price', 'proposal', 'budget', 'vendor', 'provider', 'hire', 'we need', 'looking for'])
     or (public.chat_has(w, array['necesito', 'necesitamos', 'busco', 'buscamos', 'quiero', 'queremos', 'quisiera', 'quisieramos', 'requerimos', 'requiero'])
         and public.chat_has(w, array['desarrollar', 'desarrollo', 'implementar', 'implementacion', 'crear', 'construir', 'disenar', 'montar',
                                       'pagina', 'sitio', 'web', 'app', 'aplicacion', 'plataforma', 'sistema', 'software', 'tienda',
                                       'empresa que', 'servicio', 'servicios', 'despliegue', 'desplegar', 'administracion', 'mantenimiento']))
  then
    return 'sales';
  end if;
  if public.chat_has(w, array[
       'no funciona', 'no sirve', 'no carga', 'no abre', 'no me deja', 'no puedo entrar', 'no puedo ingresar', 'no puedo acceder',
       'caido', 'caida', 'se cayo', 'esta caido', 'error', 'errores', 'falla', 'fallas', 'fallando', 'fallo', 'bloqueado', 'bloqueada',
       'soporte tecnico', 'mesa de ayuda', 'not working', 'is down', 'broken', 'cant log in', 'cannot log in', 'bug'])
  then
    return 'support';
  end if;
  return null;
end;
$$;

-- Categoría del formulario que mejor describe un servicio (para el puntaje).
create or replace function public.chat_lead_category(p_service text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_service in ('desarrollo-web', 'ecommerce', 'ux-ui-branding') then 'web'
    when p_service in ('plataformas-web', 'apps-moviles', 'integraciones-apis', 'cloud-devops', 'data-analytics', 'consultoria-tech') then 'system'
    when p_service = 'ia-automatizacion' then 'automation'
    when p_service in ('marketing-digital', 'produccion-audiovisual') then 'sales'
    when p_service in ('soporte-ti', 'ciberseguridad', 'hosting-mantenimiento', 'alquiler-equipos') then 'support'
    else 'other'
  end
$$;

-- -----------------------------------------------------------------------------
-- Lead automático desde una conversación web
-- -----------------------------------------------------------------------------
-- Si la conversación no tiene lead y trae correo y teléfono válidos: vincula el
-- lead que ya exista con ese correo o crea uno (origen "chat"), con el servicio
-- de la página y el primer mensaje como resumen. Devuelve el id o null.
create or replace function public.chat_auto_lead(p_conversation uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  v_lead uuid;
  v_text text;
  v_first text;
  v_service text;
  v_sales boolean;
  result jsonb;
begin
  select * into conv from public.chat_conversations where id = p_conversation;
  if conv.id is null or conv.lead_id is not null or conv.channel <> 'web' then
    return conv.lead_id;
  end if;
  if conv.email is null or conv.email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return null;
  end if;

  select left(string_agg(body, E'\n' order by id), 2000), (array_agg(body order by id))[1]
    into v_text, v_first
    from (select id, body from public.chat_messages
           where conversation_id = conv.id and sender = 'visitor' and not internal
           order by id limit 5) x;
  if v_first is null then
    return null;
  end if;
  v_service := public.chat_page_service(conv.page);

  -- ¿Ya existe un lead con ese correo? Se vincula, sin duplicar.
  select id into v_lead from public.leads where lower(email) = lower(conv.email) order by created_at desc limit 1;
  if v_lead is not null then
    update public.chat_conversations set lead_id = v_lead where id = conv.id;
    update public.leads
       set service = coalesce(service, v_service),
           request_summary = coalesce(request_summary, left(regexp_replace(btrim(v_first), '\s+', ' ', 'g'), 200))
     where id = v_lead;
    insert into public.lead_activities (lead_id, type, body, meta)
    values (v_lead, 'chat', left(v_first, 500), jsonb_build_object('conversation_id', conv.id));
    return v_lead;
  end if;

  -- El lead exige teléfono; sin él se espera a que el asesor lo cree.
  if conv.phone is null or char_length(btrim(conv.phone)) < 7 then
    return null;
  end if;

  v_sales := public.chat_intent(v_text) = 'sales';
  result := public.score_lead(
    case when v_service is not null then public.chat_lead_category(v_service) else 'other' end,
    v_text, 'unknown', 'shared', case when v_sales then 'month' else 'browsing' end);

  insert into public.leads (
    name, email, phone, problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown, locale, source_page, visitor_id, consent_at, assigned_to,
    source, service, request_summary
  ) values (
    left(conv.name, 120), lower(conv.email), left(btrim(conv.phone), 30),
    case when v_service is not null then public.chat_lead_category(v_service) else 'other' end,
    v_text, 'unknown', 'shared', case when v_sales then 'month' else 'browsing' end,
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier, result -> 'breakdown',
    conv.locale, coalesce(conv.page, 'chat'), conv.visitor_id,
    -- Aceptó el tratamiento de datos al iniciar el chat.
    conv.created_at, conv.assigned_to,
    'chat', v_service, left(regexp_replace(btrim(v_first), '\s+', ' ', 'g'), 200)
  )
  returning id into v_lead;

  update public.chat_conversations set lead_id = v_lead where id = conv.id;
  insert into public.lead_activities (lead_id, type, body, meta)
  values (v_lead, 'chat', left(v_first, 500), jsonb_build_object('conversation_id', conv.id, 'auto', true));
  return v_lead;
end;
$$;
revoke all on function public.chat_auto_lead(uuid) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Bot: intenciones > preguntas frecuentes, y aviso fuera de horario
-- -----------------------------------------------------------------------------

create or replace function public.chat_bot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg jsonb;
  bot jsonb;
  conv public.chat_conversations;
  lang text;
  words text;
  intent text;
  svc text;
  answer text;
  faq record;
  first_visitor boolean;
begin
  if new.sender <> 'visitor' then
    return new;
  end if;
  select * into conv from public.chat_conversations where id = new.conversation_id;
  if conv.channel <> 'web' then
    return new;
  end if;
  cfg := public.chat_config();
  bot := coalesce(cfg -> 'bot', '{}'::jsonb);
  lang := case when conv.locale = 'en' then 'en' else 'es' end;

  -- Lead automático (vincula o crea) en cuanto haya mensaje y datos.
  if coalesce((bot ->> 'auto_lead')::boolean, true) and conv.lead_id is null then
    perform public.chat_auto_lead(conv.id);
  end if;

  -- Respuestas automáticas solo mientras ningún asesor haya respondido.
  if conv.first_response_at is null and coalesce((bot ->> 'enabled')::boolean, false) then
    words := public.chat_words(new.body);

    -- 1) Intención comercial o de soporte (una vez por conversación cada una).
    if coalesce((bot ->> 'intents_enabled')::boolean, true) then
      intent := public.chat_intent(new.body);
      if intent is not null and not exists (
        select 1 from public.chat_messages m
         where m.conversation_id = conv.id and m.sender = 'bot' and m.meta ->> 'intent' = intent
      ) then
        svc := public.chat_service_name(public.chat_page_service(conv.page), lang);
        answer := coalesce(
          nullif(bot -> 'intents' -> intent ->> case when lang = 'en' then 'answer_en' else 'answer' end, ''),
          case
            when intent = 'sales' and lang = 'en' then
              'Thanks for reaching out!' || coalesce(' We''d be glad to help you with ' || svc || '.', '') ||
              ' To prepare your quote, tell us your company name, what you need and when you need it. An advisor will reply here shortly; if you prefer, book a call at https://engynex.com/en/agendar.'
            when intent = 'sales' then
              '¡Gracias por escribirnos!' || coalesce(' Con gusto te ayudamos con ' || svc || '.', '') ||
              ' Para preparar tu cotización, cuéntanos el nombre de tu empresa, qué necesitas y para cuándo lo necesitas. Un asesor te responde aquí en breve; si prefieres, agenda una llamada en https://engynex.com/es/agendar.'
            when lang = 'en' then
              'Sorry about the trouble. Tell us what''s happening (attach a screenshot if you can) and a support advisor will look into it with you.'
            else
              'Lamentamos el inconveniente. Cuéntanos qué pasa (y si puedes, adjunta una captura) y un asesor de soporte lo revisa contigo.'
          end);
        answer := replace(replace(answer, '{servicio}', coalesce(svc, '')), '{service}', coalesce(svc, ''));
        insert into public.chat_messages (conversation_id, sender, body, meta)
        values (conv.id, 'bot', left(answer, 2000), jsonb_build_object('intent', intent));
      elsif intent is null then
        -- 2) Preguntas frecuentes: mayor prioridad primero, palabra completa.
        for faq in
          select f.value as item, f.ordinality::int as idx
            from jsonb_array_elements(coalesce(bot -> 'faqs', '[]'::jsonb)) with ordinality f
           order by coalesce((f.value ->> 'priority')::int, 0) desc, f.ordinality
        loop
          if public.chat_has(words, array(select jsonb_array_elements_text(coalesce(faq.item -> 'keywords', '[]'::jsonb))))
             and not exists (
               select 1 from public.chat_messages m
                where m.conversation_id = conv.id and m.sender = 'bot' and m.meta ->> 'faq' = faq.idx::text
             ) then
            insert into public.chat_messages (conversation_id, sender, body, meta)
            values (conv.id, 'bot',
                    left(coalesce(nullif(faq.item ->> case when lang = 'en' then 'answer_en' else 'answer' end, ''), faq.item ->> 'answer'), 2000),
                    jsonb_build_object('faq', faq.idx));
            exit;
          end if;
        end loop;
      end if;
    end if;
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

-- El lead creado por un asesor desde el chat también lleva origen, servicio y resumen.
create or replace function public.chat_create_lead(p_conversation uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
  v_text text;
  v_first text;
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
  select left(string_agg(body, E'\n' order by id), 2000), (array_agg(body order by id))[1] into v_text, v_first
    from (select id, body from public.chat_messages
           where conversation_id = conv.id and sender = 'visitor' and not internal
           order by id limit 5) x;
  v_text := coalesce(nullif(btrim(p ->> 'problem_text'), ''), v_text);

  result := public.score_lead(p ->> 'problem_category', v_text, p ->> 'budget', p ->> 'decision', p ->> 'timeline');

  insert into public.leads (
    name, email, phone, company, problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown, locale, source_page, visitor_id, consent_at, assigned_to,
    whatsapp_opt_in_at, source, service, request_summary
  ) values (
    conv.name, v_email, v_phone, nullif(btrim(p ->> 'company'), ''),
    p ->> 'problem_category', v_text, p ->> 'budget', p ->> 'decision', p ->> 'timeline',
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier, result -> 'breakdown',
    conv.locale, coalesce(conv.page, 'chat'), conv.visitor_id,
    -- Aceptó el tratamiento de datos al iniciar el chat (o escribió por WhatsApp).
    conv.created_at, coalesce(conv.assigned_to, auth.uid()),
    case when conv.channel = 'whatsapp' then conv.created_at end,
    case when conv.channel = 'whatsapp' then 'whatsapp' else 'chat' end,
    public.chat_page_service(conv.page),
    left(regexp_replace(btrim(coalesce(v_first, '')), '\s+', ' ', 'g'), 200)
  )
  returning id into new_id;

  update public.chat_conversations set lead_id = new_id where id = conv.id;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (new_id, auth.uid(), 'chat', conv.last_message, jsonb_build_object('conversation_id', conv.id));
  return new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Mensaje de espera: nadie del equipo respondió en N minutos (una sola vez)
-- -----------------------------------------------------------------------------

create or replace function public.chat_wait_nudge()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  cfg jsonb := public.chat_config();
  w jsonb := cfg -> 'bot' -> 'wait_message';
  minutes int := greatest(coalesce((w ->> 'minutes')::int, 3), 1);
  r record;
  n int := 0;
begin
  if not coalesce((cfg -> 'bot' ->> 'enabled')::boolean, false)
     or not coalesce((w ->> 'enabled')::boolean, false)
     or not public.chat_open_now(cfg) then
    return 0;
  end if;
  -- Solo conversaciones recientes (ventana de 15 minutos tras el límite), para
  -- no escribir en conversaciones viejas al activar la función.
  for r in
    select c.id, c.locale from public.chat_conversations c
     where c.status = 'open' and c.channel = 'web' and c.first_response_at is null
       and c.created_at <= now() - make_interval(mins => minutes)
       and c.created_at > now() - make_interval(mins => minutes + 15)
       and not exists (
         select 1 from public.chat_messages m
          where m.conversation_id = c.id and m.sender = 'bot' and m.meta ->> 'kind' = 'wait'
       )
  loop
    insert into public.chat_messages (conversation_id, sender, body, meta)
    values (r.id, 'bot', left(coalesce(
      nullif(w ->> case when r.locale = 'en' then 'text_en' else 'text' end, ''),
      case when r.locale = 'en'
        then 'We''re still here: an advisor will reply shortly. If you prefer, leave us your WhatsApp number and we''ll write to you there.'
        else 'Seguimos aquí: un asesor te responde en breve. Si prefieres, déjanos tu WhatsApp y te escribimos por allá.'
      end), 2000), jsonb_build_object('kind', 'wait'));
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.chat_wait_nudge() from public, anon, authenticated;

select cron.schedule('chat-wait-nudge', '* * * * *', 'select public.chat_wait_nudge()');

-- -----------------------------------------------------------------------------
-- Lo que el widget necesita (sin secretos): + respuestas rápidas, saludo por
-- página y si la IA está activa.
-- -----------------------------------------------------------------------------

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
  bot jsonb := coalesce(cfg -> 'bot', '{}'::jsonb);
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
    'exit_intent', coalesce((cfg ->> 'exit_intent')::boolean, false),
    'quick_replies', case when coalesce((bot ->> 'enabled')::boolean, false) then coalesce((
      select jsonb_agg(coalesce(nullif(q ->> case when lang = 'en' then 'label_en' else 'label' end, ''), q ->> 'label'))
        from jsonb_array_elements(coalesce(bot -> 'quick_replies', '[]'::jsonb)) q
       where coalesce(q ->> 'label', '') <> ''
    ), '[]'::jsonb) else '[]'::jsonb end,
    'page_greeting', case when coalesce((bot -> 'page_greetings' ->> 'enabled')::boolean, false)
      then nullif(bot -> 'page_greetings' ->> case when lang = 'en' then 'text_en' else 'text' end, '') end,
    'ai', jsonb_build_object(
      'enabled', coalesce((bot -> 'ai' ->> 'enabled')::boolean, false),
      'mode', coalesce(bot -> 'ai' ->> 'mode', 'assist'))
  );
end;
$$;
revoke all on function public.chat_public_config(text) from public;
grant execute on function public.chat_public_config(text) to anon, authenticated;

-- El visitante ve si un mensaje del bot lo escribió la IA (meta.ai).
create or replace function public.chat_fetch(p_token text, p_after bigint default 0)
returns jsonb
language plpgsql
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
               'ai', coalesce((m.meta ->> 'ai')::boolean, false),
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

-- -----------------------------------------------------------------------------
-- Valores por defecto de los ajustes nuevos (sin pisar los existentes)
-- -----------------------------------------------------------------------------

update public.chat_settings
   set config = jsonb_set(config, '{bot}', $json${
     "intents_enabled": true,
     "auto_lead": true,
     "page_greetings": {
       "enabled": true,
       "text": "¡Hola! 👋 ¿Te interesa {servicio}? Cuéntanos tu proyecto y te ayudamos a cotizarlo.",
       "text_en": "Hi! 👋 Interested in {service}? Tell us about your project and we'll help you with a quote."
     },
     "quick_replies": [
       { "label": "Quiero cotizar un proyecto", "label_en": "I want a quote for a project" },
       { "label": "Necesito soporte técnico", "label_en": "I need technical support" },
       { "label": "Quiero hablar con un asesor", "label_en": "I want to talk to an advisor" },
       { "label": "¿Cuáles son los planes?", "label_en": "What are the plans?" }
     ],
     "wait_message": {
       "enabled": true,
       "minutes": 3,
       "text": "Seguimos aquí: un asesor te responde en breve. Si prefieres, déjanos tu WhatsApp y te escribimos por allá.",
       "text_en": "We're still here: an advisor will reply shortly. If you prefer, leave us your WhatsApp number and we'll write to you there."
     },
     "ai": { "enabled": false, "mode": "assist", "provider": "anthropic" }
   }$json$::jsonb || coalesce(config -> 'bot', '{}'::jsonb))
 where id;

-- La FAQ de planes cubre "planes" (la respuesta rápida "¿Cuáles son los planes?").
update public.chat_settings
   set config = jsonb_set(config, '{bot,faqs}', coalesce(config -> 'bot' -> 'faqs', '[]'::jsonb) || $json$[
     { "keywords": ["planes", "plan", "paquetes"], "priority": 1,
       "answer": "Puedes ver todos los planes y precios de referencia en https://engynex.com/es/planes. Si nos cuentas qué necesitas, un asesor te recomienda el que más te conviene.",
       "answer_en": "You can see every plan and reference price at https://engynex.com/en/planes. Tell us what you need and an advisor will recommend the best fit." },
     { "keywords": ["asesor", "humano", "persona", "agente", "advisor", "human"], "priority": 1,
       "answer": "¡Claro! Ya le avisamos al equipo: un asesor te responde por aquí en breve.",
       "answer_en": "Sure! We've let the team know: an advisor will reply here shortly." }
   ]$json$::jsonb)
 where id and not exists (
   select 1 from jsonb_array_elements(coalesce(config -> 'bot' -> 'faqs', '[]'::jsonb)) f
    where f -> 'keywords' ? 'planes'
 );

-- -----------------------------------------------------------------------------
-- Conversaciones existentes: servicio y resumen en el lead vinculado, y lead
-- automático para las que traen correo y teléfono.
-- -----------------------------------------------------------------------------

update public.leads l
   set service = coalesce(l.service, public.chat_page_service(c.page)),
       request_summary = coalesce(l.request_summary, (
         select left(regexp_replace(btrim(m.body), '\s+', ' ', 'g'), 200)
           from public.chat_messages m
          where m.conversation_id = c.id and m.sender = 'visitor' and not m.internal
          order by m.id limit 1))
  from public.chat_conversations c
 where c.lead_id = l.id and c.channel = 'web'
   and (l.service is null or l.request_summary is null);

-- Conversaciones viejas sin lead: solo se vinculan al lead que ya exista con
-- ese correo (no se crean leads nuevos de conversaciones pasadas).
update public.chat_conversations c
   set lead_id = (select l.id from public.leads l where lower(l.email) = lower(c.email) order by l.created_at desc limit 1)
 where c.channel = 'web' and c.lead_id is null and c.email is not null
   and exists (select 1 from public.leads l where lower(l.email) = lower(c.email));
