-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le segnalazioni.
-- La coda c'era, il pannello pure: mancava il modo di segnalare. Nessuno,
-- dall'app, poteva dire "questo contenuto non va". Apple lo pretende, e prima
-- ancora lo pretende il buon senso: chi si sente offeso deve poterlo dire.
--
-- Si possono segnalare anche le recensioni e i messaggi delle compagnie, non
-- solo i luoghi e le persone. E ogni segnalazione ha una scadenza: ventiquattro
-- ore, che e' il tempo entro cui promettiamo di guardarla.

alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type = any (array['poi','user','recensione','messaggio','audioguida']));

alter table public.reports add column if not exists scade_il timestamptz;
update public.reports set scade_il = created_at + interval '24 hours' where scade_il is null;

create or replace function public.tg_report_scadenza() returns trigger
language plpgsql as $$
begin
  if new.scade_il is null then new.scade_il := coalesce(new.created_at, now()) + interval '24 hours'; end if;
  return new;
end $$;
drop trigger if exists report_scadenza on public.reports;
create trigger report_scadenza before insert on public.reports
  for each row execute function public.tg_report_scadenza();

create index if not exists reports_aperte on public.reports(status, scade_il) where status in ('open','reviewing');

-- Quante ne restano da guardare e quante sono gia' oltre le ventiquattro ore.
create or replace function public.segnalazioni_da_guardare()
returns table (aperte int, in_ritardo int, piu_vecchia timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select count(*)::int,
         count(*) filter (where scade_il < now())::int,
         min(created_at)
    from public.reports where status in ('open','reviewing');
$$;
grant execute on function public.segnalazioni_da_guardare() to authenticated;

notify pgrst, 'reload schema';
