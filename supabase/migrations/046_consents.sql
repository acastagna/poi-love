-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 046 — Registro consensi (GDPR + Legge albanese 124/2024).
-- Oggi l'accettazione e' solo una frase passiva "Accedendo accetti i Termini": NON e' un consenso valido.
-- Qui si introduce un consenso ESPLICITO, GRANULARE, VERSIONATO, REGISTRATO e REVOCABILE:
--   - bundle obbligatorio (base contrattuale): terms + privacy + age16 (>= 16 anni, soglia valida IT+AL)
--   - opzionali separati (consenso art.6.1.a): geo (posizione GPS) e photo (caricamento foto)
-- Append-only: ogni azione e' una riga nuova (mai UPDATE distruttivo), per poter DIMOSTRARE il consenso.
-- Insert SOLO via RPC SECURITY DEFINER (il client non puo' fabbricare righe): cattura IP/User-Agent dai header.
-- Tutto in schema public, RLS obbligatorie, idempotente.

begin;

-- ── Tipi di consenso (una sola fonte di verita') ──
do $$ begin
  create type public.consent_type as enum ('terms','privacy','age16','geo','photo');
exception when duplicate_object then null; end $$;

-- ── Tabella append-only dei consensi ──
create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ctype       public.consent_type not null,
  accepted    boolean not null,            -- true = concesso, false = negato/revocato
  version     text not null,               -- versione del testo (es. '2026-07-07')
  ip          text,                        -- catturato server-side dai header (best-effort)
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists consents_user_type_idx on public.consents (user_id, ctype, created_at desc);

alter table public.consents enable row level security;

-- L'utente vede SOLO i propri consensi. Nessuna insert/update/delete dal client:
-- le righe nascono solo dalle RPC definer sotto.
drop policy if exists consents_select on public.consents;
create policy consents_select on public.consents
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.consents from authenticated, anon, public;

-- ── Helper: estrae IP e User-Agent dai header della request (best-effort, mai fallisce) ──
create or replace function public._req_meta()
returns table(ip text, ua text)
language plpgsql stable security definer set search_path = public as $$
declare h json;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    h := null;
  end;
  ip := coalesce(
          split_part(nullif(h->>'x-forwarded-for',''), ',', 1),
          h->>'x-real-ip'
        );
  ua := h->>'user-agent';
  return next;
end $$;
revoke all on function public._req_meta() from public, anon, authenticated;

-- ── RPC: registra il consenso al primo ingresso / al cambio versione ──
-- Il bundle terms+privacy+age16 e' SEMPRE accettato (senza non si entra: base contrattuale).
-- geo e photo sono opzionali e riflettono le spunte dell'utente.
create or replace function public.record_consent(
  p_version text, p_geo boolean default false, p_photo boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m record;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(p_version),'') = '' then
    raise exception 'version required';
  end if;
  select * into m from public._req_meta();
  insert into public.consents(user_id, ctype, accepted, version, ip, user_agent) values
    (uid, 'terms',   true,             p_version, m.ip, m.ua),
    (uid, 'privacy', true,             p_version, m.ip, m.ua),
    (uid, 'age16',   true,             p_version, m.ip, m.ua),
    (uid, 'geo',     coalesce(p_geo,false),   p_version, m.ip, m.ua),
    (uid, 'photo',   coalesce(p_photo,false), p_version, m.ip, m.ua);
end $$;
revoke all on function public.record_consent(text, boolean, boolean) from public, anon;
grant execute on function public.record_consent(text, boolean, boolean) to authenticated;

-- ── RPC: aggiorna un singolo consenso opzionale (toggle dalle impostazioni: geo o photo) ──
create or replace function public.set_optional_consent(p_type text, p_on boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m record; last_ver text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_type not in ('geo','photo') then raise exception 'only geo/photo are toggleable'; end if;
  select version into last_ver from public.consents
    where user_id = uid and ctype = 'terms' and accepted order by created_at desc limit 1;
  select * into m from public._req_meta();
  insert into public.consents(user_id, ctype, accepted, version, ip, user_agent)
    values (uid, p_type::public.consent_type, coalesce(p_on,false), coalesce(last_ver,'manual'), m.ip, m.ua);
end $$;
revoke all on function public.set_optional_consent(text, boolean) from public, anon;
grant execute on function public.set_optional_consent(text, boolean) to authenticated;

-- ── RPC: stato consensi attuale (l'ultimo per tipo) ──
-- Il client la chiama dopo il login: se terms_version != versione corrente -> mostra il gate.
create or replace function public.my_consents()
returns table(terms_version text, terms_ok boolean, geo_ok boolean, photo_ok boolean)
language sql stable security definer set search_path = public as $$
  with latest as (
    select distinct on (ctype) ctype, accepted, version
    from public.consents
    where user_id = auth.uid()
    order by ctype, created_at desc
  )
  select
    (select version  from latest where ctype = 'terms' and accepted),
    coalesce((select accepted from latest where ctype = 'terms'), false),
    coalesce((select accepted from latest where ctype = 'geo'),   false),
    coalesce((select accepted from latest where ctype = 'photo'), false);
$$;
revoke all on function public.my_consents() from public, anon;
grant execute on function public.my_consents() to authenticated;

commit;
