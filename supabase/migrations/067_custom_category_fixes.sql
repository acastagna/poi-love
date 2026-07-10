-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 067 — Correzioni alla categoria personalizzata (review avversariale):
--   * request_custom_category NON riusa più la categoria PRIVATA (pendente) di un altro utente:
--     riusa solo una pubblica o la PROPRIA pendente. Niente leak dell'owner altrui, niente
--     riferimento penzolante (adottavi una categoria che poi la RLS ti nascondeva).
--   * Race-safe: se due proposte concorrenti collidono (stesso termine di due utenti, o stesso
--     utente su due dispositivi) non esce più un errore grezzo 23505: la key altrui viene
--     "namespacizzata" per tenere la mia distinta, e la doppia propria torna il chiaro CUSTOM_EXISTS.

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
  -- Riuso SOLO ciò che il chiamante può davvero vedere: una pubblica, o la SUA pendente. Mai la privata altrui.
  select * into v_exist from public.poi_categories where key = v_key and (active = true or owner_id = v_uid);
  if found then return v_exist; end if;
  -- Una sola pendente per utente.
  select * into v_exist from public.poi_categories where owner_id = v_uid and active = false limit 1;
  if found then raise exception 'CUSTOM_EXISTS' using detail = v_exist.key, hint = v_exist.label_it; end if;
  begin
    insert into public.poi_categories(key, macro, label_it, label_sq, label_en, icon, color, sort, active, official, owner_id, uses)
    values (v_key, v_macro, v_label, v_label, v_label, 'tag', '#64748B', 900, false, false, v_uid, 0)
    returning * into v_row;
    return v_row;
  exception when unique_violation then
    -- Race persa o key già occupata: reconvergo sul comportamento giusto.
    select * into v_exist from public.poi_categories where owner_id = v_uid and active = false limit 1;
    if found then raise exception 'CUSTOM_EXISTS' using detail = v_exist.key, hint = v_exist.label_it; end if;
    select * into v_exist from public.poi_categories where key = v_key and active = true;
    if found then return v_exist; end if;
    -- key occupata da una pendente PRIVATA altrui: la mia diventa distinta (namespaced) e resta privata.
    v_key := left(v_key, 32) || '_' || left(replace(v_uid::text, '-', ''), 6);
    insert into public.poi_categories(key, macro, label_it, label_sq, label_en, icon, color, sort, active, official, owner_id, uses)
    values (v_key, v_macro, v_label, v_label, v_label, 'tag', '#64748B', 900, false, false, v_uid, 0)
    returning * into v_row;
    return v_row;
  end;
end $$;
grant execute on function public.request_custom_category(text,text) to authenticated;
