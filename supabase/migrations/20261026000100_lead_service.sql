-- Servicio y resumen de cada solicitud, para ver en la lista del CRM qué
-- pidió cada lead sin abrirlo. El servicio llega del formulario (?servicio=)
-- o se deduce de la página /servicios/<slug> donde se llenó.
alter table public.leads
  add column if not exists service text,
  add column if not exists request_summary text;

create index if not exists leads_service_idx on public.leads (service);

-- Solicitudes existentes: página de servicio y calculadora de renting.
update public.leads
set service = substring(source_page from '/servicios/([a-z0-9-]+)')
where service is null and source_page ~ '/servicios/[a-z0-9-]+';

update public.leads
set service = 'alquiler-equipos',
    request_summary = left(regexp_replace(btrim(substring(problem_text from 11)), E'\\s*\\n\\s*', ' · ', 'g'), 200)
where problem_text like '[Renting]%';

create or replace function public.submit_lead(p jsonb)
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
  -- Servicio: el que manda el formulario o el de la página /servicios/<slug>.
  v_service text := coalesce(nullif(btrim(p ->> 'service'), ''), substring(p ->> 'source_page' from '/servicios/([a-z0-9-]+)'));
  v_summary text := nullif(left(btrim(p ->> 'summary'), 200), '');
  v_value bigint := case when (p ->> 'value_cop') ~ '^[0-9]{1,13}$' then (p ->> 'value_cop')::bigint end;
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

  if v_service is not null and v_service !~ '^[a-z0-9-]{2,40}$' then
    v_service := null;
  end if;

  result := public.score_lead(v_category, v_text, v_budget, v_decision, v_timeline);

  insert into public.leads (
    name, email, phone, company,
    problem_category, problem_text, budget, decision, timeline,
    score, tier, score_breakdown,
    locale, source_page, referrer, utm, gclid, visitor_id, consent_at, whatsapp_opt_in_at,
    service, request_summary, value_cop
  ) values (
    v_name, v_email, v_phone, nullif(btrim(p ->> 'company'), ''),
    v_category, v_text, v_budget, v_decision, v_timeline,
    (result ->> 'score')::smallint, (result ->> 'tier')::public.lead_tier,
    result -> 'breakdown',
    left(p ->> 'locale', 5), left(p ->> 'source_page', 500), left(p ->> 'referrer', 500),
    case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end,
    left(p ->> 'gclid', 200), left(p ->> 'visitor_id', 100), now(),
    case when coalesce((p ->> 'whatsapp_opt_in')::boolean, false) then now() end,
    v_service, v_summary, v_value
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
