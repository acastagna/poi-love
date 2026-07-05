-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 018 — Codice di migrazione del POI (cessione di proprieta')
--
-- Il proprietario di un POI (utente o admin) genera un codice; chi lo riceve
-- lo riscatta e il POI passa a lui. E' il mattone del sistema codice-POI
-- trasferibile (modello di business). Tutto passa da due RPC SECURITY DEFINER:
-- il client non tocca mai la tabella ne' author_id direttamente.
--
-- Regole: un solo codice attivo per POI (il nuovo revoca il vecchio),
-- scadenza 30 giorni, alfabeto senza caratteri ambigui (niente 0/O, 1/I/L).
-- Idempotente. Schema public, identificatori underscore, RLS obbligatorie.

begin;

-- ── 1) Tabella dei codici ─────────────────────────────────────────────────────
create table if not exists public.poi_transfer_codes (
  id          uuid primary key default gen_random_uuid(),
  poi_id      uuid not null references public.pois(id) on delete cascade,
  code        text not null unique,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days',
  status      text not null default 'pending' check (status in ('pending','redeemed','revoked')),
  redeemed_by uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz
);
create index if not exists idx_poi_transfer_poi on public.poi_transfer_codes(poi_id) where status='pending';

alter table public.poi_transfer_codes enable row level security;
-- Il creatore puo' RIVEDERE i propri codici (per mostrarli di nuovo). Scritture solo via RPC.
drop policy if exists poi_transfer_own_select on public.poi_transfer_codes;
create policy poi_transfer_own_select on public.poi_transfer_codes
  for select using ( created_by = (select auth.uid()) );

-- ── 2) Genera il codice (solo proprietario del POI o admin) ──────────────────
create or replace function public.generate_poi_transfer_code(p_poi uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
  v_code  text;
  v_try   int := 0;
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if v_uid is null then raise exception 'accesso richiesto'; end if;
  select author_id into v_owner from public.pois where id = p_poi;
  if v_owner is null then raise exception 'POI non trovato'; end if;
  if v_owner <> v_uid and not public.is_admin() then
    raise exception 'solo il proprietario puo'' generare il codice';
  end if;

  -- un solo codice attivo per POI: i pendenti precedenti si revocano
  update public.poi_transfer_codes set status='revoked'
   where poi_id = p_poi and status='pending';

  loop
    v_try := v_try + 1;
    if v_try > 20 then raise exception 'generazione codice fallita, riprova'; end if;
    v_code := 'PL-' ||
      (select string_agg(substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1), '')
         from generate_series(1,4)) || '-' ||
      (select string_agg(substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1), '')
         from generate_series(1,4));
    begin
      insert into public.poi_transfer_codes(poi_id, code, created_by)
      values (p_poi, v_code, v_uid);
      exit;
    exception when unique_violation then
      -- collisione rarissima: si ritenta
    end;
  end loop;

  begin
    insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
    values (v_uid, 'poi_transfer_generate', 'poi', p_poi::text, jsonb_build_object('code_id', v_code));
  exception when others then null; -- l'audit non blocca mai
  end;

  return v_code;
end $$;
revoke all on function public.generate_poi_transfer_code(uuid) from public;
grant execute on function public.generate_poi_transfer_code(uuid) to authenticated;

-- ── 3) Riscatta il codice: il POI cambia proprietario ─────────────────────────
create or replace function public.redeem_poi_transfer_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_row  public.poi_transfer_codes%rowtype;
  v_title text;
  v_old  uuid;
begin
  if v_uid is null then raise exception 'accesso richiesto'; end if;

  select * into v_row from public.poi_transfer_codes
   where code = upper(trim(p_code)) and status = 'pending'
   for update;
  if v_row.id is null then raise exception 'codice non valido o gia'' usato'; end if;
  if v_row.expires_at < now() then
    update public.poi_transfer_codes set status='revoked' where id = v_row.id;
    raise exception 'codice scaduto';
  end if;

  select author_id, title into v_old, v_title from public.pois where id = v_row.poi_id;
  if v_old is null then raise exception 'il POI non esiste piu'''; end if;
  if v_old = v_uid then raise exception 'questo POI e'' gia'' tuo'; end if;

  update public.pois set author_id = v_uid where id = v_row.poi_id;
  update public.poi_transfer_codes
     set status='redeemed', redeemed_by=v_uid, redeemed_at=now()
   where id = v_row.id;

  begin
    insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
    values (v_uid, 'poi_transfer_redeem', 'poi', v_row.poi_id::text,
            jsonb_build_object('from', v_old, 'to', v_uid, 'title', v_title));
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'poi_id', v_row.poi_id, 'title', v_title);
end $$;
revoke all on function public.redeem_poi_transfer_code(text) from public;
grant execute on function public.redeem_poi_transfer_code(text) to authenticated;

commit;
