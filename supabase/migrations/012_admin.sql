-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 012 — Pannello Admin
-- Ruolo admin sui profili, stato moderazione utenti, segnalazioni (POI/utenti),
-- audit log azioni admin, config limiti AI per tier, RPC di moderazione sicura.
-- Idempotente (IF NOT EXISTS / ON CONFLICT / DROP ... IF EXISTS / DO blocks): ri-eseguibile senza danni.
-- Vincoli progetto: tutto in schema public, RLS obbligatorie, identificatori con underscore.
--
-- SICUREZZA: le tabelle admin sono accessibili in lettura/scrittura SOLO a chi e' admin, via is_admin()
-- (SECURITY DEFINER, anti-ricorsione RLS). La promozione ad admin e i campi di moderazione NON sono
-- modificabili dal client: is_admin solo da service_role/console; moderation_* solo via la RPC
-- admin_set_user_status() (che verifica is_admin e segna app.admin_op per superare il trigger anti-tamper).

begin;

-- ── 1) PROFILI: ruolo admin + stato di moderazione ───────────────────────────
alter table public.profiles
  add column if not exists is_admin              boolean     not null default false,
  add column if not exists moderation_status     text        not null default 'active',
  add column if not exists moderation_reason      text,
  add column if not exists moderation_until       timestamptz,
  add column if not exists moderation_updated_by  uuid references public.profiles(id) on delete set null,
  add column if not exists moderation_updated_at  timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_moderation_status_chk') then
    alter table public.profiles add constraint profiles_moderation_status_chk
      check (moderation_status in ('active','suspended','banned'));
  end if;
end $$;

create index if not exists idx_profiles_is_admin
  on public.profiles(is_admin) where is_admin = true;
create index if not exists idx_profiles_moderation_status
  on public.profiles(moderation_status) where moderation_status <> 'active';

-- ── 2) HELPER is_admin() — SECURITY DEFINER, anti-ricorsione RLS ──────────────
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.is_admin = true and p.moderation_status = 'active'
  );
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;

-- ── 3) SEGNALAZIONI — report di POI o utenti (target polimorfico) ─────────────
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  reason        text not null,
  details       text,
  status        text not null default 'open',
  resolution    text,
  handled_by    uuid references public.profiles(id) on delete set null,
  handled_at    timestamptz,
  created_at    timestamptz not null default now(),
  constraint reports_target_type_chk check (target_type in ('poi','user')),
  constraint reports_reason_chk      check (reason in ('spam','abuse','offensive','wrong_info','duplicate','illegal','other')),
  constraint reports_status_chk      check (status in ('open','reviewing','resolved','dismissed'))
);
create index if not exists idx_reports_status   on public.reports(status);
create index if not exists idx_reports_target   on public.reports(target_type, target_id);
create index if not exists idx_reports_reporter on public.reports(reporter_id);

-- ── 4) AUDIT LOG — append-only ────────────────────────────────────────────────
create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references public.profiles(id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    text,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  constraint admin_audit_action_chk check (char_length(action) between 1 and 64)
);
create index if not exists idx_admin_audit_admin   on public.admin_audit_log(admin_id);
create index if not exists idx_admin_audit_created on public.admin_audit_log(created_at desc);

-- ── 5) LIMITI AI PER TIER — estende gamification_config (key/jsonb) ───────────
insert into public.gamification_config (key, value) values
  ('ai_limits_per_tier',
   '{
      "free":          {"messages_per_day": 10,  "max_tokens": 1024, "model": "gpt-4o-mini"},
      "professionista":{"messages_per_day": 50,  "max_tokens": 2048, "model": "gpt-4o-mini"},
      "sostenitore":   {"messages_per_day": 200, "max_tokens": 4096, "model": "gpt-4o-mini"},
      "mecenate":      {"messages_per_day": 1000,"max_tokens": 8192, "model": "gpt-4o-mini"}
    }'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── 6) RLS sulle nuove tabelle ────────────────────────────────────────────────
alter table public.reports         enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "reports_read" on public.reports;
create policy "reports_read" on public.reports
  for select using (public.is_admin() or auth.uid() = reporter_id);

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
  for insert with check (auth.uid() = reporter_id and status = 'open' and handled_by is null and resolution is null);

drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reports_admin_delete" on public.reports;
create policy "reports_admin_delete" on public.reports
  for delete using (public.is_admin());

drop policy if exists "admin_audit_read" on public.admin_audit_log;
create policy "admin_audit_read" on public.admin_audit_log
  for select using (public.is_admin());

drop policy if exists "admin_audit_insert" on public.admin_audit_log;
create policy "admin_audit_insert" on public.admin_audit_log
  for insert with check (public.is_admin() and admin_id = auth.uid());

-- scrittura admin sulla config (i limiti AI si regolano dal pannello, senza service_role)
drop policy if exists "gamification_config_admin_write" on public.gamification_config;
create policy "gamification_config_admin_write" on public.gamification_config
  for all using (public.is_admin()) with check (public.is_admin());

-- ── 7) ANTI-TAMPER: estende il trigger della mig 001 a is_admin + moderation_* ─
--    is_admin: solo service_role/console. moderation_*: solo via RPC admin (app.admin_op='1').
create or replace function public.protect_gamification_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce((current_setting('request.jwt.claims', true)::json)->>'role', '');
  admin_op text := coalesce(current_setting('app.admin_op', true), '');
begin
  if jwt_role <> 'service_role' then
    new.points := old.points;
    new.special_tier := old.special_tier;
    if old.referred_by is not null then
      new.referred_by := old.referred_by;
    end if;
    -- il ruolo admin non si tocca MAI dal client/RPC: solo service_role o console SQL
    new.is_admin := old.is_admin;
    -- la moderazione si cambia solo tramite la RPC admin (che imposta app.admin_op='1')
    if admin_op <> '1' then
      new.moderation_status     := old.moderation_status;
      new.moderation_reason     := old.moderation_reason;
      new.moderation_until      := old.moderation_until;
      new.moderation_updated_by := old.moderation_updated_by;
      new.moderation_updated_at := old.moderation_updated_at;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_gamification on public.profiles;
create trigger trg_protect_gamification
  before update on public.profiles
  for each row execute function public.protect_gamification_columns();

-- ── 8) RPC moderazione: l'admin sospende/banna/riattiva un utente in sicurezza ─
create or replace function public.admin_set_user_status(
  p_target uuid, p_status text, p_reason text default null, p_until timestamptz default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_status not in ('active','suspended','banned') then raise exception 'invalid status'; end if;
  if p_target = auth.uid() then raise exception 'cannot moderate yourself'; end if;
  perform set_config('app.admin_op', '1', true);   -- transaction-local: supera il trigger anti-tamper
  update public.profiles
     set moderation_status = p_status, moderation_reason = p_reason, moderation_until = p_until,
         moderation_updated_by = auth.uid(), moderation_updated_at = now()
   where id = p_target;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (auth.uid(), 'set_user_status', 'user', p_target::text,
          jsonb_build_object('status', p_status, 'reason', p_reason, 'until', p_until));
end $$;
revoke all on function public.admin_set_user_status(uuid,text,text,timestamptz) from public;
grant execute on function public.admin_set_user_status(uuid,text,text,timestamptz) to authenticated;

commit;

-- ── NOTA OPERATIVA (fuori transazione) ───────────────────────────────────────
-- Prima promozione admin, da console SQL o service_role (mai dal client):
--   update public.profiles set is_admin = true where id = '<UUID_DEL_TUO_PROFILO>';
