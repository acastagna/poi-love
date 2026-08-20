-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- La voce di chi ha il profilo, sul suo luogo.
-- Un minuto al professionista, tre al locale (il numero sta nella tabella
-- `livelli`, colonna audio_secondi). Non e' l'audioguida ufficiale POI-VOICE:
-- quella e' un'altra cosa, la fa l'amministrazione e vive altrove.

create table if not exists public.luogo_voce (
  poi_id     uuid primary key references public.pois(id) on delete cascade,
  autore_id  uuid not null references public.profiles(id) on delete cascade,
  url        text not null,
  secondi    numeric(6,1) not null check (secondi > 0 and secondi <= 180),
  aggiornato timestamptz not null default now()
);
alter table public.luogo_voce enable row level security;

drop policy if exists voce_leggo on public.luogo_voce;
create policy voce_leggo on public.luogo_voce for select using (true);

drop policy if exists voce_scrivo on public.luogo_voce;
create policy voce_scrivo on public.luogo_voce for all
  using (public.sono_il_locale(poi_id)) with check (public.sono_il_locale(poi_id) and autore_id = auth.uid());

grant select on public.luogo_voce to anon, authenticated;
grant insert, update, delete on public.luogo_voce to authenticated;
grant all on public.luogo_voce to service_role;

notify pgrst, 'reload schema';
