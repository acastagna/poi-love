-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I vantaggi dei livelli, veri.
-- Fino a ieri il livello era solo una scritta: non cambiava niente di quello che
-- una persona poteva fare. Qui i vantaggi diventano numeri scritti nel database,
-- che l'amministrazione cambia senza toccare il programma, e che il database
-- stesso fa rispettare al momento del salvataggio.
--
-- Nota: qui NON si scrivono prezzi. Quelli stanno solo nella cartella riservata.

create table if not exists public.livelli (
  chiave              text primary key,
  nome                text not null,
  foto_max            int  not null default 3,     -- foto oltre la copertina, sempre multipli di 3
  video_max           int  not null default 0,     -- video per luogo
  audio_secondi       int  not null default 0,     -- la voce di chi ha il profilo
  ascolta_audioguide  boolean not null default false,
  evidenze_itinerari  int  not null default 0,
  evidenze_compagnie  int  not null default 0,
  spunta              boolean not null default false,
  badge_icona         text,
  badge_colore        text,
  muro                boolean not null default false,   -- compare nel Muro dei Sostenitori
  ordine              int not null default 100
);
alter table public.livelli enable row level security;
drop policy if exists livelli_lettura on public.livelli;
create policy livelli_lettura on public.livelli for select using (true);
grant select on public.livelli to anon, authenticated, service_role;

insert into public.livelli (chiave,nome,foto_max,video_max,audio_secondi,ascolta_audioguide,
                            evidenze_itinerari,evidenze_compagnie,spunta,badge_icona,badge_colore,muro,ordine) values
 ('free',               'Persona',        3, 0,   0, false, 0,0, false, null,            null,      false, 10),
 ('sostenitore',        'Sostenitore',    6, 0,   0, false, 0,0, true,  'hand-heart',    '#C77D2E', true,  20),
 ('mecenate',           'Mecenate',       9, 0,   0, true,  1,0, true,  'crown-simple',  '#8B5CF6', true,  30),
 ('influencer',         'Influencer',    12, 1,   0, true,  3,1, true,  'megaphone',     '#0EA5E9', false, 40),
 ('professionista',     'Professionista',12, 1,  60, false, 1,0, true,  'briefcase',     '#0F766E', false, 50),
 ('professionista_plus','Locale Plus',   21, 1, 180, false, 3,1, true,  'storefront',    '#D42B2B', false, 60)
on conflict (chiave) do update set
  nome=excluded.nome, foto_max=excluded.foto_max, video_max=excluded.video_max,
  audio_secondi=excluded.audio_secondi, ascolta_audioguide=excluded.ascolta_audioguide,
  evidenze_itinerari=excluded.evidenze_itinerari, evidenze_compagnie=excluded.evidenze_compagnie,
  spunta=excluded.spunta, badge_icona=excluded.badge_icona, badge_colore=excluded.badge_colore,
  muro=excluded.muro, ordine=excluded.ordine;

-- Quante foto puo' mettere una persona: la risposta secca, per l'app e per il database.
create or replace function public.foto_massime(p_user uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select coalesce((select l.foto_max from public.profiles p
                    left join public.livelli l on l.chiave = coalesce(p.special_tier,'free')
                   where p.id = p_user),
                  (select foto_max from public.livelli where chiave='free'), 3);
$$;
grant execute on function public.foto_massime(uuid) to anon, authenticated, service_role;

-- Il limite applicato davvero: si contano le foto oltre la copertina.
-- I luoghi che oggi ne hanno di piu' non si toccano: si blocca solo chi ne aggiunge.
create or replace function public.tg_limite_foto() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  v_max   int;
  v_ora   int := coalesce(array_length(new.photos,1),0);
  v_prima int := 0;
begin
  if tg_op='UPDATE' then v_prima := coalesce(array_length(old.photos,1),0); end if;
  if v_ora <= v_prima then return new; end if;          -- toglie o lascia uguale: passa sempre
  select public.foto_massime(new.author_id) into v_max;
  -- la copertina non conta nel numero: il tetto e' foto_max piu' quella
  if v_ora > v_max + 1 then
    raise exception 'Il tuo livello arriva a % foto oltre la copertina. Per averne di piu serve un livello superiore.', v_max
      using errcode='check_violation';
  end if;
  return new;
end $$;

drop trigger if exists limite_foto on public.pois;
create trigger limite_foto before insert or update of photos on public.pois
  for each row execute function public.tg_limite_foto();

-- Il Muro dei Sostenitori: chi sostiene il progetto, in ordine di quando e' entrato.
create or replace function public.muro_sostenitori(p_quanti int default 24)
returns table (id uuid, username text, display_name text, avatar_url text, livello text, nome_livello text, colore text)
language sql stable security definer set search_path to 'public' as $$
  select p.id, p.username, p.display_name, p.avatar_url, l.chiave, l.nome, l.badge_colore
    from public.profiles p
    join public.livelli l on l.chiave = p.special_tier
   where l.muro = true and coalesce(p.moderation_status,'active')='active'
   order by l.ordine desc, p.created_at asc
   limit greatest(1, least(p_quanti, 60));
$$;
grant execute on function public.muro_sostenitori(int) to anon, authenticated, service_role;

notify pgrst, 'reload schema';

-- Il vecchio tetto fisso di 3 foto per tutti va tolto: adesso il numero lo dice
-- il livello. Resta un tetto assoluto (copertina + 21) perche' nessun errore di
-- programma possa scrivere centinaia di foto su un luogo.
alter table public.pois drop constraint if exists pois_photos_check;
alter table public.pois add constraint pois_photos_check check (coalesce(array_length(photos,1),0) <= 22);

-- Quanto puo' durare il video, per livello (il server lo fa rispettare in video.php).
alter table public.livelli add column if not exists video_secondi int not null default 0;
update public.livelli set video_secondi = case chiave when 'free' then 0 when 'professionista_plus' then 180 else 60 end;
