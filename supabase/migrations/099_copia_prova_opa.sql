-- Copia di prova del luogo "Opa", messa vicino a casa di Alessandro e intestata a
-- Patrizia: serve solo a vedere come si comporta la scheda di un luogo NON tuo,
-- con le foto. Si cancella con una riga (l'id e' 33333333-...).
insert into public.pois (id, author_id, title, description, lat, lng, address, city, country,
                         category, subcategory, tags, photos, cover_photo, visibility, is_public, love_count)
select '33333333-3333-4333-8333-333333333333',
       'a8eb109c-fd10-45bd-8dc2-8b6bdd55373d',
       title || ' (copia di prova)',
       description,
       45.72110, 11.48350,
       'Via Ca'' Nova, Zugliano, Vicenza, Italia', 'Zugliano', 'Italia',
       category, subcategory, tags, photos, cover_photo,
       'community', true, 0
from public.pois where id = 'dd7426b7-5640-4607-9179-3a072940250c'
on conflict (id) do update
  set photos = excluded.photos, description = excluded.description, title = excluded.title,
      author_id = excluded.author_id, lat = excluded.lat, lng = excluded.lng, address = excluded.address;

select p.title, pr.display_name as autore, p.lat, p.lng, coalesce(array_length(p.photos,1),0) as foto
from public.pois p join public.profiles pr on pr.id = p.author_id
where p.id = '33333333-3333-4333-8333-333333333333';
