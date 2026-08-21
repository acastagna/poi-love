-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- La conoscenza: documenti caricati, spezzati e resi cercabili per senso.
--
-- Un PDF, cosi com e, per un assistente non serve a niente: e un blocco unico.
-- Va spezzato in pezzi corti e a ogni pezzo va messo accanto un numero lungo
-- che ne descrive il significato. Cosi, a domanda fatta, si trovano i pezzi che
-- parlano di quella cosa anche quando le parole usate sono diverse.
--
-- Qui: i documenti, i pezzi, e la ricerca per senso.

create extension if not exists vector;

create table if not exists public.conoscenza_documenti (
  id           uuid primary key default gen_random_uuid(),
  titolo       text not null,
  file_url     text,
  ambito       text not null default 'entrambi' check (ambito in ('illi','copilota','entrambi')),
  lingua       text not null default 'it',
  pagine       int  not null default 0,
  pezzi        int  not null default 0,
  pezzi_pronti int  not null default 0,
  stato        text not null default 'in_lavorazione'
               check (stato in ('in_lavorazione','pronto','fallito')),
  motivo       text,
  caricato_da  uuid references public.profiles(id) on delete set null,
  creato       timestamptz not null default now()
);

create table if not exists public.conoscenza_pezzi (
  id           bigserial primary key,
  documento_id uuid not null references public.conoscenza_documenti(id) on delete cascade,
  pagina       int not null default 0,
  ordine       int not null default 0,
  testo        text not null,
  vettore      vector(1536),
  creato       timestamptz not null default now()
);
create index if not exists conoscenza_pezzi_doc on public.conoscenza_pezzi(documento_id, ordine);
-- da fare: quando i pezzi passano le poche migliaia, qui va un indice ivfflat.
-- Sotto quella soglia la scansione e piu veloce dell indice, e l indice va
-- ricostruito a ogni caricamento: meglio metterlo quando serve davvero.
create index if not exists conoscenza_pezzi_da_fare on public.conoscenza_pezzi(documento_id)
  where vettore is null;

alter table public.conoscenza_documenti enable row level security;
alter table public.conoscenza_pezzi     enable row level security;
drop policy if exists cdoc_admin on public.conoscenza_documenti;
create policy cdoc_admin on public.conoscenza_documenti for all
  using (public.sono_admin()) with check (public.sono_admin());
drop policy if exists cpez_admin on public.conoscenza_pezzi;
create policy cpez_admin on public.conoscenza_pezzi for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.conoscenza_documenti to authenticated;
grant select, insert, update, delete on public.conoscenza_pezzi to authenticated;
grant usage, select on sequence public.conoscenza_pezzi_id_seq to authenticated;
grant all on public.conoscenza_documenti, public.conoscenza_pezzi to service_role;
grant all on sequence public.conoscenza_pezzi_id_seq to service_role;

-- I pezzi che aspettano ancora il loro numero. Li prende chi ha la chiave.
create or replace function public.conoscenza_da_vettorizzare(p_quanti int default 40)
returns table (id bigint, testo text)
language sql security definer set search_path to 'public' as $$
  select p.id, p.testo from public.conoscenza_pezzi p
   where p.vettore is null
   order by p.documento_id, p.ordine
   limit greatest(1, least(coalesce(p_quanti, 40), 200));
$$;
grant execute on function public.conoscenza_da_vettorizzare(int) to service_role;

-- Scrive il numero accanto al pezzo e tiene aggiornato il conto del documento.
create or replace function public.conoscenza_segna_vettore(p_id bigint, p_vettore vector)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v_doc uuid;
begin
  update public.conoscenza_pezzi set vettore = p_vettore where id = p_id returning documento_id into v_doc;
  if v_doc is null then return false; end if;
  update public.conoscenza_documenti d
     set pezzi_pronti = (select count(*) from public.conoscenza_pezzi p
                          where p.documento_id = v_doc and p.vettore is not null),
         stato = case when (select count(*) from public.conoscenza_pezzi p
                             where p.documento_id = v_doc and p.vettore is null) = 0
                      then 'pronto' else 'in_lavorazione' end
   where d.id = v_doc;
  return true;
end $$;
grant execute on function public.conoscenza_segna_vettore(bigint, vector) to service_role;

-- La ricerca per senso: si passa il numero della domanda, tornano i pezzi vicini.
create or replace function public.conoscenza_cerca(
  p_vettore vector, p_ambito text default 'entrambi', p_quanti int default 6
) returns table (documento text, pagina int, testo text, vicinanza real)
language sql stable security definer set search_path to 'public' as $$
  select d.titolo, p.pagina, p.testo, (1 - (p.vettore <=> p_vettore))::real
    from public.conoscenza_pezzi p
    join public.conoscenza_documenti d on d.id = p.documento_id
   where p.vettore is not null
     and (p_ambito = 'entrambi' or d.ambito = 'entrambi' or d.ambito = p_ambito)
   order by p.vettore <=> p_vettore
   limit greatest(1, least(coalesce(p_quanti, 6), 20));
$$;
grant execute on function public.conoscenza_cerca(vector, text, int) to service_role, authenticated;

notify pgrst, 'reload schema';
select extversion as pgvector from pg_extension where extname = 'vector';
