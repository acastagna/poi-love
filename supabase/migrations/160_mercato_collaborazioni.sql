-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il mercato delle collaborazioni (direttiva del 20/08/2026).
--
-- L influencer non paga mai la piattaforma: incassa. Mette la levetta
-- "Disponibile per collaborazioni" e il suo listino. Il professionista e il
-- locale cercano per zona e tema, guardano i numeri veri, e la proposta passa
-- DENTRO POI-LOVE: messaggio, accordo, consegna, pagamento. La piattaforma
-- trattiene il 33 per cento netto sulle trattative.
--
-- La regola che conta sta qui, non nelle pagine: il listino di un influencer
-- lo vedono SOLO professionisti e locali (e lui stesso). Mai un altro
-- influencer, mai una persona qualsiasi. Se la pagina sbaglia, il server no.

-- ── Chi e cosa, per le regole ───────────────────────────────────────────────
create or replace function public.mio_tier()
returns text language sql stable security definer set search_path to 'public' as $$
  select coalesce((select special_tier from public.profiles where id = auth.uid()), '');
$$;
grant execute on function public.mio_tier() to authenticated;

-- Professionista o locale: chi puo guardare i listini e mandare proposte.
create or replace function public.sono_compratore()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.mio_tier() in ('professionista', 'professionista_plus') or public.sono_admin();
$$;
grant execute on function public.sono_compratore() to authenticated;

create or replace function public.sono_influencer()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.mio_tier() = 'influencer';
$$;
grant execute on function public.sono_influencer() to authenticated;

-- ── La vetrina: la presenza dell influencer sul mercato ─────────────────────
create table if not exists public.mercato_vetrine (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  disponibile boolean not null default false,
  zona        text,                          -- dove lavora: Tirana, la costa, tutta l Albania
  temi        text[] not null default '{}',  -- cibo, natura, vita notturna, cultura...
  presentazione text,                        -- due righe sue
  aggiornato  timestamptz not null default now()
);
alter table public.mercato_vetrine enable row level security;

-- La vetrina la vede chi compra; l influencer vede e governa la SUA.
drop policy if exists vetrina_compratori on public.mercato_vetrine;
create policy vetrina_compratori on public.mercato_vetrine for select
  using (public.sono_compratore() or user_id = auth.uid());
drop policy if exists vetrina_mia on public.mercato_vetrine;
create policy vetrina_mia on public.mercato_vetrine for all
  using (user_id = auth.uid() and public.sono_influencer())
  with check (user_id = auth.uid() and public.sono_influencer());
grant select, insert, update, delete on public.mercato_vetrine to authenticated;
grant all on public.mercato_vetrine to service_role;

-- ── Il listino ──────────────────────────────────────────────────────────────
create table if not exists public.mercato_listino (
  id          bigserial primary key,
  influencer  uuid not null references public.profiles(id) on delete cascade,
  titolo      text not null,
  descrizione text,
  prezzo      numeric(10,2) not null check (prezzo >= 0),
  valuta      text not null default 'EUR' check (valuta in ('EUR','ALL')),
  unita       text not null default 'contenuto'
              check (unita in ('contenuto','storia','video','visita','pacchetto','mese')),
  attivo      boolean not null default true,
  ordine      int not null default 100,
  creato      timestamptz not null default now()
);
create index if not exists mercato_listino_di on public.mercato_listino(influencer) where attivo;
alter table public.mercato_listino enable row level security;

-- LA regola: il listino lo leggono i compratori e il proprietario. Punto.
drop policy if exists listino_lettura on public.mercato_listino;
create policy listino_lettura on public.mercato_listino for select
  using (public.sono_compratore() or influencer = auth.uid());
drop policy if exists listino_mio on public.mercato_listino;
create policy listino_mio on public.mercato_listino for all
  using (influencer = auth.uid() and public.sono_influencer())
  with check (influencer = auth.uid() and public.sono_influencer());
grant select, insert, update, delete on public.mercato_listino to authenticated;
grant usage, select on sequence public.mercato_listino_id_seq to authenticated;
grant all on public.mercato_listino to service_role;
grant all on sequence public.mercato_listino_id_seq to service_role;

-- ── La proposta: la trattativa vive dentro POI-LOVE ─────────────────────────
create table if not exists public.mercato_proposte (
  id           uuid primary key default gen_random_uuid(),
  compratore   uuid not null references public.profiles(id) on delete cascade,
  influencer   uuid not null references public.profiles(id) on delete cascade,
  listino_id   bigint references public.mercato_listino(id) on delete set null,
  titolo       text not null,
  importo      numeric(10,2) check (importo is null or importo >= 0),
  valuta       text not null default 'EUR' check (valuta in ('EUR','ALL')),
  -- il 33 per cento deciso il 20/08: scritto sulla proposta alla nascita,
  -- cosi un cambio futuro non riscrive la storia delle trattative vecchie
  commissione_pct numeric(5,2) not null default 33,
  stato        text not null default 'inviata'
               check (stato in ('inviata','accettata','rifiutata','consegnata','pagata','annullata')),
  creato       timestamptz not null default now(),
  aggiornato   timestamptz not null default now(),
  check (compratore <> influencer)
);
create index if not exists proposte_influencer on public.mercato_proposte(influencer, creato desc);
create index if not exists proposte_compratore on public.mercato_proposte(compratore, creato desc);
alter table public.mercato_proposte enable row level security;

-- La vedono solo le due parti (e l amministrazione).
drop policy if exists proposta_parti on public.mercato_proposte;
create policy proposta_parti on public.mercato_proposte for select
  using (compratore = auth.uid() or influencer = auth.uid() or public.sono_admin());
-- La crea solo un compratore, verso un influencer disponibile.
drop policy if exists proposta_crea on public.mercato_proposte;
create policy proposta_crea on public.mercato_proposte for insert
  with check (
    compratore = auth.uid() and public.sono_compratore()
    and exists (select 1 from public.mercato_vetrine v
                 where v.user_id = influencer and v.disponibile)
  );
grant select, insert on public.mercato_proposte to authenticated;
grant all on public.mercato_proposte to service_role;

-- Lo stato cambia solo per strade lecite, e solo per mano della parte giusta.
create or replace function public.mercato_rispondi(p_proposta uuid, p_stato text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v record;
begin
  select * into v from public.mercato_proposte where id = p_proposta;
  if not found then raise exception 'proposta inesistente'; end if;
  if auth.uid() is distinct from v.compratore and auth.uid() is distinct from v.influencer
     and not public.sono_admin() then
    raise exception 'non e una trattativa tua';
  end if;

  -- chi puo fare cosa: l influencer accetta/rifiuta e consegna,
  -- il compratore segna il pagamento o annulla prima dell accordo
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
    if v.stato not in ('inviata','accettata') then
      raise exception 'ormai non si annulla piu';
    end if;
  else
    raise exception 'stato sconosciuto: %', p_stato;
  end if;

  update public.mercato_proposte set stato = p_stato, aggiornato = now() where id = p_proposta;
  return p_stato;
end $$;
grant execute on function public.mercato_rispondi(uuid, text) to authenticated;

-- ── I messaggi della trattativa ─────────────────────────────────────────────
create table if not exists public.mercato_messaggi (
  id          bigserial primary key,
  proposta_id uuid not null references public.mercato_proposte(id) on delete cascade,
  da          uuid not null references public.profiles(id) on delete cascade,
  testo       text not null check (length(testo) between 1 and 4000),
  creato      timestamptz not null default now()
);
create index if not exists mercato_msg_per on public.mercato_messaggi(proposta_id, creato);
alter table public.mercato_messaggi enable row level security;
drop policy if exists msg_parti on public.mercato_messaggi;
create policy msg_parti on public.mercato_messaggi for select
  using (exists (select 1 from public.mercato_proposte p where p.id = proposta_id
                  and (p.compratore = auth.uid() or p.influencer = auth.uid() or public.sono_admin())));
drop policy if exists msg_scrivo on public.mercato_messaggi;
create policy msg_scrivo on public.mercato_messaggi for insert
  with check (da = auth.uid()
    and exists (select 1 from public.mercato_proposte p where p.id = proposta_id
                 and (p.compratore = auth.uid() or p.influencer = auth.uid())
                 and p.stato in ('inviata','accettata','consegnata')));
grant select, insert on public.mercato_messaggi to authenticated;
grant usage, select on sequence public.mercato_messaggi_id_seq to authenticated;
grant all on public.mercato_messaggi to service_role;
grant all on sequence public.mercato_messaggi_id_seq to service_role;

-- ── La vetrina coi numeri veri ──────────────────────────────────────────────
-- Chi compra vede: chi e, dove, su cosa, e i numeri che non si scrivono da
-- soli: luoghi creati, cuori ricevuti, chi lo segue. Presi dalle tabelle vere.
create or replace function public.mercato_vetrina()
returns table (user_id uuid, username text, display_name text, avatar_url text,
               zona text, temi text[], presentazione text,
               luoghi bigint, cuori bigint, seguaci bigint, servizi bigint)
language sql stable security definer set search_path to 'public' as $$
  select v.user_id, p.username, p.display_name, p.avatar_url,
         v.zona, v.temi, v.presentazione,
         (select count(*) from public.pois where author_id = v.user_id and removed_at is null),
         (select count(*) from public.loves l join public.pois po on po.id = l.poi_id
           where po.author_id = v.user_id),
         (select count(*) from public.follows where following_id = v.user_id),
         (select count(*) from public.mercato_listino ml
           where ml.influencer = v.user_id and ml.attivo)
    from public.mercato_vetrine v
    join public.profiles p on p.id = v.user_id
   where v.disponibile
     and coalesce(p.moderation_status, 'active') = 'active'
     and public.sono_compratore()
   order by 8 desc;  -- prima chi ha piu luoghi creati
$$;
grant execute on function public.mercato_vetrina() to authenticated;

notify pgrst, 'reload schema';
select 'mercato pronto' as esito;
