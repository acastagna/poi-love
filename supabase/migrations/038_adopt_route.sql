-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 038: "adotta una rotta" (perk Professionista+). Un professionista sostiene una
-- rotta storica pubblica con una dedica visibile. Solo tramite RPC (colonne
-- adopted_by/dedication protette: la revoke della 037 non le include per adopted_by).

create or replace function public.adopt_route(p_trip uuid, p_dedication text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_tier text;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  select special_tier into v_tier from public.profiles where id = v_uid;
  if v_tier is null or v_tier not in ('professionista','professionista_plus','mecenate','influencer') then
    raise exception 'tier required';
  end if;
  if not exists (select 1 from public.trips where id = p_trip and is_historic = true and is_published = true) then
    raise exception 'not an historic route';
  end if;
  if exists (select 1 from public.trips where id = p_trip and adopted_by is not null and adopted_by <> v_uid) then
    raise exception 'already adopted';
  end if;
  update public.trips
     set adopted_by = v_uid, dedication = nullif(left(coalesce(p_dedication,''),200),'')
   where id = p_trip;
  return json_build_object('ok', true);
end $$;

create or replace function public.release_route(p_trip uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'auth required'; end if;
  update public.trips set adopted_by = null, dedication = null
   where id = p_trip and adopted_by = v_uid;
  return json_build_object('ok', true);
end $$;

revoke execute on function public.adopt_route(uuid,text) from public, anon;
revoke execute on function public.release_route(uuid) from public, anon;
grant execute on function public.adopt_route(uuid,text) to authenticated;
grant execute on function public.release_route(uuid) to authenticated;
