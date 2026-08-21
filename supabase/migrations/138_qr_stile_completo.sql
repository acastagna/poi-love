-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Lo stile dei QR, con quello che serve al generatore nuovo.
-- Il generatore e' stato rifatto vettoriale il 21/08: si sono aggiunte forme,
-- una seconda tinta per la sfumatura, il colore della pupilla e la scelta fra
-- i marchi. La tabella deve poterli ricordare.

alter table public.qr_stile add column if not exists colore2 text;          -- sfumatura, vuoto = tinta unita
alter table public.qr_stile add column if not exists colore_pupilla text;   -- vuoto = come gli angoli
alter table public.qr_stile add column if not exists sfondo_tipo text not null default 'bianco';
  -- bianco | trasparente | <colore>

comment on column public.qr_stile.colore2 is 'secondo colore della sfumatura; vuoto = un colore solo';
comment on column public.qr_stile.forma_punti is 'quadrato | arrotondato | tondo | rombo | goccia';
comment on column public.qr_stile.forma_angoli is 'quadrato | arrotondato | tondo | foglia | cuscino';
comment on column public.qr_stile.logo is 'poilove | poivoice | nessuno';

-- Il vincolo vecchio conosceva solo 'nostro' e 'nessuno': va tolto prima di
-- poter scrivere i nomi nuovi.
alter table public.qr_stile drop constraint if exists qr_stile_logo_check;
alter table public.qr_stile drop constraint if exists qr_stile_forma_punti_check;
alter table public.qr_stile drop constraint if exists qr_stile_forma_angoli_check;
update public.qr_stile set logo = 'poilove' where logo = 'nostro';

-- Le forme nuove devono essere davvero fra quelle ammesse.
do $$ begin
  alter table public.qr_stile add constraint qr_forme_chk check (
    forma_punti  in ('quadrato','arrotondato','tondo','rombo','goccia') and
    forma_angoli in ('quadrato','arrotondato','tondo','foglia','cuscino') and
    logo in ('poilove','poivoice','nessuno')
  );
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
select * from public.qr_stile;
