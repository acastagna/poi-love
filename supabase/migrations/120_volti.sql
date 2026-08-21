-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I volti di chi finisce nella foto per caso.
-- Chi fotografa un posto non sta fotografando le persone che passano: quei
-- volti si sfocano. Non con una macchia nera, ma con una sfocatura misurata e
-- coi bordi sfumati, che si confonde con la foto.
-- Quanto sfocare e su chi lo decide l'amministrazione, qui.

create table if not exists public.impostazioni_volti (
  id         int primary key default 1 check (id = 1),
  attiva     boolean not null default true,
  chi        text not null default 'tutti' check (chi in ('tutti','bambini')),
  intensita  int not null default 6 check (intensita between 1 and 10),
  margine    int not null default 18 check (margine between 0 and 40),
  aggiornato timestamptz not null default now()
);
insert into public.impostazioni_volti (id) values (1) on conflict (id) do nothing;

alter table public.impostazioni_volti enable row level security;
drop policy if exists volti_leggo on public.impostazioni_volti;
create policy volti_leggo on public.impostazioni_volti for select using (true);
drop policy if exists volti_admin on public.impostazioni_volti;
create policy volti_admin on public.impostazioni_volti for all using (public.sono_admin()) with check (public.sono_admin());
grant select on public.impostazioni_volti to anon, authenticated;
grant update on public.impostazioni_volti to authenticated;
grant all on public.impostazioni_volti to service_role;

notify pgrst, 'reload schema';
