-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il profilo pubblico, come nel disegno approvato del 20/08/2026.
--   - "dove vivo": lo scrive la persona, compare sotto il nome;
--   - la presentazione si ferma a 250 caratteri (deciso il 20/08);
--   - le compagnie hanno un interruttore per farsi vedere sul profilo, chiuso di default.

alter table public.profiles
  add column if not exists citta text;

comment on column public.profiles.citta is 'dove vive, scritto dalla persona: compare sotto il nome nel profilo pubblico';

do $$
begin
  if not exists (select 1 from pg_constraint where conname='profiles_bio_250') then
    alter table public.profiles add constraint profiles_bio_250 check (bio is null or length(bio) <= 250);
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_citta_120') then
    alter table public.profiles add constraint profiles_citta_120 check (citta is null or length(citta) <= 120);
  end if;
end $$;

grant select (citta) on public.profiles to anon;

alter table public.companions
  add column if not exists is_public boolean not null default false;

comment on column public.companions.is_public is
  'compagnia visibile sul profilo pubblico del proprietario: chiusa di default, la apre lui';

notify pgrst, 'reload schema';
