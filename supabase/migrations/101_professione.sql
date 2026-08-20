-- © Alessandro Castagna — 321.al / EVOLAB
-- Il mestiere: per professionisti e influencer conta quanto il livello.
alter table public.profiles add column if not exists professione text;
comment on column public.profiles.professione is
  'che lavoro fa, per professionisti e influencer: compare accanto al livello';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_professione_80') then
    alter table public.profiles add constraint profiles_professione_80 check (professione is null or length(professione) <= 80);
  end if;
end $$;
grant select (professione) on public.profiles to anon;
notify pgrst, 'reload schema';
