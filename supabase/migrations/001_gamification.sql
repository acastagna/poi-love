-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- https://321.al
--
-- Migrazione 001 — Gamification core
-- Punti e livelli sui profili, log eventi, config regolabile da admin, referral.
-- Idempotente (IF NOT EXISTS / ON CONFLICT / DROP ... IF EXISTS): ri-eseguibile senza danni.
-- Vincoli progetto: tutto in schema public, RLS obbligatorie, identificatori con underscore.
--
-- SICUREZZA (punto chiave): i punti NON sono scrivibili dal client. La scrittura legittima
-- avviene solo via service_role (Edge Function / backend), che bypassa RLS. A difesa in profondita':
--  - point_events / referrals: nessuna policy di scrittura per anon/authenticated (RLS nega di default)
--  - profiles.points / special_tier / referred_by: un trigger BEFORE UPDATE ripristina i valori se
--    chi modifica NON e' service_role, così il client non puo' auto-assegnarsi punti o tier.

begin;

-- 1) Profili: punteggio gamification, livello special (a sostegno), chi mi ha invitato
alter table public.profiles
  add column if not exists points       integer not null default 0,
  add column if not exists special_tier text,
  add column if not exists referred_by  uuid references public.profiles(id) on delete set null;

-- Vincoli su profiles (idempotenti)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_special_tier_chk') then
    alter table public.profiles add constraint profiles_special_tier_chk
      check (special_tier is null or special_tier in ('sostenitore','mecenate'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_points_nonneg_chk') then
    alter table public.profiles add constraint profiles_points_nonneg_chk
      check (points >= 0);
  end if;
end $$;

-- 2) Config gamification: punti per azione e soglie livelli, REGOLABILI da admin (mai hardcoded)
create table if not exists public.gamification_config (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 3) Eventi punti: log di ogni azione che assegna punti (per ricalcolo e anti-abuso)
create table if not exists public.point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  action     text not null,
  entity_id  text,                          -- id dell'entita' coinvolta (poi, lista, utente invitato...)
  points     integer not null,
  created_at timestamptz not null default now(),
  constraint point_events_action_chk check (action in (
    'create_poi','create_list','create_route','love_given','love_received',
    'share','referral_confirmed','make_route_public'
  )),
  constraint point_events_points_nonzero_chk check (points <> 0)
);
create index if not exists idx_point_events_user on public.point_events(user_id);

-- 4) Referral: inviti tracciati, punti accreditati solo a iscrizione confermata
create table if not exists public.referrals (
  id             uuid primary key default gen_random_uuid(),
  referrer_id    uuid not null references public.profiles(id) on delete cascade,
  referred_email text unique,               -- un invitato ha un solo referrer
  referred_id    uuid references public.profiles(id) on delete set null,
  confirmed      boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);

-- 5) Trigger: blinda le colonne gamification di profiles contro la scrittura dal client.
--    Se chi aggiorna NON e' service_role, i campi protetti restano invariati.
create or replace function public.protect_gamification_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce((current_setting('request.jwt.claims', true)::json)->>'role', '');
begin
  if jwt_role <> 'service_role' then
    new.points := old.points;
    new.special_tier := old.special_tier;
    -- referred_by si imposta una sola volta: se gia' valorizzato, non e' piu' modificabile dal client
    if old.referred_by is not null then
      new.referred_by := old.referred_by;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_gamification on public.profiles;
create trigger trg_protect_gamification
  before update on public.profiles
  for each row execute function public.protect_gamification_columns();

-- 6) Seed config di default. do update: la migrazione riporta sempre la config allo stato atteso.
insert into public.gamification_config (key, value) values
  ('points_per_action', '{"create_poi":10,"create_list":5,"create_route":8,"love_given":1,"love_received":2,"share":1,"referral_confirmed":50,"make_route_public":5}'::jsonb),
  ('level_thresholds',  '{"Amatore":0,"Viaggiatore":1001,"Giramondo":10001,"Instancabile":50001,"Leggenda":150001}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 7) RLS
alter table public.gamification_config enable row level security;
alter table public.point_events       enable row level security;
alter table public.referrals          enable row level security;

-- Config: leggibile da tutti (serve a mostrare soglie/punti nell'app). Scrittura: solo service_role (nessuna policy write).
drop policy if exists "gamification_config_read" on public.gamification_config;
create policy "gamification_config_read" on public.gamification_config for select using (true);

-- Eventi punti: ognuno legge solo i propri. Scrittura: solo service_role (nessuna policy write client).
drop policy if exists "point_events_own_read" on public.point_events;
create policy "point_events_own_read" on public.point_events for select using (auth.uid() = user_id);

-- Referral: ognuno legge i propri e puo' crearne solo a proprio nome (referrer_id = se stesso).
-- La conferma (confirmed=true) e l'accredito punti restano server-side (service_role).
drop policy if exists "referrals_own_read" on public.referrals;
create policy "referrals_own_read" on public.referrals for select using (auth.uid() = referrer_id);
drop policy if exists "referrals_own_insert" on public.referrals;
create policy "referrals_own_insert" on public.referrals for insert with check (auth.uid() = referrer_id);

commit;
