-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- L'admin può cambiare la COPERTINA (cover) di un utente dalla sua scheda, come già per l'avatar.

create or replace function public.admin_set_user_cover(p_user uuid, p_url text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_active_admin() then
    raise exception 'not admin';
  end if;
  update public.profiles
     set cover_url  = nullif(trim(coalesce(p_url,'')), ''),
         cover_type = case
                        when coalesce(trim(p_url),'') = '' then 'gradient'
                        when p_url ~ '^(linear-gradient|radial-gradient|#)' then 'gradient'
                        else 'image'
                      end
   where id = p_user;
  return found;
end;
$$;
revoke all on function public.admin_set_user_cover(uuid, text) from public, anon;
grant execute on function public.admin_set_user_cover(uuid, text) to authenticated;
