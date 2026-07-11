-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 069 — Badge delle rotte + completamento permessi editor POI admin.
--   * Badge curatoriali sulle rotte (direttiva business 10/07: il contenuto moderato/ufficializzato
--     è il prodotto vendibile): "Ufficiale" e "Indispensabile" li assegna l'admin;
--     "Più votato" NON è una colonna: si calcola dai salvataggi REALI (trip_saves), mai finto.
--   * pois.is_approved: il pannello admin lo scrive (pubblica/bozza) ma mancava il grant di colonna.

begin;

alter table public.trips add column if not exists badge_official  boolean not null default false;
alter table public.trips add column if not exists badge_essential boolean not null default false;

-- Il pannello admin aggiorna is_approved (pubblica/bozza); la RLS continua a decidere CHI può farlo.
grant update (is_approved) on public.pois to authenticated;

commit;
