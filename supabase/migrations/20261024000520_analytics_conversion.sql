-- La conversión solo compara lo comparable: leads de visitantes medidos
-- (con consentimiento) frente a esos mismos visitantes.
create or replace function public.analytics_tracked_leads(p_from timestamptz, p_to timestamptz)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct v.lead_id)::int
  from public.visitors v
  join public.leads l on l.id = v.lead_id
  where l.created_at >= p_from and l.created_at < p_to
    and public.is_employee()
$$;
revoke all on function public.analytics_tracked_leads(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_tracked_leads(timestamptz, timestamptz) to authenticated;
