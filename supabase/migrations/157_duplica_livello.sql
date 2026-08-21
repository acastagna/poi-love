-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Copiare un livello: un modello nuovo che nasce da uno che gia funziona.
--
-- I livelli sono modelli di guadagno. Uno nuovo quasi mai parte da zero: parte
-- da uno che c e gia, come Locale Plus, e cambia due cose. Fino a ora la copia
-- si poteva fare solo dal modulo di creazione, ricordandosi di scegliere "parti
-- da". Da qui e un gesto solo, sul livello stesso.
--
-- La chiave se la trova da sola: se locale_plus_copia esiste, prova
-- locale_plus_copia_2, e cosi via. Nessuno deve inventarsi un nome libero.

create or replace function public.duplica_livello(p_chiave text, p_nome text default null)
returns text
language plpgsql security definer set search_path to 'public' as $$
declare v_base text; v_nuova text; n int := 1; v_nome text;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  if not exists (select 1 from public.livelli where chiave = p_chiave) then
    raise exception 'il livello % non esiste', p_chiave;
  end if;

  v_base := p_chiave || '_copia';
  v_nuova := v_base;
  while exists (select 1 from public.livelli where chiave = v_nuova) loop
    n := n + 1;
    v_nuova := v_base || '_' || n;
  end loop;

  select coalesce(p_nome, nome || ' (copia)') into v_nome from public.livelli where chiave = p_chiave;

  -- Nasce nascosto: un modello di guadagno non va in vetrina prima di essere
  -- deciso. Si accende "Si mostra in giro" quando e pronto.
  insert into public.livelli
  select v_nuova, v_nome, foto_max, video_max, audio_secondi, ascolta_audioguide,
         evidenze_itinerari, evidenze_compagnie, spunta, badge_icona, badge_colore, muro,
         (select coalesce(max(ordine),0) + 10 from public.livelli),
         video_secondi, evidenze_luoghi, richiede_luoghi_mese, richiede_rinnovo,
         prezzo, valuta, periodo, audioguide_max, descrizione, false
    from public.livelli where chiave = p_chiave;

  insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, preset, attivo, in_evidenza)
  select v_nuova, ordine, testo_it, testo_sq, testo_en, icona, preset, attivo, in_evidenza
    from public.livello_vantaggi where livello = p_chiave;

  return v_nuova;
end $$;
grant execute on function public.duplica_livello(text, text) to authenticated;

notify pgrst, 'reload schema';
select chiave, nome, visibile from public.livelli order by ordine;
