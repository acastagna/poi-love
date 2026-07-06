-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 033: il trigger protect_gamification_columns azzerava OGNI aumento di punti
-- fatto da award_points (perche arriva con un JWT) e annullava anche il cambio
-- tier dell'RPC admin (il reset di special_tier non era condizionato ad admin_op).
-- Risultato: point_events accumulava (225 pt) ma profiles.points restava a 0 per
-- tutti, e il pannello non riusciva a cambiare tier. Fix + ricostruzione totali.
--  - points: modificabili solo se award_points ha impostato app.points_op='1'.
--  - special_tier: modificabile solo con app.admin_op='1' (RPC admin, aal2).

create or replace function public.protect_gamification_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  claims    text := current_setting('request.jwt.claims', true);
  jwt_role  text := coalesce((claims::json)->>'role', '');
  admin_op  text := coalesce(current_setting('app.admin_op', true), '');
  points_op text := coalesce(current_setting('app.points_op', true), '');
begin
  if claims is not null and jwt_role <> 'service_role' then
    -- i punti li cambia SOLO award_points (che imposta app.points_op='1')
    if points_op <> '1' then
      new.points := old.points;
    end if;
    -- il tier lo cambia SOLO la RPC admin (che imposta app.admin_op='1')
    if admin_op <> '1' then
      new.special_tier := old.special_tier;
    end if;
    if old.referred_by is not null then
      new.referred_by := old.referred_by;
    end if;
    new.is_admin := old.is_admin;   -- mai dal client/RPC
    if admin_op <> '1' then
      new.moderation_status     := old.moderation_status;
      new.moderation_reason     := old.moderation_reason;
      new.moderation_until      := old.moderation_until;
      new.moderation_updated_by := old.moderation_updated_by;
      new.moderation_updated_at := old.moderation_updated_at;
    end if;
  end if;
  return new;
end $function$;

-- award_points: apre il varco ai punti (transaction-local) prima di aggiornare
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
    perform set_config('app.points_op', '1', true);  -- varco per il trigger protettivo
    update public.profiles set points = points + v_pts where id = p_user;
  end if;
end $function$;

-- ricostruzione dei totali dai point_events (gira come service_role: il trigger la lascia passare)
update public.profiles p
   set points = coalesce((select sum(pe.points) from public.point_events pe where pe.user_id = p.id), 0);
