-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Revisione del 22/08, due rilievi sul grilletto della 170:
-- 1) il nome cat_eti_sync_del mentiva: non sincronizza, blocca;
-- 2) la cascata della 167 (on delete cascade da poi_categories) faceva
--    scattare il blocco anche cancellando un'INTERA categoria: vietato
--    per sbaglio quello che deve essere lecito.
-- La distinzione: dentro una cascata la profondita' dei grilletti e'
-- maggiore di 1 (la cascata stessa e' un grilletto di sistema); la
-- cancellazione diretta di una singola etichetta sta a profondita' 1.
-- AVVISO per il futuro (ripasso del 23/08): il criterio non e' specifico
-- della cascata FK. Un domani, un ALTRO grilletto utente che cancellasse
-- righe di categoria_etichette dal proprio corpo passerebbe anche lui
-- sotto la protezione senza errore. Oggi non ne esiste nessuno: se se ne
-- scrive uno, ripensare questa guardia (per esempio con una sentinella).
-- Nota: il collaudo qui sotto usa la categoria 'ristorante' del seed
-- (migrazioni delle categorie): se un giorno sparisse, adattare il test.

create or replace function public.cat_eti_niente_cancella_grandi()
returns trigger language plpgsql as $$
begin
  -- In cascata (categoria intera che se ne va) si lascia passare.
  if pg_trigger_depth() > 1 then return old; end if;
  if old.lingua in ('it','sq','en') then
    raise exception 'Le tre lingue grandi (it, sq, en) sono obbligatorie: l''etichetta si modifica, non si cancella';
  end if;
  return old;
end $$;

drop trigger if exists cat_eti_sync_del on public.categoria_etichette;
drop trigger if exists cat_eti_blocca_grandi on public.categoria_etichette;
create trigger cat_eti_blocca_grandi before delete on public.categoria_etichette
  for each row execute function public.cat_eti_niente_cancella_grandi();

-- Collaudo 1: la cancellazione diretta di una lingua grande resta vietata.
do $$
begin
  begin
    delete from public.categoria_etichette where chiave='ristorante' and lingua='en';
    raise exception 'IL GRILLETTO NON HA PROTETTO';
  exception when others then
    if sqlerrm like '%obbligatorie%' then raise notice 'protezione diretta ok';
    else raise; end if;
  end;
end $$;

-- Collaudo 2: cancellare una categoria INTERA (di prova) deve riuscire,
-- cascata compresa.
begin;
insert into public.poi_categories (key, macro, label_it, label_sq, label_en, icon, color, sort, active)
values ('prova_171', 'cibo', 'Prova', 'Prove', 'Test', 'fork-knife', '#888888', 999, false);
delete from public.poi_categories where key='prova_171';
select 'cascata libera: categoria di prova creata e cancellata' as esito;
rollback;
select 'grilletto rinominato e istruito' as esito;
