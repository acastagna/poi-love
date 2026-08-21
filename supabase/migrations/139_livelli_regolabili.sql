-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I livelli, regolabili fino in fondo.
-- Fino a oggi dal pannello si poteva solo registrare un abbonamento pagato. Il
-- nome di un livello, quanto costa, cosa dà: erano scritti nel codice e nelle
-- pagine. Adesso sono dati, e si cambiano senza toccare niente.

-- ── Quello che mancava alla tabella dei livelli ─────────────────────────────
alter table public.livelli add column if not exists prezzo numeric(10,2);
alter table public.livelli add column if not exists valuta text not null default 'EUR';
alter table public.livelli add column if not exists periodo text not null default 'anno';
alter table public.livelli add column if not exists audioguide_max int not null default 0;
alter table public.livelli add column if not exists descrizione text;
alter table public.livelli add column if not exists visibile boolean not null default true;

do $$ begin
  alter table public.livelli add constraint livelli_periodo_chk check (periodo in ('mese','anno','una_volta','gratis'));
exception when duplicate_object then null; end $$;

comment on column public.livelli.prezzo is 'quanto costa; vuoto = non si vende, si assegna a mano';
comment on column public.livelli.periodo is 'mese | anno | una_volta | gratis';
comment on column public.livelli.audioguide_max is 'quante audioguide POI-VOICE spettano; 0 = nessuna';
comment on column public.livelli.visibile is 'se no, resta nel database ma non si mostra a nessuno';

update public.livelli set periodo = 'gratis', prezzo = 0 where chiave = 'free' and prezzo is null;

-- ── I vantaggi, uno per uno, come righe ─────────────────────────────────────
-- Prima erano frasi scritte dentro le pagine dei livelli: per cambiarne una
-- bisognava toccare il codice, e le tre lingue andavano fuori sincrono.
create table if not exists public.livello_vantaggi (
  id          serial primary key,
  livello     text not null references public.livelli(chiave) on delete cascade,
  ordine      int  not null default 100,
  testo_it    text not null,
  testo_sq    text,
  testo_en    text,
  icona       text not null default 'ph-check-circle',
  in_evidenza boolean not null default false,   -- quello che si racconta per primo
  attivo      boolean not null default true,
  aggiornato  timestamptz not null default now()
);
create index if not exists livello_vantaggi_idx on public.livello_vantaggi(livello, ordine) where attivo;

alter table public.livello_vantaggi enable row level security;
drop policy if exists vantaggi_leggo on public.livello_vantaggi;
create policy vantaggi_leggo on public.livello_vantaggi for select using (attivo or public.sono_admin());
drop policy if exists vantaggi_admin on public.livello_vantaggi;
create policy vantaggi_admin on public.livello_vantaggi for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select on public.livello_vantaggi to anon, authenticated;
grant insert, update, delete on public.livello_vantaggi to authenticated;
grant usage, select on sequence livello_vantaggi_id_seq to authenticated;
grant all on public.livello_vantaggi to service_role;

-- I vantaggi di partenza, presi da quello che i livelli fanno DAVVERO oggi:
-- si leggono dalle colonne della tabella, non inventati.
insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 10,
       'Fino a ' || l.foto_max || ' foto su ogni luogo',
       'Deri ne ' || l.foto_max || ' foto per cdo vend',
       'Up to ' || l.foto_max || ' photos on every place',
       'ph-images', true
  from public.livelli l where l.foto_max > 0
on conflict do nothing;

insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 20,
       'La tua voce sul luogo, fino a ' || l.audio_secondi || ' secondi',
       'Zeri yt mbi vendin, deri ne ' || l.audio_secondi || ' sekonda',
       'Your voice on the place, up to ' || l.audio_secondi || ' seconds',
       'ph-microphone', true
  from public.livelli l where l.audio_secondi > 0
on conflict do nothing;

insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 30,
       'Video sul luogo, fino a ' || l.video_max || ' e ' || l.video_secondi || ' secondi l uno',
       'Video mbi vendin, deri ne ' || l.video_max || ' dhe ' || l.video_secondi || ' sekonda secili',
       'Video on the place, up to ' || l.video_max || ' of ' || l.video_secondi || ' seconds each',
       'ph-video', false
  from public.livelli l where l.video_max > 0
on conflict do nothing;

insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 40,
       'Metti in evidenza ' || l.evidenze_luoghi || ' luoghi',
       'Vendos ne pah ' || l.evidenze_luoghi || ' vende',
       'Feature ' || l.evidenze_luoghi || ' places',
       'ph-star', false
  from public.livelli l where l.evidenze_luoghi > 0
on conflict do nothing;

insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 50,
       'Ascolti le audioguide anche da lontano',
       'Degjon audioguidat edhe nga larg',
       'Listen to the audio guides from anywhere',
       'ph-headphones', false
  from public.livelli l where l.ascolta_audioguide
on conflict do nothing;

insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 60,
       'Il tuo nome sul Muro dei Sostenitori',
       'Emri yt ne Murin e Mbeshtetesve',
       'Your name on the Supporters Wall',
       'ph-hand-heart', true
  from public.livelli l where l.muro
on conflict do nothing;

insert into public.livello_vantaggi (livello, ordine, testo_it, testo_sq, testo_en, icona, in_evidenza)
select l.chiave, 70,
       'La spunta accanto al tuo nome',
       'Shenja prane emrit tend',
       'The check mark next to your name',
       'ph-seal-check', false
  from public.livelli l where l.spunta
on conflict do nothing;

-- ── Il quadro di un livello, per il pannello e per le pagine pubbliche ──────
create or replace function public.livello_quadro(p_chiave text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'livello', to_jsonb(l),
    'vantaggi', coalesce((
      select jsonb_agg(to_jsonb(v) order by v.ordine)
        from public.livello_vantaggi v
       where v.livello = l.chiave and (v.attivo or public.sono_admin())
    ), '[]'::jsonb),
    'quanti', (select count(*) from public.profiles p where p.special_tier = l.chiave)
  )
  from public.livelli l where l.chiave = p_chiave;
$$;
grant execute on function public.livello_quadro(text) to anon, authenticated;

notify pgrst, 'reload schema';
select chiave, nome, prezzo, periodo, audioguide_max,
       (select count(*) from public.livello_vantaggi v where v.livello = l.chiave) as vantaggi
  from public.livelli l order by ordine;
