-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 013 — Enforcement MFA (aal2) lato server per l'admin
-- Chiude il blocco trovato in review: il gate aal2 nel pannello era solo client-side.
-- Qui is_admin() richiede che la SESSIONE utente abbia completato il secondo fattore (aal2).
-- Cosi tutte le RLS e le RPC che usano is_admin() (moderazione, reports, audit, config, ecc.)
-- sono inaccessibili a un admin che ha fatto solo Google ma non l'MFA.
--
-- ANTI-LOCKOUT: le connessioni dirette al DB e service_role NON portano il claim 'aal',
-- quindi NON sono vincolate (coalesce -> 'aal2'). Da applicare SOLO dopo aver verificato dal vivo
-- che l'enroll MFA dell'admin funziona e raggiunge aal2, altrimenti l'admin resterebbe bloccato.

begin;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.is_admin = true and p.moderation_status = 'active'
  )
  -- la sessione deve essere aal2 (MFA completata). Senza claim aal (connessione diretta/service_role)
  -- il vincolo non si applica, per non bloccare console SQL e operazioni di servizio.
  and coalesce((current_setting('request.jwt.claims', true)::json) ->> 'aal', 'aal2') = 'aal2';
$$;

commit;
