-- Historial del lead: texto legible para los correos automáticos.
create or replace function public.email_mark(p_id bigint, p_status text, p_error text default null, p_provider_id text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_service() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.email_queue
     set status = p_status, error = left(p_error, 500), provider_id = p_provider_id,
         sent_at = case when p_status = 'sent' then now() end
   where id = p_id;
  insert into public.lead_activities (lead_id, type, body, meta)
  select q.lead_id, 'email',
         case q.kind
           when 'followup_1' then 'Correo automático 1 de 3: recursos para su caso'
           when 'followup_2' then 'Correo automático 2 de 3: invitación a agendar'
           when 'followup_3' then 'Correo automático 3 de 3: ¿seguimos?'
           when 'booking_confirmation' then 'Correo de confirmación de la reunión'
         end,
         jsonb_build_object('kind', q.kind, 'auto', true)
    from public.email_queue q
   where q.id = p_id and p_status = 'sent' and q.lead_id is not null
     and q.kind in ('followup_1', 'followup_2', 'followup_3', 'booking_confirmation');
end;
$$;
revoke all on function public.email_mark(bigint, text, text, text) from public, anon, authenticated;
grant execute on function public.email_mark(bigint, text, text, text) to service_role;
