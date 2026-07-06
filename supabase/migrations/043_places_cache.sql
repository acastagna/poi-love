-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 043: cache dei risultati Google Places (modalita' NEARBY della lente). Utenti
-- diversi che guardano la STESSA zona condividono un'unica risposta: si taglia
-- drasticamente la spesa Google al lancio. Solo NEARBY (rating/tipo, dati stabili);
-- l'arricchimento TEXT resta live perche' include openNow (scade a ore).
-- Fail-open: l'edge la usa SOLO se disponibile, altrimenti chiama Google come oggi.
-- Accesso: solo service_role (l'edge), che bypassa la RLS. anon/authenticated: nulla.

create table if not exists public.places_cache (
  key        text primary key,          -- es. 'nearby:41.328:19.818:300:it'
  payload    jsonb not null,            -- la risposta gia' pronta da restituire
  created_at timestamptz not null default now()
);
create index if not exists places_cache_created_idx on public.places_cache (created_at);

alter table public.places_cache enable row level security;
-- Nessuna policy: la tabella e' invisibile a anon/authenticated. Il service_role,
-- usato solo dall'edge function, bypassa la RLS e puo leggere/scrivere.
revoke all on public.places_cache from anon, authenticated;
