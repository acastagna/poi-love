-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 064 — Un POI può appartenere fino a 3 categorie (subcategory keys), così i POI si
-- "intrecciano" sulle categorie e la scoperta diventa incrociata. La categoria/subcategoria singola
-- resta come PRIMARIA (icona sul marker, retrocompatibilità); l'array le contiene tutte.

begin;

alter table public.pois add column if not exists categories text[] not null default '{}';

-- indice GIN per la ricerca incrociata (pois che contengono una certa categoria)
create index if not exists pois_categories_gin on public.pois using gin (categories);

grant update (categories) on public.pois to authenticated;

commit;
