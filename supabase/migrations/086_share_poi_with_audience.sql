-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 086 — "Condividi con follower / amici" REALE.
-- Prima era un segnaposto che mostrava solo un messaggio "prossimamente" (vietato dalla
-- regola di progetto: mai cose finte). Ora la condivisione accoda notifiche vere ai
-- destinatari giusti, rispettando le preferenze notifiche di ciascuno.
--
--   audience 'followers' = chi segue l'utente
--   audience 'friends'   = follow reciproco (io seguo lui e lui segue me)
--
-- Sicurezza: SECURITY DEFINER perche l'utente non puo (e non deve) scrivere notifiche
-- ad altri. Il POI deve essere pubblicamente visibile o di proprieta di chi condivide,
-- cosi non si puo usare la funzione per rivelare l'esistenza di POI privati altrui.
-- Anti abuso: tetto giornaliero di destinatari raggiunti dallo stesso mittente.

begin;

create or replace function public.share_poi_with_audience(p_poi uuid, p_audience text)
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

  -- Il POI deve essere DAVVERO visibile a chi riceve la notifica: niente inviti a guardare
  -- un posto privato o non ancora approvato (nemmeno il proprio: il destinatario non lo
  -- vedrebbe e la notifica sarebbe una porta chiusa). Vale anche come difesa: impedisce
  -- di usare la funzione per sondare l'esistenza di POI altrui.
  select exists(
    select 1 from public.pois p
     where p.id = p_poi
       and p.visibility in ('community','official','suggested_google')
       and coalesce(p.is_approved, true) = true
  ) into v_ok;
  if not v_ok then raise exception 'poi not shareable'; end if;

  -- Tetto giornaliero (conta le notifiche di condivisione gia accodate da me oggi)
  select count(*) into v_today
    from public.notifications n
   where n.actor_id = v_me
     and n.event = 'poi_shared_with_you'
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
    -- enqueue_notification rispetta gia le preferenze del destinatario e salta se disattivate
    if public.enqueue_notification(v_target, 'poi_shared_with_you', v_me, 'poi', p_poi, '{}'::jsonb) is not null then
      v_sent := v_sent + 1;
    end if;
  end loop;

  return v_sent;
end $$;

revoke all on function public.share_poi_with_audience(uuid, text) from public, anon;
grant execute on function public.share_poi_with_audience(uuid, text) to authenticated;

commit;
