-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Abbonamenti: registrazione, scadenza, decadenza.
-- Il pagamento oggi avviene FUORI dal sistema (bonifico, contanti, altro): qui
-- si registra che e' stato pagato, per quale livello e fino a quando. Da quel
-- momento il livello vale davvero, e il controllo della notte (migrazione 109)
-- avvisa prima della scadenza e lo spegne se il rinnovo non arriva.
--
-- Nessun prezzo in questo file: i listini stanno solo nella cartella riservata.

create table if not exists public.abbonamenti (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  livello       text not null references public.livelli(chiave),
  inizio        date not null default current_date,
  scadenza      date not null,
  stato         text not null default 'attivo' check (stato in ('attivo','scaduto','annullato')),
  pagato_fuori  boolean not null default true,     -- oggi si paga fuori dal sistema
  riferimento   text,                              -- numero del bonifico, ricevuta, nota
  registrato_da uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  check (scadenza > inizio)
);
create index if not exists abbonamenti_utente on public.abbonamenti(user_id, scadenza desc);

alter table public.abbonamenti enable row level security;
drop policy if exists abb_mio on public.abbonamenti;
create policy abb_mio on public.abbonamenti for select using (auth.uid() = user_id);
drop policy if exists abb_admin on public.abbonamenti;
create policy abb_admin on public.abbonamenti for all using (public.sono_admin()) with check (public.sono_admin());
grant select on public.abbonamenti to authenticated;
grant insert, update on public.abbonamenti to authenticated;
grant all on public.abbonamenti to service_role;

-- Registrare un abbonamento pagato fuori dal sistema. La puo' chiamare solo
-- l'amministrazione: assegna il livello e scrive la data di rinnovo, che e'
-- quella che il controllo della notte guarda.
create or replace function public.registra_abbonamento(
  p_user uuid, p_livello text, p_mesi int default 12, p_riferimento text default null)
returns table (r_id uuid, r_livello text, r_scadenza date)
language plpgsql security definer set search_path to 'public' as $$
declare
  v_scadenza date;
  v_id uuid;
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione puo registrare un abbonamento';
  end if;
  if not exists (select 1 from public.livelli where chiave = p_livello) then
    raise exception 'Livello sconosciuto: %', p_livello;
  end if;
  if p_mesi is null or p_mesi < 1 or p_mesi > 60 then p_mesi := 12; end if;

  -- se ne aveva gia' uno attivo, il nuovo periodo parte da quella scadenza
  select greatest(coalesce(max(a.scadenza), current_date), current_date) into v_scadenza
    from public.abbonamenti a where a.user_id = p_user and a.stato = 'attivo';
  v_scadenza := v_scadenza + (p_mesi || ' months')::interval;

  insert into public.abbonamenti(user_id, livello, scadenza, riferimento, registrato_da)
  values (p_user, p_livello, v_scadenza, p_riferimento, auth.uid())
  returning abbonamenti.id into v_id;

  update public.profiles
     set special_tier = p_livello,
         livello_scadenza = v_scadenza,
         livello_avviso_il = null
   where profiles.id = p_user;

  insert into public.livello_eventi(user_id, livello, cosa, motivo)
  values (p_user, p_livello, 'assegnato',
          'abbonamento registrato fino al ' || to_char(v_scadenza,'DD/MM/YYYY') ||
          coalesce(' · ' || p_riferimento, ''));

  begin
    insert into public.notifications(user_id, event, data)
    values (p_user, 'livello_avviso',
            jsonb_build_object('livello', p_livello, 'motivo',
              'Abbonamento attivo fino al ' || to_char(v_scadenza,'DD/MM/YYYY')));
  exception when others then null;
  end;

  return query select v_id, p_livello, v_scadenza::date;
end $$;
revoke all on function public.registra_abbonamento(uuid, text, int, text) from public, anon;
grant execute on function public.registra_abbonamento(uuid, text, int, text) to authenticated, service_role;

-- Il mio abbonamento, come lo vede l'app.
create or replace function public.mio_abbonamento()
returns table (r_livello text, r_nome text, r_inizio date, r_scadenza date, r_giorni int, r_stato text)
language sql stable security definer set search_path to 'public' as $$
  select a.livello, l.nome, a.inizio, a.scadenza, (a.scadenza - current_date)::int, a.stato
    from public.abbonamenti a
    join public.livelli l on l.chiave = a.livello
   where a.user_id = auth.uid()
   order by a.scadenza desc limit 1;
$$;
grant execute on function public.mio_abbonamento() to authenticated;

-- Quando un abbonamento scade, la riga si chiude da sola al prossimo controllo.
create or replace function public.chiudi_abbonamenti_scaduti()
returns int language sql security definer set search_path to 'public' as $$
  with chiusi as (
    update public.abbonamenti set stato='scaduto'
     where stato='attivo' and scadenza < current_date
     returning 1)
  select count(*)::int from chiusi;
$$;
grant execute on function public.chiudi_abbonamenti_scaduti() to service_role;

notify pgrst, 'reload schema';
