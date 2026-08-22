-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il pezzo mancante della sincronia (revisione del 22/08, rilievo MAJOR):
-- i grilletti della 167 coprivano inserimento e modifica, non la
-- cancellazione. Le colonne storiche sono obbligatorie per costruzione
-- (not null): quindi la regola vera e' che le tre lingue grandi non si
-- cancellano, si modificano. Le lingue oltre le tre si tolgono liberamente.

create or replace function public.cat_eti_niente_cancella_grandi()
returns trigger language plpgsql as $$
begin
  if old.lingua in ('it','sq','en') then
    raise exception 'Le tre lingue grandi (it, sq, en) sono obbligatorie: l''etichetta si modifica, non si cancella';
  end if;
  return old;
end $$;
drop trigger if exists cat_eti_sync_del on public.categoria_etichette;
create trigger cat_eti_sync_del before delete on public.categoria_etichette
  for each row execute function public.cat_eti_niente_cancella_grandi();

-- La prova: la grande e' protetta, la piccola si toglie.
do $$
begin
  begin
    delete from public.categoria_etichette where chiave='ristorante' and lingua='en';
    raise exception 'IL GRILLETTO NON HA PROTETTO';
  exception when others then
    if sqlerrm like '%obbligatorie%' then raise notice 'protezione ok: %', sqlerrm;
    else raise; end if;
  end;
end $$;
begin;
insert into public.categoria_etichette values ('ristorante','el','Εστιατόριο');
delete from public.categoria_etichette where chiave='ristorante' and lingua='el';
select 'lingua piccola tolta senza ostacoli' as esito;
rollback;
select 'grilletto attivo' as esito;
