-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 057 — Dettaglio itinerario REALE (basta finto): visibilita' salvata, date vere, campi tappa.
-- Aggiunge a trips: visibilita' persistente, date di partenza/arrivo. A trip_stops: tempo di rimanenza,
-- immagine, prefettura/regione. Solo colonne, RLS gia' in essere (owner). Idempotente.

begin;

alter table public.trips
  add column if not exists visibility text not null default 'prv',   -- 'prv' | 'friends' | 'companions' | 'pub'
  add column if not exists start_date date,
  add column if not exists end_date   date;

do $$ begin
  alter table public.trips add constraint trips_visibility_chk
    check (visibility in ('prv','friends','companions','pub'));
exception when duplicate_object then null; end $$;

alter table public.trip_stops
  add column if not exists stay_label text,   -- tempo di rimanenza (es. "2 notti", "mezza giornata")
  add column if not exists image_url  text,    -- piccola immagine della tappa (data-URL o URL)
  add column if not exists region     text;    -- prefettura / regione / luogo

commit;
