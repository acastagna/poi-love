-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Nuovo Uso 'compagnia': landing modello per l'invito in una compagnia di viaggio.
-- lp.php la compila con {{codice}} (da &join=CODICE) e {{mittente}}; il bottone
-- porta a poilove.com/?join=CODICE (adesione automatica al login).

alter table public.landing_pages drop constraint if exists landing_pages_template_for_check;
alter table public.landing_pages add constraint landing_pages_template_for_check
  check (template_for in ('libera','poi','trip','route','evento','invito','compagnia'));
