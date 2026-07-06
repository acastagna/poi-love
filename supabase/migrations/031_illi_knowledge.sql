-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 031: knowledge base a supporto di ILLI. Voci curate dall'admin per luoghi/temi
-- che l'AI non conosce: quando la domanda dell'utente contiene una delle parole
-- chiave, la voce viene iniettata nel grounding (whitelist di fatti veri).

create table if not exists public.illi_knowledge (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  keywords   text[] not null default '{}',
  content    text not null,
  lang       text,                                  -- null = vale per tutte le lingue
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.illi_knowledge enable row level security;

drop policy if exists illi_knowledge_read on public.illi_knowledge;
create policy illi_knowledge_read on public.illi_knowledge
  for select using (active = true or public.is_admin((select auth.uid())));

drop policy if exists illi_knowledge_admin_write on public.illi_knowledge;
create policy illi_knowledge_admin_write on public.illi_knowledge
  for all using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));
