-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Cercare il luogo per cui fare l'audioguida.
-- La tendina era sbagliata: si sceglieva fra i soli luoghi ufficiali e non si
-- vedeva se l'audioguida fosse gia' stata fatta. Cosi' si rischia di rifarla.
--
-- Qui si cerca scrivendo, in italiano, e ogni risultato dice a che punto e':
-- se ha gia' il materiale, il copione, la voce.

create or replace function public.cerca_per_audioguida(
  p_testo text default '',
  p_dove  text default 'ufficiali',   -- ufficiali | community
  p_quanti int default 30)
returns table (
  id uuid, nome text, nome_it text, citta text, regione text,
  ufficiale boolean, cuori int, foto text,
  ha_materiale boolean, ha_copione boolean, ha_voce boolean,
  quante_lingue_pronte int
)
language sql stable security definer set search_path to 'public' as $$
  select p.id,
         p.title,
         coalesce(p.title_it, p.title),
         p.city,
         p.region,
         coalesce(p.badge_official, false),
         coalesce(p.love_count, 0),
         coalesce(p.cover_photo, p.photos[1]),
         exists (select 1 from public.poi_materiale m where m.poi_id = p.id and m.fase = 'ricerca'),
         exists (select 1 from public.poi_materiale m where m.poi_id = p.id and m.fase = 'copione' and m.scelto),
         exists (select 1 from public.poi_materiale m where m.poi_id = p.id and m.fase = 'voce'    and m.scelto),
         (select count(distinct m.lingua)::int from public.poi_materiale m
           where m.poi_id = p.id and m.fase = 'voce' and m.scelto)
    from public.pois p
   where public.sono_admin()
     and p.removed_at is null
     and (case when p_dove = 'community' then not coalesce(p.badge_official,false)
               else coalesce(p.badge_official,false) end)
     and (
       coalesce(trim(p_testo),'') = ''
       or p.title    ilike '%'||p_testo||'%'
       or p.title_it ilike '%'||p_testo||'%'
       or p.city     ilike '%'||p_testo||'%'
       or p.region   ilike '%'||p_testo||'%'
     )
   order by
     -- i piu' votati per primi quando si guarda la community, altrimenti per nome
     case when p_dove = 'community' then coalesce(p.love_count,0) else 0 end desc,
     coalesce(p.title_it, p.title)
   limit greatest(1, least(p_quanti, 100));
$$;
grant execute on function public.cerca_per_audioguida(text, text, int) to authenticated;

-- ── Quanto dura un testo, letto ad alta voce ───────────────────────────────
-- La stima si fa dalle parole, non dai caratteri: un testo albanese e uno
-- italiano hanno parole di lunghezza diversa ma si leggono a velocita' simile.
-- Centoquaranta parole al minuto e' il passo di chi racconta, non di chi legge
-- il notiziario.
create or replace function public.durata_stimata(p_testo text, p_parole_al_minuto int default 140)
returns numeric language sql immutable as $$
  select round(
    array_length(
      regexp_split_to_array(regexp_replace(coalesce(p_testo,''), '^\s+|\s+$', '', 'g'), '\s+'),
    1)::numeric * 60.0 / greatest(60, p_parole_al_minuto)
  , 0);
$$;
grant execute on function public.durata_stimata(text, int) to authenticated, anon;

-- la durata stimata si scrive accanto al testo, cosi' non va ricalcolata ogni volta
alter table public.poi_materiale add column if not exists secondi_stimati numeric(6,0);
update public.poi_materiale
   set secondi_stimati = public.durata_stimata(testo)
 where fase = 'copione' and secondi_stimati is null;

notify pgrst, 'reload schema';
select 'ufficiali: '||count(*) from public.cerca_per_audioguida('', 'ufficiali', 100);
