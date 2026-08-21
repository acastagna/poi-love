-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I QR veri.
-- Fino a ieri i codici li disegnava un servizio esterno: ogni volta l'indirizzo
-- del profilo usciva da casa nostra, e il giorno che quel servizio chiude i QR
-- stampati in vetrina smettono di funzionare. Adesso li facciamo noi, sulla
-- nostra macchina, e sappiamo quante volte vengono inquadrati.
--
-- Tre tipi, come previsto: il locale, il professionista, l'influencer.

create table if not exists public.qr_codici (
  codice     text primary key,                        -- sta dentro l'indirizzo stampato
  tipo       text not null check (tipo in ('locale','professionista','influencer','luogo')),
  poi_id     uuid references public.pois(id) on delete cascade,
  profilo_id uuid references public.profiles(id) on delete cascade,
  etichetta  text,                                    -- come lo chiama lui: "vetrina", "tavoli", "biglietti"
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  constraint qr_una_sola_casa check (num_nonnulls(poi_id, profilo_id) = 1)
);
create index if not exists qr_poi_idx     on public.qr_codici(poi_id);
create index if not exists qr_profilo_idx on public.qr_codici(profilo_id);

create table if not exists public.qr_scansioni (
  codice text not null references public.qr_codici(codice) on delete cascade,
  giorno date not null default current_date,
  quante int not null default 0,
  primary key (codice, giorno)
);

alter table public.qr_codici    enable row level security;
alter table public.qr_scansioni enable row level security;

-- Il codice lo legge chiunque (serve a chi inquadra), ma lo crea e lo spegne
-- solo il padrone di casa: chi ha creato il luogo, o la persona stessa.
create or replace function public.qr_e_mio(p_poi uuid, p_profilo uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select case
    when p_poi is not null     then exists (select 1 from public.pois where id = p_poi and author_id = auth.uid())
    when p_profilo is not null then p_profilo = auth.uid()
    else false end;
$$;
grant execute on function public.qr_e_mio(uuid, uuid) to authenticated, anon, service_role;

drop policy if exists qr_leggo on public.qr_codici;
create policy qr_leggo on public.qr_codici for select using (true);
drop policy if exists qr_mio on public.qr_codici;
create policy qr_mio on public.qr_codici for all
  using (public.qr_e_mio(poi_id, profilo_id)) with check (public.qr_e_mio(poi_id, profilo_id));
grant select on public.qr_codici to anon, authenticated;
grant insert, update, delete on public.qr_codici to authenticated;
grant all on public.qr_codici to service_role;

drop policy if exists scans_mie on public.qr_scansioni;
create policy scans_mie on public.qr_scansioni for select using (
  exists (select 1 from public.qr_codici q where q.codice = qr_scansioni.codice and public.qr_e_mio(q.poi_id, q.profilo_id))
);
grant select on public.qr_scansioni to authenticated;
grant all on public.qr_scansioni to service_role;

-- Segnare che qualcuno ha inquadrato: lo puo' chiamare chiunque, anche chi non
-- e' collegato, ma non puo' leggere i numeri degli altri.
create or replace function public.segna_scansione(p_codice text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from public.qr_codici where codice = p_codice and attivo) then return; end if;
  insert into public.qr_scansioni(codice, giorno, quante) values (p_codice, current_date, 1)
  on conflict (codice, giorno) do update set quante = public.qr_scansioni.quante + 1;
exception when others then null;
end $$;
grant execute on function public.segna_scansione(text) to anon, authenticated;

-- Dove porta un codice: serve al server per mandare chi inquadra nel posto giusto.
create or replace function public.qr_destinazione(p_codice text)
returns table (tipo text, poi_id uuid, profilo_id uuid, username text)
language sql stable security definer set search_path to 'public' as $$
  select q.tipo, q.poi_id, q.profilo_id, p.username
    from public.qr_codici q
    left join public.profiles p on p.id = q.profilo_id
   where q.codice = p_codice and q.attivo;
$$;
grant execute on function public.qr_destinazione(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
