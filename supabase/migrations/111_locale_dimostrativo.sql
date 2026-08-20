-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il locale dimostrativo.
-- Pizzeria Aurora e' il luogo di dimostrazione nato con la migrazione 098:
-- serve a far vedere come si presenta un Locale Plus quando ha compilato tutto.
-- E' segnato come dimostrativo, non e' un locale vero e non va confuso con uno.

insert into public.locali (poi_id, telefono, pagamenti, categoria_propria, valuta_base, note)
values ('22222222-2222-4222-8222-222222222222', '+355 69 000 0000',
        array['Contanti','Carta','Satispay'], 'Pizzeria napoletana', 'ALL',
        'Locale dimostrativo di POI-LOVE')
on conflict (poi_id) do update set telefono=excluded.telefono, pagamenti=excluded.pagamenti,
  categoria_propria=excluded.categoria_propria, note=excluded.note, aggiornato=now();

delete from public.locale_piatti        where poi_id='22222222-2222-4222-8222-222222222222';
delete from public.locale_menu_sezioni  where poi_id='22222222-2222-4222-8222-222222222222';

with s as (
  insert into public.locale_menu_sezioni (poi_id, nome, ordine) values
    ('22222222-2222-4222-8222-222222222222','Antipasti',10),
    ('22222222-2222-4222-8222-222222222222','Pizze',20),
    ('22222222-2222-4222-8222-222222222222','Dolci',30)
  returning id, nome
)
insert into public.locale_piatti (poi_id, sezione_id, nome, descrizione, prezzo, valuta, chef, ordine)
select '22222222-2222-4222-8222-222222222222'::uuid, s.id, v.nome, v.descr, v.prezzo, 'ALL', v.chef, v.ordine
from s join (values
  ('Antipasti','Byrek me spinaq','Sfoglia sottile con spinaci e formaggio fresco, cotta al forno a legna.',350,false,10),
  ('Antipasti','Olive di Berat','Olive nere schiacciate, olio delle colline di Berat, origano.',250,false,20),
  ('Pizze','Margherita','Pomodoro San Marzano, fiordilatte, basilico, olio extravergine.',700,false,10),
  ('Pizze','Aurora','Mozzarella di bufala, pomodorini gialli, acciughe del Mar Adriatico, capperi.',950,true,20),
  ('Pizze','Skanderbeg','Salsiccia albanese, peperoni arrostiti, cipolla rossa, formaggio kackavall.',900,false,30),
  ('Dolci','Trilece','Il dolce dei tre latti, come lo fanno a Tirana.',400,true,10)
) as v(sezione,nome,descr,prezzo,chef,ordine) on v.sezione = s.nome;

notify pgrst, 'reload schema';
