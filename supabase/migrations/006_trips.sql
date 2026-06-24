-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 006 — Itinerari (trips) persistenti
-- Due tabelle: `trips` (il viaggio) e `trip_stops` (le tappe ordinate).
-- Le date sono label testuali (es. "12-15 Mag") come nel frontend, non date SQL: l'itinerario e'
-- editoriale, non un evento a calendario rigido. cal_year/cal_month servono al mini-calendario UI.
-- Salda il secondo debito della 004: FK lists.itinerary_id -> trips(id).
--
-- RLS: trips e' owner-only. trip_stops eredita l'accesso dal trip via subquery su trips (niente
-- ricorsione: trip_stops interroga trips, non se stessa).

begin;

-- ── Tabella viaggi ──────────────────────────────────────────────
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  cover_url   text,
  badge       text,          -- etichetta breve (citta'/tema)
  dates_label text,          -- intervallo testuale, es. "12-15 Mag"
  cal_year    int,
  cal_month   int check (cal_month is null or cal_month between 1 and 12),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_trips_owner on public.trips(owner_id);

-- ── Tabella tappe ───────────────────────────────────────────────
create table if not exists public.trip_stops (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  name            text not null,
  stop_date_label text,                       -- es. "12 Mag" (testo libero come nel frontend)
  status          text not null default 'planned' check (status in ('planned','done','suspended')),
  lat             double precision,   -- nullable di proposito: una tappa puo' essere solo editoriale (es. "pranzo"), senza geo
  lng             double precision,
  poi_id          uuid references public.pois(id) on delete set null,  -- se la tappa e' un POI reale
  icon            text,
  icon_bg         text,
  icon_color      text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_trip_stops_trip on public.trip_stops(trip_id);
create index if not exists idx_trip_stops_order on public.trip_stops(trip_id, sort_order);

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.trips      enable row level security;
alter table public.trip_stops enable row level security;

-- trips: owner-only su tutte le operazioni
drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips for select to authenticated using (owner_id = auth.uid());
drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists trips_update on public.trips;
create policy trips_update on public.trips for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists trips_delete on public.trips;
create policy trips_delete on public.trips for delete to authenticated using (owner_id = auth.uid());

-- trip_stops: accesso ereditato dall'ownership del trip (subquery su trips, niente ricorsione).
-- La subquery e' soggetta alla policy trips_select (owner-only), quindi solo l'owner del trip
-- vede/modifica le sue tappe.
drop policy if exists trip_stops_select on public.trip_stops;
create policy trip_stops_select on public.trip_stops for select to authenticated
  using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
drop policy if exists trip_stops_insert on public.trip_stops;
create policy trip_stops_insert on public.trip_stops for insert to authenticated
  with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
drop policy if exists trip_stops_update on public.trip_stops;
create policy trip_stops_update on public.trip_stops for update to authenticated
  using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
drop policy if exists trip_stops_delete on public.trip_stops;
create policy trip_stops_delete on public.trip_stops for delete to authenticated
  using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

-- ── Salda il debito della 004: FK lists.itinerary_id -> trips(id) ──
-- on delete set null: se un itinerario sparisce, le liste collegate non puntano a un id morto.
alter table public.lists drop constraint if exists fk_lists_itinerary;
alter table public.lists
  add constraint fk_lists_itinerary
  foreign key (itinerary_id) references public.trips(id) on delete set null;

-- ── updated_at automatico (mancava: la colonna restava ferma). Vale per trips, e saldo anche companions (005) ──
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at before update on public.trips
  for each row execute function public.set_updated_at();
drop trigger if exists companions_set_updated_at on public.companions;
create trigger companions_set_updated_at before update on public.companions
  for each row execute function public.set_updated_at();

commit;
