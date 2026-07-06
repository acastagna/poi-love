-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 028: l'admin deve poter SCARTARE le richieste di categoria dopo averle
-- valutate (promosse o respinte). Mancava la policy DELETE.

drop policy if exists category_requests_admin_del on public.category_requests;
create policy category_requests_admin_del on public.category_requests
  for delete using (public.is_admin((select auth.uid())));
