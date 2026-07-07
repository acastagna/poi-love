-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 053 — Immagini della bacheca compagnia. Ogni membro puo' aggiungere foto (WebP compressa lato client);
-- ogni immagine mostra l'avatar di chi l'ha postata e la data. Solo membri leggono (RLS). Cancellazione: autore o admin.
-- Bucket privato companion_photos (path: {companion_id}/{id}.webp), servito via signed URL.

begin;

create table if not exists public.companion_images (
  id           uuid primary key default gen_random_uuid(),
  companion_id uuid not null references public.companions(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  image_path   text not null,
  caption      text,
  created_at   timestamptz not null default now()
);
create index if not exists companion_images_comp_idx on public.companion_images (companion_id, created_at desc);

alter table public.companion_images enable row level security;

drop policy if exists comp_img_sel on public.companion_images;
create policy comp_img_sel on public.companion_images
  for select to authenticated using (public.is_companion_member(companion_id));
drop policy if exists comp_img_ins on public.companion_images;
create policy comp_img_ins on public.companion_images
  for insert to authenticated with check (author_id = (select auth.uid()) and public.is_companion_member(companion_id));
drop policy if exists comp_img_del on public.companion_images;
create policy comp_img_del on public.companion_images
  for delete to authenticated using (
    author_id = (select auth.uid())
    or exists (select 1 from public.companions c where c.id = companion_id and c.owner_id = (select auth.uid())));
revoke update on public.companion_images from authenticated, anon, public;

do $$ begin alter publication supabase_realtime add table public.companion_images;
exception when duplicate_object then null; when others then null; end $$;

-- Bucket privato immagini
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('companion_photos','companion_photos', false, 8388608, array['image/webp','image/jpeg','image/png'])
  on conflict (id) do nothing;

drop policy if exists comp_photo_sel on storage.objects;
create policy comp_photo_sel on storage.objects
  for select to authenticated using (
    bucket_id = 'companion_photos' and public.is_companion_member(((storage.foldername(name))[1])::uuid));
drop policy if exists comp_photo_ins on storage.objects;
create policy comp_photo_ins on storage.objects
  for insert to authenticated with check (
    bucket_id = 'companion_photos' and public.is_companion_member(((storage.foldername(name))[1])::uuid));
drop policy if exists comp_photo_del on storage.objects;
create policy comp_photo_del on storage.objects
  for delete to authenticated using (
    bucket_id = 'companion_photos' and owner = (select auth.uid()));

commit;
