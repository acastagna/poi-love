-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Due difetti trovati provando dal vivo la moderazione (21/08/2026):
--   1. il visitatore non vedeva le recensioni pubblicate: la regola guardava
--      dentro `follows`, che pero' ognuno vede solo per se'. Ora la domanda
--      "questa persona segue ancora chi ha creato il luogo?" la fa una funzione
--      di sistema, uguale per tutti.
--   2. i punti non arrivavano: l'elenco delle azioni che danno punti non
--      prevedeva 'recensione' e lo scarto avveniva in silenzio.

create or replace function public.recensione_visibile(p_autore uuid, p_poi uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.pois p
    join public.follows f on f.follower_id = p_autore and f.following_id = p.author_id
    where p.id = p_poi
  );
$$;
grant execute on function public.recensione_visibile(uuid, uuid) to anon, authenticated, service_role;

drop policy if exists rec_leggo_pubblicate on public.recensioni;
create policy rec_leggo_pubblicate on public.recensioni for select using (
  stato = 'pubblicata' and public.recensione_visibile(autore_id, poi_id)
);

alter table public.point_events drop constraint if exists point_events_action_chk;
alter table public.point_events add constraint point_events_action_chk check (
  action = any (array['create_poi','create_list','create_route','love_given','love_received',
                      'share','referral','referral_confirmed','referral_welcome',
                      'make_route_public','poi_speed_bonus','poi_improved','recensione'])
);

notify pgrst, 'reload schema';
