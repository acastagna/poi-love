-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Una tappa si puo' proporre anche alla compagnia, non solo all'itinerario.
-- Sulla bacheca compare come proposta di tappa, col nome del posto e la data
-- prevista: gli altri la vedono e ne parlano li'.

alter table public.companion_messages drop constraint if exists companion_messages_kind_check;
alter table public.companion_messages add constraint companion_messages_kind_check
  check (kind = any (array['voice','deviation','share','tappa']));

notify pgrst, 'reload schema';

-- Sulla tabella c'erano DUE controlli sul tipo di messaggio, con nomi quasi
-- uguali (_kind_check e _kind_chk): ne avevo aggiornato uno solo e l'altro
-- continuava a rifiutare le tappe. Si tiene un controllo solo.
alter table public.companion_messages drop constraint if exists companion_messages_kind_chk;
alter table public.companion_messages drop constraint if exists companion_messages_kind_check;
alter table public.companion_messages add constraint companion_messages_kind_check
  check (kind = any (array['voice','deviation','share','tappa']));
