-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Amicizia e bloccati, come deciso il 20/08/2026.
--   Follower = chi ti segue, a senso unico.
--   Amici = tutti e due si seguono. Nessuna richiesta da accettare.
--   Bloccati = chi non ti vede e non ti scrive. La tabella non c'era.
--   Invito a ricambiare = dopo che segui, puoi chiedere di essere seguito,
--   con un testo pronto e modificabile. Uno solo a testa.

create table if not exists public.blocchi (
  bloccante_id uuid not null references public.profiles(id) on delete cascade,
  bloccato_id  uuid not null references public.profiles(id) on delete cascade,
  motivo       text,
  created_at   timestamptz not null default now(),
  primary key (bloccante_id, bloccato_id),
  constraint blocco_non_se_stessi check (bloccante_id <> bloccato_id)
);
create index if not exists blocchi_bloccato_idx on public.blocchi(bloccato_id);

alter table public.blocchi enable row level security;
drop policy if exists blocchi_miei_leggo on public.blocchi;
create policy blocchi_miei_leggo   on public.blocchi for select using (auth.uid() = bloccante_id);
drop policy if exists blocchi_miei_scrivo on public.blocchi;
create policy blocchi_miei_scrivo  on public.blocchi for insert with check (auth.uid() = bloccante_id);
drop policy if exists blocchi_miei_tolgo on public.blocchi;
create policy blocchi_miei_tolgo   on public.blocchi for delete using (auth.uid() = bloccante_id);
grant select, insert, delete on public.blocchi to authenticated;

-- L'invito a ricambiare: uno solo per persona, con il testo che ha scritto.
create table if not exists public.inviti_segui (
  da_id      uuid not null references public.profiles(id) on delete cascade,
  a_id       uuid not null references public.profiles(id) on delete cascade,
  testo      text,
  created_at timestamptz not null default now(),
  primary key (da_id, a_id),
  constraint invito_non_a_se_stessi check (da_id <> a_id),
  constraint invito_testo_200 check (testo is null or length(testo) <= 200)
);
alter table public.inviti_segui enable row level security;
drop policy if exists inviti_miei on public.inviti_segui;
create policy inviti_miei on public.inviti_segui for select using (auth.uid() = da_id or auth.uid() = a_id);
drop policy if exists inviti_scrivo on public.inviti_segui;
create policy inviti_scrivo on public.inviti_segui for insert with check (auth.uid() = da_id);
grant select, insert on public.inviti_segui to authenticated;

-- Chi sono i miei amici: quelli che seguo e che mi seguono, tolti i bloccati.
create or replace function public.miei_amici()
returns table (amico_id uuid) language sql stable security definer set search_path=public as $$
  select f1.following_id
  from public.follows f1
  join public.follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
  where f1.follower_id = auth.uid()
    and not exists (select 1 from public.blocchi b
                    where (b.bloccante_id = auth.uid() and b.bloccato_id = f1.following_id)
                       or (b.bloccante_id = f1.following_id and b.bloccato_id = auth.uid()));
$$;
grant execute on function public.miei_amici() to authenticated;

-- Siamo amici io e questa persona? Serve alle recensioni.
create or replace function public.siamo_amici(p_altro uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.follows a
    join public.follows b on b.follower_id = a.following_id and b.following_id = a.follower_id
    where a.follower_id = auth.uid() and a.following_id = p_altro
  ) and not exists (
    select 1 from public.blocchi x
    where (x.bloccante_id = auth.uid() and x.bloccato_id = p_altro)
       or (x.bloccante_id = p_altro and x.bloccato_id = auth.uid())
  );
$$;
grant execute on function public.siamo_amici(uuid) to authenticated;

notify pgrst, 'reload schema';
