-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- https://321.al
--
-- Inviti: 200 punti a chi invita e 200 punti a chi arriva (direttiva 19/08/2026).
-- Prima l'invitante prendeva 50 e chi arrivava non prendeva nulla.

UPDATE public.gamification_config
SET value = jsonb_set(jsonb_set(value, '{referral_confirmed}', '200'), '{referral_welcome}', '200')
WHERE key = 'points_per_action';

CREATE OR REPLACE FUNCTION public.trg_referral_award() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
begin
  if new.referred_by is not null and new.referred_by <> new.id
     and (tg_op = 'INSERT' or old.referred_by is null) then
    -- chi ha invitato
    perform public.award_points(new.referred_by, 'referral_confirmed', new.id::text);
    -- chi e' arrivato con l'invito: il benvenuto vale quanto l'invito
    perform public.award_points(new.id, 'referral_welcome', new.referred_by::text);
    update public.referrals
      set referred_id = new.id, confirmed = true
      where id = (
        select id from public.referrals
        where referrer_id = new.referred_by and confirmed = false and referred_id is null
        order by created_at asc
        limit 1
      );
  end if;
  return new;
end
$$;

-- Segno l'avviso mandato a chi invita, cosi' non parte due volte.
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS notified_at timestamptz;
