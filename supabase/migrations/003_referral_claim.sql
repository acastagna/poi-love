-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
--
-- Migrazione 003 — Referral signup (claim) sicuro
-- Il nuovo utente "reclama" l'invito col handle (username, UNIQUE) di chi l'ha invitato.
-- Tutto server-side e validato: niente auto-referral, niente cambio se gia' referito, il referrer
-- deve esistere. L'accredito +50 lo fa il trigger referral della 002 quando referred_by viene settato.
--
-- DIPENDENZE (non modificare senza riallineare):
--  - 001 `protect_gamification_columns`: permette il PRIMO set di referred_by (old null), blocca i cambi.
--    E' cio' che rende possibile a questa RPC (che gira col jwt 'authenticated') di settare referred_by.
--  - 002 `award_points` / `trg_referral_award`: l'accredito vero. award_points e' SECURITY DEFINER,
--    quindi raggiungibile dal trigger anche se revocata al ruolo authenticated.

begin;

create or replace function public.claim_referral(p_handle text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ref uuid;
  v_set uuid;
begin
  if v_uid is null or p_handle is null or length(trim(p_handle)) = 0 then
    return false;
  end if;
  -- l'invitante deve esistere (username e' UNIQUE) ed essere diverso da me (no auto-referral)
  select id into v_ref from public.profiles where username = p_handle;
  if v_ref is null or v_ref = v_uid then
    return false;
  end if;
  -- set ATOMICO: "WHERE referred_by IS NULL" evita la race del doppio claim (niente SELECT-poi-UPDATE).
  -- Solo la prima richiesta matcha e scrive; le successive non trovano la riga e tornano false.
  update public.profiles set referred_by = v_ref
    where id = v_uid and referred_by is null
    returning referred_by into v_set;
  return v_set is not null;
end $$;
revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

-- Difesa in profondita': il trigger referral non deve MAI accreditare un auto-referral.
-- Ri-creo la funzione del trigger (002) aggiungendo il check new.referred_by <> new.id,
-- e riapplico esplicitamente i REVOKE (il CREATE OR REPLACE non li ri-documenta da solo).
create or replace function public.trg_referral_award()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referred_by is not null and new.referred_by <> new.id
     and (tg_op = 'INSERT' or old.referred_by is null) then
    perform public.award_points(new.referred_by, 'referral_confirmed', new.id::text);
    update public.referrals
      set referred_id = new.id, confirmed = true
      where referrer_id = new.referred_by and confirmed = false and referred_id is null;
  end if;
  return new;
end $$;
revoke all on function public.trg_referral_award() from public, anon, authenticated;

commit;
