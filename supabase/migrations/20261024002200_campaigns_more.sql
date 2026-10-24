-- =============================================================================
-- Campañas: más variables (con valor por defecto), prueba A/B del asunto y
-- envío escalonado por hora.
--   Variables: {nombre} {nombre_completo} {empresa} {correo} {telefono}
--   {asesor} {necesidad} {enlace_agenda} {enlace_cotizar}. Cualquiera admite
--   un valor por si falta: {empresa|tu empresa}.
-- =============================================================================

alter table public.wa_campaigns
  add column subject_b text check (char_length(subject_b) <= 200),
  add column throttle_per_hour integer check (throttle_per_hour between 10 and 10000);

-- Valores de las variables para un lead.
create or replace function public.campaign_vars(l public.leads)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'nombre', split_part(btrim(l.name), ' ', 1),
    'nombre_completo', btrim(l.name),
    'empresa', coalesce(l.company, ''),
    'correo', coalesce(l.email, ''),
    'telefono', coalesce(l.phone, ''),
    'asesor', coalesce((select split_part(coalesce(p.full_name, ''), ' ', 1) from public.profiles p where p.id = l.assigned_to), ''),
    'necesidad', case when coalesce(l.locale, 'es') = 'en' then
        case l.problem_category when 'sales' then 'selling more' when 'web' then 'your website' when 'automation' then 'automating tasks'
          when 'system' then 'a custom system' when 'support' then 'tech support' else 'your project' end
      else
        case l.problem_category when 'sales' then 'vender más' when 'web' then 'tu página web' when 'automation' then 'automatizar tareas'
          when 'system' then 'un sistema a la medida' when 'support' then 'soporte tecnológico' else 'tu proyecto' end
      end,
    'enlace_agenda', 'https://engynex.com/' || coalesce(l.locale, 'es') || '/agendar?t=' || l.booking_token,
    'enlace_cotizar', 'https://engynex.com/' || coalesce(l.locale, 'es') || '/cotizar'
  )
$$;
revoke all on function public.campaign_vars(public.leads) from public, anon, authenticated;

-- Reemplaza {var} y {var|valor si falta}.
create or replace function public.campaign_render(p_text text, p_vars jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  out text := coalesce(p_text, '');
  k text;
  v text;
begin
  for k, v in select key, value from jsonb_each_text(p_vars) loop
    if coalesce(btrim(v), '') <> '' then
      -- El valor va literal (la barra invertida tiene significado especial).
      out := regexp_replace(out, '\{' || k || '(\|[^}]*)?\}', replace(v, '\', '\\'), 'g');
    else
      out := regexp_replace(out, '\{' || k || '(\|([^}]*))?\}', '\2', 'g');
    end if;
  end loop;
  return out;
end;
$$;

-- Compatibilidad: lo que ya usaba campaign_fill.
create or replace function public.campaign_fill(p_text text, p_name text, p_company text)
returns text
language sql
immutable
set search_path = ''
as $$
  select public.campaign_render(p_text, jsonb_build_object('nombre', split_part(btrim(coalesce(p_name, '')), ' ', 1), 'empresa', coalesce(p_company, '')))
$$;

create or replace function public.campaign_queue(p_campaign uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  camp public.wa_campaigns;
  n integer;
  url text;
  slug text;
  per_hour int;
  uses_booking boolean;
begin
  if not (public.is_marketer() or public.is_service()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into camp from public.wa_campaigns where id = p_campaign for update;
  if camp.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if camp.channel = 'whatsapp' then
    return public.wa_campaign_queue(p_campaign);
  end if;
  if camp.status not in ('draft', 'scheduled') then
    raise exception 'invalid_state' using errcode = 'P0001';
  end if;
  if coalesce(btrim(camp.subject), '') = '' or coalesce(btrim(camp.body), '') = '' then
    raise exception 'missing_content' using errcode = 'P0001';
  end if;

  url := nullif(btrim(camp.cta_url), '');
  if url is not null and camp.utm and url !~* 'utm_source=' and url !~ '\{' then
    slug := trim(both '-' from regexp_replace(lower(camp.name), '[^a-z0-9]+', '-', 'g'));
    url := url || case when position('?' in url) > 0 then '&' else '?' end
               || 'utm_source=engynex&utm_medium=email&utm_campaign=' || coalesce(nullif(slug, ''), 'campana');
  end if;
  per_hour := camp.throttle_per_hour;
  uses_booking := concat_ws(' ', camp.subject, camp.subject_b, camp.preheader, camp.body, camp.cta_url) like '%{enlace_agenda%';

  insert into public.email_queue (kind, lead_id, to_email, campaign_id, created_by, send_at, payload)
  select 'custom', a.lead_id, a.email, camp.id, camp.created_by,
         -- Envío escalonado: N por hora.
         now() + case when per_hour is null then interval '0' else make_interval(hours => ((a.rn - 1) / per_hour)::int) end,
         jsonb_build_object(
           'subject', left(public.campaign_render(case when camp.subject_b is not null and a.rn % 2 = 0 then camp.subject_b else camp.subject end, a.vars), 200),
           'variant', case when camp.subject_b is null then null when a.rn % 2 = 0 then 'b' else 'a' end,
           'preheader', nullif(public.campaign_render(camp.preheader, a.vars), ''),
           'body', public.campaign_render(camp.body, a.vars),
           'cta_label', nullif(btrim(public.campaign_render(camp.cta_label, a.vars)), ''),
           'cta_url', nullif(public.campaign_render(url, a.vars), ''),
           'locale', a.locale,
           'email_token', a.email_token,
           'campaign', true)
    from (
      select e.*, public.campaign_vars(l) as vars, row_number() over (order by random()) as rn
        from public.email_audience(camp.segment) e
        join public.leads l on l.id = e.lead_id
    ) a;
  get diagnostics n = row_count;

  -- El enlace de agenda funciona 14 días para todos los destinatarios.
  if uses_booking then
    update public.leads l set booking_invite_until = greatest(coalesce(l.booking_invite_until, now()), now() + interval '14 days')
      from public.email_queue q
     where q.campaign_id = camp.id and q.lead_id = l.id;
  end if;

  update public.wa_campaigns
     set status = case when n = 0 then 'sent' else 'sending' end,
         started_at = now(), finished_at = case when n = 0 then now() end, total = n
   where id = camp.id;
  return n;
end;
$$;

-- WhatsApp: más fuentes para las variables {{n}} de la plantilla.
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
                      when 'first_name' then a.vars ->> 'nombre'
                      when 'name' then a.vars ->> 'nombre_completo'
                      when 'company' then a.vars ->> 'empresa'
                      when 'owner' then a.vars ->> 'asesor'
                      when 'need' then a.vars ->> 'necesidad'
                      when 'booking_link' then a.vars ->> 'enlace_agenda'
                      when 'quote_link' then a.vars ->> 'enlace_cotizar'
                      else p ->> 'value'
                    end, ''), p ->> 'fallback', '-'), 200)
                    order by ord)
             from jsonb_array_elements(camp.params) with ordinality as e(p, ord)
            where ord <= tpl.variables
         ), '[]'::jsonb)
    from (
      select w.*, public.campaign_vars(l) as vars
        from public.wa_audience(camp.segment) w
        join public.leads l on l.id = w.lead_id
    ) a
  on conflict (campaign_id, phone) do nothing;
  get diagnostics n = row_count;

  if exists (select 1 from jsonb_array_elements(camp.params) p where p ->> 'source' = 'booking_link') then
    update public.leads l set booking_invite_until = greatest(coalesce(l.booking_invite_until, now()), now() + interval '14 days')
      from public.wa_messages m
     where m.campaign_id = camp.id and m.lead_id = l.id;
  end if;

  update public.wa_campaigns
     set status = case when n = 0 then 'sent' else 'sending' end,
         started_at = now(),
         finished_at = case when n = 0 then now() end,
         total = n
   where id = camp.id;
  return n;
end;
$$;

-- Resultado de la prueba A/B del asunto.
create or replace function public.campaign_ab(p_campaign uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_marketer() then coalesce(jsonb_object_agg(variant, jsonb_build_object(
           'sent', sent, 'opened', opened, 'clicked', clicked, 'subject', subject)), '{}'::jsonb) end
    from (
      select payload ->> 'variant' as variant,
             count(*) filter (where status = 'sent') as sent,
             count(opened_at) as opened,
             count(clicked_at) as clicked,
             min(payload ->> 'subject') as subject
        from public.email_queue
       where campaign_id = p_campaign and payload ->> 'variant' is not null
       group by 1
    ) x
$$;
revoke all on function public.campaign_ab(uuid) from public, anon;
grant execute on function public.campaign_ab(uuid) to authenticated;

-- La duplicación copia también el asunto B y el escalonado.
create or replace function public.campaign_duplicate(p_campaign uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.is_marketer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.wa_campaigns (name, template_id, params, segment, status, channel, subject, subject_b, preheader, body,
                                   cta_label, cta_url, utm, throttle_per_hour, created_by)
  select left(name || ' (copia)', 120), template_id, params, segment, 'draft', channel, subject, subject_b, preheader, body,
         cta_label, cta_url, utm, throttle_per_hour, auth.uid()
    from public.wa_campaigns where id = p_campaign
  returning id into new_id;
  if new_id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return new_id;
end;
$$;
