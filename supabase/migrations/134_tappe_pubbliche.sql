-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le tappe degli itinerari nostri le vede chiunque.
-- L'elenco degli Itinerari Culturali mostrava "0 tappe" a tutti tranne al
-- proprietario: le righe c'erano, ma la regola non le faceva leggere.

drop policy if exists tappe_nostre_pubbliche on public.trip_stops;
create policy tappe_nostre_pubbliche on public.trip_stops for select
  using (exists (
    select 1 from public.trips t
     where t.id = trip_stops.trip_id
       and t.tipo <> 'personale'
       and t.is_published
  ));
grant select on public.trip_stops to anon, authenticated;

notify pgrst, 'reload schema';
