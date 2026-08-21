-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le audioguide ufficiali POI•VOICE.
-- Non sono la voce del proprietario (quella e' `luogo_voce`): queste le fa
-- l'amministrazione, durano quanto serve, esistono nelle tre lingue e sono
-- legate a un luogo o a una rotta storica.
--
-- Chi le ascolta e da dove:
--   sul posto, chiunque;
--   ovunque, chi ha un livello che lo prevede (Mecenate e Influencer oggi,
--   la colonna `ascolta_audioguide` della tabella livelli).

create table if not exists public.audioguide (
  id         uuid primary key default gen_random_uuid(),
  poi_id     uuid references public.pois(id) on delete cascade,
  trip_id    uuid references public.trips(id) on delete cascade,
  lingua     text not null check (lingua in ('it','sq','en')),
  titolo     text not null check (length(titolo) between 1 and 160),
  testo      text,                                   -- il copione, per leggerlo e per i motori di ricerca
  url        text not null,
  secondi    numeric(7,1) not null check (secondi > 0),
  voce       text,                                   -- chi legge
  pubblicata boolean not null default false,
  creata_da  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint audioguida_una_sola_casa check (num_nonnulls(poi_id, trip_id) = 1),
  unique (poi_id, lingua),
  unique (trip_id, lingua)
);
create index if not exists audioguide_poi_idx  on public.audioguide(poi_id)  where pubblicata;
create index if not exists audioguide_trip_idx on public.audioguide(trip_id) where pubblicata;

alter table public.audioguide enable row level security;
drop policy if exists audioguide_leggo on public.audioguide;
create policy audioguide_leggo on public.audioguide for select using (pubblicata = true);
drop policy if exists audioguide_admin on public.audioguide;
create policy audioguide_admin on public.audioguide for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
grant select on public.audioguide to anon, authenticated;
grant insert, update, delete on public.audioguide to authenticated;
grant all on public.audioguide to service_role;

-- Lo scaffale del Mecenate: le audioguide che si tiene da parte.
create table if not exists public.audioguide_scaffale (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  audioguida_id uuid not null references public.audioguide(id) on delete cascade,
  messa         timestamptz not null default now(),
  primary key (user_id, audioguida_id)
);
alter table public.audioguide_scaffale enable row level security;
drop policy if exists scaffale_mio on public.audioguide_scaffale;
create policy scaffale_mio on public.audioguide_scaffale for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, delete on public.audioguide_scaffale to authenticated;
grant all on public.audioguide_scaffale to service_role;

-- Posso ascoltarla da lontano? Lo dice il mio livello.
create or replace function public.ascolto_da_lontano()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select l.ascolta_audioguide
                     from public.profiles p
                     join public.livelli l on l.chiave = p.special_tier
                    where p.id = auth.uid()), false);
$$;
grant execute on function public.ascolto_da_lontano() to anon, authenticated;

notify pgrst, 'reload schema';

-- La regola dell'amministrazione non deve guardare dentro `profiles` con i
-- permessi di chi legge: un visitatore non ha accesso a quella tabella e la
-- lettura delle audioguide falliva. Si passa da una funzione di sistema.
create or replace function public.sono_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;
grant execute on function public.sono_admin() to anon, authenticated, service_role;

drop policy if exists audioguide_admin on public.audioguide;
create policy audioguide_admin on public.audioguide for all
  using (public.sono_admin()) with check (public.sono_admin());
