-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 065 — Dalla scheda Crea POI si può PROPORRE il POI all'amministrazione come tappa di una
-- rotta storica. L'admin lo vede tra le proposte e lo aggiunge a una rotta. (L'aggiunta a un itinerario
-- personale usa già trip_stops, non serve schema nuovo.)

begin;

alter table public.pois add column if not exists route_proposed boolean not null default false;
alter table public.pois add column if not exists route_proposed_at timestamptz;
create index if not exists pois_route_proposed_idx on public.pois(route_proposed) where route_proposed = true;

grant update (route_proposed, route_proposed_at) on public.pois to authenticated;

-- Il creatore propone il proprio POI come tappa di rotta storica.
create or replace function public.propose_poi_as_route_stop(p_poi uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.pois
    set route_proposed = true, route_proposed_at = now()
  where id = p_poi and author_id = auth.uid();
  if not found then raise exception 'not your POI'; end if;
end $$;
grant execute on function public.propose_poi_as_route_stop(uuid) to authenticated;

-- L'admin marca una proposta come gestita (toglie il flag).
create or replace function public.admin_clear_poi_route_proposal(p_poi uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  update public.pois set route_proposed = false where id = p_poi;
end $$;
grant execute on function public.admin_clear_poi_route_proposal(uuid) to authenticated;

commit;
