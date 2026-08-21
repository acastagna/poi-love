-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I due capi della coda.
-- Il pannello chiede, e chi sta girando sul Mac di Alessandro risponde con la
-- sua connessione: cosi' ricerca e copione non costano niente. La chiave a
-- pagamento resta la riserva per quando nessuno sta girando.

alter table public.ai_coda add column if not exists modello_id int references public.prompt_modelli(id) on delete set null;
alter table public.ai_coda add column if not exists poi_id uuid references public.pois(id) on delete cascade;
alter table public.ai_coda add column if not exists trip_id uuid references public.trips(id) on delete cascade;
alter table public.ai_coda add column if not exists preso_da text;   -- chi l'ha presa: 'mac' o 'chiave'
alter table public.ai_coda add column if not exists costo_eur numeric(10,6);

create index if not exists ai_coda_per_luogo on public.ai_coda(poi_id, chiesto_il desc);

-- ── Il capo del pannello: mettere una domanda in coda ───────────────────────
create or replace function public.coda_chiedi(
  p_fase text, p_domanda text, p_poi uuid default null, p_trip uuid default null,
  p_modello int default null, p_contesto jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare nuovo uuid;
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo chiedere alla coda' using errcode='42501';
  end if;
  if coalesce(trim(p_domanda),'') = '' then
    raise exception 'La domanda non puo essere vuota' using errcode='22023';
  end if;
  insert into public.ai_coda (chiesto_da, fase, domanda, poi_id, trip_id, modello_id, contesto)
  values (auth.uid(), p_fase, p_domanda, p_poi, p_trip, p_modello, coalesce(p_contesto,'{}'::jsonb))
  returning id into nuovo;
  if p_modello is not null then
    update public.prompt_modelli set usato = usato + 1 where id = p_modello;
  end if;
  return nuovo;
end $$;
grant execute on function public.coda_chiedi(text, text, uuid, uuid, int, jsonb) to authenticated;

-- ── Il capo del Mac: prendere la prossima e riportare la risposta ───────────
-- Prendere e segnare "in corso" nello stesso momento: se due lavoratori
-- partissero insieme, senza questo si prenderebbero la stessa domanda.
create or replace function public.coda_prendi(p_chi text default 'mac')
returns table (id uuid, fase text, domanda text, poi_id uuid, trip_id uuid, contesto jsonb)
language plpgsql security definer set search_path to 'public' as $$
begin
  return query
  with presa as (
    update public.ai_coda c
       set stato = 'in_corso', presa_il = now(), preso_da = p_chi
     where c.id = (
       select c2.id from public.ai_coda c2
        where c2.stato = 'in_attesa'
        order by c2.chiesto_il
        for update skip locked
        limit 1)
    returning c.id, c.fase, c.domanda, c.poi_id, c.trip_id, c.contesto
  )
  select * from presa;
end $$;
grant execute on function public.coda_prendi(text) to service_role;

create or replace function public.coda_rispondi(
  p_id uuid, p_risposta text, p_costo numeric default 0)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  update public.ai_coda
     set risposta = p_risposta, stato = 'fatta', finita_il = now(), costo_eur = p_costo
   where id = p_id and stato = 'in_corso';
  return found;
end $$;
grant execute on function public.coda_rispondi(uuid, text, numeric) to service_role;

create or replace function public.coda_fallita(p_id uuid, p_motivo text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  update public.ai_coda
     set stato = 'fallita', motivo = left(p_motivo, 400), finita_il = now()
   where id = p_id and stato = 'in_corso';
  return found;
end $$;
grant execute on function public.coda_fallita(uuid, text) to service_role;

-- Una domanda presa e mai finita non deve restare bloccata per sempre.
create or replace function public.coda_sblocca()
returns int language plpgsql security definer set search_path to 'public' as $$
declare quante int;
begin
  update public.ai_coda
     set stato = 'in_attesa', presa_il = null, preso_da = null
   where stato = 'in_corso' and presa_il < now() - interval '20 minutes';
  get diagnostics quante = row_count;
  return quante;
end $$;
grant execute on function public.coda_sblocca() to authenticated, service_role;

notify pgrst, 'reload schema';
