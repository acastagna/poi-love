-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Lo stile dei QR, deciso dall'amministrazione.
-- I codici sono nostri, quindi possiamo disegnarli come vogliamo: forma dei
-- punti, forma degli angoli, colori, marchio in mezzo. Qui si salva lo stile
-- predefinito; il generatore lo legge da solo quando non gli viene detto altro.

create table if not exists public.qr_stile (
  id              int primary key default 1 check (id = 1),
  colore          text not null default 'D42B2B',   -- i punti
  colore_angoli   text not null default 'D42B2B',   -- i tre quadrati agli angoli
  sfondo          text not null default 'FFFFFF',
  forma_punti     text not null default 'quadrato' check (forma_punti in ('quadrato','arrotondato','tondo')),
  forma_angoli    text not null default 'quadrato' check (forma_angoli in ('quadrato','arrotondato','tondo')),
  logo            text not null default 'nostro'    check (logo in ('nostro','nessuno','immagine')),
  logo_url        text,
  logo_quota      int  not null default 22 check (logo_quota between 10 and 30),  -- quanto e' grande in percentuale
  margine         int  not null default 2  check (margine between 0 and 6),
  aggiornato      timestamptz not null default now()
);
insert into public.qr_stile (id) values (1) on conflict (id) do nothing;

alter table public.qr_stile enable row level security;
drop policy if exists qr_stile_leggo on public.qr_stile;
create policy qr_stile_leggo on public.qr_stile for select using (true);
drop policy if exists qr_stile_admin on public.qr_stile;
create policy qr_stile_admin on public.qr_stile for all using (public.sono_admin()) with check (public.sono_admin());
grant select on public.qr_stile to anon, authenticated;
grant update on public.qr_stile to authenticated;
grant all on public.qr_stile to service_role;

notify pgrst, 'reload schema';
