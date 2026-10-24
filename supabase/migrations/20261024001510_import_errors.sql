-- Importación: devuelve por qué se omitió cada fila.
create or replace function public.import_leads(p_rows jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r jsonb;
  i integer := 0;
  inserted integer := 0;
  errors jsonb := '[]'::jsonb;
begin
  if not public.has_role(array['admin', 'sales']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 2000 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    if exists (select 1 from public.leads where lower(email) = lower(btrim(r ->> 'email'))) then
      errors := errors || jsonb_build_object('row', i, 'email', r ->> 'email', 'reason', 'duplicate');
      continue;
    end if;
    begin
      perform public.staff_create_lead(r || jsonb_build_object('source', 'import'));
      inserted := inserted + 1;
    exception
      when check_violation then
        errors := errors || jsonb_build_object('row', i, 'email', r ->> 'email', 'reason',
          case when sqlerrm like '%phone%' then 'phone' else 'invalid' end);
      when others then
        errors := errors || jsonb_build_object('row', i, 'email', r ->> 'email', 'reason', 'invalid');
    end;
  end loop;
  return jsonb_build_object('inserted', inserted, 'skipped', jsonb_array_length(errors), 'errors', errors);
end;
$$;
revoke all on function public.import_leads(jsonb) from public, anon;
grant execute on function public.import_leads(jsonb) to authenticated;
