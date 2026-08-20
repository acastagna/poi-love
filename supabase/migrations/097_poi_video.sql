-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il video del luogo: uno solo, compresso dal server (video.php), con la sua
-- immagine di copertina presa dal video stesso. Non entra fra le foto: quello
-- romperebbe la regola delle righe piene.

alter table public.pois
  add column if not exists video_url     text,
  add column if not exists video_poster  text,
  add column if not exists video_secondi numeric(6,1);

comment on column public.pois.video_url is
  'un solo video per luogo, gia'' compresso: H.264, lato lungo 1080, audio AAC';

notify pgrst, 'reload schema';
