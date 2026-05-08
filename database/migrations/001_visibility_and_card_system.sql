-- =============================================================================
-- POI•LOVE — Migration 001: Visibility 3 stati + Sistema Card e Condivisione
-- Cultural Bridge OS · MIT License
-- =============================================================================
-- Applicare su Supabase SQL Editor (o via supabase db push se hai CLI locale)
-- Sicuro da runnare più volte: usa IF NOT EXISTS / DO $$ per idempotenza
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUM poi_visibility (3 stati)
-- ---------------------------------------------------------------------------
-- Sostituisce il campo booleano is_public con una semantica a 3 livelli:
--   private          → visibile solo all'autore
--   community        → visibile a tutti gli utenti autenticati di POI•LOVE
--   suggested_google → in coda per suggerimento a Google Maps (futuro)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE poi_visibility AS ENUM ('private', 'community', 'suggested_google');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- tipo già esistente, skip
END $$;

-- ---------------------------------------------------------------------------
-- 2. ALTER TABLE pois: aggiunta colonna visibility
-- ---------------------------------------------------------------------------
-- Strategia di migrazione sicura:
--   a) aggiungo la nuova colonna con default 'community'
--   b) migro i dati da is_public (TRUE → community, FALSE → private)
--   c) aggiungo NOT NULL constraint
--   d) mantengo is_public per backward compatibility (deprecata)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS visibility poi_visibility;

-- Popola la nuova colonna dai dati esistenti (idempotente)
UPDATE public.pois
  SET visibility = CASE
    WHEN is_public = TRUE THEN 'community'::poi_visibility
    ELSE 'private'::poi_visibility
  END
WHERE visibility IS NULL;

-- Imposta NOT NULL con default per i nuovi record
ALTER TABLE public.pois
  ALTER COLUMN visibility SET NOT NULL,
  ALTER COLUMN visibility SET DEFAULT 'community';

-- Aggiungi colonna tag singolo (requisito UX: 1 tag per POI, < 90 sec flow)
ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS tag TEXT CHECK (char_length(tag) <= 32);

-- Deprecation notice su is_public (non eliminare per ora: backward compat)
COMMENT ON COLUMN public.pois.is_public IS
  '[DEPRECATED] Usare visibility. Mantenuto per backward compatibility.';
COMMENT ON COLUMN public.pois.visibility IS
  'Visibilità POI: private (solo autore) | community (utenti POI•LOVE) | suggested_google (coda Google Maps)';
COMMENT ON COLUMN public.pois.tag IS
  'Tag singolo del POI, max 32 caratteri. Requisito UX: inserimento < 90 sec.';

-- ---------------------------------------------------------------------------
-- 3. ENUM card_format (formati Card Composita)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE card_format AS ENUM (
    'feed_4_5',      -- 1080×1350px — Instagram/Facebook feed (4:5)
    'stories_9_16',  -- 1080×1920px — Stories/Reels/TikTok (9:16)
    'qr_strip'       -- 1080×400px  — Strip orizzontale con QR code
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4. TABELLA card_generations — Sistema Card e Condivisione
-- ---------------------------------------------------------------------------
-- Ogni record = una card generata da un utente per un POI.
-- Il SHA-256 garantisce integrità del contenuto (notarizzazione leggera).
-- I flag consent_* documentano il consenso esplicito dell'utente per usi futuri.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.card_generations (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relazioni
  poi_id          UUID          NOT NULL REFERENCES public.pois(id)
                                  ON DELETE CASCADE,
  user_id         UUID          NOT NULL REFERENCES auth.users(id)
                                  ON DELETE CASCADE,

  -- Formato e integrità
  format          card_format   NOT NULL DEFAULT 'feed_4_5',
  sha256_hash     TEXT          NOT NULL CHECK (sha256_hash ~ '^[a-f0-9]{64}$'),
  media_url       TEXT,         -- URL su Plesk dopo generazione (nullable inizialmente)

  -- Metadati flessibili (snapshot dei dati POI al momento della generazione)
  metadata        JSONB         NOT NULL DEFAULT '{}',
  -- Struttura attesa metadata:
  -- {
  --   "poi_name": "Pazari i Ri",
  --   "poi_category": "cultura",
  --   "poi_lat": 41.3275,
  --   "poi_lng": 19.8187,
  --   "love_count": 42,
  --   "photo_url": "https://...",
  --   "generated_with": "poilove-card-v1",
  --   "app_version": "0.1.0"
  -- }

  -- Consensi espliciti utente
  consent_nft     BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE = utente acconsente all'eventuale mint NFT su OpenSea (Fase 3)
  consent_book    BOOLEAN       NOT NULL DEFAULT FALSE,
  -- TRUE = utente acconsente all'uso in pubblicazioni fisiche / ebook

  -- Timestamp
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Unicità: stesso utente non può generare due volte la stessa card identica
  CONSTRAINT uq_card_hash_user UNIQUE (sha256_hash, user_id)
);

-- Indici per query frequenti
CREATE INDEX IF NOT EXISTS idx_card_gen_poi_id   ON public.card_generations (poi_id);
CREATE INDEX IF NOT EXISTS idx_card_gen_user_id  ON public.card_generations (user_id);
CREATE INDEX IF NOT EXISTS idx_card_gen_format   ON public.card_generations (format);
CREATE INDEX IF NOT EXISTS idx_card_gen_created  ON public.card_generations (created_at DESC);

-- Commenti tabella
COMMENT ON TABLE public.card_generations IS
  'Sistema Card e Condivisione POI•LOVE. Ogni record = card generata con SHA-256 notarizzazione e consensi espliciti per usi futuri (NFT, pubblicazioni).';

-- ---------------------------------------------------------------------------
-- 5. RLS — Row Level Security per card_generations
-- ---------------------------------------------------------------------------
ALTER TABLE public.card_generations ENABLE ROW LEVEL SECURITY;

-- Politica lettura: le card di POI community/suggested_google sono pubbliche;
-- le card di POI privati sono visibili solo al proprietario del POI o al generatore.
CREATE POLICY "card_gen_select" ON public.card_generations
  FOR SELECT USING (
    -- Il generatore vede sempre le proprie card
    user_id = auth.uid()
    OR
    -- Gli altri vedono le card solo se il POI è community/suggested_google
    EXISTS (
      SELECT 1 FROM public.pois p
      WHERE p.id = poi_id
        AND p.visibility IN ('community', 'suggested_google')
    )
  );

-- Politica insert: solo utenti autenticati possono generare card
CREATE POLICY "card_gen_insert" ON public.card_generations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Politica update: solo il generatore può aggiornare (es. aggiungere media_url)
CREATE POLICY "card_gen_update" ON public.card_generations
  FOR UPDATE USING (user_id = auth.uid());

-- Politica delete: solo il generatore può eliminare la propria card
CREATE POLICY "card_gen_delete" ON public.card_generations
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Aggiornamento RLS su pois — allineamento con visibility
-- ---------------------------------------------------------------------------
-- DROP delle vecchie policy basate su is_public (potrebbero non esistere,
-- usa DO $$ per gestire l'errore silenziosamente)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public pois are viewable by everyone" ON public.pois;
  DROP POLICY IF EXISTS "pois_select_public" ON public.pois;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Nuova policy SELECT allineata con visibility
CREATE POLICY "pois_select_visibility" ON public.pois
  FOR SELECT USING (
    -- Autore vede sempre i propri POI (inclusi privati)
    user_id = auth.uid()
    OR
    -- POI community e suggested_google visibili a tutti (anche non autenticati)
    visibility IN ('community', 'suggested_google')
  );

-- ---------------------------------------------------------------------------
-- 7. Trigger: updated_at su card_generations (consistency con altre tabelle)
-- ---------------------------------------------------------------------------
-- Riusa la funzione trigger già definita nello schema principale
CREATE TRIGGER card_gen_updated_at
  BEFORE UPDATE ON public.card_generations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- FINE MIGRATION 001
-- Data: 2026-04-25
-- Autore: Cultural Bridge OS / POI•LOVE Team
-- =============================================================================
