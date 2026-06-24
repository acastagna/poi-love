-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 008 — RPC transazionale per sincronizzare le tappe di un itinerario
-- Il frontend fa un "replace completo" delle tappe (delete + insert). Farlo dal client con due
-- chiamate separate NON e' atomico: se l'insert fallisce dopo la delete, le tappe spariscono dal DB.
-- Questa RPC esegue delete+insert in UNA transazione (la funzione e' una transazione): o tutto, o niente.
-- SECURITY DEFINER + check ownership: solo l'owner del trip puo' rimpiazzarne le tappe.

begin;

create or replace function public.replace_trip_stops(p_trip_id uuid, p_stops jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  -- solo l'owner del trip puo' rimpiazzarne le tappe
  if not exists (select 1 from public.trips t where t.id = p_trip_id and t.owner_id = v_uid) then
    raise exception 'not trip owner';
  end if;
  -- atomico: delete + insert nella stessa transazione (la funzione e' una sola transazione)
  delete from public.trip_stops where trip_id = p_trip_id;
  insert into public.trip_stops
    (trip_id, name, stop_date_label, status, lat, lng, poi_id, icon, icon_bg, icon_color, note, sort_order)
  select
    p_trip_id,
    s->>'name',
    s->>'stop_date_label',
    coalesce(nullif(s->>'status',''), 'planned'),
    (s->>'lat')::double precision,
    (s->>'lng')::double precision,
    (s->>'poi_id')::uuid,
    s->>'icon',
    s->>'icon_bg',
    s->>'icon_color',
    s->>'note',
    coalesce((s->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(p_stops, '[]'::jsonb)) as s
  where coalesce(nullif(s->>'name',''), '') <> '';   -- ignora tappe senza nome
end $$;

revoke all on function public.replace_trip_stops(uuid, jsonb) from public, anon;
grant execute on function public.replace_trip_stops(uuid, jsonb) to authenticated;

commit;
