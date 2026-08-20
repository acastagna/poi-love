-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Quanti luoghi si possono mettere in evidenza: il numero stava scritto dentro
-- una funzione, quindi per cambiarlo serviva toccare il programma. Ora e' una
-- colonna della tabella `livelli`, come tutti gli altri vantaggi. I numeri di
-- oggi restano gli stessi: cambia solo dove sono scritti.

alter table public.livelli add column if not exists evidenze_luoghi int not null default 0;
update public.livelli set evidenze_luoghi = case chiave
  when 'sostenitore' then 3
  when 'professionista' then 3
  when 'mecenate' then 5
  when 'influencer' then 5
  when 'professionista_plus' then 5
  else 0 end;

create or replace function public.poi_featured_cap(p_tier text)
returns int language sql stable security definer set search_path to 'public' as $$
  select coalesce((select evidenze_luoghi from public.livelli where chiave = coalesce(p_tier,'free')), 0);
$$;

notify pgrst, 'reload schema';
