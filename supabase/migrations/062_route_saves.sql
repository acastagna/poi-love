-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 062 — "Salva / tieni per te" una rotta storica o un itinerario pubblico.
-- Come i LOVE sui POI, ma per gli itinerari (trips): l'utente li salva e li ritrova.

begin;

create table if not exists public.trip_saves (
  user_id    uuid not null references auth.users(id) on delete cascade,
  trip_id    uuid not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);
create index if not exists trip_saves_trip_idx on public.trip_saves(trip_id);
create index if not exists trip_saves_user_idx on public.trip_saves(user_id);

alter table public.trip_saves enable row level security;

-- l'utente gestisce SOLO i propri salvataggi
drop policy if exists trip_saves_select on public.trip_saves;
create policy trip_saves_select on public.trip_saves for select to authenticated
  using (user_id = auth.uid());

drop policy if exists trip_saves_insert on public.trip_saves;
create policy trip_saves_insert on public.trip_saves for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (   -- si può salvare solo ciò che è visibile: rotta storica pubblicata o itinerario pubblico
      select 1 from public.trips t
      where t.id = trip_id
        and ( (t.is_historic = true and coalesce(t.is_published,false) = true)
              or t.visibility = 'pub'
              or t.owner_id = auth.uid() )
    )
  );

drop policy if exists trip_saves_delete on public.trip_saves;
create policy trip_saves_delete on public.trip_saves for delete to authenticated
  using (user_id = auth.uid());

-- conteggio salvataggi di un itinerario/rotta (pubblico, per il contatore)
create or replace function public.trip_save_count(p_trip uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.trip_saves where trip_id = p_trip;
$$;
grant execute on function public.trip_save_count(uuid) to anon, authenticated;

commit;
