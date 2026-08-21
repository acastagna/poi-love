-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Riparazioni trovate dalla revisione del 21/08/2026 sulle migrazioni 102-129.
-- Sono tutti buchi di permesso: cose che un utente qualunque poteva fare e non
-- doveva. Si chiudono qui, in un file solo, prima che il programma vada avanti.

-- ── 1. Una recensione approvata non si sposta su un altro luogo ──────────────
-- Prima la correzione controllava solo "sei tu l'autore": bastava cambiare il
-- luogo con una chiamata diretta per portare un voto gia' pubblicato addosso a
-- un locale sconosciuto, senza amicizia e senza moderazione.
drop policy if exists rec_correggo_mia on public.recensioni;
create policy rec_correggo_mia on public.recensioni for update
  using (auth.uid() = autore_id)
  with check (
    auth.uid() = autore_id
    and exists (
      select 1 from public.pois p
      where p.id = poi_id and p.author_id <> auth.uid() and public.siamo_amici(p.author_id)
    )
  );

-- E se cambia il luogo, la recensione torna in coda come se fosse nuova.
create or replace function public.tg_recensione_stato() returns trigger
language plpgsql as $$
begin
  if current_user <> 'service_role' and current_user <> 'postgres' then
    if tg_op = 'INSERT' then
      new.stato := 'in_coda'; new.motivo := null; new.direttiva := null;
    else
      if new.voto is distinct from old.voto
         or new.testo is distinct from old.testo
         or new.poi_id is distinct from old.poi_id then
        new.stato := 'in_coda'; new.motivo := null; new.direttiva := null;
      else
        new.stato := old.stato; new.motivo := old.motivo; new.direttiva := old.direttiva;
      end if;
    end if;
  end if;
  return new;
end $$;

-- ── 2. Lo stato del patto lo vede solo l'interessato ─────────────────────────
-- Era una funzione con dentro un parametro libero: chiunque poteva chiedere il
-- livello e la scadenza dell'abbonamento di un altro.
create or replace function public.stato_condizione(p_user uuid)
returns table (livello text, nome text, regola text, fatti int, servono int, scadenza date, giorni_alla_scadenza int, in_regola boolean)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if p_user is distinct from auth.uid() and not public.sono_admin() then
    raise exception 'Questa risposta riguarda solo la persona interessata' using errcode='42501';
  end if;
  return query
  with p as (select id, special_tier, livello_scadenza from public.profiles where id = p_user),
       l as (select * from public.livelli where chiave = (select special_tier from p)),
       n as (select count(*)::int c from public.pois
              where author_id = p_user and created_at > now() - interval '30 days' and removed_at is null)
  select l.chiave, l.nome,
         case when l.richiede_luoghi_mese > 0 then 'luoghi'
              when l.richiede_rinnovo then 'rinnovo' else 'nessuna' end,
         (select c from n), l.richiede_luoghi_mese,
         (select livello_scadenza from p),
         case when (select livello_scadenza from p) is null then null
              else ((select livello_scadenza from p) - current_date) end,
         case
           when l.richiede_luoghi_mese > 0 and (select c from n) < l.richiede_luoghi_mese then false
           when l.richiede_rinnovo and coalesce((select livello_scadenza from p), current_date + 3650) < current_date then false
           else true
         end
    from l;
end $$;
grant execute on function public.stato_condizione(uuid) to authenticated, service_role;

-- ── 3. I numeri della moderazione sono numeri interni ────────────────────────
create or replace function public.segnalazioni_da_guardare()
returns table (aperte int, in_ritardo int, piu_vecchia timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione' using errcode='42501';
  end if;
  return query
  select count(*)::int,
         count(*) filter (where scade_il < now())::int,
         min(created_at)
    from public.reports where status in ('open','reviewing');
end $$;
grant execute on function public.segnalazioni_da_guardare() to authenticated;

create or replace function public.candidati_conto()
returns table (proposti int, approvati int, con_foto int, senza_foto int)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione' using errcode='42501';
  end if;
  return query
  select count(*) filter (where stato='proposto')::int,
         count(*) filter (where stato='approvato')::int,
         count(*) filter (where foto_url is not null)::int,
         count(*) filter (where foto_url is null)::int
    from public.candidati;
end $$;
grant execute on function public.candidati_conto() to authenticated, service_role;

-- ── 4. La voce del luogo rispetta il tetto del livello ───────────────────────
-- Il check fermava tutti a tre minuti: il Professionista ne ha uno solo.
create or replace function public.tg_voce_tetto() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare tetto int;
begin
  select coalesce(l.audio_secondi, 0) into tetto
    from public.profiles p left join public.livelli l on l.chiave = p.special_tier
   where p.id = new.autore_id;
  if coalesce(tetto,0) <= 0 then
    raise exception 'Il tuo livello non prevede la voce sul luogo' using errcode='check_violation';
  end if;
  if new.secondi > tetto then
    raise exception 'Il tuo livello arriva a % secondi di voce', tetto using errcode='check_violation';
  end if;
  return new;
end $$;
drop trigger if exists voce_tetto on public.luogo_voce;
create trigger voce_tetto before insert or update on public.luogo_voce
  for each row execute function public.tg_voce_tetto();

-- ── 5. I viaggi in bozza restano dell'amministrazione ────────────────────────
drop policy if exists viaggi_leggo on public.viaggi_piano;
create policy viaggi_leggo on public.viaggi_piano for select
  using (stato in ('approvato','pubblicato') or public.sono_admin());

-- ── 6. Un viaggio per posizione, e la migrazione si puo' rifare ──────────────
delete from public.viaggi_piano a using public.viaggi_piano b
 where a.ordine = b.ordine and a.id > b.id;
create unique index if not exists viaggi_piano_ordine on public.viaggi_piano(ordine);

-- ── 7. La foto la corregge e la toglie chi l'ha messa ────────────────────────
drop policy if exists media_mie_correggo on public.media_assets;
create policy media_mie_correggo on public.media_assets for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists media_mie_tolgo on public.media_assets;
create policy media_mie_tolgo on public.media_assets for delete using (owner_id = auth.uid());
grant update, delete on public.media_assets to authenticated;

-- ── 8. Gli orari si sostituiscono in un colpo solo ───────────────────────────
-- L'app cancellava e poi riscriveva: se la seconda meta' non partiva, il locale
-- restava senza orari. Qui o si fa tutto o non si fa niente.
create or replace function public.sostituisci_orari(p_poi uuid, p_righe jsonb)
returns int language plpgsql security definer set search_path to 'public' as $$
declare quante int;
begin
  if not public.sono_il_locale(p_poi) and not public.sono_admin() then
    raise exception 'Gli orari li scrive chi ha creato il luogo' using errcode='42501';
  end if;
  delete from public.locale_orari where poi_id = p_poi;
  insert into public.locale_orari (poi_id, giorno, apre, chiude, chiuso, ordine)
  select p_poi,
         (r->>'giorno')::int,
         nullif(r->>'apre','')::time,
         nullif(r->>'chiude','')::time,
         coalesce((r->>'chiuso')::boolean, false),
         coalesce((r->>'ordine')::int, 0)
    from jsonb_array_elements(coalesce(p_righe,'[]'::jsonb)) r
   where (r->>'giorno')::int between 0 and 6;
  get diagnostics quante = row_count;
  return quante;
end $$;
grant execute on function public.sostituisci_orari(uuid, jsonb) to authenticated, service_role;

-- Due turni identici nello stesso giorno non hanno senso.
delete from public.locale_orari a using public.locale_orari b
 where a.poi_id = b.poi_id and a.giorno = b.giorno and a.ordine = b.ordine and a.id > b.id;
create unique index if not exists locale_orari_turno on public.locale_orari(poi_id, giorno, ordine);

-- ── 9. Un viaggio si lega solo a una compagnia di cui si fa parte ────────────
create or replace function public.tg_trip_compagnia() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.companion_id is not null
     and (tg_op = 'INSERT' or new.companion_id is distinct from old.companion_id)
     and not public.is_companion_member(new.companion_id)
     and not public.sono_admin() then
    raise exception 'Questo itinerario si puo'' legare solo a una compagnia di cui fai parte' using errcode='42501';
  end if;
  return new;
end $$;
drop trigger if exists trip_compagnia on public.trips;
create trigger trip_compagnia before insert or update of companion_id on public.trips
  for each row execute function public.tg_trip_compagnia();

-- Nota sui permessi di scrittura delle tabelle dell'amministrazione
-- (livelli, audioguide, abbonamenti, qr_stile, impostazioni_volti,
-- direttive_moderazione, viaggi_piano, candidati): il permesso resta al ruolo
-- `authenticated` perche' anche gli amministratori entrano con quel ruolo; la
-- barriera vera e' la regola di riga sono_admin(). Chi tocca queste tabelle in
-- futuro non deve togliere quella regola pensando che basti il permesso.

notify pgrst, 'reload schema';
