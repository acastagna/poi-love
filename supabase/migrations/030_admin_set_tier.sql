-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 030: l'admin assegna/toglie un tier a un utente. Stesso schema sicuro di
-- admin_set_user_status: solo admin (aal2), passa l'anti-tamper, audita.

create or replace function public.admin_set_user_tier(p_target uuid, p_tier text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_tier is not null and p_tier not in
     ('professionista','professionista_plus','sostenitore','mecenate','influencer')
  then raise exception 'invalid tier'; end if;
  perform set_config('app.admin_op', '1', true);   -- supera il trigger anti-tamper
  update public.profiles
     set special_tier = p_tier, updated_at = now()
   where id = p_target;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (auth.uid(), 'set_user_tier', 'user', p_target::text,
          jsonb_build_object('tier', p_tier));
end $function$;

revoke execute on function public.admin_set_user_tier(uuid,text) from public, anon;
grant execute on function public.admin_set_user_tier(uuid,text) to authenticated;
