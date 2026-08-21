-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le voci di POI-VOICE.
-- Trenta voci di Gemini, quattordici femminili e sedici maschili, col genere
-- dichiarato da Google. La cosa che semplifica tutto: una voce NON e' legata a
-- una lingua. Se scegli Kore, Kore parla albanese, italiano e inglese, perche'
-- il modello riconosce la lingua dal testo.
--
-- Quindi ne bastano due, una femminile e una maschile, e valgono per tutte e
-- tre. Si provano e si cambiano da qui.

create table if not exists public.voci (
  nome        text primary key,          -- il nome esatto da mandare a Google
  genere      text not null check (genere in ('femminile','maschile')),
  carattere   text,                      -- come la descrive Google
  nota        text,                      -- come suona a noi, dopo averla sentita
  scelta_per  text check (scelta_per in ('femminile','maschile')),  -- e' quella in uso
  ordine      int not null default 100,
  aggiornato  timestamptz not null default now()
);
-- Una sola voce scelta per genere.
create unique index if not exists voci_una_per_genere on public.voci(scelta_per) where scelta_per is not null;

alter table public.voci enable row level security;
drop policy if exists voci_leggo on public.voci;
create policy voci_leggo on public.voci for select using (true);
drop policy if exists voci_admin on public.voci;
create policy voci_admin on public.voci for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select on public.voci to anon, authenticated;
grant insert, update, delete on public.voci to authenticated;
grant all on public.voci to service_role;

insert into public.voci (nome, genere, carattere, ordine) values
  ('Sulafat','femminile','calda',10),
  ('Vindemiatrix','femminile','gentile',20),
  ('Gacrux','femminile','matura',30),
  ('Achernar','femminile','dolce',40),
  ('Despina','femminile','morbida',50),
  ('Erinome','femminile','nitida',60),
  ('Kore','femminile','ferma',70),
  ('Zephyr','femminile','chiara',80),
  ('Autonoe','femminile','chiara',90),
  ('Callirrhoe','femminile','tranquilla',100),
  ('Aoede','femminile','leggera',110),
  ('Leda','femminile','giovane',120),
  ('Laomedeia','femminile','allegra',130),
  ('Pulcherrima','femminile','decisa',140),
  ('Sadaltager','maschile','competente',10),
  ('Charon','maschile','informativo',20),
  ('Rasalgethi','maschile','informativo',30),
  ('Algieba','maschile','liscio',40),
  ('Iapetus','maschile','nitido',50),
  ('Schedar','maschile','regolare',60),
  ('Achird','maschile','amichevole',70),
  ('Umbriel','maschile','tranquillo',80),
  ('Orus','maschile','fermo',90),
  ('Alnilam','maschile','fermo',100),
  ('Enceladus','maschile','soffiato',110),
  ('Algenib','maschile','roco',120),
  ('Zubenelgenubi','maschile','informale',130),
  ('Sadachbia','maschile','vivace',140),
  ('Puck','maschile','allegro',150),
  ('Fenrir','maschile','acceso',160)
on conflict (nome) do nothing;

-- Le due di partenza: si cambiano dopo averle sentite.
update public.voci set scelta_per = 'femminile' where nome = 'Sulafat';
update public.voci set scelta_per = 'maschile'  where nome = 'Sadaltager';

-- Le impostazioni della voce, in un posto solo.
create table if not exists public.voce_impostazioni (
  id            int primary key default 1 check (id = 1),
  modello       text not null default 'gemini-2.5-pro-tts',
  regia         text,                       -- come recitare, a parole
  secondi_famoso int not null default 360,
  secondi_medio  int not null default 180,
  secondi_normale int not null default 60,
  a_lotti       boolean not null default false,   -- meta prezzo, consegna entro un giorno
  credito_caricato numeric(10,2),                 -- quello che Alessandro ha messo
  aggiornato    timestamptz not null default now()
);
insert into public.voce_impostazioni (id) values (1) on conflict (id) do nothing;
update public.voce_impostazioni set regia = (select testo from public.prompt_modelli where fase='voce' limit 1)
 where regia is null;

alter table public.voce_impostazioni enable row level security;
drop policy if exists voce_imp_leggo on public.voce_impostazioni;
create policy voce_imp_leggo on public.voce_impostazioni for select using (public.sono_admin());
drop policy if exists voce_imp_admin on public.voce_impostazioni;
create policy voce_imp_admin on public.voce_impostazioni for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update on public.voce_impostazioni to authenticated;
grant all on public.voce_impostazioni to service_role;

-- ── Quanto abbiamo speso, contato da noi ───────────────────────────────────
-- Google non dice quanto credito resta: nessuna sua chiamata lo restituisce.
-- Quindi il conto lo teniamo noi, con i gettoni che ogni generazione riporta.
create or replace function public.voce_conto()
returns table (oggi_eur numeric, mese_eur numeric, totale_eur numeric,
               quante_oggi int, quante_totale int, secondi_totali numeric,
               credito_caricato numeric, resta_stimato numeric)
language sql stable security definer set search_path to 'public' as $$
  with s as (
    select coalesce(sum(costo_eur) filter (where creato::date = current_date), 0) as oggi,
           coalesce(sum(costo_eur) filter (where creato >= date_trunc('month', now())), 0) as mese,
           coalesce(sum(costo_eur), 0) as tutto,
           count(*) filter (where creato::date = current_date)::int as n_oggi,
           count(*)::int as n_tutto,
           coalesce(sum(secondi), 0) as sec
      from public.poi_materiale where fase = 'voce' and public.sono_admin()
  )
  select s.oggi, s.mese, s.tutto, s.n_oggi, s.n_tutto, s.sec,
         i.credito_caricato,
         case when i.credito_caricato is null then null else i.credito_caricato - s.tutto end
    from s cross join public.voce_impostazioni i where i.id = 1;
$$;
grant execute on function public.voce_conto() to authenticated;

notify pgrst, 'reload schema';
select genere, count(*) as quante, string_agg(nome, ', ' order by ordine) filter (where scelta_per is not null) as in_uso
  from public.voci group by genere;
