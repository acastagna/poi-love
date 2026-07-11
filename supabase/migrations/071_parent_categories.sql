-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 071 — Categorie GENITORE definite dal founder (10/07 sera):
--   Cibo Normale, Cibo Gourmet, Fast Food, Lavoro, Dormire, Acquisti, Vacanze,
--   Festa, Cultura, Utilità, Benessere, Audioguida (POI•VOICE), Altro.
-- L'enum poi_category viene ESTESO (i valori storici restano validi e vengono
-- mappati client-side alle famiglie: natura→Vacanze, pratico/mappa→Utilità,
-- love/open_source→Altro, pernottare→Dormire come etichetta).
-- Etichette tradotte e COLORE arrivano dalla FAMIGLIA (client + colori figli allineati sotto).

alter type public.poi_category add value if not exists 'cibo_gourmet';
alter type public.poi_category add value if not exists 'fast_food';
alter type public.poi_category add value if not exists 'acquisti';
alter type public.poi_category add value if not exists 'vacanze';
alter type public.poi_category add value if not exists 'utilita';
alter type public.poi_category add value if not exists 'altro';
