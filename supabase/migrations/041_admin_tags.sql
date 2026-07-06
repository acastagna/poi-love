-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 041: gestione TAG dall'amministrazione (il cuore di tutto). I tag restano
-- LIBERI e mono-parola (scelta del founder: "i tag sono liberi"), ma l'admin deve
-- poterli ORGANIZZARE: vederli con i conteggi, rinominarli/unirli, eliminarli,
-- evidenziarne alcuni (sempre suggeriti) e bloccarne altri (mai suggeriti).
-- Nessuna colonna nuova su pois: i tag vivono in pois.tags[]. Qui aggiungiamo solo
-- una tabella di CURATELA e RPC SECURITY DEFINER gate is_admin.

-- ── Curatela: flag featured/blocked per singolo tag (chiave = tag normalizzato) ─
create table if not exists public.curated_tags (
  tag        text primary key,                 -- lowercase, gia normalizzato
  featured   boolean not null default false,   -- sempre in cima ai suggerimenti
  blocked    boolean not null default false,   -- mai suggerito (parola vietata)
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.curated_tags enable row level security;
drop policy if exists curated_tags_admin_all on public.curated_tags;
create policy curated_tags_admin_all on public.curated_tags
  for all using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── Elenco tag della community con conteggi + stato curatela ──────────────────
create or replace function public.admin_list_tags(p_limit int default 500)
returns table(tag text, uses bigint, featured boolean, blocked boolean)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  return query
  with used as (
    select lower(trim(tg)) as tag, count(*) as uses
    from public.pois p, unnest(p.tags) tg
    where tg is not null and length(trim(tg)) > 0
    group by lower(trim(tg))
  )
  select
    coalesce(u.tag, c.tag) as tag,
    coalesce(u.uses, 0)    as uses,
    coalesce(c.featured, false) as featured,
    coalesce(c.blocked, false)  as blocked
  from used u
  full outer join public.curated_tags c on c.tag = u.tag
  order by coalesce(c.featured, false) desc, coalesce(u.uses,0) desc, coalesce(u.tag, c.tag)
  limit greatest(1, least(coalesce(p_limit,500), 2000));
end $$;
revoke execute on function public.admin_list_tags(int) from public, anon, authenticated;
grant execute on function public.admin_list_tags(int) to authenticated;

-- ── Rinomina/unisci un tag su TUTTI i POI (dedup automatico) ───────────────────
create or replace function public.admin_rename_tag(p_old text, p_new text)
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_old text := lower(trim(p_old));
  v_new text := lower(trim(p_new));
  v_cnt int := 0;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  if v_old is null or length(v_old) = 0 or v_new is null or length(v_new) = 0 then
    return 0;
  end if;
  if length(v_new) > 40 then v_new := substr(v_new,1,40); end if;
  -- sostituisce v_old con v_new e rimuove i duplicati, preservando l'ordine
  with upd as (
    select p.id,
      (select array_agg(x order by ord)
         from (
           select x, min(ord) as ord
           from (
             select case when lower(trim(t)) = v_old then v_new else trim(t) end as x, ord
             from unnest(p.tags) with ordinality as e(t, ord)
             where t is not null and length(trim(t)) > 0
           ) s
           group by x
         ) d
      ) as new_tags
    from public.pois p
    where exists (select 1 from unnest(p.tags) t where lower(trim(t)) = v_old)
  )
  update public.pois p
     set tags = coalesce(upd.new_tags, '{}')
    from upd
   where p.id = upd.id;
  get diagnostics v_cnt = row_count;
  -- porta dietro anche la curatela
  update public.curated_tags set tag = v_new, updated_at = now()
    where tag = v_old and not exists (select 1 from public.curated_tags c2 where c2.tag = v_new);
  delete from public.curated_tags where tag = v_old;
  return v_cnt;
end $$;
revoke execute on function public.admin_rename_tag(text,text) from public, anon, authenticated;
grant execute on function public.admin_rename_tag(text,text) to authenticated;

-- ── Elimina un tag da TUTTI i POI ─────────────────────────────────────────────
create or replace function public.admin_delete_tag(p_tag text)
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tag text := lower(trim(p_tag));
  v_cnt int := 0;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  if v_tag is null or length(v_tag) = 0 then return 0; end if;
  with upd as (
    select p.id,
      (select coalesce(array_agg(trim(t) order by ord), '{}')
         from unnest(p.tags) with ordinality as e(t, ord)
        where t is not null and length(trim(t)) > 0 and lower(trim(t)) <> v_tag
      ) as new_tags
    from public.pois p
    where exists (select 1 from unnest(p.tags) t where lower(trim(t)) = v_tag)
  )
  update public.pois p
     set tags = coalesce(upd.new_tags, '{}')
    from upd
   where p.id = upd.id;
  get diagnostics v_cnt = row_count;
  return v_cnt;
end $$;
revoke execute on function public.admin_delete_tag(text) from public, anon, authenticated;
grant execute on function public.admin_delete_tag(text) to authenticated;

-- ── Evidenzia / blocca un tag (upsert curatela) ───────────────────────────────
create or replace function public.admin_curate_tag(p_tag text, p_featured boolean default null, p_blocked boolean default null, p_note text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tag text := lower(trim(p_tag));
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  if v_tag is null or length(v_tag) = 0 or length(v_tag) > 40 then return; end if;
  insert into public.curated_tags(tag, featured, blocked, note, updated_at)
  values (v_tag, coalesce(p_featured,false), coalesce(p_blocked,false), nullif(trim(coalesce(p_note,'')),''), now())
  on conflict (tag) do update set
    featured = coalesce(p_featured, public.curated_tags.featured),
    blocked  = coalesce(p_blocked,  public.curated_tags.blocked),
    note     = coalesce(nullif(trim(coalesce(p_note,'')),''), public.curated_tags.note),
    updated_at = now();
  -- se bloccato, toglilo dai POI (parola vietata)
  if coalesce(p_blocked,false) then
    perform public.admin_delete_tag(v_tag);
  end if;
end $$;
revoke execute on function public.admin_curate_tag(text,boolean,boolean,text) from public, anon, authenticated;
grant execute on function public.admin_curate_tag(text,boolean,boolean,text) to authenticated;

-- ── suggest_tags: includi gli evidenziati, escludi i bloccati ─────────────────
create or replace function public.suggest_tags(p_prefix text, p_limit int default 8)
returns text[]
language sql
stable
security definer
set search_path to ''
as $$
  with pref as (select lower(trim(p_prefix)) as q),
  from_pois as (
    select distinct lower(trim(tg)) as tag
    from public.pois p, unnest(p.tags) tg, pref
    where p.visibility in ('community','suggested_google','official')
      and pref.q is not null and length(pref.q) >= 1
      and lower(trim(tg)) like pref.q || '%'
  ),
  from_featured as (
    select tag from public.curated_tags c, pref
    where c.featured = true and c.blocked = false
      and pref.q is not null and length(pref.q) >= 1
      and c.tag like pref.q || '%'
  ),
  merged as (
    select tag, 1 as pri from from_featured
    union
    select tag, 2 as pri from from_pois
  )
  select coalesce(array_agg(tag order by pri, tag), '{}')
  from (
    select tag, min(pri) as pri
    from merged m
    where not exists (select 1 from public.curated_tags b where b.tag = m.tag and b.blocked = true)
    group by tag
    order by min(pri), tag
    limit greatest(1, least(coalesce(p_limit,8), 20))
  ) s;
$$;
revoke execute on function public.suggest_tags(text,int) from public;
grant execute on function public.suggest_tags(text,int) to anon, authenticated;
