-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 037: perk "un itinerario in evidenza" (Mecenate) e "adotta una rotta" (Pro).
-- Stesso schema sicuro dei POI in evidenza: tetto per tier server-side, colonna
-- protetta (si tocca solo via RPC definer).

alter table public.trips add column if not exists is_featured boolean not null default false;
alter table public.trips add column if not exists adopted_by uuid references public.profiles(id) on delete set null;
alter table public.trips add column if not exists dedication text;

create or replace function public.trip_featured_cap(p_tier text)
returns int language sql immutable as $$
  select case p_tier when 'mecenate' then 1 when 'professionista_plus' then 1 else 0 end;
$$;

create or replace function public.set_trip_featured(p_trip uuid, p_featured boolean)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_tier text; v_cap int; v_used int;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  if not exists (select 1 from public.trips where id = p_trip and owner_id = v_uid) then
    raise exception 'not your trip';
  end if;
  select special_tier into v_tier from public.profiles where id = v_uid;
  v_cap := public.trip_featured_cap(v_tier);
  if p_featured then
    if v_cap = 0 then raise exception 'tier without featured'; end if;
    select count(*) into v_used from public.trips where owner_id = v_uid and is_featured = true and id <> p_trip;
    if v_used >= v_cap then raise exception 'cap reached'; end if;
  end if;
  update public.trips set is_featured = p_featured where id = p_trip;
  return json_build_object('featured', p_featured, 'cap', v_cap);
end $$;

revoke execute on function public.set_trip_featured(uuid,boolean) from public, anon;
grant execute on function public.set_trip_featured(uuid,boolean) to authenticated;
grant execute on function public.trip_featured_cap(text) to anon, authenticated;

-- la colonna is_featured di trips e' protetta: solo la RPC definer la scrive
revoke update on public.trips from authenticated, anon;
grant update (name, cover_url, badge, dates_label, cal_year, cal_month, is_published, updated_at, dedication) on public.trips to authenticated;
