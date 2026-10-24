-- Resumen por campaña para el portal.
create or replace function public.wa_campaign_stats()
returns table (campaign_id uuid, sent int, delivered int, read int, replied int, failed int, pending int)
language sql
stable
security definer
set search_path = ''
as $$
  select m.campaign_id,
         count(*) filter (where m.status in ('sent', 'delivered', 'read'))::int,
         count(*) filter (where m.status in ('delivered', 'read'))::int,
         count(*) filter (where m.status = 'read')::int,
         count(*) filter (where m.replied_at is not null)::int,
         count(*) filter (where m.status = 'failed')::int,
         count(*) filter (where m.status in ('queued', 'sending'))::int
    from public.wa_messages m
   where public.is_marketer()
   group by m.campaign_id
$$;
revoke all on function public.wa_campaign_stats() from public, anon;
grant execute on function public.wa_campaign_stats() to authenticated;
