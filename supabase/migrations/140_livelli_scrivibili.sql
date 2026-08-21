-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I livelli si potevano solo leggere.
-- La tabella `livelli` aveva il permesso di lettura e basta: nessuna regola di
-- scrittura, nessun permesso. Dal pannello si poteva guardare e non toccare, e
-- il messaggio che arrivava era "permission denied", che non spiega niente.
-- Adesso li scrive l'amministrazione, e solo lei: la barriera e' la regola di
-- riga, il permesso da solo non basta a nessuno.

drop policy if exists livelli_admin on public.livelli;
create policy livelli_admin on public.livelli for all
  using (public.sono_admin()) with check (public.sono_admin());
grant insert, update, delete on public.livelli to authenticated;
grant all on public.livelli to service_role;

notify pgrst, 'reload schema';
select grantee, string_agg(privilege_type, ',' order by privilege_type) as permessi
  from information_schema.role_table_grants where table_name='livelli' group by grantee order by grantee;
