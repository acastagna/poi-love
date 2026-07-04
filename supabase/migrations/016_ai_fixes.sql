-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 016 — Fix dalla review completa del 04/07/2026
--
-- 1) apply_ai_proposal robusta: tronca title/description ai CHECK del DB (1..100 / <=200),
--    pretende lat/lng con errore parlante, risolve link_existing_poi_id senza esplodere,
--    audit log con titolo vero anche per kind='poi'.
-- 2) ai_chats.updated_at: trigger server-side, l'ordinamento non dipende piu' dall'orologio del client.
-- 3) ai_daily_usage + increment_ai_usage: contatore giornaliero per i limiti AI per tier
--    (usato dall'edge illi-chat via service_role; nessun accesso client).
-- 4) Audit automatico su modifiche sensibili ai POI (author_id / love_count) fatte da un admin.
--
-- Idempotente. Schema public, identificatori underscore, RLS obbligatorie.

begin;

-- ── 1) RPC apply_ai_proposal: versione robusta ────────────────────────────────
create or replace function public.apply_ai_proposal(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pr       public.ai_proposals%rowtype;
  poi      jsonb;
  ref_map  jsonb := '{}'::jsonb;
  new_id   uuid;
  trip_id  uuid;
  st       jsonb;
  ord      int := 0;
  v_lat    float8;
  v_lng    float8;
  link_id  uuid;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select * into pr from public.ai_proposals where id = p_id for update;
  if pr.id is null then raise exception 'proposal not found'; end if;
  if pr.status <> 'approved' then raise exception 'proposal not approved'; end if;

  if pr.kind = 'poi' then
    v_lat := (pr.payload->>'lat')::float8;
    v_lng := (pr.payload->>'lng')::float8;
    if v_lat is null or v_lng is null then
      raise exception 'proposta senza coordinate: chiedi al copilota di rifarla con lat/lng';
    end if;
    insert into public.pois(author_id,title,description,category,tags,lat,lng,address,city,visibility,is_approved,created_via)
    values (auth.uid(),
            left(coalesce(nullif(trim(pr.payload->>'name'),''),'POI'),100),
            left(coalesce(pr.payload->>'description',''),200),
            case when pr.payload->>'category' = any(enum_range(null::poi_category)::text[])
                 then (pr.payload->>'category')::poi_category else 'cultura'::poi_category end,
            coalesce((select array_agg(x) from jsonb_array_elements_text(pr.payload->'tags') x),'{}'),
            v_lat, v_lng,
            pr.payload->>'address', pr.payload->>'city', 'official', false, 'ai')
    returning id into new_id;

  elsif pr.kind in ('route','project') then
    for poi in select * from jsonb_array_elements(coalesce(pr.payload->'new_pois','[]'::jsonb)) loop
      v_lat := (poi->>'lat')::float8;
      v_lng := (poi->>'lng')::float8;
      if v_lat is null or v_lng is null then
        raise exception 'nuovo POI "%" senza coordinate: proposta da rifare', coalesce(poi->>'name','?');
      end if;
      insert into public.pois(author_id,title,description,category,tags,lat,lng,city,visibility,is_approved,created_via)
      values (auth.uid(),
              left(coalesce(nullif(trim(poi->>'name'),''),'POI'),100),
              left(coalesce(poi->>'description',''),200),
              case when poi->>'category' = any(enum_range(null::poi_category)::text[])
                   then (poi->>'category')::poi_category else 'cultura'::poi_category end,
              coalesce((select array_agg(x) from jsonb_array_elements_text(poi->'tags') x),'{}'),
              v_lat, v_lng, poi->>'city', 'official', false, 'ai')
      returning id into new_id;
      ref_map := ref_map || jsonb_build_object(poi->>'ref', new_id::text);
    end loop;

    insert into public.trips(owner_id,name,badge,is_historic,is_published)
    values (auth.uid(), left(coalesce(pr.payload#>>'{route,name}', pr.payload->>'title','Rotta'),120),
            pr.payload#>>'{route,badge}', true, false)
    returning id into trip_id;

    for st in select * from jsonb_array_elements(coalesce(pr.payload#>'{route,stops}','[]'::jsonb)) loop
      -- link_existing_poi_id: si accetta solo un uuid esistente, altrimenti null (niente esplosioni FK)
      link_id := null;
      begin
        if st->>'link_existing_poi_id' is not null then
          select id into link_id from public.pois where id = (st->>'link_existing_poi_id')::uuid;
        end if;
      exception when others then
        link_id := null;
      end;
      insert into public.trip_stops(trip_id,name,lat,lng,poi_id,sort_order,status)
      values (trip_id, left(coalesce(st->>'name','Tappa'),120),
              (st->>'lat')::float8, (st->>'lng')::float8,
              coalesce((ref_map->>(st->>'new_poi_ref'))::uuid, link_id),
              ord, 'planned');
      ord := ord + 1;
    end loop;
  else
    raise exception 'unknown kind';
  end if;

  update public.ai_proposals
     set status='applied', applied_at=now(), applied_result=jsonb_build_object('ref_map',ref_map,'trip_id',trip_id)
   where id = p_id;

  insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
  values (auth.uid(), 'ai_proposal_apply', pr.kind, p_id::text,
          jsonb_build_object('title', coalesce(pr.payload->>'title', pr.payload->>'name', pr.title)));

  return jsonb_build_object('ok',true,'trip_id',trip_id);
end $$;
revoke all on function public.apply_ai_proposal(uuid) from public;
grant execute on function public.apply_ai_proposal(uuid) to authenticated;

-- ── 2) ai_chats.updated_at server-side ────────────────────────────────────────
create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists ai_chats_touch_updated on public.ai_chats;
create trigger ai_chats_touch_updated
  before update on public.ai_chats
  for each row execute function public.tg_touch_updated_at();

-- ── 3) Contatore giornaliero AI (per i limiti per tier di illi-chat) ─────────
create table if not exists public.ai_daily_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  count   int  not null default 0,
  primary key (user_id, day)
);
-- RLS attiva senza policy client: ci accede solo il service_role dell'edge.
alter table public.ai_daily_usage enable row level security;

create or replace function public.increment_ai_usage(p_user uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.ai_daily_usage(user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_daily_usage.count + 1
  returning count into v_count;
  return v_count;
end $$;
-- Nessun client puo' chiamarla (un utente potrebbe bruciare la quota di un altro):
-- la invoca solo l'edge col service_role.
revoke all on function public.increment_ai_usage(uuid) from public;
revoke all on function public.increment_ai_usage(uuid) from authenticated;

-- ── 4) Audit su modifiche sensibili ai POI ────────────────────────────────────
create or replace function public.tg_audit_poi_sensitive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.author_id is distinct from old.author_id)
     or (new.love_count is distinct from old.love_count)
     or (new.created_via is distinct from old.created_via) then
    begin
      insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
      values (auth.uid(), 'poi_sensitive_update', 'poi', new.id::text,
              jsonb_build_object(
                'author_id',  jsonb_build_array(old.author_id, new.author_id),
                'love_count', jsonb_build_array(old.love_count, new.love_count),
                'created_via',jsonb_build_array(old.created_via, new.created_via)));
    exception when others then
      null; -- l'audit non deve mai bloccare l'operazione
    end;
  end if;
  return new;
end $$;

drop trigger if exists pois_audit_sensitive on public.pois;
create trigger pois_audit_sensitive
  after update on public.pois
  for each row execute function public.tg_audit_poi_sensitive();

commit;
