-- =============================================================================
-- Bandeja de notificaciones (campana de la barra superior) y buscador global.
-- =============================================================================

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (char_length(kind) <= 40),
  title text not null check (char_length(title) <= 200),
  body text check (char_length(body) <= 500),
  link text check (char_length(link) <= 300),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notifications: cada quien las suyas" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: marcar leídas" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: borrar las suyas" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.notifications;

-- Avisar a todos los empleados activos con ciertos roles (o a una persona).
create or replace function public.notify(p_roles public.app_role[], p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, left(p_kind, 40), left(p_title, 200), left(p_body, 500), left(p_link, 300)
    from public.profiles p
   where p.active and p.kind = 'employee'
     and ((p_user is not null and p.id = p_user) or (p_user is null and p.role = any (p_roles)));
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.notify(public.app_role[], uuid, text, text, text, text) from public, anon, authenticated;

create or replace function public.notifications_mark_all_read()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;
revoke all on function public.notifications_mark_all_read() from public, anon;
grant execute on function public.notifications_mark_all_read() to authenticated;

-- Limpieza: notificaciones leídas de más de 60 días.
select cron.schedule('purge-notifications', '50 8 * * *',
  $$delete from public.notifications where read_at is not null and created_at < now() - interval '60 days'$$);

-- -----------------------------------------------------------------------------
-- Buscador global (Ctrl+K). Con los permisos de quien busca (RLS).
-- -----------------------------------------------------------------------------
create or replace function public.global_search(p_q text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  q text := '%' || replace(replace(replace(btrim(coalesce(p_q, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  n integer := nullif(regexp_replace(coalesce(p_q, ''), '\D', '', 'g'), '')::integer;
begin
  if char_length(btrim(coalesce(p_q, ''))) < 2 then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'leads', coalesce((select jsonb_agg(x) from (
      select id, name, email, company, tier::text as tier, status::text as status
        from public.leads where name ilike q or email ilike q or company ilike q or phone ilike q
       order by created_at desc limit 6) x), '[]'),
    'chats', coalesce((select jsonb_agg(x) from (
      select id, name, email, last_message, channel
        from public.chat_conversations where name ilike q or email ilike q or phone ilike q or last_message ilike q
       order by last_message_at desc limit 5) x), '[]'),
    'tickets', coalesce((select jsonb_agg(x) from (
      select id, number, subject, name, status::text as status
        from public.tickets where subject ilike q or name ilike q or email ilike q or number = n
       order by last_activity_at desc limit 5) x), '[]'),
    'accounts', coalesce((select jsonb_agg(x) from (
      select id, full_name, email, company, kind::text as kind
        from public.profiles where kind in ('client', 'provider') and (full_name ilike q or email ilike q or company ilike q)
       order by full_name limit 5) x), '[]')
  );
end;
$$;
revoke all on function public.global_search(text) from public, anon;
grant execute on function public.global_search(text) to authenticated;
