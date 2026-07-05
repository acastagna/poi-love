-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 020 — La foto a licenza libera della proposta AI entra nel POI
-- apply_ai_proposal: se il payload porta 'photo' (URL Wikimedia trovato dall'edge),
-- il POI creato all'approvazione nasce con quella foto come principale.
-- Idempotente: ridefinisce solo la parte insert del kind 'poi' e dei new_pois.

begin;

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
    insert into public.pois(author_id,title,description,category,tags,lat,lng,address,city,visibility,is_approved,created_via,photos)
    values (auth.uid(),
            left(coalesce(nullif(trim(pr.payload->>'name'),''),'POI'),100),
            left(coalesce(pr.payload->>'description',''),200),
            case when pr.payload->>'category' = any(enum_range(null::poi_category)::text[])
                 then (pr.payload->>'category')::poi_category else 'cultura'::poi_category end,
            coalesce((select array_agg(x) from jsonb_array_elements_text(pr.payload->'tags') x),'{}'),
            v_lat, v_lng,
            pr.payload->>'address', pr.payload->>'city', 'official', false, 'ai',
            case when pr.payload->>'photo' is not null then array[pr.payload->>'photo'] else '{}'::text[] end)
    returning id into new_id;

  elsif pr.kind in ('route','project') then
    for poi in select * from jsonb_array_elements(coalesce(pr.payload->'new_pois','[]'::jsonb)) loop
      v_lat := (poi->>'lat')::float8;
      v_lng := (poi->>'lng')::float8;
      if v_lat is null or v_lng is null then
        raise exception 'nuovo POI "%" senza coordinate: proposta da rifare', coalesce(poi->>'name','?');
      end if;
      insert into public.pois(author_id,title,description,category,tags,lat,lng,city,visibility,is_approved,created_via,photos)
      values (auth.uid(),
              left(coalesce(nullif(trim(poi->>'name'),''),'POI'),100),
              left(coalesce(poi->>'description',''),200),
              case when poi->>'category' = any(enum_range(null::poi_category)::text[])
                   then (poi->>'category')::poi_category else 'cultura'::poi_category end,
              coalesce((select array_agg(x) from jsonb_array_elements_text(poi->'tags') x),'{}'),
              v_lat, v_lng, poi->>'city', 'official', false, 'ai',
              case when poi->>'photo' is not null then array[poi->>'photo'] else '{}'::text[] end)
      returning id into new_id;
      ref_map := ref_map || jsonb_build_object(poi->>'ref', new_id::text);
    end loop;

    insert into public.trips(owner_id,name,badge,is_historic,is_published)
    values (auth.uid(), left(coalesce(pr.payload#>>'{route,name}', pr.payload->>'title','Rotta'),120),
            pr.payload#>>'{route,badge}', true, false)
    returning id into trip_id;

    for st in select * from jsonb_array_elements(coalesce(pr.payload#>'{route,stops}','[]'::jsonb)) loop
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

commit;
