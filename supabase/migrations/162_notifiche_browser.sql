-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il terzo canale degli avvisi: il browser.
--
-- in_app e la campanella dentro POI-LOVE, email e la posta, push restera
-- all app installata (schermo spento). Questo e il canale del browser: la
-- notifica di sistema che compare anche quando la scheda e in secondo piano,
-- finche il browser e aperto. Parte spento: lo accende chi lo vuole, e il
-- browser stesso chiede il permesso la prima volta.
alter table public.notification_prefs
  add column if not exists browser boolean not null default false;

notify pgrst, 'reload schema';
select count(*) as righe_preferenze from public.notification_prefs;
