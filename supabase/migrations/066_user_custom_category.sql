-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 066 — Categoria personalizzata REALE, una sola per utente, dentro la tassonomia.
--   * Le categorie PUBBLICHE restano governate dall'admin (poi_categories, active=true).
--   * La categoria personalizzata di un utente è una riga poi_categories con owner_id valorizzato
--     e active=false: la vede/usa SOLO il suo proprietario (RLS), finché non diventa pubblica.
--   * Vincolo hard "una sola non-pubblica per utente" (indice unico parziale).
--   * Contatore d'uso REALE (poi_categories.uses) mantenuto da un trigger sui POI: quando la
--     categoria è usata su 20 POI diventa pubblica DA SOLA. In più l'admin la vede e la può
--     APPROVARE SUBITO (active=true) con un click.
--   Sostituisce il vecchio meccanismo a conteggio-eventi su category_requests (aggirabile) e la
--   persistenza finta in localStorage lato client.

begin;

-- 0) Pulizia dell'approccio precedente (tabella separata, prima bozza di questa 066).
drop function if exists public.set_my_custom_category(text,text,text,text);
drop function if exists public.delete_my_custom_category();
drop function if exists public.admin_approve_custom_category(text,text);
drop table if exists public.user_custom_categories;

-- 1) poi_categories: chi ha proposto la custom + contatore d'uso reale.
alter table public.poi_categories add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.poi_categories add column if not exists uses int not null default 0;

-- 2) Una sola categoria personalizzata NON pubblica per utente.
create unique index if not exists poi_categories_one_pending_custom
  on public.poi_categories (owner_id) where owner_id is not null and active = false;

-- 3) Lettura: pubbliche attive + admin (tutto) + la PROPRIA (anche se non ancora pubblica).
drop policy if exists poi_categories_read on public.poi_categories;
create policy poi_categories_read on public.poi_categories
  for select using (
    active = true
    or public.is_admin((select auth.uid()))
    or owner_id = (select auth.uid())
  );

-- 4) Via il vecchio meccanismo finto (auto-promo per numero di righe di log).
drop trigger if exists trg_autopromote_category on public.category_requests;
drop function if exists public.tg_autopromote_category();

-- 5) Proponi/usa la MIA categoria personalizzata. Ritorna la riga (da usare subito sul POI).
--    Blocca la seconda finché la prima non è pubblica (raise CUSTOM_EXISTS con la label esistente).
create or replace function public.request_custom_category(p_label text, p_macro text default null)
returns public.poi_categories language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_label text := trim(p_label);
  v_key   text;
  v_macro public.poi_category;
  v_row   public.poi_categories;
  v_exist public.poi_categories;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  if v_label is null or length(v_label) = 0 or length(v_label) > 40 then raise exception 'label 1..40'; end if;
  v_key := trim(both '_' from regexp_replace(lower(v_label), '[^a-z0-9]+', '_', 'g'));
  if length(v_key) = 0 then raise exception 'invalid label'; end if;
  begin v_macro := coalesce(p_macro, 'cultura')::public.poi_category; exception when others then v_macro := 'cultura'; end;
  -- La key esiste già (pubblica o custom altrui): la si riusa così com'è.
  select * into v_exist from public.poi_categories where key = v_key;
  if found then return v_exist; end if;
  -- L'utente ha già una sua custom non ancora pubblica? Blocca la seconda.
  select * into v_exist from public.poi_categories where owner_id = v_uid and active = false limit 1;
  if found then
    raise exception 'CUSTOM_EXISTS' using detail = v_exist.key, hint = v_exist.label_it;
  end if;
  insert into public.poi_categories(key, macro, label_it, label_sq, label_en, icon, color, sort, active, official, owner_id, uses)
  values (v_key, v_macro, v_label, v_label, v_label, 'tag', '#64748B', 900, false, false, v_uid, 0)
  returning * into v_row;
  return v_row;
end $$;
grant execute on function public.request_custom_category(text,text) to authenticated;

-- 6) Cambia idea: elimina la mia categoria personalizzata ancora non pubblica (libera lo slot).
create or replace function public.delete_my_custom_category()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  delete from public.poi_categories where owner_id = auth.uid() and active = false;
end $$;
grant execute on function public.delete_my_custom_category() to authenticated;

-- 7) Trigger sui POI: mantiene poi_categories.uses (n. POI che usano la key) e auto-pubblica a 20.
create or replace function public.tg_category_uses()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_keys text[]; v_k text; v_cnt int;
begin
  v_keys := array(select distinct x from (
      select unnest(case when TG_OP <> 'DELETE'
             then array_remove(array[NEW.subcategory] || coalesce(NEW.categories,'{}'), null) else '{}'::text[] end)
      union
      select unnest(case when TG_OP <> 'INSERT'
             then array_remove(array[OLD.subcategory] || coalesce(OLD.categories,'{}'), null) else '{}'::text[] end)
    ) s(x) where x is not null and length(x) > 0);
  foreach v_k in array v_keys loop
    if exists (select 1 from public.poi_categories where key = v_k and owner_id is not null) then
      select count(*) into v_cnt from public.pois
        where removed_at is null and (subcategory = v_k or v_k = any(categories));
      update public.poi_categories set uses = v_cnt where key = v_k;
      update public.poi_categories set active = true where key = v_k and active = false and v_cnt >= 20;
    end if;
  end loop;
  return null;
end $$;

drop trigger if exists trg_category_uses on public.pois;
create trigger trg_category_uses
  after insert or delete or update of subcategory, categories, removed_at on public.pois
  for each row execute function public.tg_category_uses();

-- 8) Admin: approva subito / rifiuta / elenca le custom in attesa (con proprietario e usi).
create or replace function public.admin_approve_category(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  update public.poi_categories set active = true where key = p_key;
end $$;
grant execute on function public.admin_approve_category(text) to authenticated;

create or replace function public.admin_reject_category(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  delete from public.poi_categories where key = p_key and active = false and owner_id is not null;
end $$;
grant execute on function public.admin_reject_category(text) to authenticated;

create or replace function public.admin_list_custom_categories()
returns table(key text, label_it text, macro text, owner_id uuid, owner_username text, uses int, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  return query
    select c.key, c.label_it, c.macro::text, c.owner_id, p.username, c.uses, c.created_at
      from public.poi_categories c
      left join public.profiles p on p.id = c.owner_id
     where c.active = false and c.owner_id is not null
     order by c.uses desc, c.created_at desc;
end $$;
grant execute on function public.admin_list_custom_categories() to authenticated;

commit;
