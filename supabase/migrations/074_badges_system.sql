-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- BADGE personalizzabili come le Categorie: ogni badge ha nome, ICONA (Phosphor), COLORE di sfondo,
-- COLORE di icona+testo, LIVELLO utente associato (tier), attivo, ordine. Gestiti in una sezione admin
-- dedicata; poi in ogni pannello (POI, rotte, itinerari, compagnie) si sceglie QUALI applicare.

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  key text unique,                              -- chiave stabile per i badge di sistema (ufficiale/indispensabile)
  name text not null,
  icon text not null default 'seal-check',      -- nome icona Phosphor (senza prefisso ph-)
  color text not null default '#B4823C',        -- colore di sfondo del badge
  text_color text not null default '#FFFFFF',   -- colore di icona + testo
  tier text,                                    -- livello utente associato (professionista, mecenate…) o null
  active boolean not null default true,
  sort integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Badge di sistema di partenza (colori coerenti con quelli già usati nell'app)
insert into public.badges(key,name,icon,color,text_color,tier,sort) values
  ('ufficiale','Ufficiale','seal-check','#B4823C','#FFFFFF',null,10),
  ('indispensabile','Indispensabile','star','#7C3AED','#FFFFFF',null,20)
on conflict (key) do nothing;

-- Quali badge sono applicati a ciascun contenuto (array di id badge)
alter table public.pois       add column if not exists badge_ids uuid[] not null default '{}';
alter table public.trips      add column if not exists badge_ids uuid[] not null default '{}';
alter table public.companions add column if not exists badge_ids uuid[] not null default '{}';

-- RLS: lettura pubblica dei badge attivi (servono all'app e al picker), scrittura solo admin
alter table public.badges enable row level security;
drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges for select
  using (active = true or public.is_active_admin());
drop policy if exists badges_admin_write on public.badges;
create policy badges_admin_write on public.badges for all
  using (public.is_active_admin()) with check (public.is_active_admin());

-- ── Crea/aggiorna un badge (admin) ───────────────────────────────────────────
create or replace function public.admin_upsert_badge(
  p_id uuid, p_name text, p_icon text, p_color text, p_text_color text,
  p_tier text default null, p_active boolean default true, p_sort integer default 100, p_key text default null
) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_tier text := nullif(btrim(coalesce(p_tier,'')),'');
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  if p_name is null or btrim(p_name)='' then raise exception 'name required'; end if;
  if v_tier is not null and v_tier not in ('professionista','professionista_plus','sostenitore','mecenate','influencer') then v_tier := null; end if;
  if p_id is null then
    insert into public.badges(key,name,icon,color,text_color,tier,active,sort)
      values (nullif(btrim(coalesce(p_key,'')),''), btrim(p_name), coalesce(nullif(btrim(p_icon),''),'seal-check'),
              coalesce(nullif(btrim(p_color),''),'#B4823C'), coalesce(nullif(btrim(p_text_color),''),'#FFFFFF'),
              v_tier, coalesce(p_active,true), coalesce(p_sort,100))
      returning id into v_id;
  else
    update public.badges set name=btrim(p_name), icon=coalesce(nullif(btrim(p_icon),''),'seal-check'),
      color=coalesce(nullif(btrim(p_color),''),'#B4823C'), text_color=coalesce(nullif(btrim(p_text_color),''),'#FFFFFF'),
      tier=v_tier, active=coalesce(p_active,true), sort=coalesce(p_sort,100), updated_at=now()
      where id=p_id returning id into v_id;
    if v_id is null then raise exception 'badge not found'; end if;
  end if;
  begin insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
    values (auth.uid(),'upsert_badge','badge',v_id::text,jsonb_build_object('name',p_name,'tier',v_tier)); exception when others then null; end;
  return v_id;
end $$;

-- ── Elimina un badge (admin) e lo toglie da tutti i contenuti ─────────────────
create or replace function public.admin_delete_badge(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  update public.pois       set badge_ids = array_remove(badge_ids, p_id) where p_id = any(badge_ids);
  update public.trips      set badge_ids = array_remove(badge_ids, p_id) where p_id = any(badge_ids);
  update public.companions set badge_ids = array_remove(badge_ids, p_id) where p_id = any(badge_ids);
  delete from public.badges where id = p_id;
  begin insert into public.admin_audit_log(admin_id,action,target_type,target_id) values (auth.uid(),'delete_badge','badge',p_id::text); exception when others then null; end;
end $$;

-- ── Applica badge + livello + assegnatario a un contenuto ─────────────────────
-- Sostituisce l'uso di admin_set_badge_and_owner con gli array di badge. Mantiene in sync
-- badge_official/badge_essential (li legge ancora l'app/SEO) dai badge di sistema applicati.
create or replace function public.admin_set_entity_badges(
  p_entity text, p_id uuid, p_badge_ids uuid[] default '{}', p_tier text default null, p_assigned uuid default null
) returns void language plpgsql security definer set search_path to 'public' as $$
declare v_ids uuid[] := coalesce(p_badge_ids,'{}'); v_uff uuid; v_ess uuid; v_off boolean; v_essf boolean;
  v_tier text := nullif(btrim(coalesce(p_tier,'')),''); v_n int;
begin
  if not public.is_active_admin() then raise exception 'not authorized'; end if;
  if v_tier is not null and v_tier not in ('professionista','professionista_plus','sostenitore','mecenate','influencer') then v_tier := null; end if;
  if p_assigned is not null and not exists(select 1 from public.profiles where id=p_assigned) then raise exception 'assigned user not found'; end if;
  select id into v_uff from public.badges where key='ufficiale';
  select id into v_ess from public.badges where key='indispensabile';
  v_off := (v_uff is not null and v_uff = any(v_ids));
  v_essf := (v_ess is not null and v_ess = any(v_ids));
  if p_entity = 'poi' then
    update public.pois set badge_ids=v_ids, badge_official=v_off, badge_essential=v_essf, badge_tier=v_tier, assigned_user_id=p_assigned where id=p_id; get diagnostics v_n=row_count;
  elsif p_entity in ('route','trip','itinerary') then
    update public.trips set badge_ids=v_ids, badge_official=v_off, badge_essential=v_essf, badge_tier=v_tier, assigned_user_id=p_assigned where id=p_id; get diagnostics v_n=row_count;
  elsif p_entity = 'companion' then
    update public.companions set badge_ids=v_ids, badge_official=v_off, badge_essential=v_essf, badge_tier=v_tier, assigned_user_id=p_assigned where id=p_id; get diagnostics v_n=row_count;
  else raise exception 'invalid entity: %', p_entity; end if;
  if v_n = 0 then raise exception 'entity not found'; end if;
  begin insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
    values (auth.uid(),'set_entity_badges',p_entity,p_id::text,jsonb_build_object('badges',v_ids,'tier',v_tier,'assigned',p_assigned)); exception when others then null; end;
end $$;

revoke all on function public.admin_upsert_badge(uuid,text,text,text,text,text,boolean,integer,text) from public, anon;
revoke all on function public.admin_delete_badge(uuid) from public, anon;
revoke all on function public.admin_set_entity_badges(text,uuid,uuid[],text,uuid) from public, anon;
grant execute on function public.admin_upsert_badge(uuid,text,text,text,text,text,boolean,integer,text) to authenticated;
grant execute on function public.admin_delete_badge(uuid) to authenticated;
grant execute on function public.admin_set_entity_badges(text,uuid,uuid[],text,uuid) to authenticated;
