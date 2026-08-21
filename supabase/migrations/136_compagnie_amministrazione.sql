-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le compagnie di viaggio, viste dall'amministrazione.
-- Fino a oggi una compagnia la vedeva solo chi ne faceva parte: giusto per le
-- persone, ma vuol dire che se una compagnia va male nessuno puo' intervenire.
-- Qui l'amministrazione ottiene la vista e il potere di moderare, e nient'altro.

-- ── Chi amministra vede tutto ───────────────────────────────────────────────
drop policy if exists companions_admin on public.companions;
create policy companions_admin on public.companions for all
  using (public.sono_admin()) with check (public.sono_admin());

drop policy if exists comp_membri_admin on public.companion_members;
create policy comp_membri_admin on public.companion_members for all
  using (public.sono_admin()) with check (public.sono_admin());

drop policy if exists comp_msg_admin on public.companion_messages;
create policy comp_msg_admin on public.companion_messages for all
  using (public.sono_admin()) with check (public.sono_admin());

drop policy if exists comp_pois_admin on public.companion_pois;
create policy comp_pois_admin on public.companion_pois for all
  using (public.sono_admin()) with check (public.sono_admin());

drop policy if exists comp_img_admin on public.companion_images;
create policy comp_img_admin on public.companion_images for all
  using (public.sono_admin()) with check (public.sono_admin());

drop policy if exists comp_react_admin on public.companion_message_reactions;
create policy comp_react_admin on public.companion_message_reactions for all
  using (public.sono_admin()) with check (public.sono_admin());

-- ── Il quadro di una compagnia in una riga sola ─────────────────────────────
-- Serve al pannello per l'elenco: senza questo dovrebbe fare sei domande per
-- ogni compagnia, e con cento compagnie diventa lento.
create or replace function public.compagnie_quadro()
returns table (
  id uuid, nome text, codice text, tipo text, creata timestamptz,
  proprietario uuid, proprietario_nome text, pubblica boolean,
  membri int, entrati int, vocali int, ultimo_vocale timestamptz,
  luoghi int, itinerari int, foto int
)
language sql stable security definer set search_path to 'public' as $$
  select c.id, c.name, c.code, c.type, c.created_at,
         c.owner_id, coalesce(p.display_name, '@'||p.username, '—'), coalesce(c.is_public,false),
         (select count(*)::int from public.companion_members m where m.companion_id = c.id),
         (select count(*)::int from public.companion_members m where m.companion_id = c.id and m.status = 'joined'),
         (select count(*)::int from public.companion_messages g where g.companion_id = c.id),
         (select max(g.created_at) from public.companion_messages g where g.companion_id = c.id),
         (select count(*)::int from public.companion_pois cp where cp.companion_id = c.id),
         (select count(*)::int from public.trips t where t.companion_id = c.id),
         (select count(*)::int from public.companion_images ci where ci.companion_id = c.id)
    from public.companions c
    left join public.profiles p on p.id = c.owner_id
   where public.sono_admin()
   order by c.created_at desc;
$$;
grant execute on function public.compagnie_quadro() to authenticated;

-- ── Chi c'e' dentro, con un nome leggibile ──────────────────────────────────
create or replace function public.compagnia_membri(p_comp uuid)
returns table (id uuid, user_id uuid, nome text, email text, stato text, entrato timestamptz, e_il_proprietario boolean)
language sql stable security definer set search_path to 'public' as $$
  select m.id, m.user_id,
         coalesce(p.display_name, '@'||p.username, m.email, '—'),
         m.email, m.status, m.joined_at,
         (m.user_id = (select owner_id from public.companions where id = p_comp))
    from public.companion_members m
    left join public.profiles p on p.id = m.user_id
   where m.companion_id = p_comp and public.sono_admin()
   order by m.created_at;
$$;
grant execute on function public.compagnia_membri(uuid) to authenticated;

-- ── La bacheca, con chi ha parlato ──────────────────────────────────────────
create or replace function public.compagnia_bacheca(p_comp uuid, p_quanti int default 50)
returns table (id uuid, autore uuid, autore_nome text, genere text, testo text,
               trascrizione text, secondi numeric, quando timestamptz, luogo text)
language sql stable security definer set search_path to 'public' as $$
  select g.id, g.author_id,
         coalesce(p.display_name, '@'||p.username, '—'),
         coalesce(g.kind,'voce'), g.body, g.transcript,
         round(coalesce(g.duration_ms,0) / 1000.0, 1), g.created_at, g.place_name
    from public.companion_messages g
    left join public.profiles p on p.id = g.author_id
   where g.companion_id = p_comp and public.sono_admin()
   order by g.created_at desc
   limit greatest(1, least(p_quanti, 200));
$$;
grant execute on function public.compagnia_bacheca(uuid, int) to authenticated;

notify pgrst, 'reload schema';
