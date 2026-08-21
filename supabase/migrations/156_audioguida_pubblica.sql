-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Dal laboratorio alla mappa: l audio scelto arriva dove l app lo suona.
--
-- Le prove di una audioguida vivono in poi_materiale: e il banco di lavoro,
-- con le ricerche, i copioni e le voci provate. L app invece suona quello che
-- trova in audioguide. Fra i due non c era niente: si poteva scegliere una voce
-- e nessuno l avrebbe mai sentita. Questa funzione e il passaggio: prende la
-- prova scelta, ci mette accanto il copione da cui viene, e la pubblica.

create or replace function public.pubblica_audioguida(p_materiale uuid)
returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare v record; v_testo text; v_titolo text; v_id uuid;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;

  select m.*, p.title as nome_luogo into v
    from public.poi_materiale m join public.pois p on p.id = m.poi_id
   where m.id = p_materiale and m.fase = 'voce';
  if not found then raise exception 'questa prova non esiste o non e una voce'; end if;
  if v.audio_url is null then raise exception 'questa prova non ha nessun file audio'; end if;

  -- il copione da cui viene la voce: e il testo che si legge sotto il lettore,
  -- ed e anche quello che i motori di ricerca leggono al posto dell audio
  select testo into v_testo from public.poi_materiale
   where poi_id = v.poi_id and fase = 'copione' and lingua = v.lingua and scelto
   limit 1;
  v_titolo := coalesce(v.titolo, v.nome_luogo);

  -- una sola audioguida per luogo e lingua: la nuova prende il posto della vecchia
  select id into v_id from public.audioguide
   where poi_id = v.poi_id and lingua = v.lingua limit 1;

  if v_id is null then
    insert into public.audioguide (poi_id, lingua, titolo, testo, url, secondi, voce, pubblicata, creata_da)
    values (v.poi_id, v.lingua, v_titolo, v_testo, v.audio_url, coalesce(v.secondi, 0), v.voce, true, auth.uid())
    returning id into v_id;
  else
    update public.audioguide set
      titolo = v_titolo, testo = v_testo, url = v.audio_url,
      secondi = coalesce(v.secondi, 0), voce = v.voce, pubblicata = true
     where id = v_id;
  end if;

  -- nel laboratorio resta segnata come quella in uso
  update public.poi_materiale set scelto = false
   where poi_id = v.poi_id and fase = 'voce' and lingua = v.lingua;
  update public.poi_materiale set scelto = true where id = p_materiale;

  return v_id;
end $$;
grant execute on function public.pubblica_audioguida(uuid) to authenticated;

-- Toglierla dalla mappa: il file resta, ma nell app non si sente piu.
create or replace function public.ritira_audioguida(p_materiale uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v record;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  select poi_id, lingua, audio_url into v from public.poi_materiale where id = p_materiale;
  if not found then return false; end if;
  update public.audioguide set pubblicata = false
   where poi_id = v.poi_id and lingua = v.lingua and url = v.audio_url;
  return true;
end $$;
grant execute on function public.ritira_audioguida(uuid) to authenticated;

notify pgrst, 'reload schema';
select count(*) as audioguide_in_mappa from public.audioguide where pubblicata;
