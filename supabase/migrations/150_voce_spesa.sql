-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il conto delle audioguide: si paga anche quello che si butta.
--
-- Prima il conto guardava il materiale rimasto: una prova rifatta piu corta
-- spariva dal conto pur essendo stata pagata. Da qui in avanti ogni generazione
-- lascia una riga qui dentro, e questa riga non si cancella mai. Il totale e la
-- somma di tutto: tenute, scartate e fallite.

create table if not exists public.voce_spesa (
  id            bigserial primary key,
  poi_id        uuid references public.pois(id) on delete set null,
  titolo        text,                    -- copia del nome: se il luogo sparisce il conto resta leggibile
  lingua        text,
  voce_f        text,
  voce_m        text,
  secondi       numeric  not null default 0,
  gettoni_in    int      not null default 0,
  gettoni_out   int      not null default 0,
  costo_eur     numeric  not null default 0,
  esito         text     not null default 'tenuta' check (esito in ('tenuta','scartata','fallita')),
  motivo        text,                    -- perche e stata buttata: rifatta piu corta, non piaceva, errore
  materiale_id  uuid references public.poi_materiale(id) on delete set null,
  creato        timestamptz not null default now()
);
create index if not exists voce_spesa_creato on public.voce_spesa(creato desc);
create index if not exists voce_spesa_poi on public.voce_spesa(poi_id);

alter table public.voce_spesa enable row level security;
drop policy if exists spesa_admin on public.voce_spesa;
create policy spesa_admin on public.voce_spesa for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update on public.voce_spesa to authenticated;
grant all on public.voce_spesa to service_role;
-- niente delete a nessuno: il registro di cassa non si cancella
revoke delete on public.voce_spesa from authenticated;

-- Recupero quello che c'e gia: le voci tenute finora diventano righe del registro.
insert into public.voce_spesa (poi_id, titolo, lingua, secondi, costo_eur, esito, materiale_id, creato)
select m.poi_id, p.title, m.lingua, coalesce(m.secondi,0), coalesce(m.costo_eur,0), 'tenuta', m.id, m.creato
  from public.poi_materiale m left join public.pois p on p.id = m.poi_id
 where m.fase = 'voce'
   and not exists (select 1 from public.voce_spesa s where s.materiale_id = m.id);

-- Una riga di registro per ogni generazione. La chiama chi genera, subito dopo
-- la risposta di Google, prima ancora di sapere se il risultato piacera.
create or replace function public.voce_segna_spesa(
  p_poi uuid, p_lingua text, p_secondi numeric, p_gettoni_in int, p_gettoni_out int,
  p_costo numeric, p_voce_f text default null, p_voce_m text default null,
  p_esito text default 'tenuta', p_motivo text default null, p_materiale uuid default null
) returns bigint
language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint;
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  insert into public.voce_spesa (poi_id, titolo, lingua, secondi, gettoni_in, gettoni_out,
                                 costo_eur, voce_f, voce_m, esito, motivo, materiale_id)
  select p_poi, (select title from public.pois where id = p_poi), p_lingua, coalesce(p_secondi,0),
         coalesce(p_gettoni_in,0), coalesce(p_gettoni_out,0), coalesce(p_costo,0),
         p_voce_f, p_voce_m, coalesce(p_esito,'tenuta'), p_motivo, p_materiale
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.voce_segna_spesa(uuid,text,numeric,int,int,numeric,text,text,text,text,uuid) to authenticated;

-- Segna come buttata una prova gia pagata: il costo resta nel totale.
create or replace function public.voce_butta(p_id bigint, p_motivo text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.sono_admin() then raise exception 'solo un amministratore'; end if;
  update public.voce_spesa set esito = 'scartata', motivo = coalesce(p_motivo, motivo)
   where id = p_id;
  return found;
end $$;
grant execute on function public.voce_butta(bigint, text) to authenticated;

-- Il conto: tutto quello che e stato pagato, con la parte buttata in chiaro.
drop function if exists public.voce_conto();
create or replace function public.voce_conto()
returns table (oggi_eur numeric, mese_eur numeric, totale_eur numeric,
               quante_oggi int, quante_totale int, secondi_totali numeric,
               scartate_eur numeric, quante_scartate int, quante_tenute int,
               credito_caricato numeric, resta_stimato numeric)
language sql stable security definer set search_path to 'public' as $$
  with s as (
    select coalesce(sum(costo_eur) filter (where creato::date = current_date), 0) as oggi,
           coalesce(sum(costo_eur) filter (where creato >= date_trunc('month', now())), 0) as mese,
           coalesce(sum(costo_eur), 0)                                            as tutto,
           count(*) filter (where creato::date = current_date)::int                as n_oggi,
           count(*)::int                                                          as n_tutto,
           coalesce(sum(secondi), 0)                                              as sec,
           coalesce(sum(costo_eur) filter (where esito <> 'tenuta'), 0)           as buttato,
           count(*) filter (where esito <> 'tenuta')::int                          as n_buttate,
           count(*) filter (where esito =  'tenuta')::int                          as n_tenute
      from public.voce_spesa where public.sono_admin()
  )
  select s.oggi, s.mese, s.tutto, s.n_oggi, s.n_tutto, s.sec,
         s.buttato, s.n_buttate, s.n_tenute,
         i.credito_caricato,
         case when i.credito_caricato is null then null else i.credito_caricato - s.tutto end
    from s cross join public.voce_impostazioni i where i.id = 1;
$$;
grant execute on function public.voce_conto() to authenticated;

notify pgrst, 'reload schema';
select count(*) as righe_registro from public.voce_spesa;
