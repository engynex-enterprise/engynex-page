-- =============================================================================
-- Fase 2 — Cuentas: sin registro público, alta por administradores,
-- contraseña temporal con cambio obligatorio.
-- =============================================================================

alter table public.profiles
  add column must_change_password boolean not null default false,
  add column last_seen_at timestamptz;

-- -----------------------------------------------------------------------------
-- Sin registro público: solo se crean usuarios desde admin_create_user (o
-- desde el panel de Supabase / la clave secreta, que marcan created_by).
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_role_value text := new.raw_app_meta_data ->> 'role';
  app_kind_value text := new.raw_app_meta_data ->> 'kind';
  v_role public.app_role := 'client';
  v_kind public.account_kind := 'client';
begin
  -- Los registros desde el formulario público de Supabase (signUp con la
  -- clave publicable) no traen `created_by` en app_metadata: se rechazan.
  if coalesce(new.raw_app_meta_data ->> 'created_by', '') = '' then
    raise exception 'Public sign-ups are disabled. Accounts are created by an administrator.';
  end if;

  if app_kind_value in ('client', 'provider', 'employee') then
    v_kind := app_kind_value::public.account_kind;
  end if;
  if app_role_value in ('admin', 'sales', 'marketing', 'support', 'client', 'provider') then
    v_role := app_role_value::public.app_role;
  end if;
  if v_kind = 'provider' then v_role := 'provider'; end if;
  if v_kind = 'client' then v_role := 'client'; end if;
  if v_kind = 'employee' and v_role in ('client', 'provider') then v_role := 'support'; end if;

  insert into public.profiles (id, email, full_name, phone, company, kind, role, must_change_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'company', ''),
    v_kind,
    v_role,
    coalesce((new.raw_app_meta_data ->> 'must_change_password')::boolean, false)
  );
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Alta de usuarios por un administrador
-- -----------------------------------------------------------------------------

create or replace function public.generate_temp_password()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 16 caracteres sin ambiguos (0/O, 1/l/I), con mayúsculas, minúsculas y
  -- números, más un símbolo al final.
  select string_agg(
           substr('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',
                  1 + (get_byte(extensions.gen_random_bytes(1), 0) % 56), 1), '')
         || '#'
  from generate_series(1, 15)
$$;

create or replace function public.admin_create_user(
  p_email text,
  p_full_name text,
  p_kind public.account_kind,
  p_role public.app_role,
  p_phone text default null,
  p_company text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := gen_random_uuid();
  v_email text := lower(btrim(p_email));
  temp_password text := public.generate_temp_password();
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'email_exists' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    v_email,
    extensions.crypt(temp_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email', 'providers', jsonb_build_array('email'),
      'kind', p_kind, 'role', p_role,
      'created_by', auth.uid(), 'must_change_password', true
    ),
    jsonb_build_object(
      'full_name', btrim(p_full_name),
      'phone', coalesce(btrim(p_phone), ''),
      'company', coalesce(btrim(p_company), '')
    ),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', v_email, 'email_verified', true),
    'email', now(), now()
  );

  return jsonb_build_object('id', uid, 'email', v_email, 'temp_password', temp_password);
end;
$$;

-- Restablece la contraseña de otro usuario (nueva temporal).
create or replace function public.admin_reset_password(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  temp_password text := public.generate_temp_password();
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(temp_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  update public.profiles set must_change_password = true where id = p_user;
  return jsonb_build_object('temp_password', temp_password);
end;
$$;

-- Activa o desactiva una cuenta (desactivar también bloquea el inicio de
-- sesión en Supabase Auth).
create or replace function public.admin_set_active(p_user uuid, p_active boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user = auth.uid() and not p_active then
    raise exception 'cannot_deactivate_self' using errcode = '22023';
  end if;
  update public.profiles set active = p_active where id = p_user;
  update auth.users
     set banned_until = case when p_active then null else '2999-12-31 00:00:00+00'::timestamptz end
   where id = p_user;
end;
$$;

-- Cambia tipo y rol (valida la coherencia y que quede al menos un admin).
create or replace function public.admin_set_role(
  p_user uuid,
  p_kind public.account_kind,
  p_role public.app_role
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role <> 'admin'
     and (select role from public.profiles where id = p_user) = 'admin'
     and (select count(*) from public.profiles where role = 'admin' and active) <= 1 then
    raise exception 'last_admin' using errcode = '22023';
  end if;
  update public.profiles set kind = p_kind, role = p_role where id = p_user;
end;
$$;

-- El propio usuario marca que ya cambió su contraseña temporal.
create or replace function public.mark_password_changed()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.profiles set must_change_password = false where id = auth.uid()
$$;

-- Última actividad (para "visto por última vez" en la gestión de usuarios).
create or replace function public.touch_last_seen()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.profiles set last_seen_at = now()
  where id = auth.uid() and (last_seen_at is null or last_seen_at < now() - interval '5 minutes')
$$;

revoke all on function public.generate_temp_password() from public, anon, authenticated;
revoke all on function public.admin_create_user(text, text, public.account_kind, public.app_role, text, text) from public, anon;
revoke all on function public.admin_reset_password(uuid) from public, anon;
revoke all on function public.admin_set_active(uuid, boolean) from public, anon;
revoke all on function public.admin_set_role(uuid, public.account_kind, public.app_role) from public, anon;
revoke all on function public.mark_password_changed() from public, anon;
revoke all on function public.touch_last_seen() from public, anon;
grant execute on function public.admin_create_user(text, text, public.account_kind, public.app_role, text, text) to authenticated;
grant execute on function public.admin_reset_password(uuid) to authenticated;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;
grant execute on function public.admin_set_role(uuid, public.account_kind, public.app_role) to authenticated;
grant execute on function public.mark_password_changed() to authenticated;
grant execute on function public.touch_last_seen() to authenticated;

-- El guardia de privilegios ya impide que un usuario cambie su rol/tipo/
-- estado; las funciones admin_* lo hacen como security definer (auth.uid()
-- sigue siendo el admin, que sí tiene permiso).
