-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 055 — Tetto mensile di spesa API (Google Places). Un contatore per mese di calendario
-- (stesso ritmo del free tier Google, che si azzera il 1 del mese). L'edge place-enrich chiama budget_hit
-- prima di OGNI chiamata Google reale (le risposte in cache NON contano): oltre il tetto smette di chiamare
-- Google e degrada ai dati gratuiti OSM. Tenendo il totale sotto 1000/mese si resta dentro il free tier = 0 spesa.

begin;

create table if not exists public.api_budget (
  bucket     text primary key,                       -- es. 'gplaces:2026-07'
  count      int  not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.api_budget enable row level security;
-- Nessuna policy: solo il service_role (l'edge) la tocca e bypassa la RLS. Client/anon: nessun accesso.

-- Incrementa il contatore del bucket e dice se siamo ancora DENTRO il tetto (true = gratis).
-- Atomico: l'incremento e il confronto avvengono nella stessa istruzione.
create or replace function public.budget_hit(p_bucket text, p_cap int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into public.api_budget(bucket, count) values (p_bucket, 1)
    on conflict (bucket) do update set count = api_budget.count + 1, updated_at = now()
    returning count into v;
  return v <= p_cap;
end $$;

revoke all on function public.budget_hit(text, int) from public, anon, authenticated;
grant execute on function public.budget_hit(text, int) to service_role;

commit;
