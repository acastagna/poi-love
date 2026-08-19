-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- https://321.al
--
-- Aiutanti per la posta (19/08/2026). Le tabelle sono protette riga per riga, quindi
-- l'utente del sito non le vede: gli diamo due porte strette, che rispondono solo
-- alla domanda che serve e non espongono nient'altro.

-- 1) In che lingua scrivere a un indirizzo: risponde solo sq/it/en, oppure niente.
CREATE OR REPLACE FUNCTION public.mail_lang_for(p_email text)
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT CASE WHEN u.raw_user_meta_data->>'lang' IN ('sq','it','en')
              THEN u.raw_user_meta_data->>'lang' END
    FROM auth.users u
   WHERE lower(u.email) = lower(p_email)
   LIMIT 1;
$$;

-- 2) Chi devo ringraziare per un invito appena accettato, e come si chiamano le persone.
--    Restituisce una riga solo se l'avviso non e' ancora partito.
CREATE OR REPLACE FUNCTION public.referral_to_notify(p_user uuid)
RETURNS TABLE (rid uuid, inviter_email text, inviter_name text, newcomer_name text, inviter_lang text)
LANGUAGE sql SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT r.id,
         inv.email::text,
         coalesce(pinv.username, split_part(inv.email::text,'@',1)),
         coalesce(pme.username,  split_part(me.email::text,'@',1)),
         CASE WHEN inv.raw_user_meta_data->>'lang' IN ('sq','it','en')
              THEN inv.raw_user_meta_data->>'lang' ELSE 'en' END
    FROM public.profiles pme
    JOIN auth.users me   ON me.id  = pme.id
    JOIN auth.users inv  ON inv.id = pme.referred_by
    LEFT JOIN public.profiles pinv ON pinv.id = pme.referred_by
    JOIN public.referrals r ON r.referred_id = pme.id AND r.notified_at IS NULL
   WHERE pme.id = p_user
   LIMIT 1;
$$;

-- 3) Segna l'avviso come mandato: vero solo alla prima volta (niente doppioni).
CREATE OR REPLACE FUNCTION public.referral_mark_notified(p_rid uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
declare n int;
begin
  update public.referrals set notified_at = now()
   where id = p_rid and notified_at is null;
  get diagnostics n = row_count;
  return n = 1;
end
$$;

REVOKE ALL ON FUNCTION public.mail_lang_for(text) FROM public;
REVOKE ALL ON FUNCTION public.referral_to_notify(uuid) FROM public;
REVOKE ALL ON FUNCTION public.referral_mark_notified(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mail_lang_for(text) TO poilove_web;
GRANT EXECUTE ON FUNCTION public.referral_to_notify(uuid) TO poilove_web;
GRANT EXECUTE ON FUNCTION public.referral_mark_notified(uuid) TO poilove_web;
