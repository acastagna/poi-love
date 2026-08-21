-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Livelli che si creano, non solo che si modificano.
--
-- I livelli sono il modello di guadagno: devono nascere qui dentro, senza
-- toccare il codice. Chi crea un livello sceglie i vantaggi da un catalogo
-- (vantaggi_preset) e ogni vantaggio scelto porta con se la regola vera.

-- Il vantaggio scritto sa da quale voce del catalogo arriva: cosi si sa se e
-- una regola che il programma fa rispettare o una promessa nostra.
alter table public.livello_vantaggi
  add column if not exists preset text references public.vantaggi_preset(chiave) on delete set null;

-- Un livello nuovo, con i valori di partenza di un livello gratuito.
create or replace function public.crea_livello(
  p_chiave text, p_nome text, p_prezzo numeric default null,
  p_periodo text default 'anno', p_descrizione text default null,
  p_copia_da text default null
) returns text
language plpgsql security definer set search_path to 'public' as $$
declare v_chiave text;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  v_chiave := lower(regexp_replace(coalesce(p_chiave,''), '[^a-z0-9_]+', '_', 'g'));
  v_chiave := trim(both '_' from v_chiave);
  if v_chiave = '' then raise exception 'la chiave non puo essere vuota'; end if;
  if exists (select 1 from public.livelli where chiave = v_chiave) then
    raise exception 'esiste gia un livello con la chiave %', v_chiave;
  end if;

  if p_copia_da is not null and exists (select 1 from public.livelli where chiave = p_copia_da) then
    -- copia di un livello esistente: stesse regole, nome e prezzo nuovi
    insert into public.livelli
    select v_chiave, coalesce(p_nome, v_chiave), foto_max, video_max, audio_secondi, ascolta_audioguide,
           evidenze_itinerari, evidenze_compagnie, spunta, badge_icona, badge_colore, muro,
           (select coalesce(max(ordine),0) + 10 from public.livelli),
           video_secondi, evidenze_luoghi, richiede_luoghi_mese, richiede_rinnovo,
           p_prezzo, valuta, coalesce(p_periodo,'anno'), audioguide_max,
           coalesce(p_descrizione, descrizione), true
      from public.livelli where chiave = p_copia_da;
    insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, preset)
    select v_chiave, ordine, testo_it, testo_sq, testo_en, icona, preset
      from public.livello_vantaggi where livello = p_copia_da;
  else
    insert into public.livelli (chiave, nome, prezzo, periodo, descrizione, ordine, visibile)
    values (v_chiave, coalesce(p_nome, v_chiave), p_prezzo, coalesce(p_periodo,'anno'),
            p_descrizione, (select coalesce(max(ordine),0) + 10 from public.livelli), true);
  end if;
  return v_chiave;
end $$;
grant execute on function public.crea_livello(text,text,numeric,text,text,text) to authenticated;

-- Togliere un livello: solo se nessuno ce l'ha addosso. Chi paga non resta orfano.
create or replace function public.elimina_livello(p_chiave text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  select count(*) into n from public.abbonamenti where livello = p_chiave;
  if n > 0 then
    raise exception 'ci sono % iscritti a questo livello: prima vanno spostati', n;
  end if;
  select count(*) into n from public.profiles where special_tier = p_chiave;
  if n > 0 then
    raise exception '% profili hanno questo livello: prima vanno spostati', n;
  end if;
  delete from public.livelli where chiave = p_chiave;
  return p_chiave;
end $$;
grant execute on function public.elimina_livello(text) to authenticated;

-- Mettere un vantaggio del catalogo dentro un livello: scrive la riga e, se la
-- voce e una regola, porta anche il numero nella colonna che la fa rispettare.
create or replace function public.livello_metti_vantaggio(
  p_livello text, p_preset text, p_valore int default null
) returns int
language plpgsql security definer set search_path to 'public' as $$
declare v record; v_testo text; v_id int; v_col text;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  select * into v from public.vantaggi_preset where chiave = p_preset;
  if not found then raise exception 'vantaggio sconosciuto: %', p_preset; end if;

  v_testo := replace(v.testo_it, '{n}', coalesce(p_valore::text, 'alcune'));
  insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, preset)
  values (p_livello, v.ordine,
          v_testo,
          replace(coalesce(v.testo_sq, v.testo_it), '{n}', coalesce(p_valore::text, '')),
          replace(coalesce(v.testo_en, v.testo_it), '{n}', coalesce(p_valore::text, '')),
          v.icona, v.chiave)
  returning id into v_id;

  -- se e una regola vera, il numero finisce nella colonna che la fa rispettare
  if v.colonna is not null then
    v_col := v.colonna;
    if v_col in ('ascolta_audioguide','muro','spunta') then
      execute format('update public.livelli set %I = true where chiave = $1', v_col) using p_livello;
    elsif p_valore is not null then
      execute format('update public.livelli set %I = $2 where chiave = $1', v_col) using p_livello, p_valore;
    end if;
  end if;
  return v_id;
end $$;
grant execute on function public.livello_metti_vantaggio(text,text,int) to authenticated;

notify pgrst, 'reload schema';
select chiave, nome, prezzo, periodo, visibile from public.livelli order by ordine;
