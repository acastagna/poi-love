-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Ruoli admin: SUPER (accesso totale) vs MODERATORE (solo moderazione). Difesa lato server:
-- le azioni sensibili (assegnare ruoli, cambiare tier a pagamento) le fa solo il super.

alter table public.profiles add column if not exists admin_role text;
-- gli admin già esistenti diventano super
update public.profiles set admin_role = 'super' where is_admin = true and admin_role is null;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true and admin_role = 'super' and moderation_status = 'active'
  );
$$;

-- Solo il super nomina/revoca moderatori e super. Non può declassare se stesso (per non restare senza super).
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_super_admin() then raise exception 'not super admin'; end if;
  if p_role not in ('super','moderator','none') then raise exception 'invalid role'; end if;
  if p_user = auth.uid() and p_role <> 'super' then raise exception 'cannot demote self'; end if;
  perform set_config('app.admin_op', '1', true);
  update public.profiles
     set is_admin = (p_role in ('super','moderator')),
         admin_role = case when p_role = 'none' then null else p_role end,
         updated_at = now()
   where id = p_user;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (auth.uid(), 'set_role', 'user', p_user::text, jsonb_build_object('role', p_role));
  return found;
end $$;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- Il tier a pagamento ora lo assegna SOLO il super (prima bastava is_admin).
create or replace function public.admin_set_user_tier(p_target uuid, p_tier text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_super_admin() then raise exception 'not authorized'; end if;
  if p_tier is not null and p_tier not in
     ('professionista','professionista_plus','sostenitore','mecenate','influencer')
  then raise exception 'invalid tier'; end if;
  perform set_config('app.admin_op', '1', true);
  update public.profiles set special_tier = p_tier, updated_at = now() where id = p_target;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (auth.uid(), 'set_user_tier', 'user', p_target::text, jsonb_build_object('tier', p_tier));
end $$;
