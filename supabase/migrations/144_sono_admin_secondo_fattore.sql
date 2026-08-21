-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Due porte diverse per la stessa stanza.
-- Nel database convivono due controlli di amministratore: is_admin(), che
-- pretende il secondo fattore, e sono_admin(), che guarda solo il campo del
-- profilo. Tutte le cose scritte nelle ultime settimane usano sono_admin(),
-- quindi bastava la password. Provato dal vivo: con la sola password si poteva
-- mettere una domanda nella coda.
--
-- Adesso sono_admin() chiede la stessa cosa di is_admin(): profilo attivo E
-- sessione col secondo fattore. Come prima, una connessione diretta (console
-- SQL, ruolo di servizio, lavori della macchina) non ha il claim e resta
-- libera, altrimenti le migrazioni e i lavori notturni si bloccherebbero.

create or replace function public.sono_admin()
returns boolean
language sql stable security definer set search_path to 'public' as $$
  select coalesce((
    select p.is_admin and coalesce(p.moderation_status, 'active') = 'active'
      from public.profiles p where p.id = auth.uid()
  ), false)
  and coalesce((current_setting('request.jwt.claims', true)::json) ->> 'aal', 'aal2') = 'aal2';
$$;

comment on function public.sono_admin() is
  'Amministratore attivo e con il secondo fattore. Senza claim aal (connessione diretta) il vincolo non si applica.';

notify pgrst, 'reload schema';
