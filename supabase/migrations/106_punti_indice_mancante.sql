-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Guasto trovato il 21/08/2026 provando i punti delle recensioni.
-- Nel passaggio al nostro database si e' perso l'indice unico su point_events:
-- senza quello, la funzione che assegna i punti falliva SEMPRE, per ogni azione
-- (luogo creato, love, condivisione, invito). Dove veniva chiamata dentro un
-- trigger l'errore spariva in silenzio: i punti non arrivavano e nessuno lo sapeva.
-- Qui l'indice si rimette. Prima si tolgono eventuali doppioni.

delete from public.point_events a using public.point_events b
 where a.ctid < b.ctid and a.user_id = b.user_id and a.action = b.action
   and a.entity_id is not distinct from b.entity_id;

create unique index if not exists point_events_unico
  on public.point_events(user_id, action, entity_id);

notify pgrst, 'reload schema';
