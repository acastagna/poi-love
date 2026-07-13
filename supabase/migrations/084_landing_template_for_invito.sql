-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Nuovo Uso 'invito': la landing modello per "Diffondi POI•LOVE" (referral dal profilo).
-- L'app la aggancia da loadCommTemplates e ci manda gli invitati con ?ref=<handle>.

alter table public.landing_pages drop constraint if exists landing_pages_template_for_check;
alter table public.landing_pages add constraint landing_pages_template_for_check
  check (template_for in ('libera','poi','trip','route','evento','invito'));

update public.landing_pages set template_for = 'invito' where slug = 'invito-community';
