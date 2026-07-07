-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 060 — Link condiviso degli itinerari PUBBLICI: chiunque (anche non loggato) può leggere un
-- itinerario con visibility='pub' e le sue tappe, così la pagina di condivisione (OpenGraph) funziona.
-- Gli itinerari privati/amici/compagnia restano protetti.

begin;

drop policy if exists trips_public_shared on public.trips;
create policy trips_public_shared on public.trips for select to anon, authenticated
  using (visibility = 'pub');

drop policy if exists trip_stops_public_shared on public.trip_stops;
create policy trip_stops_public_shared on public.trip_stops for select to anon, authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.visibility = 'pub'));

commit;
