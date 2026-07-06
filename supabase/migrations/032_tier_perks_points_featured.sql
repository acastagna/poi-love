-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 032: perk dei tier resi VERI.
--  1) Punti x2 per i tier che lo promettono (Professionista, Professionista Plus,
--     Mecenate, Influencer). Sostenitore resta base.
--  2) POI "in evidenza" (is_featured) con TETTO per tier, applicato server-side.

-- ── moltiplicatore punti per tier ──
create or replace function public.award_points(p_user uuid, p_action text, p_entity text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_pts int;
  v_tier text;
  v_mult int := 1;
begin
  if p_user is null or p_entity is null then return; end if;
  select coalesce((value->>p_action)::int, 0) into v_pts
    from public.gamification_config where key = 'points_per_action';
  if v_pts is null or v_pts = 0 then return; end if;
  select special_tier into v_tier from public.profiles where id = p_user;
  if v_tier in ('professionista','professionista_plus','mecenate','influencer') then
    v_mult := 2;   -- perk "punti x2"
  end if;
  v_pts := v_pts * v_mult;
  insert into public.point_events(user_id, action, entity_id, points)
    values (p_user, p_action, p_entity, v_pts)
    on conflict (user_id, action, entity_id) do nothing;
  if found then
    update public.profiles set points = points + v_pts where id = p_user;
  end if;
end $function$;

-- ── tetto POI in evidenza per tier ──
create or replace function public.poi_featured_cap(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
    when 'mecenate' then 5
    when 'professionista_plus' then 5
    when 'influencer' then 5
    when 'professionista' then 3
    when 'sostenitore' then 3
    else 0 end;
$$;

-- ── metti/togli in evidenza un proprio POI, entro il tetto del tier ──
create or replace function public.set_poi_featured(p_poi_id uuid, p_featured boolean)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_tier text;
  v_cap int;
  v_used int;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  if not exists (select 1 from public.pois where id = p_poi_id and author_id = v_uid) then
    raise exception 'not your POI';
  end if;
  select special_tier into v_tier from public.profiles where id = v_uid;
  v_cap := public.poi_featured_cap(v_tier);
  if p_featured then
    if v_cap = 0 then raise exception 'tier without featured'; end if;
    select count(*) into v_used from public.pois
      where author_id = v_uid and is_featured = true and id <> p_poi_id;
    if v_used >= v_cap then raise exception 'cap reached'; end if;
  end if;
  update public.pois set is_featured = p_featured where id = p_poi_id;
  select count(*) into v_used from public.pois where author_id = v_uid and is_featured = true;
  return json_build_object('featured', p_featured, 'used', v_used, 'cap', v_cap);
end $function$;

revoke execute on function public.set_poi_featured(uuid,boolean) from public, anon;
grant execute on function public.set_poi_featured(uuid,boolean) to authenticated;
grant execute on function public.poi_featured_cap(text) to anon, authenticated;
