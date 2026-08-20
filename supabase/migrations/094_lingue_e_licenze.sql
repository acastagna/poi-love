-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Blocco A1, migrazioni di base. Due buchi trovati dal controllo del 20/08:
--   1. i luoghi non hanno dove mettere il testo nelle tre lingue;
--   2. delle foto non si salva licenza, autore e fonte, e le licenze libere le pretendono.

-- ── 1. Il testo dei luoghi nelle tre lingue ─────────────────────────────────
alter table public.pois
  add column if not exists title_sq        text,
  add column if not exists title_it        text,
  add column if not exists title_en        text,
  add column if not exists description_sq  text,
  add column if not exists description_it  text,
  add column if not exists description_en  text,
  add column if not exists lingua_originale text
    check (lingua_originale is null or lingua_originale in ('sq','it','en'));

comment on column public.pois.lingua_originale is
  'la lingua in cui il testo e'' stato scritto la prima volta: le altre due sono traduzioni';

-- il testo che c'e' gia' resta dov'e'; title e description restano la voce principale
-- e valgono come ricaduta quando la lingua richiesta e' vuota.
create or replace function public.poi_testo(p_poi public.pois, p_lang text, p_campo text)
returns text language sql immutable as $$
  select coalesce(
    case when p_campo = 'title' then
      case p_lang when 'sq' then p_poi.title_sq when 'it' then p_poi.title_it when 'en' then p_poi.title_en end
    else
      case p_lang when 'sq' then p_poi.description_sq when 'it' then p_poi.description_it when 'en' then p_poi.description_en end
    end,
    case when p_campo = 'title' then p_poi.title else p_poi.description end
  );
$$;

-- ── 2. Licenza, autore e fonte delle foto ──────────────────────────────────
alter table public.media
  add column if not exists licenza        text,
  add column if not exists autore         text,
  add column if not exists fonte_url      text,
  add column if not exists attribuzione   text,
  add column if not exists origine        text
    check (origine is null or origine in ('utente','gestore','commons','openverse','unsplash','pexels','pixabay','sistema')),
  add column if not exists volti_trattati boolean not null default false,
  add column if not exists volti_quanti   int not null default 0,
  add column if not exists verificata     boolean not null default false;

comment on column public.media.attribuzione is
  'la frase pronta da mostrare sotto la foto, per esempio: foto di Mario Rossi, CC BY-SA 4.0';
comment on column public.media.volti_trattati is
  'vero quando la foto e'' passata dalla sfocatura dei volti prima della pubblicazione';

alter table public.media_assets
  add column if not exists licenza      text,
  add column if not exists autore       text,
  add column if not exists fonte_url    text,
  add column if not exists attribuzione text;

-- una foto presa da fuori senza licenza e senza autore non si pubblica: lo dice la tabella,
-- non solo le buone intenzioni.
create or replace function public.tg_media_licenza() returns trigger language plpgsql as $$
begin
  if new.origine in ('commons','openverse','unsplash','pexels','pixabay')
     and (coalesce(new.licenza,'') = '' or coalesce(new.autore,'') = '') then
    raise exception 'foto da % senza licenza o senza autore: non si pubblica', new.origine;
  end if;
  return new;
end $$;

drop trigger if exists media_licenza on public.media;
create trigger media_licenza before insert or update on public.media
  for each row execute function public.tg_media_licenza();

notify pgrst, 'reload schema';
