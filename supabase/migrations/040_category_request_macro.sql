-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 040: una sottocategoria proposta appartiene a una FAMIGLIA (macro). Salviamo il
-- macro nella richiesta, cosi quando la sottocategoria viene promossa (20 volte)
-- finisce nel gruppo giusto, non sempre in "cultura".

alter table public.category_requests add column if not exists macro text;

create or replace function public.log_category_request(p_term text, p_lang text default null, p_source text default null, p_macro text default null)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_term is null or length(trim(p_term)) = 0 or length(p_term) > 80 then
    return;
  end if;
  insert into public.category_requests(term, lang, source, macro, user_id)
  values (trim(p_term), p_lang, p_source,
          case when p_macro in ('cibo','lavoro','pernottare','natura','festa','cultura','pratico','benessere','love','audioguida','mappa','open_source') then p_macro else null end,
          auth.uid());
end;
$$;
revoke execute on function public.log_category_request(text,text,text,text) from public;
grant execute on function public.log_category_request(text,text,text,text) to anon, authenticated;

-- auto-promozione: usa il macro piu recente indicato per quel termine
create or replace function public.tg_autopromote_category()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_term text := lower(trim(new.term));
  v_key  text;
  v_cnt  int;
  v_macro text;
begin
  if v_term is null or length(v_term) = 0 then return new; end if;
  v_key := trim(both '_' from regexp_replace(v_term, '[^a-z0-9]+', '_', 'g'));
  if length(v_key) = 0 then return new; end if;
  if exists (select 1 from public.poi_categories where key = v_key) then return new; end if;
  select count(*) into v_cnt from public.category_requests where lower(trim(term)) = v_term;
  if v_cnt >= 20 then
    select macro into v_macro from public.category_requests
     where lower(trim(term)) = v_term and macro is not null
     order by created_at desc limit 1;
    v_macro := coalesce(v_macro, 'cultura');
    insert into public.poi_categories(key, macro, label_it, label_sq, label_en, icon, color, sort, active, official)
    values (v_key, v_macro::public.poi_category, initcap(v_term), initcap(v_term), initcap(v_term), 'tag', '#64748B', 900, true, false)
    on conflict (key) do nothing;
  end if;
  return new;
end $$;
