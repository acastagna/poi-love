-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I duecentodieci luoghi dei quindici viaggi, in tre lingue.
-- Il testo NON lo inventa nessuno: arriva da Wikipedia nelle tre lingue, con la
-- sua licenza scritta accanto. Dove Wikipedia non ha una voce, il campo resta
-- vuoto: meglio niente che una frase inventata.

alter table public.candidati add column if not exists nome_sq   text;
alter table public.candidati add column if not exists nome_it   text;
alter table public.candidati add column if not exists nome_en   text;
alter table public.candidati add column if not exists descr_sq  text;
alter table public.candidati add column if not exists descr_it  text;
alter table public.candidati add column if not exists descr_en  text;
alter table public.candidati add column if not exists descr_fonte   text;   -- l'indirizzo della voce
alter table public.candidati add column if not exists descr_licenza text;   -- CC BY-SA 4.0

-- Un luogo per posizione nei dati aperti: se la catena rigira, non si duplica.
delete from public.candidati a using public.candidati b
 where a.fonte = b.fonte and a.fonte_id = b.fonte_id and a.fonte_id is not null and a.id > b.id;
create unique index if not exists candidati_fonte on public.candidati(fonte, fonte_id) where fonte_id is not null;

-- ── Il controllo automatico prima che una persona guardi ────────────────────
-- Quello che la macchina puo' verificare da sola lo verifica da sola: cosi' chi
-- decide guarda solo le cose che contano.
create or replace function public.candidato_problemi(p_id uuid)
returns text[] language sql stable security definer set search_path to 'public' as $$
  select array_remove(array[
    case when c.lat is null or c.lng is null then 'senza posizione' end,
    -- l'Albania sta fra 39.6 e 42.7 di latitudine, 19.2 e 21.1 di longitudine
    case when c.lat < 39.5 or c.lat > 42.8 or c.lng < 19.1 or c.lng > 21.2 then 'fuori dall Albania' end,
    case when coalesce(trim(c.nome),'') = '' then 'senza nome' end,
    case when length(coalesce(c.nome,'')) < 3 then 'nome troppo corto' end,
    case when c.foto_url is not null and (coalesce(trim(c.foto_licenza),'') = '' or coalesce(trim(c.foto_autore),'') = '') then 'foto senza licenza o autore' end,
    case when exists (select 1 from public.pois p where p.removed_at is null
                        and p.title = c.nome
                        and abs(p.lat - c.lat) < 0.002 and abs(p.lng - c.lng) < 0.002) then 'gia sulla mappa' end,
    case when exists (select 1 from public.candidati d where d.id <> c.id and d.stato <> 'scartato'
                        and lower(d.nome) = lower(c.nome)
                        and abs(d.lat - c.lat) < 0.002 and abs(d.lng - c.lng) < 0.002) then 'doppione fra i candidati' end
  ], null)
  from public.candidati c where c.id = p_id;
$$;
grant execute on function public.candidato_problemi(uuid) to authenticated;

-- ── Approvare: il candidato diventa un luogo pubblico col bollino Ufficiale ──
create or replace function public.approva_candidato(p_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  c public.candidati%rowtype;
  v_poi uuid;
  guai text[];
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo approvare un candidato';
  end if;
  select * into c from public.candidati where id = p_id;
  if not found then raise exception 'Candidato non trovato'; end if;
  if c.poi_id is not null then return c.poi_id; end if;

  guai := public.candidato_problemi(p_id);
  if 'senza posizione' = any(guai) or 'fuori dall Albania' = any(guai) or 'senza nome' = any(guai) then
    raise exception 'Questo candidato non e utilizzabile: %', array_to_string(guai, ', ');
  end if;

  insert into public.pois (author_id, title, title_sq, title_it, title_en,
                           description, description_sq, description_it, description_en,
                           lingua_originale, lat, lng, category, visibility, is_public,
                           is_approved, badge_official, photos, cover_photo, city, region, created_via)
  values (auth.uid(), c.nome,
          coalesce(c.nome_sq, c.nome), coalesce(c.nome_it, c.nome), coalesce(c.nome_en, c.nome),
          coalesce(c.descr_it, c.descr_sq, c.descr_en),
          c.descr_sq, c.descr_it, c.descr_en, 'sq',
          c.lat, c.lng,
          (case
            when c.categoria in ('castle','fort','city_gate','tower','ruins','archaeological_site','museum','memorial','monument','artwork') then 'cultura'
            when c.categoria in ('restaurant','cafe','bakery','deli','marketplace') then 'cibo'
            when c.categoria in ('beach','waterfall','spring','peak','water','cave_entrance','viewpoint') then 'natura'
            when c.categoria in ('church','monastery','mosque','place_of_worship') then 'cultura'
            when c.categoria in ('hotel','guest_house') then 'pernottare'
            else 'cultura' end)::poi_category,
          'community', true, true, true,
          case when c.foto_url is not null then array[c.foto_url] else '{}'::text[] end,
          c.foto_url, c.citta, c.prefettura, 'catena')
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

-- ── Approvare un viaggio intero, e attaccare le tappe all'itinerario ─────────
-- Duecentodieci luoghi non si approvano a mano uno per uno: si guarda la lista,
-- si mette la soglia di fiducia e si decide una volta per viaggio.
create or replace function public.approva_viaggio(p_viaggio int, p_soglia int default 60)
returns table (approvati int, tappe int, saltati int)
language plpgsql security definer set search_path to 'public' as $$
declare
  v public.viaggi_piano%rowtype;
  c record;
  v_poi uuid;
  n_ok int := 0; n_no int := 0; n_tappe int := 0;
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo approvare un viaggio';
  end if;
  select * into v from public.viaggi_piano where ordine = p_viaggio;
  if not found then raise exception 'Viaggio % non trovato', p_viaggio; end if;
  if v.trip_id is null then raise exception 'Il viaggio % non ha ancora un itinerario', p_viaggio; end if;

  for c in select * from public.candidati
            where viaggio_id = v.id and stato = 'proposto' and fiducia >= p_soglia
            order by fiducia desc, nome loop
    begin
      v_poi := public.approva_candidato(c.id);
      n_ok := n_ok + 1;
      insert into public.trip_stops (trip_id, name, lat, lng, poi_id, status, sort_order, region, image_url)
      values (v.trip_id, c.nome, c.lat, c.lng, v_poi, 'planned',
              (select coalesce(max(sort_order),0)+10 from public.trip_stops where trip_id = v.trip_id),
              c.prefettura, c.foto_url);
      n_tappe := n_tappe + 1;
    exception when others then
      n_no := n_no + 1;
      update public.candidati set motivo = left(sqlerrm, 200) where id = c.id;
    end;
  end loop;
  return query select n_ok, n_tappe, n_no;
end $$;
grant execute on function public.approva_viaggio(int, int) to authenticated;

notify pgrst, 'reload schema';
