-- =============================================================================
-- Fase 0 — Base: perfiles, roles y permisos
--
-- Cada usuario de Supabase Auth tiene un perfil con su tipo (cliente,
-- proveedor o empleado) y su rol. El rol NUNCA lo elige el usuario al
-- registrarse: viene de `app_metadata` (solo lo escribe el servidor con la
-- clave secreta, al invitar) y, si no hay, es "client".
-- =============================================================================

create type public.app_role as enum (
  'admin',      -- todo, incluida la gestión de usuarios y roles
  'sales',      -- CRM, agenda, chat
  'marketing',  -- analítica, campañas, CRM (lectura)
  'support',    -- chat, tickets
  'client',     -- portal de cliente
  'provider'    -- portal de proveedor
);

create type public.account_kind as enum ('client', 'provider', 'employee');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  company text,
  kind public.account_kind not null default 'client',
  role public.app_role not null default 'client',
  active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- El tipo y el rol deben ser coherentes.
  constraint profiles_kind_role check (
    (kind = 'client' and role = 'client')
    or (kind = 'provider' and role = 'provider')
    or (kind = 'employee' and role in ('admin', 'sales', 'marketing', 'support'))
  )
);

comment on table public.profiles is
  'Perfil de cada usuario: tipo de cuenta, rol y datos de contacto.';

-- -----------------------------------------------------------------------------
-- Funciones de ayuda para las reglas RLS (security definer: leen el perfil
-- sin pasar por RLS, para no crear recursión).
-- -----------------------------------------------------------------------------

create or replace function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = auth.uid() and active
$$;

create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and kind = 'employee'
  )
$$;

create or replace function public.has_role(roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = any (roles)
  )
$$;

-- -----------------------------------------------------------------------------
-- Perfil automático al crear un usuario.
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
  -- Solo app_metadata (escrita por el servidor) puede dar un rol distinto.
  if app_kind_value in ('client', 'provider', 'employee') then
    v_kind := app_kind_value::public.account_kind;
  end if;
  if app_role_value in ('admin', 'sales', 'marketing', 'support', 'client', 'provider') then
    v_role := app_role_value::public.app_role;
  end if;
  -- Coherencia por si los metadatos vienen incompletos.
  if v_kind = 'provider' then v_role := 'provider'; end if;
  if v_kind = 'client' then v_role := 'client'; end if;
  if v_kind = 'employee' and v_role in ('client', 'provider') then v_role := 'support'; end if;

  insert into public.profiles (id, email, full_name, kind, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    v_kind,
    v_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático (se reutiliza en las demás tablas).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Cada usuario ve su perfil; los empleados ven todos.
create policy "profiles: ver propio o empleados"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_employee()));

-- Cada usuario edita sus datos de contacto (no su rol ni su tipo: lo impide
-- el trigger de abajo).
create policy "profiles: editar propio"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Solo administradores cambian cualquier perfil (rol, tipo, activo).
create policy "profiles: admin edita todos"
  on public.profiles for update
  to authenticated
  using ((select public.has_role(array['admin']::public.app_role[])))
  with check ((select public.has_role(array['admin']::public.app_role[])));

-- Un usuario normal no puede subirse de rol editando su propio perfil.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role
      or new.kind is distinct from old.kind
      or new.active is distinct from old.active)
     and not public.has_role(array['admin']::public.app_role[])
     and auth.uid() is not null then
    raise exception 'Solo un administrador puede cambiar el rol, el tipo o el estado de una cuenta.';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Las funciones de ayuda solo las usan usuarios con sesión.
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.is_employee() from public, anon;
revoke execute on function public.has_role(public.app_role[]) from public, anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.is_employee() to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;
