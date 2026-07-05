-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 021 — Rotte storiche: visibili a tutti quando PUBBLICATE, governate dall'admin
--
-- 1) Chiunque (anche non loggato) vede i trips con is_historic e is_published,
--    e le loro tappe: e' il contenuto culturale pubblico della piattaforma.
-- 2) L'admin vede e gestisce TUTTE le rotte storiche e le loro tappe dal pannello
--    (policy permissive in OR con quelle del proprietario, niente viene tolto).
-- Idempotente. RLS obbligatorie.

begin;

-- ── Trips: lettura pubblica delle rotte storiche pubblicate ──────────────────
drop policy if exists trips_public_historic on public.trips;
create policy trips_public_historic on public.trips
  for select using ( is_historic = true and is_published = true );

-- ── Trips: pieni poteri admin ─────────────────────────────────────────────────
drop policy if exists trips_admin_select on public.trips;
create policy trips_admin_select on public.trips
  for select using ( (select public.is_admin()) );
drop policy if exists trips_admin_update on public.trips;
create policy trips_admin_update on public.trips
  for update using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );
drop policy if exists trips_admin_delete on public.trips;
create policy trips_admin_delete on public.trips
  for delete using ( (select public.is_admin()) );

-- ── Trip stops: lettura pubblica per le rotte pubblicate + pieni poteri admin ──
drop policy if exists trip_stops_public_historic on public.trip_stops;
create policy trip_stops_public_historic on public.trip_stops
  for select using ( exists (select 1 from public.trips t
                              where t.id = trip_stops.trip_id
                                and t.is_historic = true and t.is_published = true) );
drop policy if exists trip_stops_admin_select on public.trip_stops;
create policy trip_stops_admin_select on public.trip_stops
  for select using ( (select public.is_admin()) );
drop policy if exists trip_stops_admin_insert on public.trip_stops;
create policy trip_stops_admin_insert on public.trip_stops
  for insert with check ( (select public.is_admin()) );
drop policy if exists trip_stops_admin_update on public.trip_stops;
create policy trip_stops_admin_update on public.trip_stops
  for update using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );
drop policy if exists trip_stops_admin_delete on public.trip_stops;
create policy trip_stops_admin_delete on public.trip_stops
  for delete using ( (select public.is_admin()) );

commit;
