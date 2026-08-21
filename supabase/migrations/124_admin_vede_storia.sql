-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- L'amministrazione deve vedere la storia di un livello: quando e' stato
-- assegnato, quando la persona e' stata avvisata, quando lo ha perso. Senza
-- questo la scheda nel pannello resta muta e chi deve decidere lavora al buio.

drop policy if exists livello_eventi_admin on public.livello_eventi;
create policy livello_eventi_admin on public.livello_eventi for select using (public.sono_admin());

drop policy if exists abb_admin_legge on public.abbonamenti;
create policy abb_admin_legge on public.abbonamenti for select using (public.sono_admin());

notify pgrst, 'reload schema';
