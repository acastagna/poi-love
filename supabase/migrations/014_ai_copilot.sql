-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 014 — Copilota AI agentico (proposte con approvazione umana)
-- L'AI non scrive MAI nel DB: propone. Le proposte vivono in ai_proposals (pending);
-- l'admin approva dal pannello e SOLO allora l'azione si materializza (POI bozza, rotta storica,
-- o progetto intero via RPC transazionale). Tutto sotto gate is_admin()+aal2, niente azioni distruttive.
--
-- DA APPLICARE SOLO DOPO REVIEW E OK ESPLICITO (tocca pois e trips). Idempotente.

begin;

-- ── 1) Tabella delle proposte dell'AI ─────────────────────────────────────────
create table if not exists public.ai_proposals (
  id             uuid primary key default gen_random_uuid(),
  admin_id       uuid not null references public.profiles(id) on delete cascade,
  kind           text not null check (kind in ('poi','route','project')),
  title          text,
  payload        jsonb not null default '{}'::jsonb,
  status         text not null default 'pending' check (status in ('pending','approved','rejected','applied')),
  rationale      text,
  created_at     timestamptz not null default now(),
  decided_at     timestamptz,
  applied_at     timestamptz,
  applied_result jsonb
);
create index if not exists idx_ai_proposals_status on public.ai_proposals(status) where status='pending';
create index if not exists idx_ai_proposals_admin  on public.ai_proposals(admin_id);

alter table public.ai_proposals enable row level security;
drop policy if exists ai_proposals_admin_all on public.ai_proposals;
create policy ai_proposals_admin_all on public.ai_proposals
  for all using (public.is_admin()) with check (public.is_admin());

-- ── 2) POI: stato di approvazione redazionale + origine ───────────────────────
alter table public.pois
  add column if not exists is_approved boolean not null default true,   -- i POI utente esistenti restano pubblici
  add column if not exists created_via text not null default 'user';    -- 'user' | 'admin' | 'ai'

-- visibility ammette 'official' (POI curati dall'amministrazione)
do $$ begin
  if exists (select 1 from pg_constraint where conname='pois_visibility_check') then
    alter table public.pois drop constraint pois_visibility_check;
  end if;
  alter table public.pois add constraint pois_visibility_check
    check (visibility in ('private','community','suggested_google','official'));
end $$;

-- le bozze non approvate restano nascoste al pubblico (policy RESTRICTIVE: AND con le permissive)
drop policy if exists pois_hide_unapproved on public.pois;
create policy pois_hide_unapproved on public.pois as restrictive for select
  using ( is_approved = true or author_id = auth.uid() or public.is_admin() );

-- ── 3) Trips: marca le rotte storiche ufficiali ───────────────────────────────
alter table public.trips
  add column if not exists is_historic  boolean not null default false,
  add column if not exists is_published boolean not null default true;

-- ── 4) RPC transazionale: applica una proposta approvata (progetto intero in un colpo) ─
create or replace function public.apply_ai_proposal(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pr      public.ai_proposals%rowtype;
  poi     jsonb;
  ref_map jsonb := '{}'::jsonb;
  new_id  uuid;
  trip_id uuid;
  st      jsonb;
  ord     int := 0;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select * into pr from public.ai_proposals where id = p_id for update;
  if pr.id is null then raise exception 'proposal not found'; end if;
  if pr.status <> 'approved' then raise exception 'proposal not approved'; end if;

  if pr.kind = 'poi' then
    insert into public.pois(author_id,title,description,category,tags,lat,lng,address,city,visibility,is_approved,created_via)
    values (auth.uid(), pr.payload->>'name', pr.payload->>'description',
            case when pr.payload->>'category' = any(enum_range(null::poi_category)::text[])
                 then (pr.payload->>'category')::poi_category else 'cultura'::poi_category end,
            coalesce((select array_agg(x) from jsonb_array_elements_text(pr.payload->'tags') x),'{}'),
            (pr.payload->>'lat')::float8, (pr.payload->>'lng')::float8,
            pr.payload->>'address', pr.payload->>'city', 'official', false, 'ai')
    returning id into new_id;

  elsif pr.kind in ('route','project') then
    for poi in select * from jsonb_array_elements(coalesce(pr.payload->'new_pois','[]'::jsonb)) loop
      insert into public.pois(author_id,title,description,category,tags,lat,lng,city,visibility,is_approved,created_via)
      values (auth.uid(), poi->>'name', poi->>'description',
              case when poi->>'category' = any(enum_range(null::poi_category)::text[])
                   then (poi->>'category')::poi_category else 'cultura'::poi_category end,
              coalesce((select array_agg(x) from jsonb_array_elements_text(poi->'tags') x),'{}'),
              (poi->>'lat')::float8, (poi->>'lng')::float8, poi->>'city', 'official', false, 'ai')
      returning id into new_id;
      ref_map := ref_map || jsonb_build_object(poi->>'ref', new_id::text);
    end loop;

    insert into public.trips(owner_id,name,badge,is_historic,is_published)
    values (auth.uid(), coalesce(pr.payload#>>'{route,name}', pr.payload->>'title'),
            pr.payload#>>'{route,badge}', true, false)
    returning id into trip_id;

    for st in select * from jsonb_array_elements(pr.payload#>'{route,stops}') loop
      insert into public.trip_stops(trip_id,name,lat,lng,poi_id,sort_order,status)
      values (trip_id, coalesce(st->>'name','Tappa'),
              (st->>'lat')::float8, (st->>'lng')::float8,
              coalesce((ref_map->>(st->>'new_poi_ref'))::uuid, (st->>'link_existing_poi_id')::uuid),
              ord, 'planned');
      ord := ord + 1;
    end loop;
  else
    raise exception 'unknown kind';
  end if;

  update public.ai_proposals
     set status='applied', applied_at=now(), applied_result=jsonb_build_object('ref_map',ref_map,'trip_id',trip_id)
   where id = p_id;

  insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
  values (auth.uid(), 'ai_proposal_apply', pr.kind, p_id::text, jsonb_build_object('title', pr.payload->>'title'));

  return jsonb_build_object('ok',true,'trip_id',trip_id);
end $$;
revoke all on function public.apply_ai_proposal(uuid) from public;
grant execute on function public.apply_ai_proposal(uuid) to authenticated;

commit;
