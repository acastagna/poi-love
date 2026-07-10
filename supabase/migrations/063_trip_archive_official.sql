-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 063 — Gesti swipe sugli itinerari: archiviare (nascondere senza cancellare) e proporre
-- l'itinerario all'amministrazione perché diventi una rotta ufficiale (col nome del proponente).

begin;

alter table public.trips add column if not exists archived boolean not null default false;
alter table public.trips add column if not exists official_requested boolean not null default false;
alter table public.trips add column if not exists official_requested_at timestamptz;

-- Il proprietario può aggiornare queste colonne (le policy update per owner già esistono; qui i grant a colonna).
grant update (archived, official_requested, official_requested_at) on public.trips to authenticated;

-- RPC: il proprietario propone il proprio itinerario come ufficiale (l'admin poi decide).
create or replace function public.propose_trip_official(p_trip uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.trips
    set official_requested = true, official_requested_at = now()
  where id = p_trip and owner_id = auth.uid();
  if not found then raise exception 'not your itinerary'; end if;
end $$;
grant execute on function public.propose_trip_official(uuid) to authenticated;

commit;
