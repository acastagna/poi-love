-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 058 — replace_trip_stops ora preserva i NUOVI campi tappa (stay_label, image_url, region),
-- altrimenti il riordino/sospensione (che fa delete+insert) li cancellava. Solo ricreazione funzione.

create or replace function public.replace_trip_stops(p_trip_id uuid, p_stops jsonb)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'auth required'; end if;
  if not exists (select 1 from public.trips t where t.id = p_trip_id and t.owner_id = v_uid) then
    raise exception 'not trip owner';
  end if;
  delete from public.trip_stops where trip_id = p_trip_id;
  insert into public.trip_stops
    (trip_id, name, stop_date_label, status, lat, lng, poi_id, icon, icon_bg, icon_color, note, sort_order, stay_label, image_url, region)
  select
    p_trip_id, s->>'name', s->>'stop_date_label',
    coalesce(nullif(s->>'status',''), 'planned'),
    (s->>'lat')::double precision, (s->>'lng')::double precision,
    (s->>'poi_id')::uuid, s->>'icon', s->>'icon_bg', s->>'icon_color', s->>'note',
    coalesce((s->>'sort_order')::int, 0),
    s->>'stay_label', s->>'image_url', s->>'region'
  from jsonb_array_elements(coalesce(p_stops, '[]'::jsonb)) as s
  where coalesce(nullif(s->>'name',''), '') <> '';
end $function$;
