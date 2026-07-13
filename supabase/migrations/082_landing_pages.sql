-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- LANDING PAGE BUILDER (motore unico EvolabBuilder, resa pagina): le landing costruite
-- nell'admin vivono qui. design = documento del builder (riapribile), html = pagina resa.
-- Le pubblicate sono servite da poilove.com/lp.php?s=<slug> (lettura pubblica solo se published).

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9\-]{2,80}$'),
  title text not null default '',
  design jsonb,
  html text,
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists landing_pages_slug_idx on public.landing_pages(slug);

alter table public.landing_pages enable row level security;
-- pubblico (anche anonimo): legge SOLO le pubblicate (serve a lp.php)
drop policy if exists lp_public_read on public.landing_pages;
create policy lp_public_read on public.landing_pages for select
  using (published = true or public.is_active_admin());
-- scrive solo l'admin
drop policy if exists lp_admin_write on public.landing_pages;
create policy lp_admin_write on public.landing_pages for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());
