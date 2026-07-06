-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 023: love atomico. Il client faceva select+update separati sul contatore:
-- due tocchi simultanei perdevano love. Ora un'unica RPC transazionale.

create or replace function public.toggle_love(p_poi_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_loved boolean;
  v_count int;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  if exists (select 1 from loves where poi_id = p_poi_id and user_id = v_uid) then
    delete from loves where poi_id = p_poi_id and user_id = v_uid;
    v_loved := false;
  else
    insert into loves(poi_id, user_id) values (p_poi_id, v_uid)
    on conflict do nothing;
    v_loved := true;
  end if;
  select count(*) into v_count from loves where poi_id = p_poi_id;
  update pois set love_count = v_count where id = p_poi_id;
  return json_build_object('loved', v_loved, 'love_count', v_count);
end;
$$;

revoke execute on function public.toggle_love(uuid) from public, anon;
grant execute on function public.toggle_love(uuid) to authenticated;
