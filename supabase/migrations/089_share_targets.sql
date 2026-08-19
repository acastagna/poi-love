-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 089 — Condividere DOVE serve, non solo col link.
-- Prima il foglio "Condividi" di un itinerario offriva solo i canali esterni
-- (WhatsApp, Telegram, X…). Qui arrivano i pezzi che mancavano, tutti veri:
--
--   1) 'trip_shared_with_you'  → nuovo tipo di notifica per l'itinerario condiviso
--   2) share_trip_with_audience(itinerario, pubblico) → accoda notifiche vere a
--      follower o amici, con le stesse difese della 086 (tetto giornaliero,
--      controllo che l'itinerario sia davvero visibile a chi riceve)
--   3) companion_messages accetta il tipo 'share': un luogo o un itinerario
--      messo sulla bacheca della compagnia, con titolo e indirizzo web
--
-- Sicurezza: SECURITY DEFINER perche' l'utente non puo' (e non deve) scrivere
-- notifiche ad altri. Chi condivide deve essere il proprietario dell'itinerario,
-- e l'itinerario deve essere visibile, altrimenti la notifica sarebbe una porta chiusa.

-- ── 1) Il tipo di notifica (fuori transazione: PostgreSQL vuole cosi') ──
alter type public.notification_event add value if not exists 'trip_shared_with_you';

-- ── 2) La bacheca della compagnia accetta anche un luogo o un itinerario condiviso ──
begin;

alter table public.companion_messages
  add column if not exists share_url   text,
  add column if not exists share_title text,
  add column if not exists share_kind  text;

alter table public.companion_messages drop constraint if exists companion_messages_kind_chk;
alter table public.companion_messages
  add constraint companion_messages_kind_chk check (kind in ('voice','deviation','share'));

-- Un messaggio di tipo 'share' deve avere l'indirizzo web e il titolo di cio' che condivide.
alter table public.companion_messages drop constraint if exists companion_messages_share_chk;
alter table public.companion_messages
  add constraint companion_messages_share_chk
  check (kind <> 'share' or (share_url is not null and share_title is not null));

commit;

-- ── 3) Condividi un itinerario con follower o amici ──
begin;

create or replace function public.share_trip_with_audience(p_trip uuid, p_audience text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me       uuid := (select auth.uid());
  v_ok       boolean;
  v_today    integer;
  v_sent     integer := 0;
  v_target   uuid;
  c_daily_cap constant integer := 500;   -- destinatari max al giorno per mittente
begin
  if v_me is null then raise exception 'auth required'; end if;
  if p_audience not in ('followers','friends') then raise exception 'bad audience'; end if;

  -- L'itinerario deve essere mio E visibile a chi riceve: niente inviti a guardare
  -- una pagina che il destinatario non potrebbe aprire.
  select exists(
    select 1 from public.trips t
     where t.id = p_trip
       and t.owner_id = v_me
       and t.visibility in ('pub','friends','companions')
       and coalesce(t.archived, false) = false
  ) into v_ok;
  if not v_ok then raise exception 'trip not shareable'; end if;

  select count(*) into v_today
    from public.notifications n
   where n.actor_id = v_me
     and n.event = 'trip_shared_with_you'
     and n.created_at >= date_trunc('day', now());
  if v_today >= c_daily_cap then return 0; end if;

  for v_target in
    select f.follower_id
      from public.follows f
     where f.following_id = v_me
       and (
         p_audience = 'followers'
         or exists (select 1 from public.follows b
                     where b.follower_id = v_me and b.following_id = f.follower_id)
       )
     limit greatest(c_daily_cap - v_today, 0)
  loop
    if public.enqueue_notification(v_target, 'trip_shared_with_you', v_me, 'trip', p_trip, '{}'::jsonb) is not null then
      v_sent := v_sent + 1;
    end if;
  end loop;

  return v_sent;
end $$;

revoke all on function public.share_trip_with_audience(uuid, text) from public, anon;
grant execute on function public.share_trip_with_audience(uuid, text) to authenticated;

commit;
