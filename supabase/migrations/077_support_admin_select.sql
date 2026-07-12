-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Messaggi assistenza: l'admin poteva leggere solo via RPC SECURITY DEFINER. Senza una policy
-- SELECT diretta, il REALTIME non consegnava all'admin i messaggi degli altri utenti (RLS blocca).
-- Aggiungiamo una policy SELECT per admin: così il pannello riceve in tempo reale le risposte
-- di QUALSIASI utente. Le policy SELECT si sommano in OR con quella utente esistente.

drop policy if exists sm_admin_select on public.support_messages;
create policy sm_admin_select on public.support_messages
  for select
  using (public.is_active_admin());
