-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 051 — Notifica ai membri all'arrivo di un nuovo vocale nella bacheca compagnia.
-- Parte A (gia' applicata, fuori transazione): alter type notification_event add value 'companion_new_voice'.
-- Parte B (qui): trigger AFTER INSERT su companion_messages che accoda una notifica a TUTTI i membri
--   (owner + membri joined) tranne l'autore, rispettando le preferenze (notif_enabled).
-- companion_new_voice eredita i default di notif_default: in_app ON, email OFF, push OFF. Nessuna modifica a notif_default.

begin;

create or replace function public.tg_notif_comp_voice()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
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

drop trigger if exists trg_notif_comp_voice on public.companion_messages;
create trigger trg_notif_comp_voice after insert on public.companion_messages
  for each row execute function public.tg_notif_comp_voice();

commit;
