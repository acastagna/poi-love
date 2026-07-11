-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 072 — ZONA MEDIA: consenso marketing + template email + campagne/log invii +
--   template OpenGraph + deep link (con tracciamento) + pixel social + impostazioni media.
--   Parte A (già applicata separatamente, fuori transazione, come 'mic' in 048):
--     alter type public.consent_type add value if not exists 'marketing';
--   NIENTE segreti qui: chiavi provider (AcumbaMail) SOLO nei Supabase Edge Secrets. Gli ID pixel
--   NON sono segreti (sono client-side): stanno in social_pixels, letti pubblicamente, iniettati
--   SOLO dopo il consenso marketing dell'utente.

begin;

-- ══════════════════ 1) CONSENSO MARKETING (estende le RPC esistenti) ══════════════════
drop function if exists public.record_consent(text, boolean, boolean, boolean);
create or replace function public.record_consent(
  p_version text, p_geo boolean default false, p_photo boolean default false,
  p_mic boolean default false, p_marketing boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m record;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if coalesce(trim(p_version),'') = '' then raise exception 'version required'; end if;
  select * into m from public._req_meta();
  insert into public.consents(user_id, ctype, accepted, version, ip, user_agent) values
    (uid, 'terms',     true,                        p_version, m.ip, m.ua),
    (uid, 'privacy',   true,                        p_version, m.ip, m.ua),
    (uid, 'age16',     true,                        p_version, m.ip, m.ua),
    (uid, 'geo',       coalesce(p_geo,false),       p_version, m.ip, m.ua),
    (uid, 'photo',     coalesce(p_photo,false),     p_version, m.ip, m.ua),
    (uid, 'mic',       coalesce(p_mic,false),       p_version, m.ip, m.ua),
    (uid, 'marketing', coalesce(p_marketing,false), p_version, m.ip, m.ua);
end $$;
revoke all on function public.record_consent(text, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.record_consent(text, boolean, boolean, boolean, boolean) to authenticated;

drop function if exists public.my_consents();
create or replace function public.my_consents()
returns table(terms_version text, terms_ok boolean, geo_ok boolean, photo_ok boolean, mic_ok boolean, marketing_ok boolean)
language sql stable security definer set search_path = public as $$
  with latest as (
    select distinct on (ctype) ctype, accepted, version
    from public.consents where user_id = auth.uid()
    order by ctype, created_at desc
  )
  select
    (select version from latest where ctype = 'terms' and accepted),
    coalesce((select accepted from latest where ctype = 'terms'),     false),
    coalesce((select accepted from latest where ctype = 'geo'),       false),
    coalesce((select accepted from latest where ctype = 'photo'),     false),
    coalesce((select accepted from latest where ctype = 'mic'),       false),
    coalesce((select accepted from latest where ctype = 'marketing'), false);
$$;
revoke all on function public.my_consents() from public, anon;
grant execute on function public.my_consents() to authenticated;

-- Toggle opzionale ora ammette anche mic e marketing (dalle Impostazioni)
create or replace function public.set_optional_consent(p_type text, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m record; last_ver text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_type not in ('geo','photo','mic','marketing') then raise exception 'only geo/photo/mic/marketing are toggleable'; end if;
  select version into last_ver from public.consents
    where user_id = uid and ctype = 'terms' and accepted order by created_at desc limit 1;
  select * into m from public._req_meta();
  insert into public.consents(user_id, ctype, accepted, version, ip, user_agent)
    values (uid, p_type::public.consent_type, coalesce(p_on,false), coalesce(last_ver,'manual'), m.ip, m.ua);
end $$;
grant execute on function public.set_optional_consent(text, boolean) to authenticated;

-- ══════════════════ 2) TEMPLATE EMAIL + CAMPAGNE + LOG INVII ══════════════════
create table if not exists public.email_templates(
  id uuid primary key default gen_random_uuid(),
  key text not null, kind text not null check (kind in ('send','auto','invite')),
  lang text not null default 'it' check (lang in ('it','sq','en')),
  subject text not null, body_html text not null, body_text text,
  trigger_event text, active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(key, lang));

create table if not exists public.email_campaigns(
  id uuid primary key default gen_random_uuid(),
  name text not null, template_key text, lang text default 'it',
  segment text not null default 'all',
  status text not null default 'draft' check (status in ('draft','sending','sent','cancelled')),
  sent_count int not null default 0, sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now());

create table if not exists public.email_sends(
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  notification_id uuid, to_email text not null, subject text,
  status text not null default 'sent' check (status in ('sent','failed')),
  provider text, error text, created_at timestamptz not null default now());
-- de-dup email automatiche: una sola email per notifica
create unique index if not exists email_sends_notif_uq on public.email_sends(notification_id) where notification_id is not null;

-- ══════════════════ 3) TEMPLATE OPENGRAPH (per entità, lettura pubblica) ══════════════════
create table if not exists public.og_templates(
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('poi','route','trip','profile')),
  lang text not null default 'it' check (lang in ('it','sq','en')),
  title_tpl text not null default '{name} · POI•LOVE',
  desc_tpl text not null default '{desc}',
  image_url text,   -- immagine di riserva se l'entità non ne ha
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique(entity_type, lang));

-- ══════════════════ 4) DEEP LINK (con UTM + tracciamento clic) ══════════════════
create table if not exists public.deep_links(
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  target_url text not null,   -- impostato SOLO dall'admin (fidato): niente open-redirect
  label text, target_type text, target_id text,
  utm_source text, utm_medium text, utm_campaign text,
  clicks int not null default 0, active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now());

create table if not exists public.deep_link_clicks(
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.deep_links(id) on delete cascade,
  ts timestamptz not null default now(), ua text, referer text);
create index if not exists deep_link_clicks_link_idx on public.deep_link_clicks(link_id);

-- ══════════════════ 5) PIXEL SOCIAL (ID non segreti, lettura pubblica) ══════════════════
create table if not exists public.social_pixels(
  network text primary key check (network in ('meta','ga4','google_ads','tiktok','linkedin','pinterest','snap','x')),
  pixel_id text, active boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now());

-- ══════════════════ 6) IMPOSTAZIONI MEDIA (KV non segreto: mittente, provider) ══════════════════
create table if not exists public.media_settings(
  key text primary key, value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now());
insert into public.media_settings(key, value) values
  ('email', jsonb_build_object('from','no-reply@poilove.com','from_name','POI•LOVE','provider','acumbamail','reply_to','info@321.al'))
on conflict (key) do nothing;

-- ══════════════════ RLS ══════════════════
alter table public.email_templates  enable row level security;
alter table public.email_campaigns  enable row level security;
alter table public.email_sends       enable row level security;
alter table public.og_templates      enable row level security;
alter table public.deep_links         enable row level security;
alter table public.deep_link_clicks   enable row level security;
alter table public.social_pixels      enable row level security;
alter table public.media_settings     enable row level security;

-- admin-only: template email, campagne, invii, clic deep-link
do $$ begin
  perform 1;
  execute 'drop policy if exists p_admin_all on public.email_templates';
  execute 'create policy p_admin_all on public.email_templates for all using (public.is_active_admin()) with check (public.is_active_admin())';
  execute 'drop policy if exists p_admin_all on public.email_campaigns';
  execute 'create policy p_admin_all on public.email_campaigns for all using (public.is_active_admin()) with check (public.is_active_admin())';
  execute 'drop policy if exists p_admin_all on public.email_sends';
  execute 'create policy p_admin_all on public.email_sends for all using (public.is_active_admin()) with check (public.is_active_admin())';
  execute 'drop policy if exists p_admin_all on public.deep_link_clicks';
  execute 'create policy p_admin_all on public.deep_link_clicks for all using (public.is_active_admin()) with check (public.is_active_admin())';
end $$;

-- lettura pubblica (render/embed) + scrittura admin: og_templates, deep_links, social_pixels, media_settings
do $$ begin
  execute 'drop policy if exists p_pub_read on public.og_templates';
  execute 'create policy p_pub_read on public.og_templates for select using (active = true)';
  execute 'drop policy if exists p_admin_w on public.og_templates';
  execute 'create policy p_admin_w on public.og_templates for all using (public.is_active_admin()) with check (public.is_active_admin())';

  execute 'drop policy if exists p_pub_read on public.deep_links';
  execute 'create policy p_pub_read on public.deep_links for select using (active = true)';
  execute 'drop policy if exists p_admin_w on public.deep_links';
  execute 'create policy p_admin_w on public.deep_links for all using (public.is_active_admin()) with check (public.is_active_admin())';

  execute 'drop policy if exists p_pub_read on public.social_pixels';
  execute 'create policy p_pub_read on public.social_pixels for select using (active = true)';
  execute 'drop policy if exists p_admin_w on public.social_pixels';
  execute 'create policy p_admin_w on public.social_pixels for all using (public.is_active_admin()) with check (public.is_active_admin())';

  execute 'drop policy if exists p_pub_read on public.media_settings';
  execute 'create policy p_pub_read on public.media_settings for select using (true)';
  execute 'drop policy if exists p_admin_w on public.media_settings';
  execute 'create policy p_admin_w on public.media_settings for all using (public.is_active_admin()) with check (public.is_active_admin())';
end $$;

grant select on public.og_templates, public.deep_links, public.social_pixels, public.media_settings to anon, authenticated;
grant select, insert, update, delete on public.email_templates, public.email_campaigns, public.email_sends, public.deep_link_clicks, public.og_templates, public.deep_links, public.social_pixels, public.media_settings to authenticated;

-- ══════════════════ RPC: risoluzione deep-link (redirect + tracciamento) ══════════════════
-- Il target lo imposta SOLO l'admin (RLS), quindi è fidato: niente open-redirect.
create or replace function public.resolve_deep_link(p_slug text, p_ua text default null, p_ref text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_url text; v_utm text;
begin
  select id, target_url into v_id, v_url from public.deep_links where slug = p_slug and active = true;
  if v_id is null then return null; end if;
  update public.deep_links set clicks = clicks + 1 where id = v_id;
  insert into public.deep_link_clicks(link_id, ua, referer) values (v_id, left(coalesce(p_ua,''),300), left(coalesce(p_ref,''),300));
  return v_url;
end $$;
grant execute on function public.resolve_deep_link(text, text, text) to anon, authenticated;

commit;
