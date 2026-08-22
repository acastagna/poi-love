-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I quindici luoghi in omaggio al Sostenitore (deciso il 22/08).
--
-- Quando uno diventa Sostenitore, quindici luoghi Ufficiali dei viaggi di ILLI
-- diventano "suoi": nel suo profilo compaiono in riga con l immagine e il
-- bollino "Ufficiale, per <nome>", solo il nome, mai il cognome. I luoghi
-- restano Ufficiali e restano di tutti: l omaggio e la dedica, non la proprieta.

create table if not exists public.omaggi_sostenitore (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  poi_id   uuid not null references public.pois(id) on delete cascade,
  nome     text not null,               -- il nome scritto sul bollino, deciso alla nascita
  ordine   int  not null default 0,
  creato   timestamptz not null default now(),
  primary key (user_id, poi_id)
);
alter table public.omaggi_sostenitore enable row level security;
-- La dedica e' una celebrazione: si vede sul profilo pubblico, quindi si legge.
drop policy if exists omaggi_lettura on public.omaggi_sostenitore;
create policy omaggi_lettura on public.omaggi_sostenitore for select using (true);
drop policy if exists omaggi_admin on public.omaggi_sostenitore;
create policy omaggi_admin on public.omaggi_sostenitore for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select on public.omaggi_sostenitore to anon, authenticated;
grant all on public.omaggi_sostenitore to service_role;

-- Il nome per il bollino: la prima parola del nome mostrato, mai il cognome.
create or replace function public.nome_per_bollino(p_user uuid)
returns text language sql stable set search_path to 'public' as $$
  select coalesce(
    nullif(split_part(trim(coalesce(display_name, '')), ' ', 1), ''),
    username, 'Sostenitore')
    from public.profiles where id = p_user;
$$;

-- L assegnazione: quindici luoghi Ufficiali, i meno dedicati per primi cosi le
-- dediche si spargono su tutti i luoghi invece di ammucchiarsi sui primi.
create or replace function public.assegna_omaggi_sostenitore(p_user uuid)
returns int language plpgsql security definer set search_path to 'public' as $$
declare v_nome text; v_quanti int;
begin
  select count(*) into v_quanti from public.omaggi_sostenitore where user_id = p_user;
  if v_quanti >= 15 then return 0; end if;   -- li ha gia: non si rimescolano

  v_nome := public.nome_per_bollino(p_user);
  insert into public.omaggi_sostenitore (user_id, poi_id, nome, ordine)
  select p_user, p.id, v_nome, row_number() over ()
    from (
      select po.id
        from public.pois po
        left join (select poi_id, count(*) n from public.omaggi_sostenitore group by poi_id) d
               on d.poi_id = po.id
       where (po.badge_official or po.visibility = 'official')
         and po.is_approved and po.removed_at is null
       order by coalesce(d.n, 0), po.love_count desc, po.created_at
       limit 15
    ) p
  on conflict do nothing;
  get diagnostics v_quanti = row_count;
  return v_quanti;
end $$;
grant execute on function public.assegna_omaggi_sostenitore(uuid) to service_role;

-- Il grilletto: appena il profilo diventa Sostenitore, l omaggio nasce da solo.
create or replace function public.grilletto_omaggi()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.special_tier = 'sostenitore'
     and (old.special_tier is distinct from 'sostenitore') then
    perform public.assegna_omaggi_sostenitore(new.id);
  end if;
  return new;
end $$;
drop trigger if exists profili_omaggi_sostenitore on public.profiles;
create trigger profili_omaggi_sostenitore after update of special_tier on public.profiles
  for each row execute function public.grilletto_omaggi();

-- Chi Sostenitore lo e' gia', i suoi quindici li riceve adesso.
select p.username, public.assegna_omaggi_sostenitore(p.id) as assegnati
  from public.profiles p where p.special_tier = 'sostenitore';

notify pgrst, 'reload schema';
select count(*) as dediche_totali from public.omaggi_sostenitore;
