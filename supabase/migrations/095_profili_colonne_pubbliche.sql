-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Blocco A2. Trovato dal controllo del 20/08: la porta dei dati risponde anche
-- senza chiave e la tabella delle persone lasciava leggere a chiunque
-- is_admin, admin_role e le quattro colonne di moderazione. Con una riga di
-- comando si scopriva chi e' l'amministratore e cosa e' stato scritto su un utente.
--
-- Scrivere era gia' bloccato e i luoghi privati non uscivano: si chiude solo la lettura.
-- Nome, avatar, bio, punti e livello restano pubblici: la condivisione dei profili
-- e le pagine per i motori non cambiano.
--
-- Nota tecnica: togliere le singole colonne non basta, perche' il permesso sulla
-- tabella intera le copre tutte. Si toglie il permesso largo e si concedono
-- esplicitamente le sole colonne pubbliche.

revoke select on public.profiles from anon;

grant select (
  id, username, display_name, avatar_url, bio, language,
  created_at, updated_at, cover_url, cover_type, points, special_tier
) on public.profiles to anon;

comment on table public.profiles is
  'Le colonne is_admin, admin_role, moderation_* e referred_by non sono leggibili dal pubblico (095, 20/08/2026).';

notify pgrst, 'reload schema';
