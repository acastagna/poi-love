-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 015 — Storico chat del copilota + gestione POI dal pannello admin
--
-- 1) ai_chats: il copilota RICORDA le sue conversazioni. Una riga = una chat (messages jsonb).
--    L'admin la ritrova, la riapre, la rinomina o la cancella. RLS: solo l'admin proprietario.
-- 2) Policy admin ADDITIVE su pois: l'admin vede/modifica/cancella TUTTI i POI dal pannello,
--    non solo i propri. Sono permissive (OR con le policy esistenti), quindi non tolgono nulla
--    al flusso utente. Le restrictive esistenti (is_active su insert/update) restano in AND:
--    l'admin e' sempre attivo, quindi passa.
--
-- Idempotente. Tutto in schema public, identificatori con underscore, RLS obbligatorie.

begin;

-- ── 1) Storico chat del copilota ──────────────────────────────────────────────
create table if not exists public.ai_chats (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.profiles(id) on delete cascade,
  title      text,
  mode       text,
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_chats_admin on public.ai_chats(admin_id, updated_at desc);

alter table public.ai_chats enable row level security;

-- Solo l'admin (con aal2) e solo sulle PROPRIE chat.
drop policy if exists ai_chats_owner_admin on public.ai_chats;
create policy ai_chats_owner_admin on public.ai_chats
  for all
  using      ( (select public.is_admin()) and admin_id = (select auth.uid()) )
  with check ( (select public.is_admin()) and admin_id = (select auth.uid()) );

-- ── 2) Gestione POI dal pannello: l'admin governa tutti i POI ──────────────────
-- SELECT: per vedere anche i POI ufficiali/bozza di cui non e' autore.
drop policy if exists pois_admin_select on public.pois;
create policy pois_admin_select on public.pois
  for select using ( (select public.is_admin()) );

-- UPDATE: per correggere qualsiasi POI (resta in AND con require_active_upd: l'admin e' attivo).
drop policy if exists pois_admin_update on public.pois;
create policy pois_admin_update on public.pois
  for update using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- DELETE: per cancellare qualsiasi POI (nessuna restrictive su delete).
drop policy if exists pois_admin_delete on public.pois;
create policy pois_admin_delete on public.pois
  for delete using ( (select public.is_admin()) );

commit;
