-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 092 — Chi torna a migliorare un luogo prende punti.
-- Regola del founder (19/08/2026): "quando vado a modificare acquisisco altri punti
-- e vengo ringraziato, perche' ho migliorato un posto del cuore e quindi tutta la
-- community". Non e' un premio a pioggia: vale una volta al giorno per ogni luogo,
-- con un tetto giornaliero, e il conto lo fa il server.

begin;

-- Quanto vale un miglioramento: si regola dal pannello admin come tutti gli altri punti
update public.gamification_config
   set value = value || '{"poi_improved": 5}'::jsonb
 where key = 'points_per_action';

alter table public.point_events drop constraint if exists point_events_action_chk;
alter table public.point_events
  add constraint point_events_action_chk check (action in (
    'create_poi','create_list','create_route','love_given','love_received',
    'share','referral','referral_confirmed','referral_welcome','make_route_public',
    'poi_speed_bonus','poi_improved'
  ));

create or replace function public.award_poi_improvement(p_poi uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me    uuid := (select auth.uid());
  v_pts   integer;
  v_oggi  integer;
  c_max_giorno constant integer := 20;   -- miglioramenti premiati al giorno
begin
  if v_me is null then raise exception 'auth required'; end if;

  -- Deve essere un luogo mio: si migliora quello che si e' creato
  if not exists(select 1 from public.pois p where p.id = p_poi and p.author_id = v_me)
  then return 0; end if;

  -- Una volta al giorno per ogni luogo: rientrare dieci volte non moltiplica i punti
  if exists(select 1 from public.point_events
             where user_id = v_me and action = 'poi_improved'
               and entity_id = p_poi::text
               and created_at >= date_trunc('day', now()))
  then return 0; end if;

  select count(*) into v_oggi from public.point_events
   where user_id = v_me and action = 'poi_improved' and created_at >= date_trunc('day', now());
  if v_oggi >= c_max_giorno then return 0; end if;

  select coalesce((value->>'poi_improved')::int, 5) into v_pts
    from public.gamification_config where key = 'points_per_action';
  v_pts := coalesce(v_pts, 5);
  if v_pts <= 0 then return 0; end if;

  insert into public.point_events(user_id, action, entity_id, points)
    values (v_me, 'poi_improved', p_poi::text, v_pts)
    on conflict do nothing;   -- stesso account su due schermi: nessun errore, nessun doppio punto
  update public.profiles set points = points + v_pts where id = v_me;
  return v_pts;
end $$;

revoke all on function public.award_poi_improvement(uuid) from public, anon;
grant execute on function public.award_poi_improvement(uuid) to authenticated;

commit;
