-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- La catena automatica dei contenuti.
-- Per arrivare a duecentodieci luoghi Ufficiali non si scrive tutto a mano: si
-- pescano candidati dai dati aperti (OpenStreetMap, Wikidata), si cerca una foto
-- con licenza, e si da' un punteggio di fiducia. Poi decide una persona.
--
-- Regola dura sulle foto, scritta nel documento del 20/08: una foto NON si
-- attacca a un luogo solo perche' e' stata scattata li' vicino. Nelle citta' i
-- falsi positivi arrivano al cento per cento. Si attacca solo se il nome
-- corrisponde. Meglio nessuna foto che la foto sbagliata.

create table if not exists public.candidati (
  id            uuid primary key default gen_random_uuid(),
  viaggio_id    int references public.viaggi_piano(id) on delete set null,
  nome          text not null,
  nome_alt      text,
  lat           double precision not null,
  lng           double precision not null,
  citta         text,
  prefettura    text,
  categoria     text,
  tags          text[] not null default '{}',
  fonte         text not null,                    -- openstreetmap, wikidata
  fonte_id      text,                             -- node/way/relation o Q-id
  wikidata      text,
  foto_url      text,
  foto_autore   text,
  foto_licenza  text,
  foto_fonte    text,
  foto_come     text,                             -- come l'abbiamo trovata: 'nome' oppure 'nessuna'
  fiducia       int not null default 0,           -- da 0 a 100
  stato         text not null default 'proposto' check (stato in ('proposto','approvato','scartato','pubblicato')),
  motivo        text,
  poi_id        uuid references public.pois(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (fonte, fonte_id)
);
create index if not exists candidati_stato on public.candidati(stato, fiducia desc);
create index if not exists candidati_viaggio on public.candidati(viaggio_id);

alter table public.candidati enable row level security;
drop policy if exists candidati_admin on public.candidati;
create policy candidati_admin on public.candidati for all using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.candidati to authenticated;
grant all on public.candidati to service_role;

-- Quanti ne abbiamo, e quanti sono davvero utilizzabili.
create or replace function public.candidati_conto()
returns table (proposti int, approvati int, con_foto int, senza_foto int)
language sql stable security definer set search_path to 'public' as $$
  select count(*) filter (where stato='proposto')::int,
         count(*) filter (where stato='approvato')::int,
         count(*) filter (where foto_url is not null)::int,
         count(*) filter (where foto_url is null)::int
    from public.candidati;
$$;
grant execute on function public.candidati_conto() to authenticated, service_role;

notify pgrst, 'reload schema';
