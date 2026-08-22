-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le notifiche push del web (seguito del blocco notifiche, mig 047 e 162).
--
-- Finora il canale "browser" suonava solo a pagina aperta, e dal passaggio
-- alla macchina nostra (18/08) non suonava piu' nemmeno li'. Da qui in avanti
-- le push le spedisce la MACCHINA quando l'evento nasce, ad app anche chiusa:
-- qui vive il registro delle iscrizioni dei dispositivi. La spedizione la fa
-- il lavoro automatico poilove-push (ogni minuto, via presa locale).

create table if not exists public.push_iscrizioni (
  endpoint    text primary key,                  -- l'indirizzo del dispositivo presso il servizio push
  user_id     uuid not null references public.profiles(id) on delete cascade,
  p256dh      text not null,                     -- chiave pubblica del dispositivo
  auth        text not null,                     -- segreto di autenticazione del dispositivo
  lingua      text not null default 'sq' check (lingua ~ '^[a-z]{2}$'),
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists push_iscrizioni_user_idx on public.push_iscrizioni (user_id);

alter table public.push_iscrizioni enable row level security;
-- Ognuno vede e governa SOLO le proprie iscrizioni. La macchina (postgres,
-- via presa locale) passa sopra le regole per spedire.
drop policy if exists push_iscr_sel on public.push_iscrizioni;
create policy push_iscr_sel on public.push_iscrizioni
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists push_iscr_ins on public.push_iscrizioni;
create policy push_iscr_ins on public.push_iscrizioni
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists push_iscr_upd on public.push_iscrizioni;
create policy push_iscr_upd on public.push_iscrizioni
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists push_iscr_del on public.push_iscrizioni;
create policy push_iscr_del on public.push_iscrizioni
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.push_iscrizioni to authenticated;
grant all on public.push_iscrizioni to service_role;

-- Il segno del postino: quando la push e' partita (o e' stata saltata perche'
-- nessun dispositivo iscritto), qui c'e' la data. Cosi' la coda non rilegge.
alter table public.notifications
  add column if not exists push_sent_at timestamptz;
create index if not exists notifications_push_coda_idx
  on public.notifications (created_at) where push_sent_at is null;

notify pgrst, 'reload schema';
select 'push_iscrizioni pronta' as esito;
