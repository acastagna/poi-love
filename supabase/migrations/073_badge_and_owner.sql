-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- A3 — Sistema BADGE + ASSEGNAZIONE uniforme su POI, Rotte/Itinerari (trips) e Compagnie.
-- Badge possibili: "Ufficiale" (badge_official), "Indispensabile" (badge_essential),
-- oppure un livello di utenza (badge_tier = slug tier). Assegnazione: assigned_user_id
-- = utente registrato accreditato come autore/gestore del contenuto.
-- Tutto passa (dal pannello) per la RPC admin_set_badge_and_owner, gate is_active_admin, con audit.

-- ── Colonne uniformi ────────────────────────────────────────────────────────────
-- trips ha già badge_official/badge_essential (mig 069); aggiungo solo tier + assegnatario.
alter table public.trips
  add column if not exists badge_tier text,
  add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null;

alter table public.pois
  add column if not exists badge_official boolean not null default false,
  add column if not exists badge_essential boolean not null default false,
  add column if not exists badge_tier text,
  add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null;

alter table public.companions
  add column if not exists badge_official boolean not null default false,
  add column if not exists badge_essential boolean not null default false,
  add column if not exists badge_tier text,
  add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null;

-- Indici per filtrare/elencare per badge e per assegnatario (T8: colonna/filtro in elenco).
create index if not exists pois_assigned_idx on public.pois(assigned_user_id) where assigned_user_id is not null;
create index if not exists trips_assigned_idx on public.trips(assigned_user_id) where assigned_user_id is not null;
create index if not exists pois_badge_tier_idx on public.pois(badge_tier) where badge_tier is not null;
create index if not exists trips_badge_tier_idx on public.trips(badge_tier) where badge_tier is not null;

-- ── RPC unica: imposta badge + assegnatario su una qualsiasi delle 3 entità ──────
-- p_entity: 'poi' | 'route' | 'trip' | 'companion'  (route e trip → tabella trips)
-- p_official/p_essential: booleani; p_tier: slug tier o null; p_assigned: uuid utente o null.
-- Ritorna void; solleva eccezione se non admin, entità/tier non validi, o id inesistente.
create or replace function public.admin_set_badge_and_owner(
  p_entity text,
  p_id uuid,
  p_official boolean default false,
  p_essential boolean default false,
  p_tier text default null,
  p_assigned uuid default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tier text := nullif(btrim(coalesce(p_tier,'')), '');
  v_off boolean := coalesce(p_official, false);
  v_ess boolean := coalesce(p_essential, false);
  v_n int;
begin
  if not public.is_active_admin() then
    raise exception 'not authorized';
  end if;

  -- tier ammessi (coerenti con i tier dell'app); qualsiasi altro valore → null
  if v_tier is not null and v_tier not in
     ('professionista','professionista_plus','sostenitore','mecenate','influencer') then
    v_tier := null;
  end if;

  -- l'assegnatario, se dato, deve essere un profilo reale
  if p_assigned is not null and not exists (select 1 from public.profiles where id = p_assigned) then
    raise exception 'assigned user not found';
  end if;

  if p_entity = 'poi' then
    update public.pois
       set badge_official = v_off, badge_essential = v_ess,
           badge_tier = v_tier, assigned_user_id = p_assigned
     where id = p_id;
    get diagnostics v_n = row_count;
  elsif p_entity in ('route','trip','itinerary') then
    update public.trips
       set badge_official = v_off, badge_essential = v_ess,
           badge_tier = v_tier, assigned_user_id = p_assigned
     where id = p_id;
    get diagnostics v_n = row_count;
  elsif p_entity = 'companion' then
    update public.companions
       set badge_official = v_off, badge_essential = v_ess,
           badge_tier = v_tier, assigned_user_id = p_assigned
     where id = p_id;
    get diagnostics v_n = row_count;
  else
    raise exception 'invalid entity: %', p_entity;
  end if;

  if v_n = 0 then
    raise exception 'entity not found';
  end if;

  -- traccia in audit (attore = admin corrente)
  begin
    insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
    values (auth.uid(), 'set_badge_and_owner', p_entity, p_id::text,
            jsonb_build_object('official', v_off, 'essential', v_ess, 'tier', v_tier, 'assigned', p_assigned));
  exception when others then null; -- l'audit non deve mai bloccare l'azione
  end;
end;
$$;

revoke all on function public.admin_set_badge_and_owner(text,uuid,boolean,boolean,text,uuid) from public, anon;
grant execute on function public.admin_set_badge_and_owner(text,uuid,boolean,boolean,text,uuid) to authenticated;
