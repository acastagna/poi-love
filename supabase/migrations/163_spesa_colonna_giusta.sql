-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Trovato registrando la prima audioguida vera: la 159 ha rinominato
-- costo_eur in costo_usd ma la funzione che scrive la spesa inseriva ancora
-- nella colonna vecchia. Nessuna prova l aveva vista perche fino a stasera
-- nessuna spesa era mai stata scritta davvero.
create or replace function public.voce_segna_spesa(
  p_poi uuid, p_lingua text, p_secondi numeric, p_gettoni_in int, p_gettoni_out int,
  p_costo numeric, p_voce_f text default null, p_voce_m text default null,
  p_esito text default 'tenuta', p_motivo text default null, p_materiale uuid default null
) returns bigint
language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  insert into public.voce_spesa (poi_id, titolo, lingua, secondi, gettoni_in, gettoni_out,
                                 costo_usd, voce_f, voce_m, esito, motivo, materiale_id)
  select p_poi, (select title from public.pois where id = p_poi), p_lingua, coalesce(p_secondi,0),
         coalesce(p_gettoni_in,0), coalesce(p_gettoni_out,0), coalesce(p_costo,0),
         p_voce_f, p_voce_m, coalesce(p_esito,'tenuta'), p_motivo, p_materiale
  returning id into v_id;
  return v_id;
end $$;
notify pgrst, 'reload schema';
select 'funzione allineata' as esito;
