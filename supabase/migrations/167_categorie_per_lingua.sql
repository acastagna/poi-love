-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le categorie per lingua (blocco 49, uscita dai confini).
--
-- Oggi ogni lingua e' una colonna (label_it, label_sq, label_en): aggiungere
-- il greco vorrebbe dire cambiare lo schema e ogni pagina. Da qui le etichette
-- vivono in una tabella per lingua; le tre colonne storiche restano e si
-- tengono allineate da sole, cosi' NIENTE di esistente si rompe, e la quarta
-- lingua sara' solo righe nuove.

create table if not exists public.categoria_etichette (
  chiave  text not null references public.poi_categories(key) on delete cascade,
  lingua  text not null check (lingua ~ '^[a-z]{2}$'),
  testo   text not null,
  primary key (chiave, lingua)
);
alter table public.categoria_etichette enable row level security;
drop policy if exists cat_eti_leggo on public.categoria_etichette;
create policy cat_eti_leggo on public.categoria_etichette for select using (true);
drop policy if exists cat_eti_admin on public.categoria_etichette;
create policy cat_eti_admin on public.categoria_etichette for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select on public.categoria_etichette to anon, authenticated;
grant insert, update, delete on public.categoria_etichette to authenticated;
grant all on public.categoria_etichette to service_role;

-- Il travaso: quello che oggi sta nelle colonne diventa righe.
insert into public.categoria_etichette (chiave, lingua, testo)
select key, l.lingua, l.testo from public.poi_categories c,
  lateral (values ('it', c.label_it), ('sq', c.label_sq), ('en', c.label_en)) as l(lingua, testo)
 where l.testo is not null and l.testo <> ''
on conflict (chiave, lingua) do update set testo = excluded.testo;

-- Le colonne storiche restano vive: chi scrive un'etichetta nelle tre lingue
-- grandi la vede finire anche nella colonna, e viceversa. Due grilletti,
-- con una sentinella per non rincorrersi a vicenda.
create or replace function public.cat_eti_verso_colonne()
returns trigger language plpgsql as $$
begin
  if current_setting('poilove.cat_sync', true) = '1' then return new; end if;
  perform set_config('poilove.cat_sync', '1', true);
  if new.lingua = 'it' then update public.poi_categories set label_it = new.testo where key = new.chiave;
  elsif new.lingua = 'sq' then update public.poi_categories set label_sq = new.testo where key = new.chiave;
  elsif new.lingua = 'en' then update public.poi_categories set label_en = new.testo where key = new.chiave;
  end if;
  perform set_config('poilove.cat_sync', '0', true);
  return new;
end $$;
drop trigger if exists cat_eti_sync on public.categoria_etichette;
create trigger cat_eti_sync after insert or update on public.categoria_etichette
  for each row execute function public.cat_eti_verso_colonne();

create or replace function public.cat_colonne_verso_eti()
returns trigger language plpgsql as $$
begin
  if current_setting('poilove.cat_sync', true) = '1' then return new; end if;
  perform set_config('poilove.cat_sync', '1', true);
  insert into public.categoria_etichette (chiave, lingua, testo)
  select new.key, l.lingua, l.testo
    from (values ('it', new.label_it), ('sq', new.label_sq), ('en', new.label_en)) as l(lingua, testo)
   where l.testo is not null and l.testo <> ''
  on conflict (chiave, lingua) do update set testo = excluded.testo;
  perform set_config('poilove.cat_sync', '0', true);
  return new;
end $$;
drop trigger if exists cat_col_sync on public.poi_categories;
create trigger cat_col_sync after insert or update on public.poi_categories
  for each row execute function public.cat_colonne_verso_eti();

-- La lettura del futuro: le categorie nella lingua chiesta, con la scala di
-- ripiego lingua -> albanese -> inglese -> italiano -> chiave.
create or replace function public.categorie_per_lingua(p_lingua text default 'it')
returns table (chiave text, macro text, etichetta text, icona text, colore text, ordine int)
language sql stable set search_path to 'public' as $$
  select c.key, c.macro,
         coalesce(
           (select testo from public.categoria_etichette e where e.chiave = c.key and e.lingua = p_lingua),
           (select testo from public.categoria_etichette e where e.chiave = c.key and e.lingua = 'sq'),
           (select testo from public.categoria_etichette e where e.chiave = c.key and e.lingua = 'en'),
           (select testo from public.categoria_etichette e where e.chiave = c.key and e.lingua = 'it'),
           c.key),
         c.icon, c.color, c.sort
    from public.poi_categories c
   where c.active
   order by c.sort;
$$;
grant execute on function public.categorie_per_lingua(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
select lingua, count(*) from public.categoria_etichette group by lingua order by lingua;
