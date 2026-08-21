-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il conto delle audioguide in euro, e il preventivo prima di spendere.
--
-- Google fa i conti in dollari, noi paghiamo in euro. Finora il pannello
-- scriveva dollari con l etichetta "dollari" e la colonna si chiamava
-- costo_eur: due bugie che si annullavano solo per caso. Qui si mette ordine:
-- si conserva quello che Google addebita (dollari), si mostra quello che paghi
-- (euro), e il cambio non se lo inventa nessuno: e quello della Banca
-- d Albania che gia arriva ogni giorno nella tabella cambi.

-- Il nome giusto: quello che c e dentro sono dollari.
alter table public.voce_spesa    rename column costo_eur to costo_usd;
alter table public.poi_materiale rename column costo_eur to costo_usd;

-- Quanti euro fa un dollaro, oggi. Passa dal lek perche e da li che arriva il
-- dato ufficiale: dollari in lek, lek in euro.
create or replace function public.usd_in_eur(p_usd numeric)
returns numeric language sql stable set search_path to 'public' as $$
  select round(coalesce(p_usd, 0) * (
    select u.lek / e.lek
      from public.cambi u
      join public.cambi e on e.giorno = u.giorno and e.valuta = 'EUR'
     where u.valuta = 'USD'
     order by u.giorno desc
     limit 1
  ), 4);
$$;
grant execute on function public.usd_in_eur(numeric) to authenticated, service_role;

-- Il preventivo: quanto costa un audio di tanti secondi, in quante lingue.
-- Venticinque gettoni per ogni secondo, venti dollari per milione di gettoni.
-- A lotti si paga la meta, con la consegna entro un giorno.
create or replace function public.voce_preventivo(
  p_secondi numeric, p_lingue int default 3, p_lotti boolean default false
) returns table (usd numeric, eur numeric, secondi_totali numeric)
language sql stable set search_path to 'public' as $$
  with c as (
    select coalesce(p_secondi,0) * greatest(coalesce(p_lingue,1), 1) as sec
  )
  select round(c.sec * 25 * 20 / 1000000.0 * (case when p_lotti then 0.5 else 1 end), 4),
         public.usd_in_eur(c.sec * 25 * 20 / 1000000.0 * (case when p_lotti then 0.5 else 1 end)),
         c.sec
    from c;
$$;
grant execute on function public.voce_preventivo(numeric, int, boolean) to authenticated, service_role;

-- Il conto: dollari veri e euro al cambio di oggi, con la parte buttata in chiaro.
drop function if exists public.voce_conto();
create or replace function public.voce_conto()
returns table (oggi_eur numeric, mese_eur numeric, totale_eur numeric,
               quante_oggi int, quante_totale int, secondi_totali numeric,
               scartate_eur numeric, quante_scartate int, quante_tenute int,
               credito_caricato numeric, resta_stimato numeric, totale_usd numeric)
language sql stable security definer set search_path to 'public' as $$
  with s as (
    select coalesce(sum(costo_usd) filter (where creato::date = current_date), 0) as oggi,
           coalesce(sum(costo_usd) filter (where creato >= date_trunc('month', now())), 0) as mese,
           coalesce(sum(costo_usd), 0)                                            as tutto,
           count(*) filter (where creato::date = current_date)::int                as n_oggi,
           count(*)::int                                                          as n_tutto,
           coalesce(sum(secondi), 0)                                              as sec,
           coalesce(sum(costo_usd) filter (where esito <> 'tenuta'), 0)           as buttato,
           count(*) filter (where esito <> 'tenuta')::int                          as n_buttate,
           count(*) filter (where esito =  'tenuta')::int                          as n_tenute
      from public.voce_spesa where public.sono_admin()
  )
  select public.usd_in_eur(s.oggi), public.usd_in_eur(s.mese), public.usd_in_eur(s.tutto),
         s.n_oggi, s.n_tutto, s.sec,
         public.usd_in_eur(s.buttato), s.n_buttate, s.n_tenute,
         i.credito_caricato,
         case when i.credito_caricato is null then null
              else round(i.credito_caricato - public.usd_in_eur(s.tutto), 2) end,
         s.tutto
    from s cross join public.voce_impostazioni i where i.id = 1;
$$;
grant execute on function public.voce_conto() to authenticated;

-- Il credito caricato adesso si intende in euro: e quello che paghi tu.
comment on column public.voce_impostazioni.credito_caricato is
  'Quanto credito hai caricato su Google, in euro. Serve solo a stimare quanto resta.';

notify pgrst, 'reload schema';
select public.usd_in_eur(1) as un_dollaro_in_euro;
select * from public.voce_preventivo(180, 3, false);
