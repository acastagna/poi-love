-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 011 — Restringe la SELECT su follows (anti-scraping del grafo sociale)
-- Prima: follows_select USING (true) -> qualsiasi utente autenticato leggeva TUTTO il grafo chi-segue-chi.
-- Ora: un utente vede solo le righe in cui e coinvolto (come follower o come seguito).
-- Insert/delete restano invariati (gia ristretti a follower_id = auth.uid()).
-- NB: per mostrare conteggi follower PUBBLICI di altri utenti servira una RPC SECURITY DEFINER dedicata;
--     la lettura diretta del grafo altrui resta volutamente preclusa.

begin;

drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows for select to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

commit;
