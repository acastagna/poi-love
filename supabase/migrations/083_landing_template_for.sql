-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Le landing sono STRUMENTI DI COMUNICAZIONE legati alle azioni: una landing puo essere
-- il modello per condividere un POI, un itinerario, una rotta o un evento. lp.php la
-- autocompila coi dati veri ({{titolo}} {{descrizione}} {{foto}} {{mittente}} {{link}}).

alter table public.landing_pages add column if not exists template_for text not null default 'libera'
  check (template_for in ('libera','poi','trip','route','evento'));
