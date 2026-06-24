-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 002 — Accredito punti server-side (atomico, anti-abuso)
-- I punti NON si accreditano dal client: sono i TRIGGER del database a darli quando l'azione
-- reale avviene (POI creato, love inserito, lista creata, referral confermato). Lo share, che
-- non ha un record, passa da una RPC con validazione + tetto giornaliero. Tutto SECURITY DEFINER.

begin;

-- Dedup forte a livello di DB: la stessa coppia (utente, azione, entita') vale una sola volta.
-- entity_id e' sempre valorizzato dalle nostre azioni, quindi l'unique copre tutti i casi.
create unique index if not exists uq_point_events_dedup
  on public.point_events(user_id, action, entity_id);

-- Funzione centrale: legge i punti dalla config, INSERT con ON CONFLICT DO NOTHING (no doppio
-- accredito anche con richieste parallele), incrementa profiles.points solo se l'evento e' nuovo.
create or replace function public.award_points(p_user uuid, p_action text, p_entity text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pts int;
begin
  if p_user is null or p_entity is null then return; end if;
  select coalesce((value->>p_action)::int, 0) into v_pts
    from public.gamification_config where key = 'points_per_action';
  if v_pts is null or v_pts = 0 then return; end if;
  -- l'unique index + ON CONFLICT rende l'anti-abuso atomico (niente TOCTOU sul doppio tap)
  insert into public.point_events(user_id, action, entity_id, points)
    values (p_user, p_action, p_entity, v_pts)
    on conflict (user_id, action, entity_id) do nothing;
  if found then
    update public.profiles set points = points + v_pts where id = p_user;
  end if;
end $$;

-- ── Trigger: POI creato → punti all'autore ──
create or replace function public.trg_poi_award()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_points(new.author_id, 'create_poi', new.id::text);
  return new;
end $$;
drop trigger if exists trg_pois_award on public.pois;  -- i trigger non supportano CREATE OR REPLACE
create trigger trg_pois_award after insert on public.pois
  for each row execute function public.trg_poi_award();

-- ── Trigger: love inserito → punto a chi mette + punto all'autore del POI ──
create or replace function public.trg_love_award()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  perform public.award_points(new.user_id, 'love_given', new.poi_id::text);
  select author_id into v_author from public.pois where id = new.poi_id;
  if v_author is not null and v_author <> new.user_id then
    -- entity_id composito "poi:lover" (NON e' un uuid): rende il punto unico per quel love specifico
    perform public.award_points(v_author, 'love_received', new.poi_id::text || ':' || new.user_id::text);
  end if;
  return new;
end $$;
drop trigger if exists trg_loves_award on public.loves;
create trigger trg_loves_award after insert on public.loves
  for each row execute function public.trg_love_award();

-- ── Trigger: lista creata → punti al proprietario ──
create or replace function public.trg_list_award()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_points(new.owner_id, 'create_list', new.id::text);
  return new;
end $$;
drop trigger if exists trg_lists_award on public.lists;
create trigger trg_lists_award after insert on public.lists
  for each row execute function public.trg_list_award();

-- ── Trigger: referral confermato → punti all'invitante quando referred_by viene impostato ──
-- ATTENZIONE: il trigger e' "UPDATE OF referred_by" di proposito. award_points fa UPDATE su
-- profiles.points: se il trigger fosse su "UPDATE" generico, quell'update rientrerebbe qui in
-- loop infinito. Limitandolo a OF referred_by, l'update dei punti NON lo ri-attiva. Non cambiare.
create or replace function public.trg_referral_award()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referred_by is not null and (tg_op = 'INSERT' or old.referred_by is null) then
    perform public.award_points(new.referred_by, 'referral_confirmed', new.id::text);
    update public.referrals
      set referred_id = new.id, confirmed = true
      where referrer_id = new.referred_by and confirmed = false and referred_id is null;
  end if;
  return new;
end $$;
drop trigger if exists trg_profiles_referral on public.profiles;
create trigger trg_profiles_referral after insert or update of referred_by on public.profiles
  for each row execute function public.trg_referral_award();

-- ── RPC share: lo share non ha record DB, lo chiama il client dopo una condivisione.
--    Anti-abuso: l'entita' DEVE essere reale (un POI, una lista, o 'profile') + tetto giornaliero.
create or replace function public.award_share(p_entity text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return 0; end if;
  -- l'entita' deve essere reale: niente stringhe inventate per gonfiare i punti
  if p_entity is null or (
       p_entity <> 'profile'
       and not exists (select 1 from public.pois  where id::text = p_entity)
       and not exists (select 1 from public.lists where id::text = p_entity)
     ) then
    return (select points from public.profiles where id = v_uid);
  end if;
  -- tetto giornaliero: max 10 punti share nelle ultime 24h, anti-spam
  if (select count(*) from public.point_events
        where user_id = v_uid and action = 'share'
        and created_at > now() - interval '24 hours') >= 10 then
    return (select points from public.profiles where id = v_uid);
  end if;
  perform public.award_points(v_uid, 'share', p_entity);
  return (select points from public.profiles where id = v_uid);
end $$;

-- ── Permessi: il client puo' chiamare SOLO award_share. Tutto il resto e' interno. ──
revoke all on function public.award_points(uuid, text, text) from public, anon, authenticated;
revoke all on function public.award_share(text)             from public, anon, authenticated;
revoke all on function public.trg_poi_award()               from public, anon, authenticated;
revoke all on function public.trg_love_award()              from public, anon, authenticated;
revoke all on function public.trg_list_award()              from public, anon, authenticated;
revoke all on function public.trg_referral_award()          from public, anon, authenticated;
grant execute on function public.award_share(text) to authenticated;

commit;
