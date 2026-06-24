-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 005 — Compagnie (compagni di viaggio) persistenti
-- Due tabelle: `companions` (il gruppo) e `companion_members` (chi ne fa parte / invitati via email).
-- Il creatore (owner_id) e' membro implicito: non serve un record in companion_members per lui.
-- Join via codice: RPC `join_companion(code)` (SECURITY DEFINER) cosi' un utente entra col codice
-- senza che la insert-policy debba aprire companion_members a chiunque.
-- Salda anche il debito della 004: aggiunge la FK lists.companion_id -> companions(id).
--
-- RLS senza ricorsione: le policy che dipendono dalla membership chiamano `is_companion_member`,
-- una funzione SECURITY DEFINER che interroga le tabelle BYPASSANDO la RLS. Se le policy
-- interrogassero direttamente companion_members, Postgres rientrerebbe nella stessa policy in loop.

begin;

-- ── Tabella gruppi ──────────────────────────────────────────────
create table if not exists public.companions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  code        text not null unique check (char_length(code) between 4 and 12),  -- codice join (oggi 6 char)
  name        text not null,
  description text,
  type        text not null default 'trip' check (type in ('forever','trip','dinner')),
  start_date  date,
  start_time  time without time zone,
  end_date    date,
  end_time    time without time zone,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_companions_owner on public.companions(owner_id);

-- ── Tabella membri / inviti ─────────────────────────────────────
create table if not exists public.companion_members (
  id           uuid primary key default gen_random_uuid(),
  companion_id uuid not null references public.companions(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,  -- null finche' l'invitato non si registra
  email        text,                                                    -- per inviti a chi non e' ancora utente
  status       text not null default 'invited' check (status in ('invited','joined')),
  joined_at    timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_companion_members_companion on public.companion_members(companion_id);
create index if not exists idx_companion_members_user on public.companion_members(user_id);
-- Unicita' SOLO per utenti registrati: un user_id compare una volta per compagnia. Gli inviti email
-- (user_id null) restano liberi di ripetersi. Indice PARZIALE: e' anche il target dell'ON CONFLICT
-- dell'RPC join (idempotenza), che inserisce sempre con user_id non-null (vedi guardia in join_companion).
create unique index if not exists uq_companion_member_user
  on public.companion_members(companion_id, user_id) where user_id is not null;

-- ── Helper anti-ricorsione: sono owner o membro 'joined' di questa compagnia? ──
create or replace function public.is_companion_member(p_companion uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.companions c
      where c.id = p_companion and c.owner_id = auth.uid()
  ) or exists(
    select 1 from public.companion_members m
      where m.companion_id = p_companion and m.user_id = auth.uid() and m.status = 'joined'
  );
$$;
revoke all on function public.is_companion_member(uuid) from public, anon;
grant execute on function public.is_companion_member(uuid) to authenticated;

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.companions        enable row level security;
alter table public.companion_members enable row level security;

-- companions: vedo quelle di cui sono owner o membro. is_companion_member(id) copre GIA' l'owner,
-- quindi una sola chiamata (niente "owner_id = auth.uid() or ..." ridondante). Creo solo come me,
-- modifico/elimino solo le mie.
drop policy if exists companions_select on public.companions;
create policy companions_select on public.companions for select to authenticated
  using (public.is_companion_member(id));
drop policy if exists companions_insert on public.companions;
create policy companions_insert on public.companions for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists companions_update on public.companions;
create policy companions_update on public.companions for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists companions_delete on public.companions;
create policy companions_delete on public.companions for delete to authenticated
  using (owner_id = auth.uid());

-- companion_members: vedo i membri delle compagnie di cui faccio parte;
-- inserisce solo l'owner (gli inviti) — la subquery dipende dalla policy companions_select (l'owner
-- legge sempre le proprie compagnie); cancella l'owner (rimuove) o il membro stesso (esce).
-- UPDATE intenzionalmente ASSENTE: lo status si promuove a 'joined' solo via RPC join_companion
-- (SECURITY DEFINER), mai con UPDATE diretto dal client.
drop policy if exists companion_members_select on public.companion_members;
create policy companion_members_select on public.companion_members for select to authenticated
  using (public.is_companion_member(companion_id));
drop policy if exists companion_members_insert on public.companion_members;
create policy companion_members_insert on public.companion_members for insert to authenticated
  with check (exists(
    select 1 from public.companions c where c.id = companion_id and c.owner_id = auth.uid()
  ));
drop policy if exists companion_members_delete on public.companion_members;
create policy companion_members_delete on public.companion_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists(select 1 from public.companions c where c.id = companion_id and c.owner_id = auth.uid())
  );

-- ── RPC join via codice: entro in una compagnia conoscendone il codice ──
-- SECURITY DEFINER perche' l'utente che entra NON e' owner (la insert-policy e' owner-only).
-- Valida il codice, poi inserisce/promuove la mia membership a 'joined'. Idempotente grazie
-- all'indice parziale uq_companion_member_user: l'insert ha sempre user_id non-null (guardia v_uid).
create or replace function public.join_companion(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_comp uuid;
begin
  -- coerente col check DDL companions.code: char_length tra 4 e 12
  if v_uid is null or p_code is null
     or char_length(trim(p_code)) < 4 or char_length(trim(p_code)) > 12 then
    return null;
  end if;
  select id into v_comp from public.companions where upper(code) = upper(trim(p_code));
  if v_comp is null then
    return null;
  end if;
  insert into public.companion_members(companion_id, user_id, status, joined_at)
    values (v_comp, v_uid, 'joined', now())
    on conflict (companion_id, user_id) where user_id is not null
      do update set status = 'joined', joined_at = now();
  return v_comp;
end $$;
revoke all on function public.join_companion(text) from public, anon;
grant execute on function public.join_companion(text) to authenticated;

-- ── Salda il debito della migrazione 004: FK lists.companion_id -> companions(id) ──
-- on delete set null: se una compagnia sparisce, le liste condivise con essa tornano "private"
-- (companion_id null) invece di puntare a un id morto. Idempotente via drop-if-exists.
alter table public.lists drop constraint if exists fk_lists_companion;
alter table public.lists
  add constraint fk_lists_companion
  foreign key (companion_id) references public.companions(id) on delete set null;

commit;
