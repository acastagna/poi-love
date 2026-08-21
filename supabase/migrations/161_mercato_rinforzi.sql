-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I rinforzi del mercato, dopo la revisione avversariale del 21/08.
--
-- Quattro cose vere trovate dalla revisione:
--  1. due risposte quasi contemporanee sulla stessa trattativa potevano
--     scavalcarsi: una proposta annullata poteva tornare "consegnata";
--  2. la levetta "disponibile" spenta toglieva l influencer dall elenco ma chi
--     conosceva gia il suo id continuava a leggere vetrina e listino: la
--     promessa scritta in pagina ("spenta non la vede nessuno") era falsa;
--  3. i numeri della vetrina contavano anche i luoghi privati dell influencer;
--  4. le due tabelle grosse (pois, loves) non avevano gli indici che la
--     vetrina interroga per ogni riga.

-- ── 1. La macchina a stati non si scavalca ──────────────────────────────────
create or replace function public.mercato_rispondi(p_proposta uuid, p_stato text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v record; n int;
begin
  -- for update: chi arriva secondo aspetta, e rilegge uno stato vero
  select * into v from public.mercato_proposte where id = p_proposta for update;
  if not found then raise exception 'proposta inesistente'; end if;
  if auth.uid() is distinct from v.compratore and auth.uid() is distinct from v.influencer
     and not public.sono_admin() then
    raise exception 'non e una trattativa tua';
  end if;

  if p_stato in ('accettata','rifiutata') then
    if auth.uid() <> v.influencer then raise exception 'risponde l influencer'; end if;
    if v.stato <> 'inviata' then raise exception 'la proposta non e piu in attesa'; end if;
  elsif p_stato = 'consegnata' then
    if auth.uid() <> v.influencer then raise exception 'consegna l influencer'; end if;
    if v.stato <> 'accettata' then raise exception 'prima si accetta, poi si consegna'; end if;
  elsif p_stato = 'pagata' then
    if auth.uid() <> v.compratore and not public.sono_admin() then
      raise exception 'il pagamento lo conferma chi paga';
    end if;
    if v.stato <> 'consegnata' then raise exception 'si paga a consegna avvenuta'; end if;
  elsif p_stato = 'annullata' then
    -- tutte e due le parti possono tirarsi indietro finche non c e la consegna
    if v.stato not in ('inviata','accettata') then
      raise exception 'ormai non si annulla piu';
    end if;
  else
    raise exception 'stato sconosciuto: %', p_stato;
  end if;

  -- la condizione sullo stato ripetuta QUI: se nel frattempo qualcuno lo ha
  -- cambiato, zero righe e si dice il vero invece di sovrascrivere
  update public.mercato_proposte set stato = p_stato, aggiornato = now()
   where id = p_proposta and stato = v.stato;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'lo stato e cambiato un attimo fa: ricarica'; end if;
  return p_stato;
end $$;

-- ── 2. Spenta vuol dire spenta ──────────────────────────────────────────────
drop policy if exists vetrina_compratori on public.mercato_vetrine;
create policy vetrina_compratori on public.mercato_vetrine for select
  using (user_id = auth.uid() or (public.sono_compratore() and disponibile));

drop policy if exists listino_lettura on public.mercato_listino;
create policy listino_lettura on public.mercato_listino for select
  using (influencer = auth.uid()
     or (public.sono_compratore()
         and exists (select 1 from public.mercato_vetrine v
                      where v.user_id = influencer and v.disponibile)));

-- ── 3. I numeri pubblici contano solo il pubblico ───────────────────────────
-- E la vetrina mostra solo chi e ANCORA influencer: chi perde il livello
-- sparisce da solo, senza aspettare nessuna pulizia a mano.
create or replace function public.mercato_vetrina()
returns table (user_id uuid, username text, display_name text, avatar_url text,
               zona text, temi text[], presentazione text,
               luoghi bigint, cuori bigint, seguaci bigint, servizi bigint)
language sql stable security definer set search_path to 'public' as $$
  select v.user_id, p.username, p.display_name, p.avatar_url,
         v.zona, v.temi, v.presentazione,
         (select count(*) from public.pois po
           where po.author_id = v.user_id and po.removed_at is null
             and po.is_approved and po.visibility in ('community','official')),
         (select count(*) from public.loves l join public.pois po on po.id = l.poi_id
           where po.author_id = v.user_id and po.removed_at is null
             and po.visibility in ('community','official')),
         (select count(*) from public.follows where following_id = v.user_id),
         (select count(*) from public.mercato_listino ml
           where ml.influencer = v.user_id and ml.attivo)
    from public.mercato_vetrine v
    join public.profiles p on p.id = v.user_id
   where v.disponibile
     and p.special_tier = 'influencer'
     and coalesce(p.moderation_status, 'active') = 'active'
     and public.sono_compratore()
   order by 8 desc
   limit 100;
$$;

-- ── 4. Gli indici che la vetrina interroga a ogni riga ──────────────────────
create index if not exists pois_per_autore on public.pois(author_id) where removed_at is null;
create index if not exists loves_per_poi on public.loves(poi_id);

-- ── 5. Una proposta cita solo voci del listino di QUELL influencer ──────────
create or replace function public.controlla_listino_proposta()
returns trigger language plpgsql as $$
begin
  if new.listino_id is not null and not exists (
    select 1 from public.mercato_listino where id = new.listino_id and influencer = new.influencer
  ) then
    raise exception 'la voce di listino non e di questo influencer';
  end if;
  return new;
end $$;
drop trigger if exists proposta_listino_giusto on public.mercato_proposte;
create trigger proposta_listino_giusto before insert on public.mercato_proposte
  for each row execute function public.controlla_listino_proposta();

notify pgrst, 'reload schema';
select 'rinforzi applicati' as esito;
