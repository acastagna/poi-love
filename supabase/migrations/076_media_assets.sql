-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Inventario MEDIA: ogni immagine caricata dall'admin (e in prospettiva dall'app) viene registrata
-- qui, così esiste una LIBRERIA da cui riscegliere le immagini (mai più URL a mano).

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  url text not null,
  kind text,                      -- 'poi' | 'stop' | 'avatar' | 'cover' | 'og' | 'generic'
  width int, height int, bytes int, mime text,
  source text default 'upload',   -- upload | ai | web
  created_at timestamptz not null default now()
);
create index if not exists media_assets_owner_idx on public.media_assets(owner_id);
create index if not exists media_assets_created_idx on public.media_assets(created_at desc);

alter table public.media_assets enable row level security;
-- lettura: il proprietario o un admin (la libreria admin le vede tutte)
drop policy if exists media_read on public.media_assets;
create policy media_read on public.media_assets for select
  using (owner_id = auth.uid() or public.is_active_admin());
-- inserimento: utente autenticato registra i propri; admin può registrare qualsiasi owner
drop policy if exists media_insert on public.media_assets;
create policy media_insert on public.media_assets for insert to authenticated
  with check (owner_id = auth.uid() or public.is_active_admin());
-- cancellazione dall'inventario: proprietario o admin
drop policy if exists media_delete on public.media_assets;
create policy media_delete on public.media_assets for delete
  using (owner_id = auth.uid() or public.is_active_admin());
