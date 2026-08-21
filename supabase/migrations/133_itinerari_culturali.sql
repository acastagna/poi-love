-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Gli itinerari non sono tutti la stessa cosa.
-- Quelli che costruiamo noi (i quindici viaggi, e domani le rotte storiche)
-- finivano mescolati agli itinerari personali di chi li ha creati dal pannello:
-- comparivano come "i miei viaggi" di Alessandro, e non lo sono. Da qui in poi
-- ogni itinerario dice che cosa e'.

alter table public.trips add column if not exists tipo text not null default 'personale';
do $$ begin
  alter table public.trips add constraint trips_tipo_chk
    check (tipo in ('personale','culturale','storica'));
exception when duplicate_object then null; end $$;

comment on column public.trips.tipo is
  'personale = di una persona; culturale = Itinerario Culturale nostro; storica = Rotta Storica nostra';

create index if not exists trips_tipo_pubblici on public.trips(tipo, is_published)
  where tipo <> 'personale';

-- I quindici viaggi diventano Itinerari Culturali col bollino Ufficiale.
update public.trips t
   set tipo = 'culturale', badge_official = true
  from public.viaggi_piano v
 where v.trip_id = t.id;

-- Le rotte storiche gia' segnate come tali prendono il loro tipo.
update public.trips set tipo = 'storica' where is_historic and tipo = 'personale';

-- Chi puo' dire che un itinerario e' nostro: solo l'amministrazione.
create or replace function public.tg_trip_tipo() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.tipo is distinct from coalesce(old.tipo,'personale')
     and new.tipo <> 'personale'
     and not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo fare di un itinerario un Itinerario Culturale o una Rotta Storica'
      using errcode='42501';
  end if;
  -- Anche il bollino Ufficiale non se lo mette da solo chi crea.
  if coalesce(new.badge_official,false) and not coalesce(old.badge_official,false)
     and not public.sono_admin() then
    raise exception 'Il bollino Ufficiale lo mette l''amministrazione' using errcode='42501';
  end if;
  return new;
end $$;
drop trigger if exists trip_tipo on public.trips;
create trigger trip_tipo before insert or update on public.trips
  for each row execute function public.tg_trip_tipo();

-- Quelli nostri li legge chiunque, anche senza account: sono materiale pubblico.
drop policy if exists trips_nostri_pubblici on public.trips;
create policy trips_nostri_pubblici on public.trips for select
  using (tipo <> 'personale' and is_published);
grant select on public.trips to anon;

notify pgrst, 'reload schema';
