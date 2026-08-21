-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I quindici viaggi approvati da Alessandro il 21/08/2026 e messi pubblici.
-- L'assegnazione a un Mecenate o a un Sostenitore si fara' piu' avanti, su
-- misura per la persona: intanto i viaggi vivono e si fanno trovare.
do $$
declare v record; nuovo uuid;
begin
  for v in select * from public.viaggi_piano order by ordine loop
    if v.trip_id is null then
      insert into public.trips (owner_id, name, description, is_historic, is_published, visibility, badge)
      values ('f34c26e7-59df-4885-95ec-e254f5feac6c', v.nome_it, v.descr_it, false, true, 'pub', v.tema)
      returning id into nuovo;
      update public.viaggi_piano set trip_id = nuovo, stato = 'pubblicato' where id = v.id;
    else
      update public.trips set is_published = true, visibility = 'pub' where id = v.trip_id;
      update public.viaggi_piano set stato = 'pubblicato' where id = v.id;
    end if;
  end loop;
end $$;
select 'viaggi pubblicati: '||count(*) from public.viaggi_piano where stato='pubblicato';
select 'itinerari pubblici: '||count(*) from public.trips where is_published and not is_historic;
