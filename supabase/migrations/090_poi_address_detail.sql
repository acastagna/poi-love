-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 090 — L'indirizzo completo del luogo.
-- Finora del POI si salvava solo la riga di indirizzo (e citta'/stato). Il motore di
-- ricerca indirizzi nuovo restituisce tutta la scala: via e numero, CAP, citta',
-- provincia, regione, stato. Qui le colonne che mancavano, cosi' il dato non si perde.

begin;

alter table public.pois
  add column if not exists province text,
  add column if not exists region   text,
  add column if not exists postcode text;

comment on column public.pois.province is 'Provincia / contea, dal motore indirizzi (OSM)';
comment on column public.pois.region   is 'Regione / stato federato, dal motore indirizzi (OSM)';
comment on column public.pois.postcode is 'CAP, dal motore indirizzi (OSM)';

commit;
