-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 019 — Claim di proprieta' del POI (a pagamento) + fix vincolo tier
--
-- "Reclama questo luogo": un utente di TIER PAGANTE chiede la proprieta' di un POI
-- (es. il titolare vero dell'attivita'). La richiesta genera un ALLARME in admin con
-- codice di incorporamento, nome del richiedente e nome di chi cede. L'admin approva
-- (il POI passa di mano) o rifiuta. Tutto via RPC SECURITY DEFINER, audit sempre.
--
-- BONUS NECESSARIO: il CHECK su profiles.special_tier era rimasto a 2 valori
-- (sostenitore, mecenate) e avrebbe rifiutato 'professionista' e i tier futuri.
--
-- Idempotente. Schema public, identificatori underscore, RLS obbligatorie.

begin;

-- ── 0) Fix vincolo tier: i 3 tier reali + Professionista Plus (futuro) ────────
do $$ begin
  if exists (select 1 from pg_constraint where conname='profiles_special_tier_check') then
    alter table public.profiles drop constraint profiles_special_tier_check;
  end if;
  alter table public.profiles add constraint profiles_special_tier_check
    check (special_tier is null or special_tier in ('professionista','sostenitore','mecenate','professionista_plus'));
end $$;

-- ── 1) Richieste di proprieta' ────────────────────────────────────────────────
create table if not exists public.poi_ownership_requests (
  id           uuid primary key default gen_random_uuid(),
  poi_id       uuid not null references public.pois(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id     uuid references public.profiles(id) on delete set null, -- chi cede (proprietario al momento della richiesta)
  message      text,
  embed_code   text not null,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references public.profiles(id) on delete set null
);
create index if not exists idx_poi_own_req_pending on public.poi_ownership_requests(status) where status='pending';

alter table public.poi_ownership_requests enable row level security;
-- Il richiedente vede le proprie richieste; l'admin vede tutto. Scritture solo via RPC.
drop policy if exists poi_own_req_select on public.poi_ownership_requests;
create policy poi_own_req_select on public.poi_ownership_requests
  for select using ( requester_id = (select auth.uid()) or public.is_admin() );

-- ── 2) RPC: chiedi la proprieta' (solo tier paganti) ─────────────────────────
create or replace function public.request_poi_ownership(p_poi uuid, p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_tier  text;
  v_owner uuid;
  v_code  text;
  v_id    uuid;
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if v_uid is null then raise exception 'accesso richiesto'; end if;
  select special_tier into v_tier from public.profiles where id = v_uid;
  if v_tier is null then
    raise exception 'il reclamo della proprieta'' e'' riservato ai livelli a pagamento';
  end if;
  select author_id into v_owner from public.pois where id = p_poi;
  if v_owner is null then raise exception 'POI non trovato'; end if;
  if v_owner = v_uid then raise exception 'questo POI e'' gia'' tuo'; end if;
  if exists (select 1 from public.poi_ownership_requests
              where poi_id = p_poi and requester_id = v_uid and status = 'pending') then
    raise exception 'hai gia'' una richiesta in attesa per questo POI';
  end if;

  v_code := 'PLB-' ||
    (select string_agg(substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1), '')
       from generate_series(1,4)) || '-' ||
    (select string_agg(substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1), '')
       from generate_series(1,4));

  insert into public.poi_ownership_requests(poi_id, requester_id, owner_id, message, embed_code)
  values (p_poi, v_uid, v_owner, left(coalesce(p_message,''),500), v_code)
  returning id into v_id;

  begin
    insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
    values (v_uid, 'poi_claim_request', 'poi', p_poi::text,
            jsonb_build_object('request_id', v_id, 'embed_code', v_code));
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'request_id', v_id, 'embed_code', v_code);
end $$;
revoke all on function public.request_poi_ownership(uuid, text) from public;
grant execute on function public.request_poi_ownership(uuid, text) to authenticated;

-- ── 3) RPC: l'admin decide (approva = il POI passa di mano) ──────────────────
create or replace function public.decide_poi_ownership(p_request uuid, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.poi_ownership_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select * into v_req from public.poi_ownership_requests where id = p_request for update;
  if v_req.id is null then raise exception 'richiesta non trovata'; end if;
  if v_req.status <> 'pending' then raise exception 'richiesta gia'' decisa'; end if;

  if p_approve then
    update public.pois set author_id = v_req.requester_id where id = v_req.poi_id;
  end if;
  update public.poi_ownership_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_at = now(), decided_by = auth.uid()
   where id = p_request;

  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (auth.uid(), case when p_approve then 'poi_claim_approve' else 'poi_claim_reject' end,
          'poi', v_req.poi_id::text,
          jsonb_build_object('request_id', p_request, 'from', v_req.owner_id, 'to', v_req.requester_id));

  return jsonb_build_object('ok', true, 'approved', p_approve, 'poi_id', v_req.poi_id);
end $$;
revoke all on function public.decide_poi_ownership(uuid, boolean) from public;
grant execute on function public.decide_poi_ownership(uuid, boolean) to authenticated;

commit;
