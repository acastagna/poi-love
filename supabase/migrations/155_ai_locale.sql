-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- L intelligenza che gira sulla nostra macchina, e cosa sa fare davvero.
--
-- Misurato il 21/08/2026 sulla macchina di Norimberga, senza scheda grafica:
-- il modello qwen2.5 da sette miliardi risponde a sedici, diciannove parole al
-- secondo, con sei secondi di avvio la prima volta. In italiano e inglese va.
-- In albanese no: alla prova ha tradotto "Il castello domina la valle" con
-- "Kasteli domini valen", che non e albanese. Per questo qui ogni fornitore
-- dichiara in quali lingue si puo usare, e chi chiede in albanese non lo prende.

alter table public.ai_fornitori
  add column if not exists indirizzo text,
  add column if not exists lingue text[] not null default '{it,sq,en}',
  add column if not exists locale boolean not null default false;

insert into public.ai_fornitori (chiave, nome, modello, modelli, acceso, ordine, prezzo_nota,
                                 indirizzo, lingue, locale, fa_testo, fa_voce, note)
values ('locale', 'Sulla nostra macchina', 'qwen2.5:7b-instruct-q4_K_M',
        array['qwen2.5:7b-instruct-q4_K_M'], false, 5, 'non costa niente: gira sul nostro server',
        'https://media.poilove.com/locale.php', array['it','en'], true, true, false,
        'Sedici parole al secondo, misurate. Va bene per testi corti in italiano e inglese, per le traduzioni brevi e per capire di cosa parla un testo. In albanese sbaglia: quella lingua resta agli altri.')
on conflict (chiave) do update set
  indirizzo = excluded.indirizzo, lingue = excluded.lingue, locale = true,
  note = excluded.note, ordine = 5;

-- Chi risponde per primo, data la lingua: il pannello decide accendendo e
-- spostando; qui si tiene fuori chi quella lingua non la sa.
create or replace function public.ai_chi_risponde(p_lingua text default 'it')
returns table (chiave text, nome text, modello text, indirizzo text, locale boolean, ordine int)
language sql stable security definer set search_path to 'public' as $$
  select f.chiave, f.nome, f.modello, f.indirizzo, f.locale, f.ordine
    from public.ai_fornitori f
   where f.acceso and f.fa_testo
     and (coalesce(p_lingua,'it') = any (f.lingue))
   order by f.ordine;
$$;
grant execute on function public.ai_chi_risponde(text) to authenticated, service_role;

notify pgrst, 'reload schema';
select chiave, acceso, ordine, lingue, locale from public.ai_fornitori order by ordine;
