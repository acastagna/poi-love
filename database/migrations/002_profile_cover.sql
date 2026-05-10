-- ============================================================
-- POI•LOVE — Migration 002: Profile cover (sfondo profilo)
-- Aggiunge le colonne `cover_url` e `cover_type` alla tabella `profiles`
-- per salvare lo sfondo personalizzato (gradient CSS o URL immagine)
-- generato/scelto dall'utente nel profilo (anche via ILLI•AI Pollinations).
--
-- Da eseguire una volta in Supabase → SQL Editor.
-- ============================================================

-- Aggiungi colonne se non esistono (idempotente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_type text DEFAULT 'gradient';

-- Vincolo: cover_type può essere solo 'gradient' o 'image'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cover_type_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_cover_type_check
      CHECK (cover_type IS NULL OR cover_type IN ('gradient','image'));
  END IF;
END$$;

-- Le RLS policies esistenti su `profiles` (UPDATE: id = auth.uid()) coprono già
-- queste due colonne — non serve modificarle.

-- Verifica finale (output diagnostico):
SELECT column_name, data_type, column_default
  FROM information_schema.columns
 WHERE table_name = 'profiles'
   AND column_name IN ('cover_url','cover_type')
 ORDER BY column_name;
