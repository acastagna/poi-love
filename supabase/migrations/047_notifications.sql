-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 047 — Sistema notifiche: preferenze per-utente/per-tipo/per-canale + coda/storico in-app
--                  + trigger che accodano le notifiche dagli eventi REALI (follow, love, nuovo POI, compagnie).
-- Recapito reale ORA: 'in_app' (badge/lista, realtime) ed 'email' (worker esterno, quando c'e' la chiave).
-- 'push' esiste nello schema ma OGGI non recapitabile (nessun service worker): default OFF, UI "Presto".
-- Tutto in schema public, RLS obbligatorie, insert notifiche solo via funzioni/trigger SECURITY DEFINER. Idempotente.

begin;

-- ── Enum tipi evento (allineati alle key applicative del client) ──
do $$ begin
  create type public.notification_event as enum (
    'chat_new_message','companion_invite_received','companion_member_joined',
    'place_arrival_geofence','followed_user_new_poi','poi_received_love',
    'new_follower','route_suggestion_published','route_suggestion_dismissed',
    'route_adopted','gamification_level_up','gamification_badge_earned',
    'poi_shared_with_you','sos_alert'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum ('in_app','push','email');
exception when duplicate_object then null; end $$;

-- ── 1) Preferenze: una riga per (utente, tipo), 3 booleani (un canale per colonna) ──
create table if not exists public.notification_prefs (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event       public.notification_event not null,
  in_app      boolean not null default true,
  push        boolean not null default false,   -- oggi non recapitabile (no service worker)
  email       boolean not null default false,   -- opt-in, anti-spam
  updated_at  timestamptz not null default now(),
  primary key (user_id, event)
);
alter table public.notification_prefs enable row level security;

drop policy if exists notification_prefs_sel on public.notification_prefs;
create policy notification_prefs_sel on public.notification_prefs
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notification_prefs_ins on public.notification_prefs;
create policy notification_prefs_ins on public.notification_prefs
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists notification_prefs_upd on public.notification_prefs;
create policy notification_prefs_upd on public.notification_prefs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists notification_prefs_del on public.notification_prefs;
create policy notification_prefs_del on public.notification_prefs
  for delete to authenticated using (user_id = (select auth.uid()));

-- Default per-tipo se l'utente non ha mai toccato l'interruttore.
create or replace function public.notif_default(p_event public.notification_event)
returns table(in_app boolean, push boolean, email boolean)
language sql immutable as $$
  select
    (p_event <> 'place_arrival_geofence'),                              -- in_app ON per tutto tranne geofence
    false,                                                              -- push OFF ovunque (no SW)
    (p_event in ('companion_invite_received','companion_member_joined', -- email ON solo per i momenti forti
                 'route_suggestion_published','new_follower'));
$$;

-- Preferenza effettiva (riga utente se esiste, altrimenti default del tipo).
create or replace function public.notif_enabled(
  p_user uuid, p_event public.notification_event, p_channel public.notification_channel)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r record; d record;
begin
  select * into r from public.notification_prefs where user_id = p_user and event = p_event;
  if found then
    return case p_channel when 'in_app' then r.in_app when 'push' then r.push else r.email end;
  end if;
  select * into d from public.notif_default(p_event);
  return case p_channel when 'in_app' then d.in_app when 'push' then d.push else d.email end;
end $$;
revoke all on function public.notif_enabled(uuid, public.notification_event, public.notification_channel) from public, anon;
grant execute on function public.notif_enabled(uuid, public.notification_event, public.notification_channel) to authenticated;

-- ── 2) Coda/storico in-app ──
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,   -- destinatario
  event         public.notification_event not null,
  actor_id      uuid references public.profiles(id) on delete set null,           -- chi ha causato l'evento
  entity_type   text,
  entity_id     uuid,
  data          jsonb not null default '{}'::jsonb,   -- {title, name, ...} per testo localizzato lato client
  read_at       timestamptz,
  email_sent_at timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index if not exists notifications_user_all_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Il destinatario legge SOLO le proprie e puo' marcarle lette. Nessuna INSERT dal client.
drop policy if exists notifications_sel on public.notifications;
create policy notifications_sel on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notifications_upd on public.notifications;
create policy notifications_upd on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists notifications_del on public.notifications;
create policy notifications_del on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));
revoke insert on public.notifications from authenticated, anon, public;

-- Producer centrale: accoda una notifica per UN destinatario se l'in-app e' abilitato.
create or replace function public.enqueue_notification(
  p_user uuid, p_event public.notification_event, p_actor uuid,
  p_entity_type text, p_entity_id uuid, p_data jsonb default '{}'::jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_user is null or (p_actor is not null and p_actor = p_user) then return null; end if;
  if not public.notif_enabled(p_user, p_event, 'in_app') then return null; end if;
  insert into public.notifications(user_id, event, actor_id, entity_type, entity_id, data)
    values (p_user, p_event, p_actor, p_entity_type, p_entity_id, coalesce(p_data,'{}'::jsonb))
    returning id into v_id;
  return v_id;
end $$;
revoke all on function public.enqueue_notification(uuid, public.notification_event, uuid, text, uuid, jsonb) from public, anon, authenticated;

-- Realtime per il badge immediato.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; when others then null; end $$;

-- ── 3) TRIGGER: dagli eventi reali alla coda notifiche (tutti additivi, AFTER, SECURITY DEFINER) ──

-- Nuovo follower -> notifica al seguito.
create or replace function public.tg_notif_new_follower()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.enqueue_notification(NEW.following_id, 'new_follower', NEW.follower_id, 'follow', NEW.id, '{}'::jsonb);
  return NEW;
end $$;
drop trigger if exists trg_notif_new_follower on public.follows;
create trigger trg_notif_new_follower after insert on public.follows
  for each row execute function public.tg_notif_new_follower();

-- LOVE ricevuto -> notifica all'autore del POI.
create or replace function public.tg_notif_love()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_title text;
begin
  select author_id, title into v_author, v_title from public.pois where id = NEW.poi_id;
  if v_author is not null then
    perform public.enqueue_notification(v_author, 'poi_received_love', NEW.user_id, 'poi', NEW.poi_id,
      jsonb_build_object('title', coalesce(v_title,'')));
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notif_love on public.loves;
create trigger trg_notif_love after insert on public.loves
  for each row execute function public.tg_notif_love();

-- Un utente seguito crea un nuovo POI community -> notifica a tutti i suoi follower.
create or replace function public.tg_notif_new_poi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.visibility = 'community' then
    insert into public.notifications(user_id, event, actor_id, entity_type, entity_id, data)
    select f.follower_id, 'followed_user_new_poi', NEW.author_id, 'poi', NEW.id,
           jsonb_build_object('title', coalesce(NEW.title,''))
    from public.follows f
    where f.following_id = NEW.author_id
      and f.follower_id <> NEW.author_id
      and public.notif_enabled(f.follower_id, 'followed_user_new_poi', 'in_app');
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notif_new_poi on public.pois;
create trigger trg_notif_new_poi after insert on public.pois
  for each row execute function public.tg_notif_new_poi();

-- Invito a compagnia (solo se l'invitato e' un utente registrato: user_id valorizzato).
create or replace function public.tg_notif_comp_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if NEW.user_id is not null and NEW.status = 'invited' then
    select name into v_name from public.companions where id = NEW.companion_id;
    perform public.enqueue_notification(NEW.user_id, 'companion_invite_received', null, 'companion', NEW.companion_id,
      jsonb_build_object('name', coalesce(v_name,'')));
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notif_comp_invite on public.companion_members;
create trigger trg_notif_comp_invite after insert on public.companion_members
  for each row execute function public.tg_notif_comp_invite();

-- Qualcuno entra in una compagnia -> notifica all'owner della compagnia.
create or replace function public.tg_notif_comp_join()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_name text;
begin
  if NEW.status = 'joined' and coalesce(OLD.status,'') <> 'joined' then
    select owner_id, name into v_owner, v_name from public.companions where id = NEW.companion_id;
    if v_owner is not null then
      perform public.enqueue_notification(v_owner, 'companion_member_joined', NEW.user_id, 'companion', NEW.companion_id,
        jsonb_build_object('name', coalesce(v_name,'')));
    end if;
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notif_comp_join on public.companion_members;
create trigger trg_notif_comp_join after update on public.companion_members
  for each row execute function public.tg_notif_comp_join();

commit;
