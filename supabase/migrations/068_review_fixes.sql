-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 068 — Correzioni da code-review completa (sessione 10/07).
--   [major, sicurezza] L'auto-pubblicazione della categoria personalizzata a 20 "usi" contava i POI
--     (count(*)): un singolo utente poteva pubblicare un'etichetta arbitraria nella tassonomia pubblica
--     taggando 20 dei propri POI, senza moderazione. Ora conta gli AUTORI DISTINTI: servono 20 persone
--     diverse (segnale reale di adozione, non gonfiabile da un solo account). Il percorso principale
--     resta comunque l'approvazione immediata dell'admin (admin_approve_category), che VEDE l'etichetta.
--   [nit, sicurezza] Rimosso il grant diretto ridondante su pois.route_proposed*: la proposta passa solo
--     dalla RPC SECURITY DEFINER (propose_poi_as_route_stop); niente scrittura/forgiatura diretta del flag
--     o del timestamp da parte del client.

begin;

-- 1) Auto-promozione categoria custom: conta gli autori distinti (>=20 persone), non i POI.
create or replace function public.tg_category_uses()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_keys text[]; v_k text; v_cnt int;
begin
  v_keys := array(select distinct x from (
      select unnest(case when TG_OP <> 'DELETE'
             then array_remove(array[NEW.subcategory] || coalesce(NEW.categories,'{}'), null) else '{}'::text[] end)
      union
      select unnest(case when TG_OP <> 'INSERT'
             then array_remove(array[OLD.subcategory] || coalesce(OLD.categories,'{}'), null) else '{}'::text[] end)
    ) s(x) where x is not null and length(x) > 0);
  foreach v_k in array v_keys loop
    if exists (select 1 from public.poi_categories where key = v_k and owner_id is not null) then
      -- Persone DISTINTE che la usano (non il numero di POI): non gonfiabile da un solo account.
      select count(distinct author_id) into v_cnt from public.pois
        where removed_at is null and (subcategory = v_k or v_k = any(categories));
      update public.poi_categories set uses = v_cnt where key = v_k;
      update public.poi_categories set active = true where key = v_k and active = false and v_cnt >= 20;
    end if;
  end loop;
  return null;
end $$;

-- 2) La proposta "tappa di rotta storica" passa SOLO dalla RPC: via il grant diretto ridondante.
revoke update (route_proposed, route_proposed_at) on public.pois from authenticated;
revoke insert (route_proposed, route_proposed_at) on public.pois from authenticated, anon;

commit;
