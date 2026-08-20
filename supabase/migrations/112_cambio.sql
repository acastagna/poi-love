-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il cambio ufficiale della Banca d'Albania.
-- Serve per mostrare i prezzi del menu nelle due monete senza inventare niente.
-- Si prende una volta al giorno dalla pagina ufficiale. Se un giorno la pagina
-- non risponde, si tiene l'ultimo valore conosciuto e lo si dice: la riga resta
-- segnata come ricaduta, cosi' si sa sempre da dove viene il numero.

create table if not exists public.cambi (
  giorno    date not null,
  valuta    text not null,
  lek       numeric(12,4) not null check (lek > 0),   -- quanti Lek per una unita'
  fonte     text not null default 'Banka e Shqiperise',
  ricaduta  boolean not null default false,           -- valore riportato da un giorno precedente
  preso     timestamptz not null default now(),
  primary key (giorno, valuta)
);
alter table public.cambi enable row level security;
drop policy if exists cambi_leggo on public.cambi;
create policy cambi_leggo on public.cambi for select using (true);
grant select on public.cambi to anon, authenticated;
grant all on public.cambi to service_role;

-- Il cambio da usare adesso: quello di oggi, altrimenti l'ultimo conosciuto.
create or replace function public.cambio_ora(p_valuta text default 'EUR')
returns table (lek numeric, giorno date, ricaduta boolean, fonte text)
language sql stable security definer set search_path to 'public' as $$
  select c.lek, c.giorno, c.ricaduta, c.fonte
    from public.cambi c
   where c.valuta = upper(p_valuta) and c.giorno <= current_date
   order by c.giorno desc limit 1;
$$;
grant execute on function public.cambio_ora(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
