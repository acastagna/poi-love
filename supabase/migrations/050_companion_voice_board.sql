-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 050 — Bacheca VOCALE della compagnia (walkie-talkie "premi e parla").
-- Ogni compagnia diventa anche una bacheca di vocali: si registra l'audio (resta sempre) e si trascrive
-- (Whisper server-side, riempita async da una edge function). Reazioni like/dislike (NO love) e risposte (parent_id).
-- Accesso SOLO ai membri della compagnia (RLS via is_companion_member). Audio in bucket privato companion_audio.
-- Tutto in schema public, RLS obbligatorie, idempotente.

begin;

-- ── Messaggi vocali ──
create table if not exists public.companion_messages (
  id           uuid primary key default gen_random_uuid(),
  companion_id uuid not null references public.companions(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  audio_path   text,                    -- path nel bucket companion_audio: {companion_id}/{id}.webm
  duration_ms  int,
  transcript   text,                    -- trascrizione (riempita async da Whisper); puo' restare null, l'audio basta
  lang         text,                    -- lingua rilevata/della trascrizione
  parent_id    uuid references public.companion_messages(id) on delete cascade,  -- risposta a un altro vocale
  created_at   timestamptz not null default now()
);
create index if not exists companion_messages_comp_idx on public.companion_messages (companion_id, created_at desc);
create index if not exists companion_messages_parent_idx on public.companion_messages (parent_id);

alter table public.companion_messages enable row level security;

-- Solo i membri della compagnia leggono; l'autore inserisce i propri; l'autore cancella i propri.
drop policy if exists comp_msg_sel on public.companion_messages;
create policy comp_msg_sel on public.companion_messages
  for select to authenticated using (public.is_companion_member(companion_id));
drop policy if exists comp_msg_ins on public.companion_messages;
create policy comp_msg_ins on public.companion_messages
  for insert to authenticated with check (author_id = (select auth.uid()) and public.is_companion_member(companion_id));
drop policy if exists comp_msg_del on public.companion_messages;
create policy comp_msg_del on public.companion_messages
  for delete to authenticated using (author_id = (select auth.uid()));
-- Nessuna UPDATE da client: la trascrizione la scrive la edge function (service_role, bypassa RLS).
revoke update on public.companion_messages from authenticated, anon, public;

-- ── Reazioni: like / dislike (una per utente per messaggio) ──
create table if not exists public.companion_message_reactions (
  message_id uuid not null references public.companion_messages(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('like','dislike')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.companion_message_reactions enable row level security;

-- I membri della compagnia (del messaggio) leggono le reazioni; ognuno gestisce SOLO la propria.
drop policy if exists comp_react_sel on public.companion_message_reactions;
create policy comp_react_sel on public.companion_message_reactions
  for select to authenticated using (
    exists(select 1 from public.companion_messages m
           where m.id = message_id and public.is_companion_member(m.companion_id)));
drop policy if exists comp_react_ins on public.companion_message_reactions;
create policy comp_react_ins on public.companion_message_reactions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and
    exists(select 1 from public.companion_messages m
           where m.id = message_id and public.is_companion_member(m.companion_id)));
drop policy if exists comp_react_upd on public.companion_message_reactions;
create policy comp_react_upd on public.companion_message_reactions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists comp_react_del on public.companion_message_reactions;
create policy comp_react_del on public.companion_message_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- ── Realtime per la bacheca (nuovi vocali + reazioni live) ──
do $$ begin alter publication supabase_realtime add table public.companion_messages;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.companion_message_reactions;
exception when duplicate_object then null; when others then null; end $$;

-- ── Bucket audio privato ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('companion_audio','companion_audio', false, 10485760, array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'])
  on conflict (id) do nothing;

-- Storage policies: solo i membri della compagnia (dedotta dalla prima cartella del path = companion_id) leggono/caricano.
drop policy if exists comp_audio_sel on storage.objects;
create policy comp_audio_sel on storage.objects
  for select to authenticated using (
    bucket_id = 'companion_audio' and public.is_companion_member(((storage.foldername(name))[1])::uuid));
drop policy if exists comp_audio_ins on storage.objects;
create policy comp_audio_ins on storage.objects
  for insert to authenticated with check (
    bucket_id = 'companion_audio' and public.is_companion_member(((storage.foldername(name))[1])::uuid));
drop policy if exists comp_audio_del on storage.objects;
create policy comp_audio_del on storage.objects
  for delete to authenticated using (
    bucket_id = 'companion_audio' and owner = (select auth.uid()));

commit;
