-- IA con varios proveedores (Anthropic, OpenAI, Google Gemini) y piloto
-- automático del chat: llaves en el catálogo de integraciones (cifradas en
-- Vault), traspaso de la conversación a un asesor y una guardia para que la
-- IA responda una sola vez a cada mensaje del visitante.

create or replace function public.integration_catalog()
 RETURNS TABLE(key text, secret boolean, is_public boolean, pattern text)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  values
    ('gtm_id', false, true, '^GTM-[A-Z0-9]{4,12}$'),
    ('ga4_id', false, true, '^G-[A-Z0-9]{4,16}$'),
    ('google_ads_id', false, true, '^AW-[0-9]{6,14}$'),
    ('google_ads_lead_label', false, true, '^[A-Za-z0-9_-]{4,64}$'),
    ('google_ads_booking_label', false, true, '^[A-Za-z0-9_-]{4,64}$'),
    ('meta_pixel_id', false, true, '^[0-9]{6,20}$'),
    ('clarity_id', false, true, '^[a-z0-9]{6,20}$'),
    ('linkedin_partner_id', false, true, '^[0-9]{4,12}$'),
    ('tiktok_pixel_id', false, true, '^[A-Z0-9]{10,30}$'),
    ('gsc_verification', false, true, '^[A-Za-z0-9_-]{20,80}$'),
    ('bing_verification', false, true, '^[A-Fa-f0-9]{32}$'),
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
    ('resend_webhook_secret', true, false, '^whsec_\S{10,}$'),
    ('email_from', false, false, '^.{3,160}$'),
    ('notify_emails', false, false, '^[^,\s@]+@[^,\s@]+\.[^,\s@]+(\s*,\s*[^,\s@]+@[^,\s@]+\.[^,\s@]+)*$'),
    ('anthropic_api_key', true, false, '^sk-ant-\S{20,}$'),
    ('ai_lead_insights', false, false, '^(on|off)$'),
    -- IA: más proveedores y proveedor predeterminado
    ('openai_api_key', true, false, '^sk-\S{20,}$'),
    ('openai_model', false, false, '^[A-Za-z0-9._:-]{2,80}$'),
    ('gemini_api_key', true, false, '^\S{20,}$'),
    ('gemini_model', false, false, '^[A-Za-z0-9._-]{2,80}$'),
    ('ai_provider', false, false, '^(anthropic|openai|gemini)$'),
    ('followup_sequence', false, false, '^(on|off)$'),
    ('abandoned_recovery', false, false, '^(on|off)$'),
    ('weekly_report', false, false, '^(on|off)$'),
    ('slack_webhook_url', true, false, '^https://hooks\.slack\.com/\S+$'),
    ('teams_webhook_url', true, false, '^https://\S+$'),
    ('google_chat_webhook_url', true, false, '^https://chat\.googleapis\.com/\S+$'),
    -- Dominios (Hostinger)
    ('hostinger_api_token', true, false, '^\S{20,}$'),
    ('domain_usd_cop', false, false, '^[0-9]{3,5}$'),
    ('domain_margin_pct', false, false, '^[0-9]{1,3}$'),
    ('domain_tlds', false, false, '^[a-z.]+(\s*,\s*[a-z.]+)*$'),
    ('domain_auto_register', false, false, '^(on|off)$'),
    -- Pagos (Wompi)
    ('wompi_public_key', false, false, '^pub_(test|prod)_\S{10,}$'),
    ('wompi_integrity_secret', true, false, '^(test|prod)_integrity_\S{10,}$'),
    ('wompi_events_secret', true, false, '^(test|prod)_events_\S{10,}$'),
    ('wompi_private_key', true, false, '^prv_(test|prod)_\S{10,}$'),
    ('domain_test_safe', false, false, '^(on|off)$')
$function$;

-- Una sola respuesta de IA por mensaje del visitante (meta.ai_for = id).
create unique index if not exists chat_messages_ai_for_uniq
  on public.chat_messages (conversation_id, (meta ->> 'ai_for'))
  where meta ? 'ai_for';

-- La IA pide un asesor: asigna (si nadie la tiene), etiqueta y avisa.
create or replace function public.chat_ai_handoff(p_conversation uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.chat_conversations;
begin
  update public.chat_conversations
     set assigned_to = coalesce(assigned_to, public.chat_pick_agent()),
         tags = case when 'requiere-asesor' = any (tags) then tags else array_append(tags, 'requiere-asesor') end
   where id = p_conversation
  returning * into conv;
  if conv.id is null then
    return;
  end if;
  perform public.notify(
    array['admin', 'sales', 'support']::public.app_role[],
    conv.assigned_to,
    'chat',
    'Un cliente pide hablar con un asesor',
    coalesce(conv.name, 'Visitante') || coalesce(': ' || nullif(btrim(p_reason), ''), ''),
    '/es/portal/chat?c=' || conv.id
  );
end;
$$;

revoke all on function public.chat_ai_handoff(uuid, text) from public, anon, authenticated;
grant execute on function public.chat_ai_handoff(uuid, text) to service_role;
