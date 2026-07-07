-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 056 — La COMPAGNIA ha una sua foto (avatar del gruppo), come un profilo. Il cerchione grande
-- della card e della bacheca e' l'identita' della compagnia, non del creatore. L'immagine e' una data-URL
-- WebP compressa (come gli avatar profilo): niente bucket, niente URL firmati. La imposta solo l'owner
-- (la policy companions_update di mig 005 lo permette gia'). Sola aggiunta di colonna, nessuna nuova policy.

begin;

alter table public.companions
  add column if not exists avatar_url text;   -- data-URL WebP ~256px, impostata dall'owner

commit;
