-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le recensioni, come deciso il 20/08/2026.
--   Valgono per i LUOGHI, mai per le persone.
--   Le scrive solo chi e' amico di chi ha creato il luogo. Una a testa.
--   Da 0 a 5 love, la media ha i decimali. Recensire vale 200 punti.
--   Se chi ha scritto smette di seguire, la sua recensione sparisce.
--   Se il locale blocca o smette di seguire, la recensione RESTA.
--   Prima di comparire passa dalla moderazione, guidata da direttive scritte.

create table if not exists public.recensioni (
  id          uuid primary key default gen_random_uuid(),
  poi_id      uuid not null references public.pois(id) on delete cascade,
  autore_id   uuid not null references public.profiles(id) on delete cascade,
  voto        numeric(2,1) not null check (voto >= 0 and voto <= 5),
  testo       text check (testo is null or length(testo) <= 1000),
  stato       text not null default 'in_coda' check (stato in ('pubblicata','in_coda','rifiutata')),
  motivo      text,
  direttiva   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (poi_id, autore_id)
);
create index if not exists recensioni_poi_idx on public.recensioni(poi_id, stato);

alter table public.recensioni enable row level security;

-- Le recensioni pubblicate le legge chiunque, ma solo finche' chi le ha scritte
-- segue ancora chi ha creato il luogo: e' la regola dell'amicizia che si scioglie.
drop policy if exists rec_leggo_pubblicate on public.recensioni;
create policy rec_leggo_pubblicate on public.recensioni for select using (
  stato = 'pubblicata'
  and exists (
    select 1 from public.pois p
    join public.follows f on f.follower_id = recensioni.autore_id and f.following_id = p.author_id
    where p.id = recensioni.poi_id
  )
);
drop policy if exists rec_leggo_mie on public.recensioni;
create policy rec_leggo_mie on public.recensioni for select using (auth.uid() = autore_id);

-- Si scrive solo se si e' amici di chi ha creato il luogo, e mai sul proprio.
drop policy if exists rec_scrivo_se_amico on public.recensioni;
create policy rec_scrivo_se_amico on public.recensioni for insert with check (
  auth.uid() = autore_id
  and exists (
    select 1 from public.pois p
    where p.id = poi_id and p.author_id <> auth.uid() and public.siamo_amici(p.author_id)
  )
);
drop policy if exists rec_correggo_mia on public.recensioni;
create policy rec_correggo_mia on public.recensioni for update using (auth.uid() = autore_id) with check (auth.uid() = autore_id);
drop policy if exists rec_tolgo_mia on public.recensioni;
create policy rec_tolgo_mia on public.recensioni for delete using (auth.uid() = autore_id);
grant select, insert, update, delete on public.recensioni to authenticated;
grant select on public.recensioni to anon;

-- Le direttive della moderazione: le scrive l'amministrazione, non stanno nel codice.
create table if not exists public.direttive_moderazione (
  id        serial primary key,
  ambito    text not null default 'recensioni',
  regola    text not null,
  esempio   text,
  attiva    boolean not null default true,
  ordine    int not null default 100
);
alter table public.direttive_moderazione enable row level security;
drop policy if exists direttive_lettura on public.direttive_moderazione;
create policy direttive_lettura on public.direttive_moderazione for select using (true);
grant select on public.direttive_moderazione to anon, authenticated;

insert into public.direttive_moderazione (regola, esempio, ordine)
select * from (values
 ('Niente insulti, minacce, parole d''odio verso persone o gruppi.', 'sei un imbecille', 10),
 ('Niente contenuti razzisti, sessisti o discriminatori.', null, 20),
 ('Niente dati personali di altri: nomi di dipendenti, numeri di telefono, indirizzi privati.', 'il cameriere Marco abita in via...', 30),
 ('Niente numeri di telefono, email o collegamenti pubblicitari.', 'chiama il 333...', 40),
 ('Niente attacchi ai concorrenti o confronti con altri locali per denigrarli.', 'meglio andare dal loro concorrente', 50),
 ('Il testo deve parlare del luogo: fuori tema si mette in coda.', 'oggi piove e sono triste', 60),
 ('Niente recensioni palesemente false o copiate.', null, 70),
 ('Un voto senza testo si pubblica: non tutti scrivono, e va bene.', null, 80)
) v where not exists (select 1 from public.direttive_moderazione);

-- La media di un luogo, con i decimali.
create or replace function public.media_recensioni(p_poi uuid)
returns table (media numeric, quante int) language sql stable as $$
  select round(avg(voto)::numeric, 1), count(*)::int
  from public.recensioni where poi_id = p_poi and stato = 'pubblicata';
$$;
grant execute on function public.media_recensioni(uuid) to anon, authenticated;

-- Recensire vale 200 punti, una volta sola per luogo.
insert into public.gamification_config (key, value)
select 'points_per_action', '{}'::jsonb where not exists (select 1 from public.gamification_config where key='points_per_action');
update public.gamification_config
   set value = jsonb_set(coalesce(value,'{}'::jsonb), '{recensione}', '200'::jsonb)
 where key = 'points_per_action';

create or replace function public.tg_recensione_punti() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.stato = 'pubblicata' and (tg_op = 'INSERT' or old.stato is distinct from 'pubblicata') then
    begin
      perform public.award_points(new.autore_id, 'recensione', new.poi_id::text);
    exception when others then null;
    end;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists recensione_punti on public.recensioni;
create trigger recensione_punti before insert or update on public.recensioni
  for each row execute function public.tg_recensione_punti();

notify pgrst, 'reload schema';
