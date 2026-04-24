-- ============================================================
-- POI•LOVE — Schema Supabase
-- Framework: Cultural Bridge OS — MIT License
-- Author: Alessandro Castagna · 321.al · AltroStile.NET
-- Version: 1.0 — Aprile 2026
-- ============================================================
-- Esecuzione: incolla nell'editor SQL di Supabase (in ordine)
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- per geolocalizzazione avanzata (opzionale)


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE poi_category AS ENUM (
  'cibo',
  'lavoro',
  'pernottare',
  'natura',
  'festa',
  'cultura',
  'pratico',
  'benessere',
  'love',
  'audioguida',
  'mappa',
  'open_source'
);

CREATE TYPE list_visibility AS ENUM ('private', 'public');

CREATE TYPE media_type AS ENUM ('photo', 'video', 'audio');

CREATE TYPE cultural_route_id AS ENUM (
  'via_egnatia',
  'serenissima',
  'illyrian',
  'greek_colonies'
);


-- ============================================================
-- TABELLA: profiles
-- Estende auth.users di Supabase con i dati pubblici utente
-- ============================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 30),
  display_name  TEXT,
  avatar_url    TEXT,                          -- URL su server Plesk
  bio           TEXT CHECK (char_length(bio) <= 200),
  language      TEXT DEFAULT 'it' CHECK (language IN ('it', 'sq', 'en')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: aggiorna updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: crea profilo automaticamente al signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    -- Username provvisorio dal email (senza dominio), univoco
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 4),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- TABELLA: pois
-- Il cuore del sistema — i luoghi amati
-- ============================================================

CREATE TABLE public.pois (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Posizione
  lat             DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng             DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  address         TEXT,                          -- indirizzo human-readable (da Geocoding API)
  place_id        TEXT,                          -- Google Places ID (opzionale, per match preciso)
  city            TEXT,
  country         TEXT DEFAULT 'AL',             -- ISO 3166-1 alpha-2

  -- Contenuto
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description     TEXT CHECK (char_length(description) <= 200),
  category        poi_category NOT NULL,
  tags            TEXT[] DEFAULT '{}',           -- tag liberi aggiuntivi

  -- Rotta culturale di appartenenza (opzionale)
  cultural_route  cultural_route_id,

  -- Reputazione
  love_count      INTEGER DEFAULT 0 CHECK (love_count >= 0),

  -- Visibilità
  is_public       BOOLEAN DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,         -- POI in evidenza (moderatori)

  -- Media — gli URL puntano al server Plesk
  photos          TEXT[] DEFAULT '{}' CHECK (array_length(photos, 1) <= 3),
  cover_photo     TEXT,                          -- prima foto (url), usata come thumbnail

  -- Metadati
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pois_author_idx ON public.pois(author_id);
CREATE INDEX pois_category_idx ON public.pois(category);
CREATE INDEX pois_location_idx ON public.pois(lat, lng);
CREATE INDEX pois_public_idx ON public.pois(is_public) WHERE is_public = TRUE;
CREATE INDEX pois_cultural_route_idx ON public.pois(cultural_route) WHERE cultural_route IS NOT NULL;

CREATE TRIGGER pois_updated_at
  BEFORE UPDATE ON public.pois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELLA: loves
-- Sistema di reputazione — un LOVE per utente per POI
-- ============================================================

CREATE TABLE public.loves (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  poi_id      UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  -- Vincolo: un utente può dare LOVE a un POI una sola volta
  UNIQUE (user_id, poi_id)
);

CREATE INDEX loves_poi_idx ON public.loves(poi_id);
CREATE INDEX loves_user_idx ON public.loves(user_id);

-- Trigger: aggiorna love_count su pois in tempo reale
CREATE OR REPLACE FUNCTION sync_love_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pois SET love_count = love_count + 1 WHERE id = NEW.poi_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pois SET love_count = GREATEST(love_count - 1, 0) WHERE id = OLD.poi_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loves_sync_count
  AFTER INSERT OR DELETE ON public.loves
  FOR EACH ROW EXECUTE FUNCTION sync_love_count();


-- ============================================================
-- TABELLA: lists
-- Liste personali di POI (private o pubbliche)
-- ============================================================

CREATE TABLE public.lists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description   TEXT CHECK (char_length(description) <= 300),
  visibility    list_visibility DEFAULT 'private',
  share_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),  -- link condivisione
  cover_poi_id  UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lists_owner_idx ON public.lists(owner_id);
CREATE INDEX lists_public_idx ON public.lists(visibility) WHERE visibility = 'public';

CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELLA: poi_lists
-- Relazione many-to-many tra POI e liste
-- ============================================================

CREATE TABLE public.poi_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id     UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  poi_id      UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  note        TEXT CHECK (char_length(note) <= 200),   -- nota personale sul POI nella lista
  sort_order  INTEGER DEFAULT 0,

  UNIQUE (list_id, poi_id)
);

CREATE INDEX poi_lists_list_idx ON public.poi_lists(list_id);
CREATE INDEX poi_lists_poi_idx ON public.poi_lists(poi_id);


-- ============================================================
-- TABELLA: categories (lookup statico)
-- ============================================================

CREATE TABLE public.categories (
  slug        poi_category PRIMARY KEY,
  label_it    TEXT NOT NULL,
  label_sq    TEXT NOT NULL,
  label_en    TEXT NOT NULL,
  icon_name   TEXT NOT NULL,    -- nome icona Phosphor v2.1.1
  color       TEXT NOT NULL     -- hex color
);

-- Seed dati categorie
INSERT INTO public.categories (slug, label_it, label_sq, label_en, icon_name, color) VALUES
  ('cibo',        'Cibo',         'Ushqim',     'Food',          'ForkKnife',       '#D42B2B'),
  ('lavoro',      'Lavoro',       'Punë',       'Work',          'Briefcase',       '#285EA7'),
  ('pernottare',  'Pernottare',   'Akomodim',   'Stay',          'Bed',             '#7A6B3A'),
  ('natura',      'Natura',       'Natyrë',     'Nature',        'Tree',            '#3A7A5A'),
  ('festa',       'Festa',        'Festë',      'Party',         'Confetti',        '#D42B2B'),
  ('cultura',     'Cultura',      'Kulturë',    'Culture',       'BookOpen',        '#285EA7'),
  ('pratico',     'Pratico',      'Praktik',    'Practical',     'Wrench',          '#7A6B3A'),
  ('benessere',   'Benessere',    'Mirëqenie',  'Wellbeing',     'Heart',           '#D42B2B'),
  ('love',        'Love',         'Dashuri',    'Love',          'HeartStraight',   '#D42B2B'),
  ('audioguida',  'Audioguida',   'Audioudhëz', 'Audio Guide',   'Headphones',      '#285EA7'),
  ('mappa',       'Mappa',        'Hartë',      'Map',           'MapTrifold',      '#7A6B3A'),
  ('open_source', 'Open Source',  'Burim i Hapur','Open Source', 'Code',            '#285EA7');


-- ============================================================
-- TABELLA: cultural_routes (lookup statico)
-- ============================================================

CREATE TABLE public.cultural_routes (
  id          cultural_route_id PRIMARY KEY,
  name_it     TEXT NOT NULL,
  name_sq     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  origin      TEXT,
  territories TEXT[],
  period      TEXT,
  color       TEXT,
  description_it TEXT,
  description_sq TEXT,
  description_en TEXT
);

INSERT INTO public.cultural_routes VALUES
  ('via_egnatia',
   'Via Egnatia', 'Via Egnatia', 'Via Egnatia',
   'Durazzo (Dyrrachium) → Costantinopoli',
   ARRAY['Albania','Macedonia del Nord','Grecia','Turchia'],
   'Romana — 146 a.C.', '#8A7040',
   'La prima grande strada romana che attraversò i Balcani, da Durazzo a Costantinopoli.',
   'Rruga e parë e madhe romake që kaloi nëpër Ballkan, nga Durrësi deri në Konstantinopojë.',
   'The first great Roman road crossing the Balkans, from Durrës to Constantinople.'),
  ('serenissima',
   'Rotte della Serenissima', 'Rrugët e Serenissimes', 'Serenissima Routes',
   'Venezia → Levante',
   ARRAY['Albania','Croazia','Montenegro','Grecia'],
   'XIV–XVIII sec.', '#285EA7',
   'Le rotte commerciali della Repubblica di Venezia lungo la costa adriatica e ionica.',
   'Rrugët tregtare të Republikës së Venecias përgjatë bregdetit adriatik dhe jon.',
   'The commercial routes of the Republic of Venice along the Adriatic and Ionian coasts.'),
  ('illyrian',
   'Rotte Illiriche', 'Gjurmët Ilire', 'Illyrian Paths',
   'Adriatico Orientale',
   ARRAY['Albania','Bosnia','Slovenia','Kosovo'],
   'Antichità', '#6B4A8A',
   'I percorsi delle tribù illiriche, custodi della costa adriatica orientale prima di Roma.',
   'Shtigjet e fiseve ilire, kujdestarë të bregdetit lindor adriatik para Romës.',
   'The paths of Illyrian tribes, guardians of the eastern Adriatic coast before Rome.'),
  ('greek_colonies',
   'Colonie Greche', 'Koloni Greke', 'Greek Colonies',
   'Magna Grecia → Epiro',
   ARRAY['Albania','Grecia'],
   'VII–IV sec. a.C.', '#C49A00',
   'Le fondazioni greche lungo la costa albanese: Apollonia, Butrinto, Amantia.',
   'Themelimet greke përgjatë bregdetit shqiptar: Apolonia, Butrinti, Amantia.',
   'Greek foundations along the Albanian coast: Apollonia, Butrint, Amantia.');


-- ============================================================
-- TABELLA: media (riferimento agli upload su Plesk)
-- ============================================================

CREATE TABLE public.media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poi_id      UUID REFERENCES public.pois(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,               -- URL completo sul server Plesk
  path        TEXT NOT NULL,               -- path relativo sul server (es: /poi/uuid/foto1.webp)
  type        media_type DEFAULT 'photo',
  size_bytes  INTEGER,
  width       INTEGER,
  height      INTEGER,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX media_poi_idx ON public.media(poi_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loves       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poi_lists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_routes ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "Profili pubblici visibili a tutti"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Utente può modificare solo il proprio profilo"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ---- POIS ----
CREATE POLICY "POI pubblici visibili a tutti"
  ON public.pois FOR SELECT USING (is_public = TRUE OR auth.uid() = author_id);

CREATE POLICY "Utente autenticato può inserire POI"
  ON public.pois FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autore può modificare i propri POI"
  ON public.pois FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Autore può eliminare i propri POI"
  ON public.pois FOR DELETE USING (auth.uid() = author_id);

-- ---- LOVES ----
CREATE POLICY "Love pubblici visibili a tutti"
  ON public.loves FOR SELECT USING (TRUE);

CREATE POLICY "Utente autenticato può dare LOVE"
  ON public.loves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utente può togliere il proprio LOVE"
  ON public.loves FOR DELETE USING (auth.uid() = user_id);

-- ---- LISTS ----
CREATE POLICY "Liste pubbliche visibili a tutti, private solo al proprietario"
  ON public.lists FOR SELECT
  USING (visibility = 'public' OR auth.uid() = owner_id);

CREATE POLICY "Utente autenticato può creare liste"
  ON public.lists FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Proprietario può modificare le proprie liste"
  ON public.lists FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Proprietario può eliminare le proprie liste"
  ON public.lists FOR DELETE USING (auth.uid() = owner_id);

-- ---- POI_LISTS ----
CREATE POLICY "Vedi poi_lists se puoi vedere la lista"
  ON public.poi_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_id
      AND (l.visibility = 'public' OR l.owner_id = auth.uid())
    )
  );

CREATE POLICY "Proprietario lista può aggiungere POI"
  ON public.poi_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Proprietario lista può rimuovere POI"
  ON public.poi_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_id AND l.owner_id = auth.uid()
    )
  );

-- ---- MEDIA ----
CREATE POLICY "Media pubblici visibili se il POI è pubblico"
  ON public.media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pois p
      WHERE p.id = poi_id AND (p.is_public = TRUE OR p.author_id = auth.uid())
    )
  );

CREATE POLICY "Uploader può inserire media"
  ON public.media FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Uploader può eliminare i propri media"
  ON public.media FOR DELETE USING (auth.uid() = uploader_id);

-- ---- LOOKUP (categories, cultural_routes) — sola lettura pubblica ----
CREATE POLICY "Categorie visibili a tutti"
  ON public.categories FOR SELECT USING (TRUE);

CREATE POLICY "Rotte culturali visibili a tutti"
  ON public.cultural_routes FOR SELECT USING (TRUE);


-- ============================================================
-- REALTIME
-- Abilita canali Supabase Realtime per aggiornamenti live
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.pois;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loves;


-- ============================================================
-- SEED: POI iniziali Tirana (da completare prima del lancio)
-- Inserisci dopo aver creato il profilo admin
-- ============================================================

-- Esempio di come inserire i POI seed manualmente:
-- INSERT INTO public.pois (author_id, lat, lng, title, description, category, is_public, is_featured)
-- VALUES (
--   '<UUID-PROFILO-ADMIN>',
--   41.3275, 19.8187,
--   'Pazari i Ri',
--   'Il mercato storico di Tirana, cuore pulsante della città vecchia.',
--   'cultura',
--   TRUE, TRUE
-- );

-- ============================================================
-- FINE SCHEMA
-- ============================================================
