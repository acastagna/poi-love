-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Il trigger anti-manomissione ripristinava SEMPRE is_admin (giusto: mai dal client). Ma ora il super
-- deve poter nominare moderatori/super. Introduciamo un flag dedicato app.role_op='1' che SOLO la RPC
-- admin_set_role (super-gated) imposta: solo con quel flag is_admin può cambiare. Resta bloccato altrove.

create or replace function public.protect_gamification_columns()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  claims    text := current_setting('request.jwt.claims', true);
  jwt_role  text := coalesce((claims::json)->>'role', '');
  admin_op  text := coalesce(current_setting('app.admin_op', true), '');
  points_op text := coalesce(current_setting('app.points_op', true), '');
  role_op   text := coalesce(current_setting('app.role_op', true), '');
begin
  if claims is not null and jwt_role <> 'service_role' then
    if points_op <> '1' then new.points := old.points; end if;
    if admin_op <> '1' then new.special_tier := old.special_tier; end if;
    if old.referred_by is not null then new.referred_by := old.referred_by; end if;
    -- is_admin cambia SOLO tramite admin_set_role (che imposta app.role_op='1'); altrimenti resta com'era
    if role_op <> '1' then new.is_admin := old.is_admin; end if;
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

-- admin_set_role: imposta il flag role_op così il trigger lascia passare is_admin
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_super_admin() then raise exception 'not super admin'; end if;
  if p_role not in ('super','moderator','none') then raise exception 'invalid role'; end if;
  if p_user = auth.uid() and p_role <> 'super' then raise exception 'cannot demote self'; end if;
  perform set_config('app.role_op', '1', true);
  update public.profiles
     set is_admin = (p_role in ('super','moderator')),
         admin_role = case when p_role = 'none' then null else p_role end,
         updated_at = now()
   where id = p_user;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (auth.uid(), 'set_role', 'user', p_user::text, jsonb_build_object('role', p_role));
  return found;
end $$;
