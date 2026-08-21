-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- La copertina di un itinerario nostro.
-- Gli Itinerari Culturali nascevano senza immagine: nell'elenco erano solo
-- righe di testo. La copertina non si inventa, si prende dalla prima tappa che
-- ha una foto vera con la sua licenza.

create or replace function public.copertina_dal_viaggio(p_trip uuid)
returns text language plpgsql security definer set search_path to 'public' as $$
declare u text;
begin
  select coalesce(p.cover_photo, p.photos[1]) into u
    from public.trip_stops s
    join public.pois p on p.id = s.poi_id
   where s.trip_id = p_trip
     and coalesce(p.cover_photo, p.photos[1]) is not null
   order by s.sort_order
   limit 1;
  if u is not null then
    update public.trips set cover_url = u where id = p_trip and coalesce(cover_url,'') = '';
  end if;
  return u;
end $$;
grant execute on function public.copertina_dal_viaggio(uuid) to authenticated, service_role;

-- Quando si approva un viaggio intero, la copertina arriva da sola.
create or replace function public.approva_viaggio(p_viaggio int, p_soglia int default 60)
returns table (approvati int, tappe int, saltati int)
language plpgsql security definer set search_path to 'public' as $$
declare
  v public.viaggi_piano%rowtype;
  c record;
  v_poi uuid;
  n_ok int := 0; n_no int := 0; n_tappe int := 0;
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo approvare un viaggio';
  end if;
  select * into v from public.viaggi_piano where ordine = p_viaggio;
  if not found then raise exception 'Viaggio % non trovato', p_viaggio; end if;
  if v.trip_id is null then raise exception 'Il viaggio % non ha ancora un itinerario', p_viaggio; end if;

  for c in select * from public.candidati
            where viaggio_id = v.id and stato = 'proposto' and fiducia >= p_soglia
            order by fiducia desc, nome loop
    begin
      v_poi := public.approva_candidato(c.id);
      n_ok := n_ok + 1;
      insert into public.trip_stops (trip_id, name, lat, lng, poi_id, status, sort_order, region, image_url)
      values (v.trip_id, c.nome, c.lat, c.lng, v_poi, 'planned',
              (select coalesce(max(sort_order),0)+10 from public.trip_stops where trip_id = v.trip_id),
              c.prefettura, c.foto_url);
      n_tappe := n_tappe + 1;
    exception when others then
      n_no := n_no + 1;
      update public.candidati set motivo = left(sqlerrm, 200) where id = c.id;
    end;
  end loop;

  perform public.copertina_dal_viaggio(v.trip_id);
  return query select n_ok, n_tappe, n_no;
end $$;
grant execute on function public.approva_viaggio(int, int) to authenticated;

-- E per quello gia' pubblicato, adesso.
do $$
declare t record;
begin
  for t in select trip_id from public.viaggi_piano where trip_id is not null loop
    perform public.copertina_dal_viaggio(t.trip_id);
  end loop;
end $$;

select name, case when coalesce(cover_url,'')='' then 'senza copertina' else 'ha la copertina' end
  from public.trips where tipo='culturale' order by name;
