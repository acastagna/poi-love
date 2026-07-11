-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 070 — Conteggi REALI dei salvataggi rotta in batch.
--   trip_saves ha RLS "vedi solo i tuoi": un conteggio client-side sarebbe FALSO.
--   Questa RPC (security definer) ritorna i conteggi veri per un elenco di rotte:
--   alimenta il badge "Più votato" (admin + webapp), mai inventato.

create or replace function public.trip_save_counts(p_trips uuid[])
returns table(trip_id uuid, n bigint)
language sql security definer set search_path = public stable as $$
  select ts.trip_id, count(*)::bigint
    from public.trip_saves ts
   where ts.trip_id = any(p_trips)
   group by ts.trip_id;
$$;
grant execute on function public.trip_save_counts(uuid[]) to anon, authenticated;
