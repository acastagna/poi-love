-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 091 — I punti del POI dipendono da quanto ci metti.
-- Regola del founder (19/08/2026): si parte da 30 punti e si scende col cronometro,
-- fino a un minimo di 10. Entro 60 secondi il massimo, oltre i 60 restano 10 e il
-- messaggio diventa un complimento per l'accuratezza.
--
-- Come funziona: il colpo di partenza (10 punti) lo da' gia' il trigger sulla tabella
-- pois. Qui si aggiunge SOLO la differenza (da 0 a 20), una volta sola per POI.
-- Il conto lo rifa' il server: il cliente dice i secondi, il server decide i punti,
-- controlla che il POI sia suo e appena creato, e mette un tetto giornaliero.

begin;

-- Il registro dei punti deve accettare il nuovo tipo di accredito
alter table public.point_events drop constraint if exists point_events_action_chk;
alter table public.point_events
  add constraint point_events_action_chk check (action in (
    'create_poi','create_list','create_route','love_given','love_received',
    'share','referral','referral_confirmed','referral_welcome','make_route_public',
    'poi_speed_bonus'
  ));

create or replace function public.award_poi_speed_bonus(p_poi uuid, p_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      uuid := (select auth.uid());
  v_sec     integer := greatest(coalesce(p_seconds, 999), 0);
  v_punti   integer;
  v_base    integer;
  v_bonus   integer;
  v_oggi    integer;
  c_max_giorno constant integer := 30;   -- quanti bonus al massimo in un giorno
begin
  if v_me is null then raise exception 'auth required'; end if;

  -- Deve essere un POI mio, creato da poco: niente bonus su cose vecchie o altrui
  if not exists(
    select 1 from public.pois p
     where p.id = p_poi and p.author_id = v_me
       and p.created_at > now() - interval '15 minutes'
  ) then return 0; end if;

  -- Una volta sola per POI
  if exists(select 1 from public.point_events
             where user_id = v_me and action = 'poi_speed_bonus' and entity_id = p_poi::text)
  then return 0; end if;

  select count(*) into v_oggi from public.point_events
   where user_id = v_me and action = 'poi_speed_bonus' and created_at >= date_trunc('day', now());
  if v_oggi >= c_max_giorno then return 0; end if;

  -- 30 punti subito, uno in meno ogni 3 secondi, mai sotto 10
  v_punti := greatest(10, 30 - (v_sec / 3));
  select coalesce((value->>'create_poi')::int, 10) into v_base
    from public.gamification_config where key = 'points_per_action';
  v_bonus := greatest(v_punti - coalesce(v_base, 10), 0);
  if v_bonus = 0 then return 0; end if;

  insert into public.point_events(user_id, action, entity_id, points)
    values (v_me, 'poi_speed_bonus', p_poi::text, v_bonus)
    on conflict do nothing;
  update public.profiles set points = points + v_bonus where id = v_me;
  return v_bonus;
end $$;

revoke all on function public.award_poi_speed_bonus(uuid, integer) from public, anon;
grant execute on function public.award_poi_speed_bonus(uuid, integer) to authenticated;

commit;
