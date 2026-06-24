-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 004 — Persistenza liste: colonne per compagnia e itinerario
-- La tabella lists esiste gia' (id, owner_id, name, description, visibility enum private/public,
-- share_token, cover_poi_id). Aggiungo i due riferimenti che il popup lista usa:
--  - companion_id: con quale compagnia e' condivisa la lista (il "3o stato" = privata + companion_id)
--  - itinerary_id: a quale itinerario appartiene la lista
-- FK non aggiunte ora: le tabelle companions/trips non esistono ancora, verranno con una migrazione
-- successiva che aggiunge anche i vincoli referenziali. Idempotente.

begin;

alter table public.lists
  add column if not exists companion_id uuid,
  add column if not exists itinerary_id uuid;

commit;
