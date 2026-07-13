-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- EVOLAB Mail Builder su POI•LOVE: il documento del costruttore (righe > colonne > moduli)
-- si salva accanto all'HTML reso, così il template resta RIAPRIBILE e modificabile nel builder.

alter table public.email_templates add column if not exists design jsonb;
