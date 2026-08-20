-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il ritmo vero, cantiere per cantiere. La data di fine non e' piu' un'ipotesi
-- unica per tutto ("una giornata al giorno"): ogni cantiere ha la sua velocita',
-- misurata su quello che succede davvero, e i giorni in cui si sta fermi ad
-- aspettare qualcun altro sono contati a parte.
--
-- Misura di partenza (20/08/2026): in un pomeriggio si sono chiuse 3 giornate di
-- programma sui blocchi piccoli. Sui blocchi grossi si va piu' piano, e sui
-- contenuti e sull'app il passo non lo detta chi scrive il codice.

create table if not exists public.programma_ritmo (
  cantiere     text primary key,
  al_giorno    numeric(4,2) not null,
  giorni_fermi int not null default 0,
  nota         text
);

alter table public.programma_ritmo enable row level security;
drop policy if exists ritmo_lettura_pubblica on public.programma_ritmo;
create policy ritmo_lettura_pubblica on public.programma_ritmo for select using (true);
grant select on public.programma_ritmo to anon, authenticated;

truncate public.programma_ritmo;
insert into public.programma_ritmo (cantiere, al_giorno, giorni_fermi, nota) values
('A', 2.5, 0, 'Web: tutto sotto il nostro controllo, il collaudo di Alessandro e'' rapido. Sui blocchi da 4-6 giornate si rallenta.'),
('B', 2.5, 0, 'Amministrazione: stessa materia del web.'),
('C', 1.5, 0, 'Contenuti: il passo lo dettano le fonti aperte e il controllo a mano dei 50 luoghi Ufficiali.'),
('D', 1.5, 7,  'App: impianto nuovo, prove sul telefono vero, e sette giorni fermi per la revisione degli store, gia'' tolto quello che si recupera lavorando ad altro.'),
('E', 2.0, 0, 'Fase due: mercato e rapporto, materia nuova ma piccola.'),
('F', 2.5, 0, 'Confini: lavoro noto, molti punti da toccare.');

notify pgrst, 'reload schema';
