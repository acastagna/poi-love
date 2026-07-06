-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 022: policy UPDATE su poi_lists (riordino sort_order dal dettaglio lista).
-- Esistevano solo SELECT/INSERT/DELETE: senza UPDATE il riordino era impossibile.

drop policy if exists "Proprietario lista puo riordinare POI" on public.poi_lists;
create policy "Proprietario lista puo riordinare POI" on public.poi_lists
  for update
  using (exists (select 1 from public.lists l
                 where l.id = poi_lists.list_id
                   and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.lists l
                      where l.id = poi_lists.list_id
                        and l.owner_id = (select auth.uid())));
