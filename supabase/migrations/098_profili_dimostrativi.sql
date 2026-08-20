-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I profili dimostrativi: servono a vedere come si comporta l'app quando un luogo
-- NON e' tuo. Regola del 20/08/2026: portano una scritta visibile dovunque
-- compaiano, non entrano nelle classifiche ne' nei conteggi pubblici, e non
-- scrivono mai recensioni su locali veri.

alter table public.profiles add column if not exists is_demo boolean not null default false;
comment on column public.profiles.is_demo is
  'profilo dimostrativo: l''app lo dichiara sempre, e non entra nelle classifiche';

grant select (is_demo) on public.profiles to anon;

-- Una persona dimostrativa e un luogo VERO vicino a casa di Alessandro:
-- Pizzeria Aurora, Via Ca' Nova, Zugliano (dati presi da OpenStreetMap).
insert into public.profiles (id, username, display_name, bio, language, points, is_demo)
values ('11111111-1111-4111-8111-111111111111', 'marta.dimostrativa', 'Marta B.',
        'Profilo dimostrativo di POI-LOVE: serve a far vedere come si vede un luogo di un altro.',
        'it', 40, true)
on conflict (id) do update set is_demo = true, display_name = excluded.display_name;

insert into public.pois (id, author_id, title, description, lat, lng, address, city, country,
                         category, visibility, is_public, love_count)
values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
        'Pizzeria Aurora',
        'Pizzeria in Via Ca'' Nova, a Zugliano. Luogo vero, messo da un profilo dimostrativo per far vedere come appare un luogo che non e'' tuo.',
        45.72352, 11.47929, 'Via Ca'' Nova, Zugliano, Vicenza, Italia', 'Zugliano', 'Italia',
        'cibo', 'community', true, 0)
on conflict (id) do update set title = excluded.title, description = excluded.description;

notify pgrst, 'reload schema';
