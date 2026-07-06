-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 029: pulizia dei tier. Esistevano DUE CHECK su special_tier che, sommandosi,
-- ammettevano di fatto solo sostenitore/mecenate: impostare "professionista"
-- falliva. Tolgo il vincolo vecchio e ridefinisco l'unico set ammesso,
-- aggiungendo il livello Influencer.

alter table public.profiles drop constraint if exists profiles_special_tier_chk;
alter table public.profiles drop constraint if exists profiles_special_tier_check;
alter table public.profiles add constraint profiles_special_tier_check
  check (special_tier is null or special_tier = any (array[
    'professionista','professionista_plus','sostenitore','mecenate','influencer'
  ]));
