-- POI•LOVE — Migration: card + hash + liberatoria
-- Esegui in: Supabase Dashboard → SQL Editor

-- ─── Colonne card e hash ──────────────────────────
ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS card_url          text,
  ADD COLUMN IF NOT EXISTS card_hash         text,           -- SHA-256 hex corrente
  ADD COLUMN IF NOT EXISTS card_hash_history jsonb DEFAULT '[]'::jsonb, -- storico versioni
  ADD COLUMN IF NOT EXISTS card_hashed_at    timestamptz;

-- ─── Colonne consenso uso creativo ───────────────
ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS license_book         boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_nft          boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_accepted_at  timestamptz;

-- ─── Indici per query libro/NFT ───────────────────
CREATE INDEX IF NOT EXISTS idx_pois_license_book
  ON pois (license_book) WHERE license_book = true;

CREATE INDEX IF NOT EXISTS idx_pois_license_nft
  ON pois (license_nft) WHERE license_nft = true;

CREATE INDEX IF NOT EXISTS idx_pois_card_hash
  ON pois (card_hash) WHERE card_hash IS NOT NULL;

-- ─── Funzione: archivia hash precedente prima di aggiornarlo
-- Viene chiamata ogni volta che card_hash cambia (rigenera card)
CREATE OR REPLACE FUNCTION archive_card_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Se card_hash cambia e ne esisteva uno precedente, archivalo
  IF OLD.card_hash IS NOT NULL AND OLD.card_hash <> NEW.card_hash THEN
    NEW.card_hash_history = COALESCE(OLD.card_hash_history, '[]'::jsonb) || jsonb_build_object(
      'hash',       OLD.card_hash,
      'url',        OLD.card_url,
      'archived_at', NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archive_card_hash
  BEFORE UPDATE OF card_hash ON pois
  FOR EACH ROW
  EXECUTE FUNCTION archive_card_hash();

-- ─── RLS: solo l'owner può aggiornare license e card ──
-- (le policy esistenti su pois già coprono user_id = auth.uid())
-- Aggiungi questa policy se non presente:

-- Verifica che RLS sia attivo sulla tabella pois
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;

-- Policy aggiornamento card e consenso (owner only)
CREATE POLICY IF NOT EXISTS "owner can update card and license"
  ON pois FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── View: opere per libro annuale ───────────────
-- Usata dal backend per generare il libro e la collezione NFT
CREATE OR REPLACE VIEW v_licensed_works AS
SELECT
  p.id,
  p.name,
  p.description,
  p.latitude,
  p.longitude,
  p.tag,
  p.card_url,
  p.card_hash,
  p.card_hashed_at,
  p.love_count,
  p.license_book,
  p.license_nft,
  p.license_accepted_at,
  p.created_at,
  pr.username,
  pr.full_name
FROM pois p
JOIN profiles pr ON pr.id = p.user_id
WHERE
  p.card_hash IS NOT NULL
  AND p.visibility IN ('community', 'suggested_google')
  AND (p.license_book = true OR p.license_nft = true);

COMMENT ON VIEW v_licensed_works IS
  'Opere con hash verificabile e almeno un consenso attivo. Fonte per libro annuale e collezione NFT.';
