-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 026: Tassonomia POI a 3 livelli ORTOGONALI.
--  L1 CATEGORIA (oggettiva, pubblica): set ricco curato, DATA-DRIVEN in tabella
--     (non array hardcoded). Ogni sottocategoria appartiene a un "macro" = valore
--     dell'enum poi_category gia esistente (pois.category resta stabile).
--  L2 LUOGO PERSONALE (privato): segnalibro locale, resta client-side.
--  L3 TAG (libero, community): colonna pois.tags[] gia esiste, qui la si abilita
--     e si aggiunge un tracciamento delle richieste per l'autoaggiornamento
--     data-driven (per analisi della richiesta, con curation admin, mai cieco).

-- ── Sottocategorie curate (L1 ricco) ──────────────────────────────────────────
create table if not exists public.poi_categories (
  key       text primary key,                         -- es. 'ristorante'
  macro     public.poi_category not null,             -- bucket enum per pois.category
  label_it  text not null,
  label_sq  text not null,
  label_en  text not null,
  icon      text not null default 'map-pin',          -- suffisso Phosphor (ph-<icon>)
  color     text not null default '#D42B2B',
  sort      int  not null default 0,
  active    boolean not null default true,            -- visibile nel picker
  official  boolean not null default true,            -- curata vs proposta community
  created_at timestamptz not null default now()
);

-- soft ref: la sottocategoria scelta (per scoperta fine); il macro resta in category
alter table public.pois add column if not exists subcategory text;

-- ── Tracciamento richieste (spina dorsale autoaggiornamento data-driven) ───────
-- ogni ricerca/creazione che non trova una categoria adatta lascia una traccia:
-- l'admin la analizza e decide se promuoverla a categoria (curation, non automatico).
create table if not exists public.category_requests (
  id         uuid primary key default gen_random_uuid(),
  term       text not null,
  lang       text,
  source     text,                                    -- 'search' | 'create' | 'illi'
  user_id    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists category_requests_term_idx on public.category_requests (lower(term));

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.poi_categories enable row level security;
alter table public.category_requests enable row level security;

drop policy if exists poi_categories_read on public.poi_categories;
create policy poi_categories_read on public.poi_categories
  for select using (active = true or public.is_admin((select auth.uid())));

drop policy if exists poi_categories_admin_write on public.poi_categories;
create policy poi_categories_admin_write on public.poi_categories
  for all using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- chiunque loggato puo LASCIARE una richiesta (solo per se stesso), nessuno la rilegge
drop policy if exists category_requests_insert on public.category_requests;
create policy category_requests_insert on public.category_requests
  for insert with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists category_requests_admin_read on public.category_requests;
create policy category_requests_admin_read on public.category_requests
  for select using (public.is_admin((select auth.uid())));

-- ── Seed: set ricco curato approvato dal founder (25/06) ───────────────────────
insert into public.poi_categories (key,macro,label_it,label_sq,label_en,icon,color,sort) values
  -- Mangiare / Bere  (macro: cibo)
  ('ristorante','cibo','Ristorante','Restorant','Restaurant','fork-knife','#D9480F',10),
  ('pizzeria','cibo','Pizzeria','Piceri','Pizzeria','pizza','#E8590C',11),
  ('bar_caffe','cibo','Bar / Caffè','Bar / Kafe','Bar / Café','coffee','#B45309',12),
  ('street_food','cibo','Street food','Street food','Street food','hamburger','#D9730D',13),
  ('pasticceria','cibo','Pasticceria','Pastiçeri','Pastry shop','cake','#C2410C',14),
  ('enoteca','cibo','Cantina / Enoteca','Kantinë / Enotekë','Winery / Wine bar','wine','#9A3412',15),
  -- Dormire  (macro: pernottare)
  ('hotel','pernottare','Hotel','Hotel','Hotel','buildings','#1D4ED8',20),
  ('bnb','pernottare','B&B','B&B','B&B','house-line','#2563EB',21),
  ('agriturismo','pernottare','Agriturismo','Agroturizëm','Farm stay','barn','#3B82F6',22),
  ('casa_vacanze','pernottare','Casa vacanze','Shtëpi pushimi','Holiday home','house','#60A5FA',23),
  -- Cultura  (macro: cultura)
  ('museo','cultura','Museo','Muze','Museum','bank','#7C3AED',30),
  ('monumento','cultura','Monumento','Monument','Monument','castle-turret','#8B5CF6',31),
  ('spirituale','cultura','Chiesa / Spirituale','Kishë / Shpirtërore','Church / Spiritual','church','#A78BFA',32),
  ('teatro_cinema','cultura','Teatro / Cinema','Teatër / Kinema','Theatre / Cinema','film-slate','#9333EA',33),
  ('arte','cultura','Arte','Art','Art','palette','#7E22CE',34),
  -- Natura / Sport  (macro: natura)
  ('parco','natura','Parco','Park','Park','tree','#15803D',40),
  ('spiaggia','natura','Spiaggia','Plazh','Beach','umbrella','#0891B2',41),
  ('montagna','natura','Montagna / Sentiero','Mal / Shteg','Mountain / Trail','mountains','#166534',42),
  ('acqua','natura','Acqua','Ujë','Water','waves','#0E7490',43),
  ('sport','natura','Sport / Palestra','Sport / Palestër','Sport / Gym','barbell','#16A34A',44),
  -- Servizi / Pro  (macro: pratico)
  ('negozio','pratico','Negozio','Dyqan','Shop','storefront','#0F766E',50),
  ('artigianato','pratico','Artigianato','Zejtari','Craft','hammer','#0D9488',51),
  ('salute','pratico','Salute','Shëndet','Health','first-aid','#DC2626',52),
  ('benessere_spa','benessere','Benessere / Spa','Mirëqenie / Spa','Wellness / Spa','flower-lotus','#DB2777',53),
  ('coworking','lavoro','Ufficio / Coworking','Zyrë / Coworking','Office / Coworking','briefcase','#475569',54),
  ('pratico','pratico','Pratico','Praktike','Practical','wrench','#64748B',55),
  -- Vita / Esperienze  (macro: festa)
  ('locale_notte','festa','Locale / Notte','Lokal / Natë','Nightlife','martini','#BE185D',60),
  ('evento','festa','Evento / Festa','Event / Festë','Event / Party','confetti','#DB2777',61),
  ('audioguida','audioguida','Audioguida / Tour','Audioguidë / Tur','Audio guide / Tour','headphones','#0891B2',62)
on conflict (key) do update set
  macro=excluded.macro, label_it=excluded.label_it, label_sq=excluded.label_sq,
  label_en=excluded.label_en, icon=excluded.icon, color=excluded.color,
  sort=excluded.sort, active=true;
