-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 007 — colonna note su trip_stops
-- La tappa puo' avere un appunto libero (saveStopDetail nel frontend salva s.note). Idempotente.

begin;

alter table public.trip_stops add column if not exists note text;

commit;
