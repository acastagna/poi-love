-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Locale Plus, le fondamenta.
-- La scheda del luogo E' il profilo del locale: non c'e' una seconda pagina.
-- Qui sotto vivono le cose che un locale ha in piu' di un luogo qualsiasi:
-- gli orari giorno per giorno (anche con due turni), il menu diviso in sezioni
-- con i piatti e i Consigli dello Chef, i modi di pagare, la prenotazione,
-- e il conto delle visite per le statistiche.
--
-- Chi puo' scrivere: solo chi ha creato il luogo. Chi puo' leggere: tutti.

-- ── I dati del locale ────────────────────────────────────────────────────────
create table if not exists public.locali (
  poi_id                uuid primary key references public.pois(id) on delete cascade,
  telefono              text,
  whatsapp              text,
  sito                  text,
  prenotazione_url      text,
  prenotazione_telefono text,
  pagamenti             text[] not null default '{}',   -- contanti, carta, satispay, paypal...
  categoria_propria     text,                            -- la categoria che sceglie lui
  valuta_base           text not null default 'ALL',
  note                  text,
  aggiornato            timestamptz not null default now()
);

-- ── Gli orari, giorno per giorno, anche con due turni ────────────────────────
create table if not exists public.locale_orari (
  id       uuid primary key default gen_random_uuid(),
  poi_id   uuid not null references public.pois(id) on delete cascade,
  giorno   int  not null check (giorno between 0 and 6),   -- 0 = lunedi
  apre     time,
  chiude   time,
  chiuso   boolean not null default false,
  ordine   int not null default 0                          -- 0 = primo turno, 1 = secondo
);
create index if not exists locale_orari_idx on public.locale_orari(poi_id, giorno, ordine);

-- ── Il menu: sezioni e piatti ────────────────────────────────────────────────
create table if not exists public.locale_menu_sezioni (
  id       uuid primary key default gen_random_uuid(),
  poi_id   uuid not null references public.pois(id) on delete cascade,
  nome     text not null check (length(nome) between 1 and 80),
  ordine   int  not null default 100
);
create index if not exists locale_sezioni_idx on public.locale_menu_sezioni(poi_id, ordine);

create table if not exists public.locale_piatti (
  id           uuid primary key default gen_random_uuid(),
  poi_id       uuid not null references public.pois(id) on delete cascade,
  sezione_id   uuid references public.locale_menu_sezioni(id) on delete set null,
  nome         text not null check (length(nome) between 1 and 120),
  descrizione  text check (descrizione is null or length(descrizione) <= 600),
  prezzo       numeric(10,2) check (prezzo is null or prezzo >= 0),
  valuta       text not null default 'ALL',
  foto         text,
  chef         boolean not null default false,     -- Consigli dello Chef
  disponibile  boolean not null default true,
  ordine       int not null default 100
);
create index if not exists locale_piatti_idx on public.locale_piatti(poi_id, sezione_id, ordine);

-- ── Le visite, per le statistiche ────────────────────────────────────────────
create table if not exists public.locale_visite (
  poi_id uuid not null references public.pois(id) on delete cascade,
  giorno date not null default current_date,
  viste  int  not null default 0,
  primary key (poi_id, giorno)
);

-- ── Chi comanda su questo locale ─────────────────────────────────────────────
create or replace function public.sono_il_locale(p_poi uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.pois where id = p_poi and author_id = auth.uid());
$$;
grant execute on function public.sono_il_locale(uuid) to authenticated, anon, service_role;

do $$
declare t text;
begin
  foreach t in array array['locali','locale_orari','locale_menu_sezioni','locale_piatti'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_leggo', t);
    execute format('create policy %I on public.%I for select using (true)', t||'_leggo', t);
    execute format('drop policy if exists %I on public.%I', t||'_scrivo', t);
    execute format('create policy %I on public.%I for all using (public.sono_il_locale(poi_id)) with check (public.sono_il_locale(poi_id))', t||'_scrivo', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select on public.%I to anon', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

alter table public.locale_visite enable row level security;
drop policy if exists visite_leggo on public.locale_visite;
create policy visite_leggo on public.locale_visite for select using (public.sono_il_locale(poi_id));
grant select on public.locale_visite to authenticated;
grant all on public.locale_visite to service_role;

-- Segnare una visita: lo puo' fare chiunque apra la scheda, ma solo un colpo per volta
-- e senza poter leggere i numeri degli altri.
create or replace function public.segna_visita(p_poi uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.locale_visite(poi_id, giorno, viste) values (p_poi, current_date, 1)
  on conflict (poi_id, giorno) do update set viste = public.locale_visite.viste + 1;
exception when others then null;
end $$;
grant execute on function public.segna_visita(uuid) to anon, authenticated;

-- ── Aperto adesso? La risposta, con l'ora di Tirana ──────────────────────────
create or replace function public.locale_adesso(p_poi uuid)
returns table (aperto boolean, fino time, prossimo_giorno int, prossimo_apre time)
language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_ora   time := (now() at time zone 'Europe/Tirane')::time;
  v_oggi  int  := extract(isodow from (now() at time zone 'Europe/Tirane'))::int - 1;  -- 0 = lunedi
  r record; i int;
begin
  -- i turni di oggi
  for r in select * from public.locale_orari where poi_id = p_poi and giorno = v_oggi and not chiuso loop
    if r.apre is not null and r.chiude is not null then
      if (r.chiude > r.apre  and v_ora >= r.apre and v_ora < r.chiude)          -- turno normale
      or (r.chiude <= r.apre and v_ora >= r.apre) then                          -- comincia oggi e finisce domani
        aperto := true; fino := r.chiude; prossimo_giorno := null; prossimo_apre := null;
        return next; return;
      end if;
    end if;
  end loop;

  -- il turno di ieri che sconfina nella notte: alle due del mattino il locale
  -- che ha aperto ieri sera e chiude alle tre e' ancora aperto
  for r in select * from public.locale_orari where poi_id = p_poi and giorno = (v_oggi + 6) % 7 and not chiuso loop
    if r.apre is not null and r.chiude is not null and r.chiude <= r.apre and v_ora < r.chiude then
      aperto := true; fino := r.chiude; prossimo_giorno := null; prossimo_apre := null;
      return next; return;
    end if;
  end loop;

  -- chiuso: si cerca la prima apertura nei sette giorni che vengono
  for i in 0..6 loop
    select giorno, apre into prossimo_giorno, prossimo_apre
      from public.locale_orari
     where poi_id = p_poi and giorno = (v_oggi + i) % 7 and not chiuso and apre is not null
       and (i > 0 or apre > v_ora)
     order by apre limit 1;
    if prossimo_apre is not null then exit; end if;
  end loop;
  aperto := false; fino := null; return next;
end $$;
grant execute on function public.locale_adesso(uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
