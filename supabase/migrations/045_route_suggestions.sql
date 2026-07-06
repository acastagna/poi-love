-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 045: segnalazioni di ROTTE STORICHE dagli utenti. L'utente propone una rotta
-- (nome, descrizione, zona); l'amministrazione valuta, sceglie le immagini giuste,
-- rifinisce la descrizione e la pubblica dando CREDITO PUBBLICO al segnalatore
-- ("Ringraziamento a: Nome", linkato al profilo).
--   L2 modello: identico a category_requests/ownership (tabella + RPC definer + triage admin).
--   Il credito vive in trips.suggested_by (uuid FK profiles), scrivibile SOLO via RPC
--   admin: nessuno puo' auto-accreditarsi. La descrizione della rotta va in
--   trips.description (contenuto editabile dall'admin, come name/badge).

-- ── trips: descrizione + credito segnalatore ─────────────────────────────────
alter table public.trips add column if not exists description   text;
alter table public.trips add column if not exists suggested_by  uuid references public.profiles(id) on delete set null;
-- description e' contenuto editabile (come name/badge): grant colonna a authenticated.
-- suggested_by NON e' grantato: si tocca solo dalle RPC SECURITY DEFINER qui sotto.
grant update (description) on public.trips to authenticated;

-- ── Tabella segnalazioni ─────────────────────────────────────────────────────
create table if not exists public.route_suggestions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  description       text,
  area              text,
  status            text not null default 'pending',        -- pending | published | dismissed
  published_trip_id uuid references public.trips(id) on delete set null,
  handled_by        uuid references public.profiles(id) on delete set null,
  handled_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists route_suggestions_status_idx on public.route_suggestions (status, created_at desc);

alter table public.route_suggestions enable row level security;
-- l'utente crea le sue; vede le sue; l'admin vede/gestisce tutte
drop policy if exists route_suggestions_insert on public.route_suggestions;
create policy route_suggestions_insert on public.route_suggestions
  for insert with check (user_id = (select auth.uid()));
drop policy if exists route_suggestions_select on public.route_suggestions;
create policy route_suggestions_select on public.route_suggestions
  for select using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));
drop policy if exists route_suggestions_admin_update on public.route_suggestions;
create policy route_suggestions_admin_update on public.route_suggestions
  for update using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

-- ── RPC utente: invia una segnalazione (login obbligatorio, anti-spam) ────────
create or replace function public.submit_route_suggestion(p_name text, p_description text default null, p_area text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text := trim(coalesce(p_name, ''));
  v_pending int;
  v_id uuid;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  if length(v_name) < 3 or length(v_name) > 120 then raise exception 'bad name'; end if;
  -- anti-spam: massimo 5 segnalazioni ancora in attesa per utente
  select count(*) into v_pending from public.route_suggestions where user_id = v_uid and status = 'pending';
  if v_pending >= 5 then raise exception 'too many pending'; end if;
  insert into public.route_suggestions(user_id, name, description, area)
  values (v_uid, v_name, nullif(left(trim(coalesce(p_description,'')), 1500), ''), nullif(left(trim(coalesce(p_area,'')), 120), ''))
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.submit_route_suggestion(text,text,text) from public, anon;
grant execute on function public.submit_route_suggestion(text,text,text) to authenticated;

-- ── RPC admin: crea una rotta BOZZA dalla segnalazione, col credito attaccato ──
-- La rotta nasce non pubblicata: l'admin poi rifinisce descrizione/immagine/tappe e
-- la pubblica con gli strumenti esistenti. Il credito (suggested_by) e' gia' dentro.
create or replace function public.admin_route_from_suggestion(p_suggestion_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_s   public.route_suggestions%rowtype;
  v_trip uuid;
begin
  if not public.is_admin(v_uid) then raise exception 'not authorized'; end if;
  select * into v_s from public.route_suggestions where id = p_suggestion_id;
  if not found then raise exception 'not found'; end if;
  if v_s.status <> 'pending' then raise exception 'already handled'; end if;

  insert into public.trips(owner_id, name, description, badge, is_historic, is_published, suggested_by)
  values (v_uid, left(v_s.name,120), v_s.description, null, true, false, v_s.user_id)
  returning id into v_trip;

  update public.route_suggestions
     set status = 'published', published_trip_id = v_trip, handled_by = v_uid, handled_at = now()
   where id = p_suggestion_id;

  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (v_uid, 'route_from_suggestion', 'trip', v_trip::text,
          jsonb_build_object('suggestion_id', p_suggestion_id, 'suggested_by', v_s.user_id));
  return v_trip;
end $$;
revoke execute on function public.admin_route_from_suggestion(uuid) from public, anon, authenticated;
grant execute on function public.admin_route_from_suggestion(uuid) to authenticated;

-- ── RPC admin: scarta una segnalazione ───────────────────────────────────────
create or replace function public.admin_dismiss_route_suggestion(p_suggestion_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if not public.is_admin(v_uid) then raise exception 'not authorized'; end if;
  update public.route_suggestions
     set status = 'dismissed', handled_by = v_uid, handled_at = now()
   where id = p_suggestion_id and status = 'pending';
  if not found then return false; end if;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (v_uid, 'route_suggestion_dismiss', 'route_suggestion', p_suggestion_id::text, '{}'::jsonb);
  return true;
end $$;
revoke execute on function public.admin_dismiss_route_suggestion(uuid) from public, anon, authenticated;
grant execute on function public.admin_dismiss_route_suggestion(uuid) to authenticated;
