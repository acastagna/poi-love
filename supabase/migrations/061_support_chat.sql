-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 061 — Chat di supporto: amministratore/moderatore <-> cliente, dentro ILLI•AI.
-- L'admin scrive a un utente; il messaggio compare nella chat ILLI del cliente con etichetta "Umano".
-- Il cliente vede un badge coi non letti e può rispondere. Nessun service_role lato client:
-- l'admin agisce SOLO tramite RPC SECURITY DEFINER che verificano is_admin + moderation_status.

begin;

create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,   -- il CLIENTE, proprietario della conversazione
  sender     text not null check (sender in ('admin','user')),            -- chi ha scritto il messaggio
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at    timestamptz                                                  -- quando il destinatario l'ha letto
);
create index if not exists support_messages_user_idx on public.support_messages(user_id, created_at);
create index if not exists support_messages_unread_idx on public.support_messages(user_id) where read_at is null;

alter table public.support_messages enable row level security;

-- ── RLS lato CLIENTE: vede e scrive SOLO la propria conversazione ──
drop policy if exists sm_user_select on public.support_messages;
create policy sm_user_select on public.support_messages for select to authenticated
  using (user_id = auth.uid());

drop policy if exists sm_user_insert on public.support_messages;
create policy sm_user_insert on public.support_messages for insert to authenticated
  with check (user_id = auth.uid() and sender = 'user');

-- il cliente può segnare come letti i messaggi dell'admin (aggiorna read_at) nella propria conversazione
drop policy if exists sm_user_update on public.support_messages;
create policy sm_user_update on public.support_messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Helper: il chiamante è admin attivo? ──
create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true and moderation_status = 'active'
  );
$$;

-- ── RPC ADMIN: invia un messaggio a un cliente (verifica is_admin lato server) ──
create or replace function public.admin_send_support_message(p_user_id uuid, p_body text)
returns public.support_messages
language plpgsql security definer set search_path = public as $$
declare r public.support_messages;
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  if p_body is null or char_length(btrim(p_body)) = 0 then raise exception 'empty body'; end if;
  insert into public.support_messages(user_id, sender, body)
    values (p_user_id, 'admin', left(btrim(p_body), 4000))
  returning * into r;
  return r;
end $$;

-- ── RPC ADMIN: leggi l'intera conversazione di un cliente ──
create or replace function public.admin_list_support(p_user_id uuid)
returns setof public.support_messages
language sql stable security definer set search_path = public as $$
  select * from public.support_messages
  where user_id = p_user_id and public.is_active_admin()
  order by created_at asc;
$$;

-- ── RPC ADMIN: elenca le conversazioni (ultima riga + non letti dal cliente) ──
create or replace function public.admin_support_threads()
returns table(user_id uuid, username text, avatar_url text, last_body text, last_at timestamptz, unread_from_user int)
language sql stable security definer set search_path = public as $$
  select sm.user_id, p.username, p.avatar_url,
    (select body from public.support_messages x where x.user_id = sm.user_id order by x.created_at desc limit 1) as last_body,
    max(sm.created_at) as last_at,
    count(*) filter (where sm.sender = 'user' and sm.read_at is null)::int as unread_from_user
  from public.support_messages sm
  join public.profiles p on p.id = sm.user_id
  where public.is_active_admin()
  group by sm.user_id, p.username, p.avatar_url
  order by last_at desc;
$$;

-- ── RPC ADMIN: segna come letti i messaggi del cliente in una conversazione ──
create or replace function public.admin_mark_support_read(p_user_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.support_messages
    set read_at = now()
  where user_id = p_user_id and sender = 'user' and read_at is null and public.is_active_admin();
$$;

grant execute on function public.admin_send_support_message(uuid, text) to authenticated;
grant execute on function public.admin_list_support(uuid) to authenticated;
grant execute on function public.admin_support_threads() to authenticated;
grant execute on function public.admin_mark_support_read(uuid) to authenticated;
grant execute on function public.is_active_admin() to authenticated;

-- ── Realtime: il cliente riceve in tempo reale i messaggi dell'admin ──
do $$ begin
  begin execute 'alter publication supabase_realtime add table public.support_messages'; exception when others then null; end;
end $$;

commit;
