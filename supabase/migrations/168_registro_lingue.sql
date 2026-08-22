-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il registro delle lingue (blocco 48, impianto parametrico).
--
-- Le lingue dell'app diventano DATI: una riga qui e un file di dizionario,
-- e la bandiera compare nel selettore senza rifare l'app. Le tre grandi
-- (sq, it, en) viaggiano dentro l'app per partire all'istante; questo
-- registro comanda quali si vedono e in che ordine.

create table if not exists public.lingue (
  codice   text primary key check (codice ~ '^[a-z]{2}$'),
  nome     text not null,             -- nel proprio idioma: Shqip, Italiano...
  bandiera text not null,             -- img/flags/<xx>.svg
  ordine   int  not null default 100,
  attiva   boolean not null default false
);
alter table public.lingue enable row level security;
drop policy if exists lingue_leggo on public.lingue;
create policy lingue_leggo on public.lingue for select using (true);
drop policy if exists lingue_admin on public.lingue;
create policy lingue_admin on public.lingue for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select on public.lingue to anon, authenticated;
grant insert, update, delete on public.lingue to authenticated;
grant all on public.lingue to service_role;

insert into public.lingue (codice, nome, bandiera, ordine, attiva) values
  ('sq', 'Shqip',     'img/flags/al.svg', 1, true),
  ('it', 'Italiano',  'img/flags/it.svg', 2, true),
  ('en', 'English',   'img/flags/gb.svg', 3, true),
  ('el', 'Ελληνικά',  'img/flags/gr.svg', 4, false)
on conflict (codice) do nothing;

notify pgrst, 'reload schema';
select codice, nome, attiva from public.lingue order by ordine;
