-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Autore e fonte di ogni foto.
-- Fino a oggi le foto arrivavano e basta: nessuno scriveva da dove venissero.
-- Per le foto scattate dagli utenti l'autore e' chi le carica; per quelle prese
-- da fuori servono licenza e autore, altrimenti non entrano. Non e' pignoleria:
-- una foto senza licenza e' un problema legale che si scopre troppo tardi.

alter table public.media_assets add column if not exists poi_id uuid references public.pois(id) on delete cascade;
create index if not exists media_assets_poi on public.media_assets(poi_id);

-- 'source' dice da dove viene: 'utente' (l'ha scattata chi la carica) oppure
-- il nome del posto da cui e' stata presa (unsplash, pexels, wikimedia...).
create or replace function public.tg_media_licenza() returns trigger
language plpgsql as $$
begin
  if coalesce(new.source,'') <> 'utente' then
    if coalesce(trim(new.licenza),'') = '' or coalesce(trim(new.autore),'') = '' then
      raise exception 'Una foto presa da fuori entra solo con licenza e autore (fonte: %)', coalesce(new.source,'sconosciuta')
        using errcode='check_violation';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists media_licenza on public.media_assets;
create trigger media_licenza before insert or update on public.media_assets
  for each row execute function public.tg_media_licenza();

alter table public.media_assets enable row level security;
drop policy if exists media_leggo on public.media_assets;
create policy media_leggo on public.media_assets for select using (true);
drop policy if exists media_mie on public.media_assets;
create policy media_mie on public.media_assets for insert with check (owner_id = auth.uid());
drop policy if exists media_admin on public.media_assets;
create policy media_admin on public.media_assets for all using (public.sono_admin()) with check (public.sono_admin());
grant select on public.media_assets to anon, authenticated;
grant insert on public.media_assets to authenticated;
grant all on public.media_assets to service_role;

-- L'attribuzione da mostrare sotto la foto, quando serve.
create or replace function public.attribuzione_foto(p_url text)
returns text language sql stable security definer set search_path to 'public' as $$
  select case
    when m.source = 'utente' or m.source is null then null
    else coalesce(m.attribuzione, m.autore || ' · ' || m.licenza)
  end
  from public.media_assets m where m.url = p_url limit 1;
$$;
grant execute on function public.attribuzione_foto(text) to anon, authenticated;

notify pgrst, 'reload schema';
