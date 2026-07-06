-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 034: chiusura dei buchi trovati dall'audit backend del 06/07.
--  1) Colonne sensibili di pois scrivibili in diretta dal client (bypass dei perk):
--     is_featured (tetto tier aggirato), love_count (gonfiabile), is_approved
--     (auto-approvazione), author_id (cessione senza codice). Ora si toccano SOLO
--     via le RPC/trigger SECURITY DEFINER. Il trigger love diventa DEFINER cosi
--     continua a funzionare anche dopo la revoca.
--  2) Tier nuovi (professionista_plus, influencer) senza limiti AI: ricadevano su free.
--  3) trg_referral_award confermava TUTTE le referral pendenti di un referrer a ogni
--     iscrizione: ora ne conferma UNA sola.
--  4) category_requests: solo via RPC (niente insert diretto, stop spam anonimo).

-- ── 1) protezione colonne pois ──
-- il trigger di conteggio love deve poter scrivere love_count anche dopo la revoca
alter function public.sync_love_count() security definer set search_path to public;

revoke update (is_featured, love_count, is_approved, author_id) on public.pois from anon, authenticated;

-- ── 2) limiti AI per i tier nuovi (copiano mecenate / professionista) ──
update public.gamification_config
   set value = value
     || jsonb_build_object('professionista_plus', value->'mecenate')
     || jsonb_build_object('influencer', value->'professionista')
 where key = 'ai_limits_per_tier'
   and value ? 'mecenate' and value ? 'professionista';

-- ── 3) referral: conferma UNA sola referral, non tutte quelle del referrer ──
create or replace function public.trg_referral_award()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.referred_by is not null and new.referred_by <> new.id
     and (tg_op = 'INSERT' or old.referred_by is null) then
    perform public.award_points(new.referred_by, 'referral_confirmed', new.id::text);
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
end $function$;

-- ── 4) category_requests: solo via RPC log_category_request (definer) ──
drop policy if exists category_requests_insert on public.category_requests;
