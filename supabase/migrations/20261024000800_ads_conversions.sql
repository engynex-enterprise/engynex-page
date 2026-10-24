-- =============================================================================
-- Fase 7 — Conversiones offline para Google Ads
--
-- Los leads que llegaron desde un anuncio guardan su gclid. Cuando avanzan en
-- el CRM (lead calificado, reunión, venta) se reportan a Google Ads para que
-- las campañas optimicen hacia clientes reales y no solo formularios.
-- Google Ads acepta clics de hasta 90 días.
-- =============================================================================

create or replace function public.ads_offline_conversions(p_days integer default 90)
returns table (gclid text, kind text, converted_at timestamptz, value numeric, lead_id uuid)
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
  with ads_leads as (
    select l.* from public.leads l
     where l.gclid is not null and l.created_at > now() - make_interval(days => least(greatest(p_days, 1), 90))
  )
  -- Lead calificado: verde al llegar.
  select a.gclid, 'qualified'::text, a.created_at, null::numeric, a.id
    from ads_leads a where a.tier = 'green'
  union all
  -- Reunión agendada (la primera que no se canceló).
  select a.gclid, 'meeting', min(ap.created_at), null::numeric, a.id
    from ads_leads a join public.appointments ap on ap.lead_id = a.id
   where ap.status <> 'cancelled'
   group by a.id, a.gclid
  union all
  -- Venta: el lead pasó a "ganado" (con su valor, si se registró).
  select a.gclid, 'won', min(act.created_at), max(a.value_cop)::numeric, a.id
    from ads_leads a join public.lead_activities act on act.lead_id = a.id
   where a.status = 'won' and act.type = 'status_change' and act.meta ->> 'to' = 'won'
   group by a.id, a.gclid
  order by 3;
end;
$$;

revoke all on function public.ads_offline_conversions(integer) from public, anon;
grant execute on function public.ads_offline_conversions(integer) to authenticated, service_role;
