-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 049 — Hardening da review qualità 07/07:
--  (1) tetto di sicurezza al fan-out di tg_notif_new_poi (evita fan-out illimitato sincrono su autori con molti follower);
--  (2) set_optional_consent ora accetta anche il tipo 'mic' (introdotto dalla 048) per il futuro pannello impostazioni.

begin;

-- (1) Fan-out con LIMIT: oltre il tetto, i follower più vecchi non ricevono la notifica in-app per quel POI.
create or replace function public.tg_notif_new_poi()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.visibility = 'community' then
    insert into public.notifications(user_id, event, actor_id, entity_type, entity_id, data)
    select f.follower_id, 'followed_user_new_poi', NEW.author_id, 'poi', NEW.id,
           jsonb_build_object('title', coalesce(NEW.title,''))
    from public.follows f
    where f.following_id = NEW.author_id
      and f.follower_id <> NEW.author_id
      and public.notif_enabled(f.follower_id, 'followed_user_new_poi', 'in_app')
    limit 5000;   -- tetto di sicurezza: il costo di creazione POI resta limitato anche con molti follower
  end if;
  return NEW;
end $$;

-- (2) set_optional_consent: whitelist estesa a 'mic'
create or replace function public.set_optional_consent(p_type text, p_on boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m record; last_ver text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_type not in ('geo','photo','mic') then raise exception 'only geo/photo/mic are toggleable'; end if;
  select version into last_ver from public.consents
    where user_id = uid and ctype = 'terms' and accepted order by created_at desc limit 1;
  select * into m from public._req_meta();
  insert into public.consents(user_id, ctype, accepted, version, ip, user_agent)
    values (uid, p_type::public.consent_type, coalesce(p_on,false), coalesce(last_ver,'manual'), m.ip, m.ua);
end $$;
revoke all on function public.set_optional_consent(text, boolean) from public, anon;
grant execute on function public.set_optional_consent(text, boolean) to authenticated;

commit;
