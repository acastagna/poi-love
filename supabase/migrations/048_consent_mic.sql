-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 048 — Aggiunge il consenso MICROFONO (dettatura vocale) al registro consensi.
-- Parte A (gia' applicata separatamente, fuori transazione):
--   alter type public.consent_type add value if not exists 'mic';
-- Parte B (qui): record_consent ora registra anche 'mic'; my_consents ritorna mic_ok.

begin;

-- Sostituisce record_consent con la firma a 4 argomenti (p_mic aggiunto, default false).
-- Nota: la vecchia firma a 3 argomenti va rimossa, altrimenti una chiamata a 3 arg resta ambigua.
drop function if exists public.record_consent(text, boolean, boolean);
create or replace function public.record_consent(
  p_version text, p_geo boolean default false, p_photo boolean default false, p_mic boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m record;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if coalesce(trim(p_version),'') = '' then raise exception 'version required'; end if;
  select * into m from public._req_meta();
  insert into public.consents(user_id, ctype, accepted, version, ip, user_agent) values
    (uid, 'terms',   true,                    p_version, m.ip, m.ua),
    (uid, 'privacy', true,                    p_version, m.ip, m.ua),
    (uid, 'age16',   true,                    p_version, m.ip, m.ua),
    (uid, 'geo',     coalesce(p_geo,false),   p_version, m.ip, m.ua),
    (uid, 'photo',   coalesce(p_photo,false), p_version, m.ip, m.ua),
    (uid, 'mic',     coalesce(p_mic,false),   p_version, m.ip, m.ua);
end $$;
revoke all on function public.record_consent(text, boolean, boolean, boolean) from public, anon;
grant execute on function public.record_consent(text, boolean, boolean, boolean) to authenticated;

-- my_consents ritorna anche mic_ok (DROP obbligatorio: cambia il tipo di ritorno)
drop function if exists public.my_consents();
create or replace function public.my_consents()
returns table(terms_version text, terms_ok boolean, geo_ok boolean, photo_ok boolean, mic_ok boolean)
language sql stable security definer set search_path = public as $$
  with latest as (
    select distinct on (ctype) ctype, accepted, version
    from public.consents
    where user_id = auth.uid()
    order by ctype, created_at desc
  )
  select
    (select version  from latest where ctype = 'terms' and accepted),
    coalesce((select accepted from latest where ctype = 'terms'), false),
    coalesce((select accepted from latest where ctype = 'geo'),   false),
    coalesce((select accepted from latest where ctype = 'photo'), false),
    coalesce((select accepted from latest where ctype = 'mic'),   false);
$$;
revoke all on function public.my_consents() from public, anon;
grant execute on function public.my_consents() to authenticated;

commit;
