-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 039: le categorie proposte dagli utenti diventano usabili da TUTTI dopo 20
-- richieste (auto-promozione by demand, richiesta del founder). La categoria e'
-- gia usabile subito per chi la propone (lato client, come subcategory del POI);
-- qui la si rende globale quando raggiunge la soglia. official=false: resta
-- riconoscibile come proposta community e l'admin puo rifinirla (macro, etichette).

create or replace function public.tg_autopromote_category()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_term text := lower(trim(new.term));
  v_key  text;
  v_cnt  int;
begin
  if v_term is null or length(v_term) = 0 then return new; end if;
  v_key := regexp_replace(v_term, '[^a-z0-9]+', '_', 'g');
  v_key := trim(both '_' from v_key);
  if length(v_key) = 0 then return new; end if;
  -- gia' esiste come categoria? niente da fare
  if exists (select 1 from public.poi_categories where key = v_key) then return new; end if;
  -- quante richieste totali per questo termine?
  select count(*) into v_cnt from public.category_requests where lower(trim(term)) = v_term;
  if v_cnt >= 20 then
    insert into public.poi_categories(key, macro, label_it, label_sq, label_en, icon, color, sort, active, official)
    values (v_key, 'cultura', initcap(v_term), initcap(v_term), initcap(v_term), 'tag', '#64748B', 900, true, false)
    on conflict (key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_autopromote_category on public.category_requests;
create trigger trg_autopromote_category
  after insert on public.category_requests
  for each row execute function public.tg_autopromote_category();
