-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 010 — Rotte storiche degli utenti
-- Le rotte UFFICIALI (_HISTORIC_ROUTES) sono hardcoded nel frontend (curate dall'amministrazione).
-- Le rotte UTENTE vivevano in localStorage (poi_user_routes): questa tabella le persiste.
-- Struttura semplice e editoriale: nome, meta (sottotitolo), e stile (icona/colore/sfondo).
-- I "punti" della rotta (POI collegati) sono un layer successivo: il frontend non li persiste ancora.

begin;

create table if not exists public.user_routes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  meta       text,
  icon       text,
  color      text,
  bg         text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_routes_owner on public.user_routes(owner_id);

alter table public.user_routes enable row level security;

-- owner-based: le rotte utente sono private al proprietario (potranno diventare pubbliche in futuro)
drop policy if exists user_routes_select on public.user_routes;
create policy user_routes_select on public.user_routes for select to authenticated using (owner_id = auth.uid());
drop policy if exists user_routes_insert on public.user_routes;
create policy user_routes_insert on public.user_routes for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists user_routes_update on public.user_routes;
create policy user_routes_update on public.user_routes for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists user_routes_delete on public.user_routes;
create policy user_routes_delete on public.user_routes for delete to authenticated using (owner_id = auth.uid());

-- updated_at automatico (riusa set_updated_at creata nella 006)
drop trigger if exists user_routes_set_updated_at on public.user_routes;
create trigger user_routes_set_updated_at before update on public.user_routes
  for each row execute function public.set_updated_at();

commit;
