-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I promemoria di scadenza e le ricevute (blocco 47).
--
-- Il motore delle condizioni (109) interviene DOPO lo sforamento. Qui si
-- avvisa PRIMA: a trenta, sette e un giorno dalla scadenza dell abbonamento,
-- una notifica gentile. E le ricevute: l amministrazione carica il documento
-- del pagamento, l utente lo trova nel suo pannello e lo scarica.

alter type notification_event add value if not exists 'abbonamento_promemoria';

-- Un promemoria non si ripete: si segna quale soglia e' gia stata avvisata.
create table if not exists public.abbonamento_promemoria (
  abbonamento_id uuid not null references public.abbonamenti(id) on delete cascade,
  soglia         int  not null check (soglia in (30, 7, 1)),
  mandato_il     timestamptz not null default now(),
  primary key (abbonamento_id, soglia)
);
alter table public.abbonamento_promemoria enable row level security;
drop policy if exists prom_mio on public.abbonamento_promemoria;
create policy prom_mio on public.abbonamento_promemoria for select
  using (exists (select 1 from public.abbonamenti a
                  where a.id = abbonamento_id and (a.user_id = auth.uid() or public.sono_admin())));
grant select on public.abbonamento_promemoria to authenticated;
grant all on public.abbonamento_promemoria to service_role;

-- Le ricevute: il documento vive sul server dei file, qui il registro.
create table if not exists public.ricevute (
  id             uuid primary key default gen_random_uuid(),
  abbonamento_id uuid not null references public.abbonamenti(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  numero         text not null,                -- es. 2026-0001
  importo        numeric(10,2),
  valuta         text not null default 'EUR',
  file_nome      text not null,                -- il nome sul server dei file, mai indovinabile
  emessa_il      date not null default current_date,
  caricata_da    uuid references public.profiles(id) on delete set null,
  creato         timestamptz not null default now()
);
create unique index if not exists ricevute_numero on public.ricevute(numero);
alter table public.ricevute enable row level security;
drop policy if exists ricevute_mie on public.ricevute;
create policy ricevute_mie on public.ricevute for select
  using (user_id = auth.uid() or public.sono_admin());
drop policy if exists ricevute_admin on public.ricevute;
create policy ricevute_admin on public.ricevute for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.ricevute to authenticated;
grant all on public.ricevute to service_role;

-- Il giro dei promemoria: lo chiama il lavoro della notte.
create or replace function public.manda_promemoria_scadenze()
returns table (mandati int)
language plpgsql security definer set search_path to 'public' as $$
declare r record; v int := 0; g int;
begin
  for r in
    select a.id, a.user_id, a.scadenza, l.nome
      from public.abbonamenti a join public.livelli l on l.chiave = a.livello
     where a.stato = 'attivo' and a.scadenza >= current_date
  loop
    g := r.scadenza - current_date;
    -- La soglia che tocca oggi: la piu' stretta in cui rientriamo. E chi ha
    -- gia' avuto un avviso uguale o piu' stretto non riceve quello largo:
    -- alla prima stesura il secondo giro riavvisava scalando alla soglia
    -- sopra, e la prova doppia l'ha stanato.
    declare v_soglia int;
    begin
      v_soglia := case when g <= 1 then 1 when g <= 7 then 7 when g <= 30 then 30 else null end;
      if v_soglia is null then continue; end if;
      if exists (select 1 from public.abbonamento_promemoria
                  where abbonamento_id = r.id and soglia <= v_soglia) then
        continue;
      end if;
      insert into public.abbonamento_promemoria values (r.id, v_soglia);
    end;
    insert into public.notifications (user_id, event, data)
    values (r.user_id, 'abbonamento_promemoria',
            jsonb_build_object('livello', r.nome, 'giorni', g, 'scadenza', r.scadenza));
    v := v + 1;
  end loop;
  mandati := v; return next;
end $$;
revoke all on function public.manda_promemoria_scadenze() from public, anon, authenticated;
grant execute on function public.manda_promemoria_scadenze() to service_role;

notify pgrst, 'reload schema';
select 'promemoria e ricevute pronti' as esito;
