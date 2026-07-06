-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 036: rate limit per le edge pubbliche (place-enrich). Invece di bloccare gli
-- ospiti (che svuoterebbe la lente), si limita l'abuso per IP: la lente resta
-- piena di POI Google per tutti, ma nessuno puo bruciare la quota Google.
-- Solo service_role puo chiamarla (dalla edge, chiave mai nel client).

create table if not exists public.edge_rate_limit (
  bucket     text primary key,
  n          int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.edge_rate_limit enable row level security;  -- nessuna policy: deny-all ai client

create or replace function public.rl_hit(p_key text, p_max int, p_window_secs int default 3600)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_n int;
begin
  -- pulizia opportunistica delle righe scadute (tiene la tabella piccola)
  delete from public.edge_rate_limit where updated_at < now() - interval '2 hours';
  insert into public.edge_rate_limit(bucket, n, updated_at) values (p_key, 1, now())
  on conflict (bucket) do update set
    n = case when public.edge_rate_limit.updated_at < now() - make_interval(secs => p_window_secs)
             then 1 else public.edge_rate_limit.n + 1 end,
    updated_at = now()
  returning n into v_n;
  return v_n <= p_max;   -- true = consentito
end $$;

revoke execute on function public.rl_hit(text,int,int) from public, anon, authenticated;
grant execute on function public.rl_hit(text,int,int) to service_role;
