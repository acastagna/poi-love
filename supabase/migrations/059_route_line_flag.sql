-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 059 — Le rotte storiche seguono la STRADA per default (come gli itinerari). Eccezione: le
-- linee dritte (ley line, es. Linea di San Michele) restano in linea d'aria. Flag per-rotta route_line.

alter table public.trips
  add column if not exists route_line boolean not null default false;  -- true = linea dritta (ley), false = segue la strada
