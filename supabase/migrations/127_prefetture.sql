-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le dodici prefetture, con il loro identificativo nei dati aperti.
-- Nel piano dei viaggi le chiamiamo con il nome corto (Berat), ma in
-- OpenStreetMap si chiamano "Qarku i Beratit": senza questa corrispondenza la
-- catena automatica cercava dentro una zona che non esiste e tornava a mani
-- vuote. Gli identificativi sono stati risolti uno per uno il 21/08/2026.

create table if not exists public.prefetture (
  chiave     text primary key,        -- come la chiamiamo noi
  nome_osm   text not null,           -- come si chiama nei dati aperti
  osm_id     bigint not null,         -- la relazione di OpenStreetMap
  ordine     int not null default 100
);

insert into public.prefetture (chiave, nome_osm, osm_id, ordine) values
 ('Berat','Qarku i Beratit',1252289,10),
 ('Diber','Qarku i Dibrës',1249567,20),
 ('Durres','Qarku i Durrësit',1249872,30),
 ('Elbasan','Qarku i Elbasanit',1250609,40),
 ('Fier','Qarku i Fierit',1251469,50),
 ('Gjirokaster','Qarku i Gjirokastrës',1253915,60),
 ('Korce','Qarku i Korçës',1252589,70),
 ('Kukes','Qarku i Kukësit',1759889,80),
 ('Lezhe','Qarku i Lezhës',1248935,90),
 ('Shkoder','Qarku i Shkodrës',1248293,100),
 ('Tirane','Tiranë',1250106,110),
 ('Vlore','Qarku i Vlorës',1255521,120)
on conflict (chiave) do update set nome_osm=excluded.nome_osm, osm_id=excluded.osm_id;

alter table public.prefetture enable row level security;
drop policy if exists prefetture_leggo on public.prefetture;
create policy prefetture_leggo on public.prefetture for select using (true);
grant select on public.prefetture to anon, authenticated, service_role;

notify pgrst, 'reload schema';
