-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Dentro la compagnia mancavano due cose: i luoghi e gli itinerari.
-- La bacheca c'era, ma i posti restavano messaggi che scorrono via. Adesso la
-- compagnia ha i suoi luoghi e i suoi itinerari, che restano li' e li vedono
-- tutti quelli che ne fanno parte.

create table if not exists public.companion_pois (
  companion_id uuid not null references public.companions(id) on delete cascade,
  poi_id       uuid not null references public.pois(id) on delete cascade,
  aggiunto_da  uuid references public.profiles(id) on delete set null,
  quando       timestamptz not null default now(),
  primary key (companion_id, poi_id)
);
create index if not exists companion_pois_idx on public.companion_pois(companion_id, quando desc);

alter table public.companion_pois enable row level security;
drop policy if exists comp_pois_leggo on public.companion_pois;
create policy comp_pois_leggo on public.companion_pois for select using (public.is_companion_member(companion_id));
drop policy if exists comp_pois_scrivo on public.companion_pois;
create policy comp_pois_scrivo on public.companion_pois for insert with check (public.is_companion_member(companion_id) and aggiunto_da = auth.uid());
drop policy if exists comp_pois_tolgo on public.companion_pois;
create policy comp_pois_tolgo on public.companion_pois for delete using (
  aggiunto_da = auth.uid()
  or exists (select 1 from public.companions c where c.id = companion_id and c.owner_id = auth.uid())
);
grant select, insert, delete on public.companion_pois to authenticated;
grant all on public.companion_pois to service_role;

-- Un itinerario puo' appartenere a una compagnia: e' il viaggio che stanno
-- facendo insieme. Resta di chi lo ha creato, ma lo vedono tutti.
alter table public.trips add column if not exists companion_id uuid references public.companions(id) on delete set null;
create index if not exists trips_companion_idx on public.trips(companion_id) where companion_id is not null;

drop policy if exists trips_compagnia_leggo on public.trips;
create policy trips_compagnia_leggo on public.trips for select using (
  companion_id is not null and public.is_companion_member(companion_id)
);

notify pgrst, 'reload schema';
