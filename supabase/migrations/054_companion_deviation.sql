-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 054 — "Deviazione" (Fuori Rotta): una proposta di alternativa fuori percorso nella bacheca compagnia.
-- Un membro propone una deviazione (testo + luogo facoltativo); appare come box VERDE nella bacheca; la compagnia
-- vota con le stesse reazioni like/dislike (approva/no). Se prende meno della meta' dei voti sparisce (lato client).
-- Riusa companion_messages: aggiungo un tipo ('voice' | 'deviation') e i campi della proposta. Nessuna nuova tabella,
-- nessuna nuova policy: le RLS di insert/select/delete e le reazioni valgono gia' per ogni riga di companion_messages.

begin;

alter table public.companion_messages
  add column if not exists kind       text not null default 'voice',
  add column if not exists body       text,               -- testo della proposta di deviazione
  add column if not exists place_name text,               -- destinazione facoltativa
  add column if not exists place_lat  double precision,    -- coordinate facoltative (se il proponente allega la posizione)
  add column if not exists place_lng  double precision;

-- Vincolo tipo (idempotente). Le righe esistenti hanno gia' kind='voice' per via del default.
do $$ begin
  alter table public.companion_messages
    add constraint companion_messages_kind_chk check (kind in ('voice','deviation'));
exception when duplicate_object then null; end $$;

-- La notifica "nuovo vocale" NON deve partire per le deviazioni (il testo sarebbe sbagliato):
-- ricreo la funzione del trigger di mig 051 con un'uscita anticipata quando kind <> 'voice'.
-- (La notifica dedicata alla deviazione e' un passo successivo, quando serve.)
create or replace function public.tg_notif_comp_voice()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if NEW.kind is distinct from 'voice' then return NEW; end if;
  select name into v_name from public.companions where id = NEW.companion_id;
  insert into public.notifications(user_id, event, actor_id, entity_type, entity_id, data)
  select mem.uid, 'companion_new_voice', NEW.author_id, 'companion', NEW.companion_id,
         jsonb_build_object('name', coalesce(v_name,''))
  from (
    select owner_id as uid from public.companions where id = NEW.companion_id
    union
    select user_id as uid from public.companion_members
      where companion_id = NEW.companion_id and status = 'joined' and user_id is not null
  ) mem
  where mem.uid is not null
    and mem.uid <> NEW.author_id
    and public.notif_enabled(mem.uid, 'companion_new_voice', 'in_app');
  return NEW;
end $$;

commit;
