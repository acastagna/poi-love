-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Da candidato a luogo Ufficiale.
-- La macchina propone, una persona decide. Quando l'amministrazione approva, il
-- candidato diventa un POI vero col bollino Ufficiale, e la foto porta con se'
-- autore e licenza: senza quelli il luogo nasce senza foto, non con una foto
-- rubata.

create or replace function public.approva_candidato(p_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  c public.candidati%rowtype;
  v_poi uuid;
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo approvare un candidato';
  end if;
  select * into c from public.candidati where id = p_id;
  if not found then raise exception 'Candidato non trovato'; end if;
  if c.poi_id is not null then return c.poi_id; end if;

  insert into public.pois (author_id, title, lat, lng, category, visibility, is_public,
                           is_approved, badge_official, photos, city, address, created_via)
  values (auth.uid(), c.nome, c.lat, c.lng,
          -- la categoria dei dati aperti (castle, museum, ruins...) non e' la
          -- nostra: si traduce, e quello che non si riconosce diventa 'cultura'
          (case
            when c.categoria in ('castle','fort','city_gate','tower','ruins','archaeological_site','museum','memorial','monument','artwork') then 'cultura'
            when c.categoria in ('restaurant','cafe','bakery','deli','marketplace') then 'cibo'
            when c.categoria in ('beach','waterfall','spring','peak','water','cave_entrance','viewpoint') then 'natura'
            when c.categoria in ('church','monastery','mosque','place_of_worship') then 'cultura'
            when c.categoria in ('hotel','guest_house') then 'pernottare'
            else 'cultura' end)::poi_category,
          'community', true, true, true,
          case when c.foto_url is not null then array[c.foto_url] else '{}'::text[] end,
          c.citta, null, 'catena')
  returning id into v_poi;

  if c.foto_url is not null then
    insert into public.media_assets (owner_id, poi_id, url, kind, source, autore, licenza, fonte_url, attribuzione)
    values (auth.uid(), v_poi, c.foto_url, 'foto',
            coalesce(nullif(c.foto_come,''),'wikimedia'), c.foto_autore, c.foto_licenza, c.foto_fonte,
            c.foto_autore || ' · ' || c.foto_licenza);
  end if;

  update public.candidati set stato = 'pubblicato', poi_id = v_poi where id = p_id;
  return v_poi;
end $$;
revoke all on function public.approva_candidato(uuid) from public, anon;
grant execute on function public.approva_candidato(uuid) to authenticated, service_role;

create or replace function public.scarta_candidato(p_id uuid, p_motivo text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.sono_admin() then raise exception 'Solo l''amministrazione'; end if;
  update public.candidati set stato='scartato', motivo=p_motivo where id=p_id;
end $$;
revoke all on function public.scarta_candidato(uuid, text) from public, anon;
grant execute on function public.scarta_candidato(uuid, text) to authenticated, service_role;

notify pgrst, 'reload schema';
