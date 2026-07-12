-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- L'admin può cambiare la FOTO (avatar) di un utente dalla sua scheda. Serve una RPC dedicata:
-- la RLS di profiles lascia scrivere solo al proprietario, quindi l'admin passa da qui (gate + audit).

create or replace function public.admin_set_user_avatar(p_user uuid, p_url text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_url text := nullif(btrim(coalesce(p_url,'')),'');
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  -- accetta solo URL http(s) o vuoto (per togliere la foto). Niente data: o javascript:
  if v_url is not null and v_url !~* '^https?://' then raise exception 'invalid url'; end if;
  update public.profiles set avatar_url = v_url, updated_at = now() where id = p_user;
  if not found then raise exception 'user not found'; end if;
  begin insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
    values (auth.uid(),'set_user_avatar','user',p_user::text,jsonb_build_object('url',v_url)); exception when others then null; end;
end $$;

revoke all on function public.admin_set_user_avatar(uuid,text) from public, anon;
grant execute on function public.admin_set_user_avatar(uuid,text) to authenticated;
