-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il rapporto notarizzato (blocco 46), col motore gia scritto in Top Market.
--
-- Professionista e influencer hanno numeri che valgono soldi: visite, cuori,
-- inquadrature del QR, collaborazioni pagate. Il rapporto li mette per
-- iscritto, e l impronta del testo va ai calendar pubblici OpenTimestamps:
-- quando finisce in un blocco Bitcoin, nessuno puo piu dire che i numeri
-- sono stati riscritti dopo. Privato: lo vede chi lo riguarda.
--
-- La firma la fa LA MACCHINA (lavoro programmato, come il backup): il browser
-- non tocca mai stato, ricevute o blocco, altrimenti la prova varrebbe zero.

create table if not exists public.rapporti (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  periodo    text not null,                   -- '2026-08'
  testo      text not null,                   -- il rapporto per esteso, deterministico
  impronta   text not null check (impronta ~ '^[a-f0-9]{64}$'),
  stato      text not null default 'in_coda'
             check (stato in ('in_coda','inviata','ancorata','errore')),
  ricevute   jsonb,                           -- le risposte dei calendar
  blocco     int,                             -- il numero del blocco Bitcoin
  inviato_il  timestamptz,
  ancorato_il timestamptz,
  creato     timestamptz not null default now(),
  unique (user_id, periodo)
);
alter table public.rapporti enable row level security;
drop policy if exists rapporti_miei on public.rapporti;
create policy rapporti_miei on public.rapporti for select
  using (user_id = auth.uid() or public.sono_admin());
grant select on public.rapporti to authenticated;
grant all on public.rapporti to service_role;
-- nessuna scrittura ad authenticated: genera passa dalla funzione, la firma dal cron

-- Il rapporto nasce dai numeri VERI del mese, scritti in modo deterministico:
-- stesso mese, stessi dati, stessa impronta.
create or replace function public.genera_rapporto(p_periodo text default null)
returns table (r_periodo text, r_impronta text, r_stato text)
language plpgsql security definer set search_path to 'public' as $$
declare
  v_user uuid := auth.uid();
  v_per text := coalesce(p_periodo, to_char(current_date - interval '1 month', 'YYYY-MM'));
  v_tier text; v_nome text; v_testo text; v_imp text;
  v_da date; v_a date;
  n_luoghi int; n_cuori int; n_seguaci int; n_qr int; n_coll int; v_coll numeric;
begin
  if v_user is null then raise exception 'serve l accesso'; end if;
  select special_tier, coalesce(display_name, username) into v_tier, v_nome
    from public.profiles where id = v_user;
  -- coalesce: un livello NULL deve BOCCIARE, non far diventare l'IF un "non so"
  if coalesce(v_tier,'') not in ('professionista','professionista_plus','influencer') and not public.sono_admin() then
    raise exception 'il rapporto e dei profili professionali';
  end if;
  if v_per !~ '^\d{4}-\d{2}$' then raise exception 'periodo nella forma AAAA-MM'; end if;
  v_da := to_date(v_per || '-01', 'YYYY-MM-DD');
  v_a  := v_da + interval '1 month';

  select count(*) into n_luoghi from public.pois
   where author_id = v_user and removed_at is null and created_at >= v_da and created_at < v_a;
  select count(*) into n_cuori from public.loves l join public.pois p on p.id = l.poi_id
   where p.author_id = v_user and l.created_at >= v_da and l.created_at < v_a;
  select count(*) into n_seguaci from public.follows
   where following_id = v_user and created_at >= v_da and created_at < v_a;
  n_qr := 0;
  begin
    select count(*) into n_qr from public.qr_scan s join public.pois p on p.id = s.poi_id
     where p.author_id = v_user and s.quando >= v_da and s.quando < v_a;
  exception when undefined_table or undefined_column then n_qr := 0; end;
  select count(*), coalesce(sum(importo),0) into n_coll, v_coll from public.mercato_proposte
   where (compratore = v_user or influencer = v_user)
     and stato = 'pagata' and aggiornato >= v_da and aggiornato < v_a;

  v_testo :=
    'RAPPORTO POI-LOVE' || E'\n' ||
    'Profilo: ' || v_nome || ' (' || v_user || ')' || E'\n' ||
    'Livello: ' || coalesce(v_tier,'-') || E'\n' ||
    'Periodo: ' || v_per || E'\n' ||
    'Luoghi creati nel periodo: ' || n_luoghi || E'\n' ||
    'Cuori ricevuti nel periodo: ' || n_cuori || E'\n' ||
    'Nuovi seguaci nel periodo: ' || n_seguaci || E'\n' ||
    'Inquadrature QR nel periodo: ' || n_qr || E'\n' ||
    'Collaborazioni pagate nel periodo: ' || n_coll || ' (totale ' || v_coll || ' EUR)' || E'\n' ||
    'Generato al momento della prima richiesta e depositato con OpenTimestamps.';
  v_imp := encode(digest(v_testo, 'sha256'), 'hex');

  insert into public.rapporti (user_id, periodo, testo, impronta)
  values (v_user, v_per, v_testo, v_imp)
  on conflict (user_id, periodo) do nothing;

  return query select r.periodo, r.impronta, r.stato from public.rapporti r
   where r.user_id = v_user and r.periodo = v_per;
  -- (i nomi in uscita r_* esistono solo per non fare ombra alle colonne)
end $$;
grant execute on function public.genera_rapporto(text) to authenticated;

notify pgrst, 'reload schema';
select 'rapporti pronti' as esito;
