-- =============================================================================
-- Proyectos: el equipo publica una novedad y, si es visible para el cliente,
-- se le avisa (campana + correo). Las notificaciones solo las crea el
-- servidor, por eso va en una función propia.
-- =============================================================================

create or replace function public.project_post_update(p_project uuid, p_body text, p_kind text default 'update', p_link text default null, p_visible boolean default true)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  p public.client_projects;
  acc public.profiles;
  uid bigint;
  v_kind text := case when p_kind in ('update', 'delivery', 'question') then p_kind else 'update' end;
  v_link text := nullif(btrim(coalesce(p_link, '')), '');
begin
  if not public.is_support_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into p from public.client_projects where id = p_project;
  if p.id is null or nullif(btrim(p_body), '') is null then
    raise exception 'invalid' using errcode = '22023';
  end if;
  if v_link is not null and v_link !~* '^https?://' then
    raise exception 'invalid' using errcode = '22023';
  end if;
  insert into public.project_updates (project_id, author_id, kind, body, link_url, visible_to_client)
  values (p.id, auth.uid(), v_kind, left(btrim(p_body), 4000), left(v_link, 500), coalesce(p_visible, true))
  returning id into uid;
  update public.client_projects set updated_at = now() where id = p.id;

  if coalesce(p_visible, true) then
    select * into acc from public.profiles where id = p.account_id;
    -- notify() solo llega a empleados; al cliente se le escribe directo.
    insert into public.notifications (user_id, kind, title, body, link)
    values (p.account_id, 'ticket',
      left(case v_kind when 'delivery' then '📦 Nueva entrega en ' when 'question' then '❓ Tenemos una pregunta sobre ' else '📣 Novedad en ' end || p.name, 200),
      left(btrim(p_body), 300), '/es/portal/proyectos/' || p.id);
    insert into public.email_queue (kind, to_email, payload)
    values ('custom', acc.email, jsonb_build_object(
      'subject', case v_kind when 'delivery' then 'Nueva entrega en ' when 'question' then 'Una pregunta sobre ' else 'Novedades de ' end || p.name,
      'body', 'Hola ' || split_part(coalesce(acc.full_name, acc.email), ' ', 1) || E',\n\n' || left(btrim(p_body), 3000),
      'cta_label', 'Ver mi proyecto', 'cta_url', 'https://engynex.com/es/portal/proyectos/' || p.id, 'locale', 'es'));
  end if;
  return uid;
end;
$$;
revoke all on function public.project_post_update(uuid, text, text, text, boolean) from public, anon;
grant execute on function public.project_post_update(uuid, text, text, text, boolean) to authenticated;

-- Nombre del responsable del proyecto (el cliente no puede leer perfiles del equipo).
create or replace function public.project_manager_name(p_project uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(m.full_name, split_part(m.email, '@', 1))
    from public.client_projects p
    join public.profiles m on m.id = p.manager_id
   where p.id = p_project
     and (p.account_id = (select auth.uid()) or (select public.is_employee()));
$$;
revoke all on function public.project_manager_name(uuid) from public, anon;
grant execute on function public.project_manager_name(uuid) to authenticated;
