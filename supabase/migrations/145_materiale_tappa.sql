-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il materiale di una tappa: ricerca, copione, voce.
-- Le tre fasi delle audioguide lasciano qualcosa che deve restare attaccato al
-- luogo, altrimenti la ricerca fatta oggi si perde e domani si rifa' da capo.

create table if not exists public.poi_materiale (
  id          uuid primary key default gen_random_uuid(),
  poi_id      uuid not null references public.pois(id) on delete cascade,
  fase        text not null check (fase in ('ricerca','copione','voce')),
  lingua      text not null default 'it' check (lingua in ('it','sq','en')),
  titolo      text,
  testo       text not null,
  secondi     numeric(6,1),                     -- per il copione: quanto deve durare
  audio_url   text,                             -- per la voce: dove sta il file
  voce        text,                             -- quale voce ha parlato
  modello     text,                             -- quale modello lo ha scritto o letto
  costo_eur   numeric(10,6),
  da_coda     uuid references public.ai_coda(id) on delete set null,
  scelto      boolean not null default false,   -- quello buono, fra i tentativi
  creato_da   uuid references public.profiles(id) on delete set null,
  creato      timestamptz not null default now()
);
create index if not exists poi_materiale_idx on public.poi_materiale(poi_id, fase, creato desc);
-- Un solo copione scelto per luogo e lingua: sennò non si sa quale far leggere.
create unique index if not exists poi_materiale_uno_scelto
  on public.poi_materiale(poi_id, fase, lingua) where scelto;

alter table public.poi_materiale enable row level security;
drop policy if exists materiale_admin on public.poi_materiale;
create policy materiale_admin on public.poi_materiale for all
  using (public.sono_admin()) with check (public.sono_admin());
-- L'audio scelto lo deve poter sentire chiunque: e' l'audioguida.
drop policy if exists materiale_audio_pubblico on public.poi_materiale;
create policy materiale_audio_pubblico on public.poi_materiale for select
  using (fase = 'voce' and scelto and audio_url is not null);
grant select on public.poi_materiale to anon, authenticated;
grant insert, update, delete on public.poi_materiale to authenticated;
grant all on public.poi_materiale to service_role;

-- ── Quanto e' avanti una tappa ─────────────────────────────────────────────
create or replace function public.tappa_avanzamento(p_poi uuid)
returns table (fase text, lingua text, quanti int, ha_scelto boolean, ultimo timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select m.fase, m.lingua, count(*)::int, bool_or(m.scelto), max(m.creato)
    from public.poi_materiale m
   where m.poi_id = p_poi and public.sono_admin()
   group by m.fase, m.lingua
   order by m.fase, m.lingua;
$$;
grant execute on function public.tappa_avanzamento(uuid) to authenticated;

-- Scegliere un pezzo vuol dire togliere la scelta all'altro: si fa in un colpo.
create or replace function public.materiale_scegli(p_id uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare r public.poi_materiale%rowtype;
begin
  if not public.sono_admin() then
    raise exception 'Solo l''amministrazione' using errcode='42501';
  end if;
  select * into r from public.poi_materiale where id = p_id;
  if not found then return false; end if;
  update public.poi_materiale set scelto = false
   where poi_id = r.poi_id and fase = r.fase and lingua = r.lingua and id <> p_id;
  update public.poi_materiale set scelto = true where id = p_id;
  return true;
end $$;
grant execute on function public.materiale_scegli(uuid) to authenticated;

notify pgrst, 'reload schema';
