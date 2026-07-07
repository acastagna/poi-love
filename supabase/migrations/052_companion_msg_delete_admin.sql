-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 052 — Un vocale della bacheca puo' essere cancellato da CHI L'HA SCRITTO oppure dall'AMMINISTRATORE
-- (owner della compagnia). Prima la DELETE era solo per l'autore.

begin;

drop policy if exists comp_msg_del on public.companion_messages;
create policy comp_msg_del on public.companion_messages
  for delete to authenticated using (
    author_id = (select auth.uid())
    or exists (select 1 from public.companions c
               where c.id = companion_id and c.owner_id = (select auth.uid()))
  );

commit;
