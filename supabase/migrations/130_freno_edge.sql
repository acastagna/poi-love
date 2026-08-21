-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Un freno per le funzioni che costano.
-- La moderazione e la ricerca foto chiamano servizi esterni a pagamento o a
-- quota limitata. Senza un freno, una persona sola puo' esaurire la quota di
-- tutti in pochi minuti, e da quel momento la ricerca foto smette di funzionare
-- per chiunque. Il freno conta quante volte una persona chiama in un giorno.

create table if not exists public.freno_giornaliero (
  chi     text not null,          -- id della persona, oppure 'ip:...' se non collegata
  cosa    text not null,          -- nome della funzione
  giorno  date not null default current_date,
  quante  int  not null default 0,
  primary key (chi, cosa, giorno)
);
create index if not exists freno_giorno on public.freno_giornaliero(giorno);

alter table public.freno_giornaliero enable row level security;
grant all on public.freno_giornaliero to service_role;

-- Segna una chiamata e dice se si e' oltre il tetto. Ritorna quante ne ha fatte.
create or replace function public.freno(p_chi text, p_cosa text, p_tetto int)
returns table (quante int, oltre boolean)
language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.freno_giornaliero(chi, cosa, giorno, quante)
  values (p_chi, p_cosa, current_date, 1)
  on conflict (chi, cosa, giorno) do update set quante = public.freno_giornaliero.quante + 1
  returning public.freno_giornaliero.quante into quante;
  oltre := quante > p_tetto;
  return next;
end $$;
revoke all on function public.freno(text, text, int) from public, anon, authenticated;
grant execute on function public.freno(text, text, int) to service_role;

-- Le righe vecchie si buttano da sole: non serve tenere il conto di ieri.
create or replace function public.pulisci_freno() returns int
language sql security definer set search_path to 'public' as $$
  with x as (delete from public.freno_giornaliero where giorno < current_date - 3 returning 1)
  select count(*)::int from x;
$$;
grant execute on function public.pulisci_freno() to service_role;

notify pgrst, 'reload schema';
