-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 042: soft-delete REVERSIBILE dei POI dall'amministrazione (regola di ferro:
-- "niente si cancella, nel dubbio si sposta"). Nessuna modifica alla RLS di pois
-- (tabella critica, 4 policy SELECT permissive): le policy esistenti gia' nascondono
-- ai non-proprietari i POI con is_public=false + is_approved=false + visibility='private'.
-- Il soft-delete salva lo stato precedente per poterlo RIPRISTINARE identico.
-- L'eliminazione definitiva (hard delete) resta possibile ma separata, per lo spam vero.

alter table public.pois add column if not exists removed_at      timestamptz;
alter table public.pois add column if not exists removed_by      uuid;
alter table public.pois add column if not exists removed_reason  text;
alter table public.pois add column if not exists prev_visibility text;
alter table public.pois add column if not exists prev_is_public  boolean;
create index if not exists pois_removed_at_idx on public.pois (removed_at) where removed_at is not null;

-- ── Nascondi un POI (reversibile) ─────────────────────────────────────────────
create or replace function public.admin_soft_delete_poi(p_id uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_vis text;
  v_pub boolean;
begin
  if not public.is_admin(v_uid) then
    raise exception 'not authorized';
  end if;
  select visibility, is_public into v_vis, v_pub from public.pois where id = p_id;
  if not found then return false; end if;
  update public.pois set
    prev_visibility = coalesce(prev_visibility, v_vis),   -- non sovrascrivo se gia' rimosso
    prev_is_public  = coalesce(prev_is_public, v_pub),
    visibility  = 'private',
    is_public   = false,
    is_approved = false,
    removed_at  = now(),
    removed_by  = v_uid,
    removed_reason = nullif(trim(coalesce(p_reason,'')),'')
  where id = p_id;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (v_uid, 'poi_soft_delete', 'poi', p_id::text, jsonb_build_object('reason', p_reason));
  return true;
end $$;
revoke execute on function public.admin_soft_delete_poi(uuid,text) from public, anon, authenticated;
grant execute on function public.admin_soft_delete_poi(uuid,text) to authenticated;

-- ── Ripristina un POI rimosso allo stato esatto di prima ──────────────────────
create or replace function public.admin_restore_poi(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_vis text;
  v_pub boolean;
begin
  if not public.is_admin(v_uid) then
    raise exception 'not authorized';
  end if;
  select prev_visibility, prev_is_public into v_vis, v_pub from public.pois where id = p_id and removed_at is not null;
  if not found then return false; end if;
  update public.pois set
    visibility  = coalesce(v_vis, 'community'),
    is_public   = coalesce(v_pub, true),
    is_approved = true,
    removed_at  = null,
    removed_by  = null,
    removed_reason = null,
    prev_visibility = null,
    prev_is_public  = null
  where id = p_id;
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, meta)
  values (v_uid, 'poi_restore', 'poi', p_id::text, '{}'::jsonb);
  return true;
end $$;
revoke execute on function public.admin_restore_poi(uuid) from public, anon, authenticated;
grant execute on function public.admin_restore_poi(uuid) to authenticated;
