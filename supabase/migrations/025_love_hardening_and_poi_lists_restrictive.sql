-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 025: esiti della review avversariale del 06/07.
-- 1) toggle_love: SECURITY DEFINER saltava le policy RESTRICTIVE anti-bannati
--    della 012; ora il blocco is_active e' dentro la funzione. Hardening
--    search_path='' con riferimenti schema-qualificati (niente dirottamento pg_temp).
-- 2) poi_lists non aveva mai ricevuto require_active_ins/upd: il loop della 012
--    puntava a "list_pois" che non esiste. Recuperate qui.

create or replace function public.toggle_love(p_poi_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_loved boolean;
  v_count int;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  if not public.is_active(v_uid) then
    raise exception 'account suspended';
  end if;
  if exists (select 1 from public.loves where poi_id = p_poi_id and user_id = v_uid) then
    delete from public.loves where poi_id = p_poi_id and user_id = v_uid;
    v_loved := false;
  else
    insert into public.loves(poi_id, user_id) values (p_poi_id, v_uid)
    on conflict do nothing;
    v_loved := true;
  end if;
  select count(*) into v_count from public.loves where poi_id = p_poi_id;
  update public.pois set love_count = v_count where id = p_poi_id;
  return json_build_object('loved', v_loved, 'love_count', v_count);
end;
$$;

revoke execute on function public.toggle_love(uuid) from public, anon;
grant execute on function public.toggle_love(uuid) to authenticated;

drop policy if exists require_active_ins on public.poi_lists;
create policy require_active_ins on public.poi_lists
  as restrictive for insert
  with check (public.is_active((select auth.uid())));

drop policy if exists require_active_upd on public.poi_lists;
create policy require_active_upd on public.poi_lists
  as restrictive for update
  using (public.is_active((select auth.uid())));
