-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I vantaggi gia scritti riconoscono la voce del catalogo da cui vengono.
--
-- Visto nella prova: aggiungendo "la spunta" a un livello che ce l aveva gia
-- scritta a mano, la riga compariva due volte. Le righe vecchie non avevano il
-- collegamento al catalogo, quindi nessuno poteva accorgersene. Qui il
-- collegamento si ricostruisce dal testo, e da adesso in poi mettere due volte
-- lo stesso vantaggio aggiorna la riga invece di crearne un altra.

-- Ricostruzione: il testo del catalogo con {n} diventa una ricerca che accetta
-- qualsiasi numero al posto suo.
-- Nell ordine giusto: prima {n} diventa un segnaposto, poi si protegge il resto,
-- poi il segnaposto diventa "un numero qualsiasi". Al contrario le graffe
-- venivano protette e la voce col numero non si riconosceva piu.
update public.livello_vantaggi v
   set preset = p.chiave
  from public.vantaggi_preset p
 where v.preset is null
   and v.testo_it ~* ('^' || replace(
         regexp_replace(replace(p.testo_it, '{n}', 'QQNUMEROQQ'),
                        '([.^$*+?()\[\]{}|\\])', '\\\1', 'g'),
         'QQNUMEROQQ', '[0-9]+') || '$');

-- Un vantaggio per livello: se c e gia, si aggiorna.
create or replace function public.livello_metti_vantaggio(
  p_livello text, p_preset text, p_valore int default null
) returns int
language plpgsql security definer set search_path to 'public' as $$
declare v record; v_id int; v_col text;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  select * into v from public.vantaggi_preset where chiave = p_preset;
  if not found then raise exception 'vantaggio sconosciuto: %', p_preset; end if;

  select id into v_id from public.livello_vantaggi
   where livello = p_livello and preset = p_preset limit 1;

  if v_id is null then
    insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, preset)
    values (p_livello, v.ordine,
            replace(v.testo_it, '{n}', coalesce(p_valore::text, 'alcune')),
            replace(coalesce(v.testo_sq, v.testo_it), '{n}', coalesce(p_valore::text, '')),
            replace(coalesce(v.testo_en, v.testo_it), '{n}', coalesce(p_valore::text, '')),
            v.icona, v.chiave)
    returning id into v_id;
  else
    update public.livello_vantaggi set
      testo_it = replace(v.testo_it, '{n}', coalesce(p_valore::text, 'alcune')),
      testo_sq = replace(coalesce(v.testo_sq, v.testo_it), '{n}', coalesce(p_valore::text, '')),
      testo_en = replace(coalesce(v.testo_en, v.testo_it), '{n}', coalesce(p_valore::text, '')),
      icona = v.icona
     where id = v_id;
  end if;

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
select coalesce(preset,'(scritto a mano)') as voce, count(*)
  from public.livello_vantaggi group by 1 order by 2 desc;
