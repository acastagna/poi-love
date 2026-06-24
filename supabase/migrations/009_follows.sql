-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 009 — Follow / connessioni social
-- Il frontend (togglePublicFollow) gia' fa insert/delete su `follows` con follower_id/following_id,
-- ma la tabella non esisteva: il follow falliva in silenzio. Questa migrazione la crea.
-- I follow sono pubblici in lettura (standard social: i contatori follower/seguiti sono visibili).
-- NOTA PRE-LANCIO (rivedere prima del 17/08): SELECT using(true) espone l'intero grafo sociale agli
-- utenti loggati (scraping possibile). Accettabile per la beta; valutare rate limiting o restrizione.

begin;

create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,  -- chi segue
  following_id uuid not null references public.profiles(id) on delete cascade,  -- chi e' seguito
  created_at   timestamptz not null default now(),
  constraint uq_follow unique (follower_id, following_id),       -- un follow una volta sola
  constraint no_self_follow check (follower_id <> following_id)  -- non ci si segue da soli (difesa in profondita')
);
create index if not exists idx_follows_follower  on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

alter table public.follows enable row level security;

-- SELECT pubblico (tra autenticati): serve per contare/elencare follower e seguiti di un profilo
drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows for select to authenticated using (true);
-- INSERT: seguo solo a nome mio
drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert to authenticated with check (follower_id = auth.uid());
-- DELETE: smetto di seguire solo i miei follow
drop policy if exists follows_delete on public.follows;
create policy follows_delete on public.follows for delete to authenticated using (follower_id = auth.uid());
-- niente UPDATE: un follow si crea o si elimina, non si modifica

commit;
