-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I documenti riservati dell'amministrazione.
-- Il repository e' pubblico: il testo di questi documenti vive nel database,
-- mai nei file. La pagina admin/documento.html li mostra a chi e' admin e
-- permette di fare domande all'AI attraverso la coda (ai_coda), come la chat
-- dei vantaggi: risponde chi sta girando sul Mac, a costo zero.

create table if not exists public.admin_documenti (
  slug          text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
  titolo        text not null,
  corpo         text not null default '',
  aggiornato_il timestamptz not null default now()
);

alter table public.admin_documenti enable row level security;
drop policy if exists admin_documenti_admin on public.admin_documenti;
create policy admin_documenti_admin on public.admin_documenti for all
  using (public.sono_admin()) with check (public.sono_admin());

grant select, insert, update, delete on public.admin_documenti to authenticated;
grant all on public.admin_documenti to service_role;

notify pgrst, 'reload schema';
