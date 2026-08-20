-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il controllo automatico delle condizioni.
-- Un livello non e' un regalo per sempre: si tiene se si rispetta il patto.
--   Influencer: almeno 30 luoghi negli ultimi 30 giorni.
--   Professionista e Locale Plus: rinnovo entro la data di scadenza.
-- Il controllo gira ogni notte. Chi non rispetta il patto riceve prima un avviso;
-- se dopo quattordici giorni la cosa non e' cambiata, perde il livello da solo.
-- Niente sorprese: ogni passo resta scritto in `livello_eventi`.

-- avvisi nuovi
do $$ begin
  alter type public.notification_event add value if not exists 'livello_avviso';
  alter type public.notification_event add value if not exists 'livello_perso';
  alter type public.notification_event add value if not exists 'segui_invito';
exception when others then null; end $$;

alter table public.livelli   add column if not exists richiede_luoghi_mese int not null default 0;
alter table public.livelli   add column if not exists richiede_rinnovo boolean not null default false;
update public.livelli set richiede_luoghi_mese = case chiave when 'influencer' then 30 else 0 end,
                          richiede_rinnovo     = chiave in ('professionista','professionista_plus');

alter table public.profiles add column if not exists livello_scadenza date;
alter table public.profiles add column if not exists livello_avviso_il timestamptz;

create table if not exists public.livello_eventi (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  livello    text,
  cosa       text not null check (cosa in ('avviso','perso','rinnovato','assegnato')),
  motivo     text,
  quando     timestamptz not null default now()
);
create index if not exists livello_eventi_idx on public.livello_eventi(user_id, quando desc);
alter table public.livello_eventi enable row level security;
drop policy if exists livello_eventi_miei on public.livello_eventi;
create policy livello_eventi_miei on public.livello_eventi for select using (auth.uid() = user_id);
grant select on public.livello_eventi to authenticated;
grant select, insert on public.livello_eventi to service_role;
grant usage, select on sequence livello_eventi_id_seq to service_role;

-- Come sta messa una persona col suo patto: la risposta secca, anche per l'app.
create or replace function public.stato_condizione(p_user uuid)
returns table (livello text, nome text, regola text, fatti int, servono int, scadenza date, giorni_alla_scadenza int, in_regola boolean)
language sql stable security definer set search_path to 'public' as $$
  with p as (select id, special_tier, livello_scadenza from public.profiles where id = p_user),
       l as (select * from public.livelli where chiave = (select special_tier from p)),
       n as (select count(*)::int c from public.pois
              where author_id = p_user and created_at > now() - interval '30 days' and removed_at is null)
  select l.chiave, l.nome,
         case when l.richiede_luoghi_mese > 0 then 'luoghi'
              when l.richiede_rinnovo then 'rinnovo' else 'nessuna' end,
         (select c from n), l.richiede_luoghi_mese,
         (select livello_scadenza from p),
         case when (select livello_scadenza from p) is null then null
              else ((select livello_scadenza from p) - current_date) end,
         case
           when l.richiede_luoghi_mese > 0 and (select c from n) < l.richiede_luoghi_mese then false
           when l.richiede_rinnovo and coalesce((select livello_scadenza from p), current_date + 3650) < current_date then false
           else true
         end
    from l;
$$;
grant execute on function public.stato_condizione(uuid) to authenticated, service_role;

-- Il lavoro della notte.
create or replace function public.controlla_condizioni()
returns table (guardati int, avvisati int, persi int)
language plpgsql security definer set search_path to 'public' as $$
declare
  r record; v_g int := 0; v_a int := 0; v_p int := 0;
  v_quanti int; v_motivo text; v_fuori boolean;
begin
  for r in
    select p.id, p.special_tier, p.livello_scadenza, p.livello_avviso_il,
           l.nome, l.richiede_luoghi_mese, l.richiede_rinnovo
      from public.profiles p
      join public.livelli l on l.chiave = p.special_tier
     where l.richiede_luoghi_mese > 0 or l.richiede_rinnovo
  loop
    v_g := v_g + 1; v_fuori := false; v_motivo := null;

    if r.richiede_luoghi_mese > 0 then
      select count(*) into v_quanti from public.pois
       where author_id = r.id and created_at > now() - interval '30 days' and removed_at is null;
      if v_quanti < r.richiede_luoghi_mese then
        v_fuori := true;
        v_motivo := 'luoghi negli ultimi trenta giorni: ' || v_quanti || ' invece di ' || r.richiede_luoghi_mese;
      end if;
    end if;

    if not v_fuori and r.richiede_rinnovo then
      if r.livello_scadenza is null or r.livello_scadenza < current_date then
        v_fuori := true;
        v_motivo := case when r.livello_scadenza is null then 'nessuna data di rinnovo'
                         else 'rinnovo scaduto il ' || to_char(r.livello_scadenza,'DD/MM/YYYY') end;
      end if;
    end if;

    if not v_fuori then
      -- tornato in regola: l'avviso si azzera
      if r.livello_avviso_il is not null then
        update public.profiles set livello_avviso_il = null where id = r.id;
      end if;
      continue;
    end if;

    if r.livello_avviso_il is null then
      update public.profiles set livello_avviso_il = now() where id = r.id;
      insert into public.livello_eventi(user_id, livello, cosa, motivo) values (r.id, r.special_tier, 'avviso', v_motivo);
      insert into public.notifications(user_id, event, data)
        values (r.id, 'livello_avviso', jsonb_build_object('livello', r.nome, 'motivo', v_motivo, 'giorni', 14));
      v_a := v_a + 1;

    elsif r.livello_avviso_il < now() - interval '14 days' then
      update public.profiles set special_tier = null, livello_avviso_il = null where id = r.id;
      insert into public.livello_eventi(user_id, livello, cosa, motivo) values (r.id, r.special_tier, 'perso', v_motivo);
      insert into public.notifications(user_id, event, data)
        values (r.id, 'livello_perso', jsonb_build_object('livello', r.nome, 'motivo', v_motivo));
      v_p := v_p + 1;
    end if;
  end loop;

  guardati := v_g; avvisati := v_a; persi := v_p; return next;
end $$;
revoke all on function public.controlla_condizioni() from public, anon, authenticated;
grant execute on function public.controlla_condizioni() to service_role;

notify pgrst, 'reload schema';
