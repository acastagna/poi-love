-- ============================================================
-- POI•LOVE — Schema Supabase
-- Framework: Cultural Bridge OS — MIT License
-- Author: Alessandro Castagna · 321.al · AltroStile.NET
-- Version: 1.1 — Aprile 2026
-- ============================================================
-- Changelog v1.1:
--   - poi_visibility ENUM 3 stati (private/community/suggested_google)
--     sostituisce is_public (boolean)
--   - card_format ENUM (feed_4_5/stories_9_16/qr_strip)
--   - Tabella card_generations (SHA-256 notarizzazione + consent NFT/book)
--   - RLS pois aggiornata per visibility
--   - RLS media aggiornata per visibility
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE poi_category AS ENUM (
  'cibo', 'lavoro', 'pernottare', 'natura', 'festa',
  'cultura', 'pratico', 'benessere', 'love',
  'audioguida', 'mappa', 'open_source'
);

CREATE TYPE poi_visibility AS ENUM (
  'private',           -- visibile solo all'autore
  'community',         -- visibile a tutti gli utenti POI•LOVE
  'suggested_google'   -- in coda per suggerimento a Google Maps (futuro)
);

CREATE TYPE list_visibility AS ENUM ('private', 'public');

CREATE TYPE media_type AS ENUM ('photo', 'video', 'audio');

CREATE TYPE cultural_route_id AS ENUM (
  'via_egnatia', 'serenissima', 'illyrian', 'greek_colonies'
);

CREATE TYPE card_format AS ENUM (
  'feed_4_5',      -- 1080×1350px — Instagram/Facebook feed (4:5)
  'stories_9_16',  -- 1080×1920px — Stories/Reels/TikTok (9:16)
  'qr_strip'       -- 1080×400px  — Strip orizzontale con QR code
);


-- ============================================================
-- TABELLA: profiles
-- ============================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 30),
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT CHECK (char_length(bio) <= 200),
  language      TEXT DEFAULT 'it' CHECK (language IN ('it', 'sq', 'en')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Alias usato dai trigger di card_generations
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
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
-- ============================================================

CREATE TABLE public.pois (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Posizione
  lat             DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng             DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  address         TEXT,
  place_id        TEXT,
  city            TEXT,
  country         TEXT DEFAULT 'AL',

  -- Contenuto
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description     TEXT CHECK (char_length(description) <= 200),
  category        poi_category NOT NULL,
  tags            TEXT[] DEFAULT '{}',

  -- Rotta culturale
  cultural_route  cultural_route_id,

  -- Reputazione
  love_count      INTEGER DEFAULT 0 CHECK (love_count >= 0),

  -- Visibilità (3 stati — sostituisce is_public boolean)
  visibility      poi_visibility NOT NULL DEFAULT 'community',
  is_featured     BOOLEAN DEFAULT FALSE,

  -- Media
  photos          TEXT[] DEFAULT '{}' CHECK (array_length(photos, 1) <= 3),
  cover_photo     TEXT,

  -- Metadati
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pois_author_idx ON public.pois(author_id);
CREATE INDEX pois_category_idx ON public.pois(category);
CREATE INDEX pois_location_idx ON public.pois(lat, lng);
CREATE INDEX pois_visibility_idx ON public.pois(visibility) WHERE visibility = 'community';
CREATE INDEX pois_cultural_route_idx ON public.pois(cultural_route) WHERE cultural_route IS NOT NULL;

CREATE TRIGGER pois_updated_at
  BEFORE UPDATE ON public.pois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELLA: loves
-- ============================================================

CREATE TABLE public.loves (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  poi_id      UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, poi_id)
);

CREATE INDEX loves_poi_idx ON public.loves(poi_id);
CREATE INDEX loves_user_idx ON public.loves(user_id);

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
-- ============================================================

CREATE TABLE public.lists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description   TEXT CHECK (char_length(description) <= 300),
  visibility    list_visibility DEFAULT 'private',
  share_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
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
-- ============================================================

CREATE TABLE public.poi_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id     UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  poi_id      UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  note        TEXT CHECK (char_length(note) <= 200),
  sort_order  INTEGER DEFAULT 0,
  UNIQUE (list_id, poi_id)
);

CREATE INDEX poi_lists_list_idx ON public.poi_lists(list_id);
CREATE INDEX poi_lists_poi_idx ON public.poi_lists(poi_id);


-- ============================================================
-- TABELLA: categories (lookup)
-- ============================================================

CREATE TABLE public.categories (
  slug        poi_category PRIMARY KEY,
  label_it    TEXT NOT NULL,
  label_sq    TEXT NOT NULL,
  label_en    TEXT NOT NULL,
  icon_name   TEXT NOT NULL,
  color       TEXT NOT NULL
);

INSERT INTO public.categories VALUES
  ('cibo',        'Cibo',       'Ushqim',       'Food',        'ForkKnife',     '#D42B2B'),
  ('lavoro',      'Lavoro',     'Punë',         'Work',        'Briefcase',     '#285EA7'),
  ('pernottare',  'Pernottare', 'Akomodim',     'Stay',        'Bed',           '#7A6B3A'),
  ('natura',      'Natura',     'Natyrë',       'Nature',      'Tree',          '#3A7A5A'),
  ('festa',       'Festa',      'Festë',        'Party',       'Confetti',      '#D42B2B'),
  ('cultura',     'Cultura',    'Kulturë',      'Culture',     'BookOpen',      '#285EA7'),
  ('pratico',     'Pratico',    'Praktik',      'Practical',   'Wrench',        '#7A6B3A'),
  ('benessere',   'Benessere',  'Mirëqenie',    'Wellbeing',   'Heart',         '#D42B2B'),
  ('love',        'Love',       'Dashuri',      'Love',        'HeartStraight', '#D42B2B'),
  ('audioguida',  'Audioguida', 'Audioudhëz',   'Audio Guide', 'Headphones',    '#285EA7'),
  ('mappa',       'Mappa',      'Hartë',        'Map',         'MapTrifold',    '#7A6B3A'),
  ('open_source', 'Open Source','Burim i Hapur', 'Open Source','Code',          '#285EA7');


-- ============================================================
-- TABELLA: cultural_routes (lookup)
-- ============================================================

CREATE TABLE public.cultural_routes (
  id             cultural_route_id PRIMARY KEY,
  name_it        TEXT NOT NULL,
  name_sq        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  origin         TEXT,
  territories    TEXT[],
  period         TEXT,
  color          TEXT,
  description_it TEXT,
  description_sq TEXT,
  description_en TEXT
);

INSERT INTO public.cultural_routes VALUES
  ('via_egnatia',
   'Via Egnatia','Via Egnatia','Via Egnatia',
   'Durazzo → Costantinopoli',
   ARRAY['Albania','Macedonia del Nord','Grecia','Turchia'],
   'Romana — 146 a.C.','#8A7040',
   'La prima grande strada romana che attraversò i Balcani.',
   'Rruga e parë e madhe romake që kaloi nëpër Ballkan.',
   'The first great Roman road crossing the Balkans.'),
  ('serenissima',
   'Rotte della Serenissima','Rrugët e Serenissimes','Serenissima Routes',
   'Venezia → Levante',
   ARRAY['Albania','Croazia','Montenegro','Grecia'],
   'XIV–XVIII sec.','#285EA7',
   'Le rotte commerciali della Repubblica di Venezia lungo la costa adriatica e ionica.',
   'Rrugët tregtare të Republikës së Venecias përgjatë bregdetit adriatik dhe jon.',
   'The commercial routes of the Republic of Venice along the Adriatic and Ionian coasts.'),
  ('illyrian',
   'Rotte Illiriche','Gjurmët Ilire','Illyrian Paths',
   'Adriatico Orientale',
   ARRAY['Albania','Bosnia','Slovenia','Kosovo'],
   'Antichità','#6B4A8A',
   'I percorsi delle tribù illiriche, custodi della costa adriatica orientale.',
   'Shtigjet e fiseve ilire, kujdestarë të bregdetit lindor adriatik.',
   'The paths of Illyrian tribes, guardians of the eastern Adriatic coast.'),
  ('greek_colonies',
   'Colonie Greche','Koloni Greke','Greek Colonies',
   'Magna Grecia → Epiro',
   ARRAY['Albania','Grecia'],
   'VII–IV sec. a.C.','#C49A00',
   'Le fondazioni greche lungo la costa albanese: Apollonia, Butrinto, Amantia.',
   'Themelimet greke përgjatë bregdetit shqiptar: Apolonia, Butrinti, Amantia.',
   'Greek foundations along the Albanian coast: Apollonia, Butrint, Amantia.');


-- ============================================================
-- TABELLA: media
-- ============================================================

CREATE TABLE public.media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poi_id      UUID REFERENCES public.pois(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  path        TEXT NOT NULL,
  type        media_type DEFAULT 'photo',
  size_bytes  INTEGER,
  width       INTEGER,
  height      INTEGER,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX media_poi_idx ON public.media(poi_id);


-- ============================================================
-- TABELLA: card_generations (Sistema Card e Condivisione)
-- ============================================================

CREATE TABLE public.card_generations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id       UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format       card_format NOT NULL DEFAULT 'feed_4_5',
  sha256_hash  TEXT NOT NULL CHECK (sha256_hash ~ '^[a-f0-9]{64}$'),
  media_url    TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  consent_nft  BOOLEAN NOT NULL DEFAULT FALSE,
  consent_book BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_card_hash_user UNIQUE (sha256_hash, user_id)
);

CREATE INDEX idx_card_gen_poi_id  ON public.card_generations (poi_id);
CREATE INDEX idx_card_gen_user_id ON public.card_generations (user_id);
CREATE INDEX idx_card_gen_created ON public.card_generations (created_at DESC);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loves           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poi_lists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_generations ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profili pubblici visibili a tutti"
  ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Utente può modificare solo il proprio profilo"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POIS (visibility 3 stati)
CREATE POLICY "pois_select_visibility"
  ON public.pois FOR SELECT
  USING (visibility IN ('community', 'suggested_google') OR auth.uid() = author_id);
CREATE POLICY "Utente autenticato può inserire POI"
  ON public.pois FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Autore può modificare i propri POI"
  ON public.pois FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Autore può eliminare i propri POI"
  ON public.pois FOR DELETE USING (auth.uid() = author_id);

-- LOVES
CREATE POLICY "Love pubblici visibili a tutti"
  ON public.loves FOR SELECT USING (TRUE);
CREATE POLICY "Utente autenticato può dare LOVE"
  ON public.loves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utente può togliere il proprio LOVE"
  ON public.loves FOR DELETE USING (auth.uid() = user_id);

-- LISTS
CREATE POLICY "Liste pubbliche visibili a tutti"
  ON public.lists FOR SELECT
  USING (visibility = 'public' OR auth.uid() = owner_id);
CREATE POLICY "Utente autenticato può creare liste"
  ON public.lists FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Proprietario può modificare le proprie liste"
  ON public.lists FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Proprietario può eliminare le proprie liste"
  ON public.lists FOR DELETE USING (auth.uid() = owner_id);

-- POI_LISTS
CREATE POLICY "Vedi poi_lists se puoi vedere la lista"
  ON public.poi_lists FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lists l
    WHERE l.id = list_id AND (l.visibility = 'public' OR l.owner_id = auth.uid())
  ));
CREATE POLICY "Proprietario lista può aggiungere POI"
  ON public.poi_lists FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.owner_id = auth.uid()
  ));
CREATE POLICY "Proprietario lista può rimuovere POI"
  ON public.poi_lists FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.owner_id = auth.uid()
  ));

-- MEDIA (aggiornata per visibility)
CREATE POLICY "Media visibili se il POI è community o dell'autore"
  ON public.media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pois p
    WHERE p.id = poi_id
      AND (p.visibility IN ('community', 'suggested_google') OR p.author_id = auth.uid())
  ));
CREATE POLICY "Uploader può inserire media"
  ON public.media FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Uploader può eliminare i propri media"
  ON public.media FOR DELETE USING (auth.uid() = uploader_id);

-- LOOKUP (sola lettura pubblica)
CREATE POLICY "Categorie visibili a tutti"
  ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Rotte culturali visibili a tutti"
  ON public.cultural_routes FOR SELECT USING (TRUE);

-- CARD_GENERATIONS
CREATE POLICY "card_gen_select" ON public.card_generations FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.pois p
    WHERE p.id = poi_id AND p.visibility IN ('community', 'suggested_google')
  )
);
CREATE POLICY "card_gen_insert" ON public.card_generations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "card_gen_update" ON public.card_generations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "card_gen_delete" ON public.card_generations
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.pois;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loves;


-- ============================================================
-- FINE SCHEMA v1.1
-- ============================================================
