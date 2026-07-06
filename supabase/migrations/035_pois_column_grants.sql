-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 035: la REVOKE per-colonna (034) e' inefficace finche' esiste il grant UPDATE
-- a livello TABELLA. Qui tolgo l'UPDATE di tabella e riconcedo SOLO le colonne che
-- l'autore modifica legittimamente. is_featured/love_count/is_approved/author_id/
-- created_via restano scrivibili solo dalle RPC/trigger SECURITY DEFINER.

revoke update on public.pois from authenticated, anon;

grant update (
  title, description, category, subcategory, tags,
  lat, lng, address, place_id, city, country,
  photos, cover_photo, visibility, is_public, cultural_route, updated_at
) on public.pois to authenticated;
