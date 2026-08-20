-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- La guardia della moderazione.
-- Chi scrive una recensione non puo' pubblicarla da solo: qualunque cosa mandi,
-- lo stato che arriva dal telefono diventa 'in_coda'. L'unica a poter scrivere
-- 'pubblicata' o 'rifiutata' e' la funzione di moderazione, che gira sul server
-- con la chiave di servizio.

create or replace function public.tg_recensione_stato() returns trigger
language plpgsql as $$
begin
  if current_user <> 'service_role' and current_user <> 'postgres' then
    if tg_op = 'INSERT' then
      new.stato := 'in_coda';
      new.motivo := null;
      new.direttiva := null;
    else
      -- se cambia voto o testo la recensione torna in coda: si rimodera
      if new.voto is distinct from old.voto or new.testo is distinct from old.testo then
        new.stato := 'in_coda';
        new.motivo := null;
        new.direttiva := null;
      else
        new.stato := old.stato;
        new.motivo := old.motivo;
        new.direttiva := old.direttiva;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists recensione_stato on public.recensioni;
create trigger recensione_stato before insert or update on public.recensioni
  for each row execute function public.tg_recensione_stato();

-- Il trigger dei punti deve girare DOPO la guardia: si rinomina cosi' l'ordine
-- alfabetico lo mette per secondo (i trigger BEFORE partono in ordine di nome).
drop trigger if exists recensione_punti on public.recensioni;
create trigger recensione_zz_punti before insert or update on public.recensioni
  for each row execute function public.tg_recensione_punti();

notify pgrst, 'reload schema';

-- Chi scrive e' chi e' collegato: non serve che lo dica l'app.
alter table public.recensioni alter column autore_id set default auth.uid();

-- La moderazione lavora con la chiave di servizio: le servono i permessi.
grant select, insert, update, delete on public.recensioni to service_role;
grant select on public.direttive_moderazione to service_role;
