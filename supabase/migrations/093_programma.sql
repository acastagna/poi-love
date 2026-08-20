-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il programma di lavoro, dentro il database: cosi' la pagina di avanzamento
-- si aggiorna da sola invece di essere riscritta a mano ogni volta.

create table if not exists public.programma (
  id            serial primary key,
  cantiere      text not null,
  cantiere_nome text not null,
  blocco        text not null,
  dettaglio     text,
  giornate      numeric(4,1) not null default 0,
  stato         text not null default 'da_fare'
                check (stato in ('fatto','in_corso','da_fare','in_attesa')),
  attesa_di     text,
  ordine        int not null,
  aggiornato    timestamptz not null default now()
);

create index if not exists programma_ordine_idx on public.programma(ordine);

alter table public.programma enable row level security;
drop policy if exists programma_lettura_pubblica on public.programma;
create policy programma_lettura_pubblica on public.programma for select using (true);

drop trigger if exists programma_tocca on public.programma;
create or replace function public.tg_programma_tocca() returns trigger language plpgsql as $$
begin new.aggiornato := now(); return new; end $$;
create trigger programma_tocca before update on public.programma
  for each row execute function public.tg_programma_tocca();

grant select on public.programma to anon, authenticated;
grant usage, select on sequence public.programma_id_seq to authenticated;

truncate public.programma restart identity;
insert into public.programma (cantiere,cantiere_nome,blocco,dettaglio,giornate,stato,attesa_di,ordine) values
('A','Web, il prodotto completo','Migrazioni di base','campi lingua sui luoghi, colonne licenza e autore sulle foto',1.5,'da_fare',null,10),
('A','Web, il prodotto completo','Sicurezza: colonne di amministrazione','togliere al pubblico chi e'' amministratore e le note di moderazione',0.5,'in_attesa','alessandro',20),
('A','Web, il prodotto completo','Certificato di poilove.com','oggi dichiara un''impronta diversa dal PDF: rigenerare o togliere',0.5,'da_fare',null,30),
('A','Web, il prodotto completo','Caduta di lingua sull''inglese','oggi chi non e'' riconosciuto legge albanese',0.5,'da_fare',null,40),
('A','Web, il prodotto completo','Scheda del luogo, struttura vera','copertina separata, gallerie a multipli di tre, video compresso, sezioni per livello',2.5,'da_fare',null,50),
('A','Web, il prodotto completo','Profilo pubblico, cinque tipologie','piu'' la pagina per i motori di ricerca',3,'da_fare',null,60),
('A','Web, il prodotto completo','Amicizia, bloccati, invito a seguirsi','doppio seguito, elenco dei bloccati, testo pronto e modificabile',1,'da_fare',null,70),
('A','Web, il prodotto completo','Recensioni e moderazione AI','sui luoghi e ricevute, direttive scritte, coda e motivo',4,'da_fare',null,80),
('A','Web, il prodotto completo','Vantaggi dei livelli, resi veri','limiti foto, badge, muro, 15 luoghi in omaggio, evidenze',3,'da_fare',null,90),
('A','Web, il prodotto completo','Controllo automatico delle condizioni','30 luoghi al mese, scadenze, decadenza da sola',1,'da_fare',null,100),
('A','Web, il prodotto completo','Locale Plus','orari a tendina, menu con caricamento file, doppia valuta, consigli dello chef, statistiche',6,'da_fare',null,110),
('A','Web, il prodotto completo','Cambio Banca d''Albania','una volta al giorno, con ricaduta sull''ultimo noto',1,'da_fare',null,120),
('A','Web, il prodotto completo','Audio della persona','un minuto ai professionisti, tre ai locali, MP3 192',1.5,'da_fare',null,130),
('A','Web, il prodotto completo','Audioguide ufficiali POI-VOICE','durata libera, tre lingue, gestite dall''amministrazione',2,'da_fare',null,140),
('A','Web, il prodotto completo','QR veri','locale, professionista, influencer',1,'da_fare',null,150),
('A','Web, il prodotto completo','Abbonamenti, registrazione','pagamento fuori dal sistema, scadenze, decadenza',1.5,'da_fare',null,160),
('A','Web, il prodotto completo','Foto: WebP, licenza, volti sfocati','sotto i 100 KB, autore e fonte salvati, volti di terzi oscurati',2,'da_fare',null,170),
('A','Web, il prodotto completo','Tre lingue e pagine per i motori','tutto il testo nuovo, mappa del sito',2,'da_fare',null,180),
('B','Amministrazione','Direttive della moderazione AI','modificabili senza toccare il codice',1.5,'da_fare',null,200),
('B','Amministrazione','Coda segnalazioni e blocco utenti','intervento entro 24 ore, come pretende Apple',1.5,'da_fare',null,210),
('B','Amministrazione','Menu dei locali','compilazione a mano e caricamento da file',1.5,'da_fare',null,220),
('B','Amministrazione','Media con licenza e attribuzione','autore, licenza, fonte, attribuzione visibile',1,'da_fare',null,230),
('B','Amministrazione','Abbonamenti, livelli, ruoli, statistiche','',1.5,'da_fare',null,240),
('C','Contenuti: viaggi e luoghi','Disegnare i 15 viaggi','tema, ordine, dodici prefetture',2,'da_fare',null,300),
('C','Contenuti: viaggi e luoghi','Catena automatica','dati aperti, foto con licenza, controllo dei falsi positivi',3,'da_fare',null,310),
('C','Contenuti: viaggi e luoghi','Sfocatura dei volti sulla macchina','prima della pubblicazione, i bambini sempre',1,'da_fare',null,320),
('C','Contenuti: viaggi e luoghi','Generazione e controllo dei 210 luoghi','tre lingue, bollino Ufficiale',3,'da_fare',null,330),
('C','Contenuti: viaggi e luoghi','ILLI conosce i viaggi e li propone','',1,'da_fare',null,340),
('C','Contenuti: viaggi e luoghi','Come consegnare i 15 luoghi in omaggio','raccolta a suo nome oppure luoghi intestati',0.5,'in_attesa','alessandro',350),
('C','Contenuti: viaggi e luoghi','Script di misura dentro il repository','oggi vivono nella cartella temporanea',1,'da_fare',null,360),
('D','App iPhone e Android','Riscrittura del livello dati','lo scaffold cerca colonne che non esistono piu''; piu'' il porto alla versione attuale',5,'da_fare',null,400),
('D','App iPhone e Android','Accesso','Google, email, sessione che dura',1.5,'da_fare',null,410),
('D','App iPhone e Android','Mappa, lente, marcatori, ricerca','',3,'da_fare',null,420),
('D','App iPhone e Android','Luoghi: elenco, scheda, creazione','posizione, foto, dati della foto',4,'da_fare',null,430),
('D','App iPhone e Android','Profili nelle cinque tipologie','',2.5,'da_fare',null,440),
('D','App iPhone e Android','Itinerari e compagnie','',2.5,'da_fare',null,450),
('D','App iPhone e Android','Notifiche vere','sul web sono impossibili',1.5,'da_fare',null,460),
('D','App iPhone e Android','Avviso quando arrivi vicino','anche con l''app chiusa: il motivo vero dell''app',2,'da_fare',null,470),
('D','App iPhone e Android','Audioguide, QR, condivisione','',1.5,'da_fare',null,480),
('D','App iPhone e Android','Cancellazione account, segnalazione, blocco','richiesti dagli store',1.5,'da_fare',null,490),
('D','App iPhone e Android','Abbonamenti con Apple e Google','15 per cento con il programma piccole imprese',1.5,'da_fare',null,500),
('D','App iPhone e Android','Account Apple e Google Play','li apre Alessandro: 99 dollari l''anno e 25 una volta',0,'in_attesa','alessandro',510),
('D','App iPhone e Android','Tre lingue, icone, immagini per gli store','',1.5,'da_fare',null,520),
('D','App iPhone e Android','Invio agli store e correzioni','tre punti delicati insieme: contenuti, posizione, abbonamenti',2.5,'da_fare',null,530),
('E','Fase due del web','Mercato professionisti e influencer','vetrina, listino visibile solo ai professionisti, proposta',3,'da_fare',null,600),
('E','Fase due del web','Rapporto con marcatura su blockchain','riusando il motore gia'' scritto in Top Market',1.5,'da_fare',null,610),
('E','Fase due del web','Promemoria di scadenza e ricevute','',1.5,'da_fare',null,620),
('F','Uscita dai confini','Impianto delle lingue parametrico','oltre 250 punti di testo scritti a mano',1.5,'da_fare',null,700),
('F','Uscita dai confini','Categorie per lingua','oggi una colonna per lingua, non regge',1,'da_fare',null,710),
('F','Uscita dai confini','Un solo punto di accesso al geocodificatore','undici punti violano le regole d''uso',1.5,'da_fare',null,720),
('F','Uscita dai confini','Formati locali','numeri, date, valute',1,'da_fare',null,730),
('F','Uscita dai confini','Informativa e Condizioni chiuse con un legale','oggi solo in italiano e dichiarate bozze',0,'in_attesa','alessandro',740);

notify pgrst, 'reload schema';
