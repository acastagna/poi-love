-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 027: RPC di supporto alla tassonomia.
--  suggest_tags: autocomplete dei TAG dalla community (solo POI visibili).
--  log_category_request: traccia una richiesta senza toccare la tabella dal client
--     (SECURITY DEFINER: anche l'ospite puo lasciare la traccia, sempre come se stesso).

create or replace function public.suggest_tags(p_prefix text, p_limit int default 8)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(tag order by tag), '{}')
  from (
    select distinct tg as tag
    from public.pois p, unnest(p.tags) tg
    where p.visibility in ('community','suggested_google','official')
      and p_prefix is not null and length(trim(p_prefix)) >= 1
      and lower(tg) like lower(trim(p_prefix)) || '%'
    order by tg
    limit greatest(1, least(p_limit, 20))
  ) s;
$$;

revoke execute on function public.suggest_tags(text,int) from public;
grant execute on function public.suggest_tags(text,int) to anon, authenticated;

create or replace function public.log_category_request(p_term text, p_lang text default null, p_source text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_term is null or length(trim(p_term)) = 0 or length(p_term) > 80 then
    return;
  end if;
  insert into public.category_requests(term, lang, source, user_id)
  values (trim(p_term), p_lang, p_source, auth.uid());
end;
$$;

revoke execute on function public.log_category_request(text,text,text) from public;
grant execute on function public.log_category_request(text,text,text) to anon, authenticated;
