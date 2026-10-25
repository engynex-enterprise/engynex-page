-- =============================================================================
-- Reuniones del cliente: cancelar desde el portal
--   La reunión debe ser de un lead con el mismo correo de la cuenta. Se avisa
--   al anfitrión (o al responsable del lead) y se cancelan los recordatorios.
-- =============================================================================

create or replace function public.my_appointment_cancel(p_id uuid, p_reason text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  a public.appointments;
  l public.leads;
  reason text := left(nullif(btrim(p_reason), ''), 500);
begin
  select * into p from public.profiles where id = auth.uid() and active;
  if p.id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select a2.* into a
    from public.appointments a2
    join public.leads l2 on l2.id = a2.lead_id
   where a2.id = p_id and lower(l2.email) = lower(p.email);
  if a.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if a.status <> 'scheduled' or a.starts_at < now() then
    raise exception 'not_cancellable' using errcode = '22023';
  end if;

  update public.appointments set status = 'cancelled', cancel_reason = coalesce(reason, 'Cancelada por el cliente') where id = a.id;
  select * into l from public.leads where id = a.lead_id;
  insert into public.lead_activities (lead_id, author_id, type, body, meta)
  values (a.lead_id, auth.uid(), 'appointment', 'El cliente canceló la reunión' || coalesce(': ' || reason, ''), jsonb_build_object('kind', 'cancelled', 'by', 'client'));
  update public.email_queue set status = 'cancelled', error = 'client_cancelled'
   where lead_id = a.lead_id and status = 'queued' and kind = 'booking_confirmation';

  perform public.notify(
    case when coalesce(a.host_id, l.assigned_to) is null then array['admin', 'sales']::public.app_role[] end,
    coalesce(a.host_id, l.assigned_to),
    'meeting',
    '📅 ' || coalesce(p.full_name, p.email) || ' canceló la reunión',
    to_char(a.starts_at at time zone 'America/Bogota', 'DD/MM/YYYY HH24:MI') || coalesce(' · ' || reason, ''),
    '/es/portal/agenda');
end;
$$;
revoke all on function public.my_appointment_cancel(uuid, text) from public, anon;
grant execute on function public.my_appointment_cancel(uuid, text) to authenticated;

-- Asesor asignado a la cuenta del cliente (responsable en account_details).
create or replace function public.my_account_manager()
returns table (full_name text, email text, phone text)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(o.full_name, o.email), o.email, nullif(o.phone, '')
    from public.account_details d
    join public.profiles o on o.id = d.owner_id and o.active
   where d.profile_id = auth.uid()
$$;
revoke all on function public.my_account_manager() from public, anon;
grant execute on function public.my_account_manager() to authenticated;
