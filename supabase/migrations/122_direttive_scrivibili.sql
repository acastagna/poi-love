-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le direttive della moderazione devono poter essere cambiate dal pannello:
-- erano di sola lettura, quindi "modificabili senza toccare il codice" era
-- vero a meta'. Adesso l'amministrazione le scrive davvero.

drop policy if exists direttive_admin on public.direttive_moderazione;
create policy direttive_admin on public.direttive_moderazione for all
  using (public.sono_admin()) with check (public.sono_admin());
grant insert, update, delete on public.direttive_moderazione to authenticated;
grant usage, select on sequence direttive_moderazione_id_seq to authenticated;
grant all on public.direttive_moderazione to service_role;

notify pgrst, 'reload schema';
