-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 017 — Rimborso quota AI su fallimento provider
--
-- Se la chiamata a OpenAI fallisce (timeout, 5xx) DOPO che increment_ai_usage ha
-- gia' consumato un messaggio della quota giornaliera, l'edge rimborsa il messaggio:
-- l'utente non paga i fallimenti che non sono colpa sua. Pavimento a 0, mai negativo.
-- Come increment_ai_usage: nessun client puo' chiamarla, la invoca solo l'edge col service_role.
--
-- Idempotente. Schema public, identificatori underscore.

begin;

create or replace function public.decrement_ai_usage(p_user uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.ai_daily_usage
     set count = greatest(count - 1, 0)
   where user_id = p_user
     and day = (now() at time zone 'utc')::date
  returning count into v_count;
  return coalesce(v_count, 0);
end $$;

revoke all on function public.decrement_ai_usage(uuid) from public;
revoke all on function public.decrement_ai_usage(uuid) from authenticated;

commit;
