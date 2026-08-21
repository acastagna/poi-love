-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I quindici viaggi.
-- Sono l'ossatura dei contenuti: quindici percorsi con un tema, un ordine e
-- quattordici tappe ciascuno. Quindici per quattordici fanno duecentodieci
-- luoghi Ufficiali, che e' il numero deciso. Coprono tutte e dodici le
-- prefetture, non solo Tirana e la Riviera.
--
-- Cinque titoli vengono dal documento approvato del 20/08 (Il nord che non ti
-- aspetti, La Riviera senza ombrelloni, La via di Scanderbeg, I laghi, Le mani
-- della cucina albanese). Gli altri dieci sono disegnati sopra quella regola:
-- un tema riconoscibile, non un elenco di posti.
--
-- Nascono tutti come BOZZA: nessun viaggio diventa pubblico senza che Alessandro
-- lo approvi.

create table if not exists public.viaggi_piano (
  id              serial primary key,
  ordine          int  not null,
  nome_it         text not null,
  nome_sq         text not null,
  nome_en         text not null,
  tema            text not null,
  descr_it        text,
  descr_sq        text,
  descr_en        text,
  prefetture      text[] not null default '{}',
  tappe_previste  int  not null default 14,
  stato           text not null default 'bozza' check (stato in ('bozza','approvato','pubblicato')),
  trip_id         uuid references public.trips(id) on delete set null,
  note            text,
  created_at      timestamptz not null default now()
);

alter table public.viaggi_piano enable row level security;
drop policy if exists viaggi_leggo on public.viaggi_piano;
create policy viaggi_leggo on public.viaggi_piano for select using (true);
drop policy if exists viaggi_admin on public.viaggi_piano;
create policy viaggi_admin on public.viaggi_piano for all using (public.sono_admin()) with check (public.sono_admin());
grant select on public.viaggi_piano to anon, authenticated;
grant insert, update, delete on public.viaggi_piano to authenticated;
grant usage, select on sequence viaggi_piano_id_seq to authenticated;
grant all on public.viaggi_piano to service_role;

insert into public.viaggi_piano (ordine,nome_it,nome_sq,nome_en,tema,descr_it,descr_sq,descr_en,prefetture) values
(1,'Il nord che non ti aspetti','Veriu qe nuk e pret','The north you do not expect','montagna e paesi',
 'Le valli oltre Scutari, i villaggi di pietra e le strade che sembrano finire e invece cominciano.',
 'Luginat pertej Shkodres, fshatrat prej guri dhe rruget qe duket se mbarojne por sapo fillojne.',
 'The valleys beyond Shkodra, the stone villages and the roads that seem to end and instead begin.',
 array['Shkoder','Kukes','Lezhe']),
(2,'La Riviera senza ombrelloni','Riviera pa cadra','The Riviera without sunbeds','mare e borghi',
 'La costa del sud fuori stagione: le calette, i paesi appesi e le tavole dove si mangia il pesce del giorno.',
 'Bregdeti i jugut jashte sezonit: gjiret e vogla, fshatrat e varura dhe tavolinat me peshkun e dites.',
 'The southern coast out of season: the coves, the hanging villages and the tables with the fish of the day.',
 array['Vlore']),
(3,'La via di Scanderbeg','Rruga e Skenderbeut','Skanderbeg road','storia',
 'Dove ha camminato davvero: Kruja, i passi di montagna, le fortezze che guardano la pianura.',
 'Aty ku ka ecur vertet: Kruja, qafat e maleve, kalate qe shohin fushen.',
 'Where he actually walked: Kruja, the mountain passes, the fortresses that watch the plain.',
 array['Durres','Diber','Tirane']),
(4,'I laghi','Liqenet','The lakes','acqua',
 'Ohrid, Prespa e Shkodra: tre laghi, tre modi di stare sull acqua, tre cucine diverse.',
 'Ohri, Prespa dhe Shkodra: tre liqene, tre menyra per te jetuar ujin, tri kuzhina te ndryshme.',
 'Ohrid, Prespa and Shkodra: three lakes, three ways of living by the water, three different kitchens.',
 array['Korce','Diber','Shkoder']),
(5,'Le mani della cucina albanese','Duart e kuzhines shqiptare','The hands of Albanian cooking','cibo',
 'Chi impasta, chi affumica, chi conserva: le cucine dove si impara guardando.',
 'Kush gatuan brumin, kush tymos, kush ruan: kuzhinat ku mesohet duke pare.',
 'Who kneads, who smokes, who preserves: the kitchens where you learn by watching.',
 array['Tirane','Elbasan','Korce']),
(6,'Le citta di pietra','Qytetet e gurit','The stone cities','architettura',
 'Berat e Argirocastro: tetti, finestre e scale che raccontano come si viveva.',
 'Berati dhe Gjirokastra: catite, dritaret dhe shkallet qe tregojne si jetohej.',
 'Berat and Gjirokastra: roofs, windows and stairs that tell how people lived.',
 array['Berat','Gjirokaster']),
(7,'Le vie dell olio e del vino','Rruget e vajit dhe veres','The oil and wine roads','cibo',
 'Uliveti e vigne fra Fier e Berat, con le cantine che aprono la porta a chi chiede.',
 'Ullishtat dhe vreshtat mes Fierit dhe Beratit, me kantinat qe hapin deren per ke troket.',
 'Olive groves and vineyards between Fier and Berat, with cellars that open the door to whoever asks.',
 array['Fier','Berat','Vlore']),
(8,'Prima dell Albania','Para Shqiperise','Before Albania','archeologia',
 'Apollonia, Bylis, Durazzo: le pietre greche e romane e quello che ci hanno lasciato sotto i piedi.',
 'Apolonia, Bylisi, Durresi: gurët greke dhe romake dhe cfare na kane lene nen kembe.',
 'Apollonia, Bylis, Durres: the Greek and Roman stones and what they left under our feet.',
 array['Fier','Durres']),
(9,'Monasteri e icone','Manastire dhe ikona','Monasteries and icons','arte sacra',
 'Le chiese dipinte del sud e i monasteri dove il tempo si e fermato per scelta.',
 'Kishat e pikturuara te jugut dhe manastiret ku koha ka ndaluar me deshire.',
 'The painted churches of the south and the monasteries where time stopped on purpose.',
 array['Korce','Berat','Gjirokaster']),
(10,'Le alpi e i sentieri','Alpet dhe shtigjet','The alps and the trails','montagna',
 'Theth, Valbona e i passi in mezzo: cammini veri, con i posti dove si dorme.',
 'Thethi, Valbona dhe qafat ne mes: ecje te verteta, me vendet ku flihet.',
 'Theth, Valbona and the passes between: real walks, with the places to sleep.',
 array['Shkoder','Kukes']),
(11,'Il mare del sud','Deti i jugut','The southern sea','mare',
 'Da Himara a Saranda, con le soste che non stanno sulle cartoline.',
 'Nga Himara ne Sarande, me ndalesat qe nuk dalin ne kartolina.',
 'From Himara to Saranda, with the stops that are not on the postcards.',
 array['Vlore']),
(12,'Le citta del lavoro','Qytetet e punes','The working cities','memoria',
 'Elbasan, Kukes, Peshkopia: le fabbriche, le miniere e cosa e rimasto delle persone che ci lavoravano.',
 'Elbasani, Kukesi, Peshkopia: fabrikat, minierat dhe cfare ka mbetur nga njerezit qe punonin aty.',
 'Elbasan, Kukes, Peshkopia: the factories, the mines and what remains of the people who worked there.',
 array['Elbasan','Kukes','Diber']),
(13,'Il Novecento sotto terra','Shekulli i njezete nen toke','The twentieth century underground','memoria',
 'Bunker, gallerie e rifugi: il secolo che l Albania ha passato guardandosi le spalle.',
 'Bunkere, tunele dhe streha: shekulli qe Shqiperia e kaloi duke ruajtur shpinen.',
 'Bunkers, tunnels and shelters: the century Albania spent watching its back.',
 array['Tirane','Durres','Elbasan']),
(14,'Sorgenti e cascate','Burime dhe ujevara','Springs and waterfalls','natura',
 'L acqua che esce dalla roccia: Bogova, il Syri i Kalter, i mulini rimasti.',
 'Uji qe del nga shkembi: Bogova, Syri i Kalter, mullinjte qe kane mbetur.',
 'Water coming out of the rock: Bogova, the Blue Eye, the mills that remain.',
 array['Berat','Vlore','Elbasan']),
(15,'Mercati e mestieri','Tregje dhe zeje','Markets and crafts','vita quotidiana',
 'Dove si compra, si contratta e si ripara: i mestieri che tengono in piedi una citta.',
 'Ku blihet, pazarohet dhe riparohet: zejet qe mbajne ne kembe nje qytet.',
 'Where people buy, bargain and repair: the crafts that keep a city standing.',
 array['Tirane','Korce','Shkoder'])
on conflict do nothing;

notify pgrst, 'reload schema';
