-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 024: due difetti dell'audit scoperti col collaudo del love atomico.
-- 1) love_count era tra i campi "sensibili": OGNI love scriveva una riga di
--    audit (rumore infinito). Sensibili restano autore e origine.
-- 2) admin_audit_log.admin_id era NOT NULL ma la FK fa SET NULL: eliminare
--    un utente con anche una sola riga di audit era IMPOSSIBILE (23502).
--    Ora la riga di audit sopravvive con admin_id NULL (= account rimosso).

alter table public.admin_audit_log alter column admin_id drop not null;

create or replace function public.tg_audit_poi_sensitive()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (new.author_id is distinct from old.author_id)
     or (new.created_via is distinct from old.created_via) then
    begin
      insert into public.admin_audit_log(admin_id,action,target_type,target_id,meta)
      values (auth.uid(), 'poi_sensitive_update', 'poi', new.id::text,
              jsonb_build_object(
                'author_id',  jsonb_build_array(old.author_id, new.author_id),
                'created_via',jsonb_build_array(old.created_via, new.created_via)));
    exception when others then
      null; -- l'audit non deve mai bloccare l'operazione
    end;
  end if;
  return new;
end $function$;
