-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le segnalazioni dentro la scheda di una persona.
-- Erano il pezzo piu' importante che mancava: si poteva sospendere qualcuno
-- senza poter vedere perche', e si poteva leggere una segnalazione senza sapere
-- se quella persona ne aveva gia' addosso altre dieci.

create or replace function public.persona_segnalazioni(p_persona uuid)
returns table (
  verso text,              -- 'ricevuta' oppure 'fatta'
  id uuid,
  motivo text,
  dettaglio text,
  stato text,
  su_cosa text,            -- luogo | persona
  cosa_nome text,          -- il nome del luogo, o della persona segnalata
  altra_persona text,      -- chi ha segnalato, oppure chi e' stato segnalato
  quando timestamptz,
  scade_il timestamptz,
  chiusa_da text,
  esito text
)
language sql stable security definer set search_path to 'public' as $$
  -- quelle che ha ricevuto: sul suo profilo, o su un luogo che ha creato
  select 'ricevuta'::text, r.id, r.reason, r.details, r.status,
         r.target_type,
         case when r.target_type = 'poi'
              then coalesce((select p.title from public.pois p where p.id = r.target_id), '(luogo tolto)')
              else coalesce((select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = r.target_id), '(profilo)')
         end,
         coalesce((select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = r.reporter_id), 'qualcuno'),
         r.created_at, r.scade_il,
         (select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = r.handled_by),
         r.resolution
    from public.reports r
   where public.sono_admin()
     and ( (r.target_type = 'user' and r.target_id = p_persona)
        or (r.target_type = 'poi'  and r.target_id in (select id from public.pois where author_id = p_persona)) )

  union all

  -- quelle che ha fatto lei
  select 'fatta'::text, r.id, r.reason, r.details, r.status,
         r.target_type,
         case when r.target_type = 'poi'
              then coalesce((select p.title from public.pois p where p.id = r.target_id), '(luogo tolto)')
              else coalesce((select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = r.target_id), '(profilo)')
         end,
         case when r.target_type = 'poi'
              then coalesce((select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr
                              join public.pois p on p.author_id = pr.id where p.id = r.target_id), '—')
              else coalesce((select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = r.target_id), '—')
         end,
         r.created_at, r.scade_il,
         (select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = r.handled_by),
         r.resolution
    from public.reports r
   where public.sono_admin() and r.reporter_id = p_persona

  order by 9 desc;
$$;
grant execute on function public.persona_segnalazioni(uuid) to authenticated;

-- Chi e' sospeso, e da chi. Nella scheda si vedeva solo l'etichetta.
create or replace function public.persona_stato(p_persona uuid)
returns table (stato text, motivo text, fino_a timestamptz, deciso_da text, quando timestamptz,
               ricevute int, fatte int, aperte int)
language sql stable security definer set search_path to 'public' as $$
  select p.moderation_status, p.moderation_reason, p.moderation_until,
         (select coalesce(pr.display_name, '@'||pr.username) from public.profiles pr where pr.id = p.moderation_updated_by),
         p.moderation_updated_at,
         (select count(*)::int from public.persona_segnalazioni(p_persona) s where s.verso = 'ricevuta'),
         (select count(*)::int from public.persona_segnalazioni(p_persona) s where s.verso = 'fatta'),
         (select count(*)::int from public.persona_segnalazioni(p_persona) s where s.verso = 'ricevuta' and s.stato in ('open','reviewing'))
    from public.profiles p
   where p.id = p_persona and public.sono_admin();
$$;
grant execute on function public.persona_stato(uuid) to authenticated;

notify pgrst, 'reload schema';
