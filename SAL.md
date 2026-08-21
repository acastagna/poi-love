# SAL — Stato Avanzamento Lavori · POI•LOVE

## 21/08/2026 sera — I comandi diventano nostri, i livelli si creano, i documenti entrano in testa agli assistenti

Programma da 68,5 a 70,5 giornate su 113. Controllo: 19 su 19.

### I comandi del pannello, disegnati da noi
Le tendine e le caselle di spunta erano quelle del sistema operativo: fondo
bianco, azzurro di Windows, dentro una scheda scura stonavano. Adesso c'e'
`admin/js/ui-controls.js`, con la tendina e l'interruttore nostri, che seguono
il tema chiaro e scuro come tutto il resto. La tendina si apre in posizione
fissa: dentro le schede che scorrono, una tendina normale veniva tagliata a
meta'. Rifatti con questi comandi: Modifica POI, l'editor dei livelli, le voci
di POI•VOICE, il riquadro dei badge.

Il riquadro **Badge e assegnazione** era una macchia color crema su fondo scuro,
coi colori scritti a mano dentro il codice. Adesso segue il tema, legge i livelli
veri dal database invece di una lista scritta nel programma, e accanto al nome
della persona mostra la sua faccia.

Nel Modifica POI il muro di ventiquattro categorie si filtra, le scelte stanno
sempre in cima e l'area non si mangia mezza scheda. Il campo "Pubblico" con la
casella azzurra e' diventato **Visibile a tutti**, con sotto scritto cosa
succede quando e' spento.

### I livelli si creano, e i vantaggi dicono cosa fanno davvero
Prima si potevano solo regolare. Adesso se ne creano di nuovi, anche copiando
le regole di uno che c'e' gia', e si eliminano (solo se nessuno ce l'ha addosso:
chi paga non resta orfano).

I vantaggi hanno un **catalogo di sedici voci**, e ogni voce dice a chiare
lettere se e' una **regola** che il programma fa rispettare da solo, o una
**promessa** che manteniamo a mano. Dieci sono regole vere e portano il numero
nella colonna che le fa rispettare: metti "dodici foto" e da quel momento il
server rifiuta la tredicesima. Sei sono promesse, ed e' scritto che nessuno le
controlla al posto tuo.

C'e' anche una **chat con l'AI sui vantaggi**, che passa dalla coda e non costa
niente: conosce prezzo, pubblico e vantaggi gia' presenti, propone righe gia'
scritte nelle tre lingue e le mostra in anteprima prima di inserirle.

Alla prima prova i vantaggi si duplicavano: le righe vecchie non sapevano da
quale voce del catalogo venissero. Ricostruito il collegamento sul testo,
ventidue righe su ventisei ora lo sanno, e mettere due volte lo stesso vantaggio
aggiorna invece di duplicare.

### La conoscenza: i PDF entrano davvero
Un manuale di decine di pagine non si incolla in una scheda. Adesso si carica il
PDF: il server delle immagini ne tira fuori il testo pagina per pagina e lo
spezza in pezzi corti (nessuna chiave passa di li'), poi la funzione che ha la
chiave mette accanto a ogni pezzo il numero che ne descrive il significato. Da
li' in poi, a domanda fatta, si trova il pezzo giusto anche con parole diverse.

Provato dal vivo con le condizioni d'uso, otto pagine: alla domanda "che eta'
bisogna avere per iscriversi?" ha tirato fuori il passaggio dei sedici anni,
con numero di pagina. Due difetti trovati dalla prova stessa: la coda di ogni
pagina avanzava di un carattere alla volta (otto pagine facevano novecentoventi
pezzi, ora trenta), e nginx e PHP scrivevano tutti e due la stessa intestazione
di sicurezza: il browser rifiutava ogni chiamata. **Quel secondo difetto
riguardava anche `upload.php` e `audio.php`**, cioe' il caricamento delle foto e
della voce: era rotto dal passaggio alla macchina nuova e non se n'era accorto
nessuno.

### Un'intelligenza sulla nostra macchina
Installato Ollama sulla macchina di Norimberga con qwen2.5 da sette miliardi,
chiuso a chiave: ascolta solo se stesso, e da fuori ci si arriva solo con un
biglietto di servizio. ILLI e il copilota lo provano per primi e, se non
risponde in tempo, passano oltre senza far aspettare nessuno.

**Misurato, non sperato**: sedici parole al secondo, costo zero. Ma alla domanda
"cosa e' POI•LOVE" ha risposto che non lo sa, e ha tradotto "Il castello domina
la valle" in una cosa che non e' albanese. Per questo e' **spento**, con la
misura scritta nel pannello: si accende con un click quando conviene, e si
spegne quando la risposta non regge. La tabella dei fornitori adesso dice anche
in quali lingue si puo' usare ciascuno.

### Lo studio di doppiaggio
Costruito tutto: la funzione manda a Google il copione scelto con le due voci e
la regia, rimette l'intestazione al suono grezzo che torna indietro, il pannello
salva il file, scrive la prova e **segna la spesa prima di sapere se piacera'**.
Buttare una prova non toglie niente dal conto: si paga anche quello che si
scarta, e il motivo resta scritto. Anche l'assaggio di una voce e' una
generazione pagata, e finisce nel conto come tale.

Mancava il ponte piu' importante: le prove vivevano nel laboratorio, l'app suona
da un'altra tabella, e in mezzo non c'era niente. Adesso **Pubblica questa**
porta la voce scelta dove l'app la sente davvero.

Alla prova dal vivo tutto risponde fino a Google, che dice: manca la chiave.
E' l'unica cosa che manca, ed e' in mano a lui.

### Una mina tolta dal server
Le copie di sicurezza della configurazione di nginx fatte stamattina erano
rimaste **dentro la cartella che nginx legge**: le caricava tutte. Vinceva
ancora quella giusta per ordine alfabetico, ma bastava un nome diverso per far
vincere una vecchia. Spostate in `/root/nginx-copie`, niente cancellato.


## 21/08/2026 pomeriggio — Il pannello diventa un pannello, e i QR rinascono

Nove pezzi chiusi di fila, senza fermarsi. Programma da 59 a 67,5 giornate su 113.

### I codici QR, rifatti da zero
Erano disegnati a pixel e al posto del marchio c'era un cerchio colorato. Adesso
il codice **nasce vettoriale**: l'SVG e' la forma vera, da li' escono PNG e JPG
disegnati da un motore che sa fare le curve. Cinque forme di punti, cinque di
angoli, sfumatura a due colori, colore della pupilla, il cuore POI•LOVE vero in
mezzo, e quattro modi di scaricarlo: PNG trasparente, PNG bianco, JPG bianco,
JPG col fondo che vuoi, piu' l'SVG che non ha dimensione.

**Provate settantacinque combinazioni con un lettore vero.** Al primo giro ne
fallivano ventisette: gli angoli tondi pieni e la foglia come l'avevo disegnata
non si leggono, e il PNG trasparente non si leggeva perche' il buco degli angoli
era dipinto invece che ritagliato. Riscritti come anello con riempimento a regola
alternata: settantacinque su settantacinque.

### Il pannello
| Cosa | Prima | Adesso |
|---|---|---|
| Livelli | si registrava un abbonamento e basta | prezzo, periodo, tutte le manopole, e i vantaggi uno per uno nelle tre lingue |
| Persone | si sospendeva senza sapere perche' | le segnalazioni fatte e ricevute nella scheda; sospensione con durata e motivo scritti da chi modera |
| Copilota | fornitore e modello fissi nel codice | li sceglie il pannello, e sotto la risposta c'e' scritto chi ha risposto |
| Compagnie | non esistevano | elenco, membri, bacheca coi vocali, moderazione |
| Connessioni AI | due nomi scritti nel codice | sette fornitori, pallino verde solo se chiave presente E acceso, bottone per prendere la chiave, prova vera |

### POI•VOICE, le prime due fasi funzionano
Sezione nuova. Si sceglie il luogo e la lingua, sei domande gia' pronte piu' la
chat libera, il materiale resta attaccato al luogo. Poi il copione, nella durata
scelta. Ricerca e copione passano dalla **coda**: la domanda finisce in una
tabella e risponde chi sta girando sul Mac, quindi non costano niente.

Provata per intero sul castello di Berat: domanda con le coordinate vere, presa
dal Mac, risposta, tenuta; poi il copione a tre minuti, scritto, tenuto e scelto.

La fase tre ha le trenta voci, la regia, le tre durate e il conto della spesa
tenuto da noi. Manca solo la chiave di Google.

### Due cose trovate per strada
- **Il copilota era morto dal 18 agosto**: chiedeva a Supabase chi fossi mentre
  gli accessi sono nostri. L'ultima risposta riuscita era del 12 luglio.
- **Una porta aperta nel database**: convivevano due controlli di amministratore,
  uno che pretendeva il secondo fattore e uno che guardava solo il profilo. Tutto
  quello scritto nelle ultime settimane usava il secondo. Misurato: con la sola
  password si metteva una domanda in coda. Adesso chiedono la stessa cosa.


## 21/08/2026 mattina — Revisione del codice della notte (5.34)

Cinque revisioni indipendenti, in sola lettura, su tutto quello che era stato scritto fra le 00:15 e
le 09:00: app, server delle foto, funzioni AI, pannello di amministrazione, migrazioni del database.
Tre revisioni su cinque hanno dato esito **bloccato**. Tutto quello che hanno trovato e' stato
riparato, pubblicato e verificato dal vivo. Controlli 18 su 18.

### Database (migrazione 131)
| Buco trovato | Chiuso cosi' |
|---|---|
| Una recensione gia' pubblicata si poteva spostare su un altro luogo con una sola richiesta: stesso voto, stesso testo, ancora pubblicata, senza amicizia e senza moderazione | La regola di correzione ripete le condizioni della scrittura; se cambia il luogo la recensione torna in coda |
| `stato_condizione` accettava l'identificativo di chiunque: si leggeva il livello e la scadenza dell'abbonamento di un altro | Risponde solo sull'interessato, o all'amministrazione |
| `segnalazioni_da_guardare` e `candidati_conto` erano leggibili da qualunque persona collegata | Solo amministrazione |
| La voce del luogo accettava tre minuti per tutti | Il tetto del livello e' imposto dal database |
| I quindici viaggi in bozza erano pubblici da subito | Si vedono solo da approvati; un viaggio per posizione |
| La foto non si poteva correggere ne' togliere da chi l'aveva messa | Ora si' |
| Gli orari si cancellavano e poi si riscrivevano: se la seconda meta' non partiva, il locale restava senza orari | Una sola chiamata, `sostituisci_orari`: o tutto o niente |
| Un itinerario si poteva legare a una compagnia di cui non si fa parte | Vincolo sul database |

### App
- Il pannello del locale controlla la proprieta' all'apertura e a ogni scrittura.
- Gli indirizzi delle foto dentro gli attributi di stile toglievano solo l'apice singolo: con un
  doppio apice l'attributo si chiudeva prima del previsto. Ora passano tutti da `_escAttr`.
- Il menu chiede con le nostre finestre, non con quelle del browser.
- Tutte le chiavi delle tre lingue verificate: ne mancava una sola (`loc_non_tuo`), aggiunta.

### Pannello di amministrazione
- `esc()` in tutti e cinque i moduli nuovi, ogni campo che arriva dai dati aperti passa di li'.
- Registrare un abbonamento chiede conferma coi numeri sotto gli occhi e spegne il bottone: due clic
  facevano due abbonamenti e una scadenza sbagliata.

### Lavori automatici della macchina
- Il controllo della notte scrive **NON FATTO** se il database risponde male, invece di una riga che
  sembra a posto.
- Il cambio della Banca d'Albania controlla moneta e numero prima che finiscano in una istruzione SQL.
- I registri si tengono otto settimane, poi si buttano (`/etc/logrotate.d/poilove`).

### Profili dimostrativi
La parola d'accesso scritta sul foglio non funzionava. Rimessa, e provata dal vivo su tutti e sette:
entrano. Il foglio resta valido, la parola e' la stessa.


## Notte fra 20 e 21/08/2026 — Recensioni, vantaggi dei livelli, controllo delle condizioni (5.04 → 5.07)

Lavoro in autonomia, tre blocchi del programma chiusi e in linea. Stato sempre aggiornato su
https://sal.poilove.com/avanzamento.html

### Recensioni con moderazione AI (5.05, migrazioni 103-106)
- Le scrive solo chi e' **amico** di chi ha creato il luogo, una a testa, da 0 a 5.
- **Nessuno pubblica da solo**: il database impone lo stato "in coda" a qualunque cosa arrivi dal
  telefono. L'unica a poter pubblicare e' la funzione di moderazione sul server (`modera-recensione`).
- La moderazione segue **otto direttive scritte nel database**, cambiabili dal pannello.
  Prova reale: testo con insulti e numero di telefono -> respinta, direttive 1 e 4; testo corretto -> pubblicata.
- Se chi ha scritto smette di seguire, la recensione sparisce; se il locale blocca, la recensione resta.
- Recensire vale 200 punti.
- **Guasto riparato**: nel passaggio al nostro database si era perso l'indice unico di `point_events`.
  Da allora **nessuna azione assegnava piu' punti**, in tutto il sistema, e l'errore spariva in silenzio.

### I vantaggi dei livelli, resi veri (5.06, migrazioni 107-108)
- Tabella `livelli`: foto, video, secondi di voce, audioguide, luoghi in evidenza, spunta, muro.
  Tutti numeri **nel database**, cambiabili dal pannello senza toccare il programma.
- Foto per luogo: Persona copertina + 3, Sostenitore + 6, Mecenate + 9, Influencer e Professionista + 12,
  Locale Plus + 21. Il tetto lo fa rispettare il database al salvataggio, verificato.
- Tolto il vecchio **tetto fisso di 3 foto per chiunque**, che rendeva impossibili tutti i livelli superiori.
- Riparato: il **video era spento per tutti**, il codice leggeva una variabile che nessuno riempiva.

### Controllo automatico delle condizioni (5.07, migrazione 109)
- Patto per livello: **30 luoghi in trenta giorni** all'Influencer, **rinnovo** a Professionista e Locale Plus.
- Lavoro della notte alle 03:20 (`/usr/local/bin/poilove-condizioni.sh`, `/etc/cron.d/poilove-condizioni`):
  chi e' fuori riceve un **avviso**, e se dopo **quattordici giorni** non e' cambiato niente perde il livello
  da solo. Ogni passo resta scritto in `livello_eventi`.
- Nell'app compare il riquadro **"Il tuo patto"** con i numeri veri.
- Riparato: l'invito a ricambiare scriveva un avviso che il database rifiutava in silenzio.

Controlli esterni: **18 su 18** dopo ogni pubblicazione. Programma: **20 giornate su 97**.

---

## Sessione 20/08/2026 (pomeriggio e sera) — La scheda del luogo diventa il disegno approvato (v4.62 → 4.78)

**Dove si guarda lo stato, da oggi**: https://sal.poilove.com/avanzamento.html
Si aggiorna da sola: legge la tabella `programma` (migrazione 093) e ricalcola percentuale,
giornate che restano e data di fine. Il SAL e il sito di presentazione hanno la stessa riga viva.
Il progetto per intero, stampabile: https://sal.poilove.com/progetto.html

### Prima parte: disegni, programma, verifiche

- **Sei schede del luogo e sei profili pubblici** disegnati e approvati (`docs/mockup-schede-profili/`),
  con le regole scritte in TODO.md: copertina, gallerie a righe piene, recensioni solo dove servono,
  audioguide, QR, mercato delle collaborazioni.
- **Pagina pubblica dei livelli** aggiornata: Plus locali a **250 euro l'anno**, foto del locale
  **copertina + 21 e un video**, in tre lingue, su project e sal.
- **Programma di lavoro dentro il database** (`programma`, `programma_ritmo`): 97 giornate, sei cantieri,
  data di fine calcolata sul ritmo di ciascuno.
- **Controllo avversariale indipendente** (agente certificatore + quattro indagini con revisore):
  ha smentito quattro mie affermazioni. In sintesi: l'impianto dell'app Expo **non** parla con lo schema
  vero (e' una riscrittura, non un aggancio); il "rapporto notarizzato" non prova nessuna data;
  le foto esterne si prendevano **senza salvare licenza e autore**; i 200 luoghi partivano da 18.
  Correzioni e prove in `PROGETTO-PROFILI-E-SCHEDE.md`, capitolo 9 e 16.

### Seconda parte: lavoro vero, otto giornate di programma chiuse

| Blocco | Cosa e' cambiato |
|---|---|
| Migrazioni di base (094) | i luoghi hanno i campi per le tre lingue; le foto hanno licenza, autore, fonte e attribuzione, con una **guardia**: una foto da Commons o Openverse senza licenza viene rifiutata dal database |
| Sicurezza (095) | la tabella delle persone non espone piu' a chiunque `is_admin`, `admin_role` e le note di moderazione. Restano pubbliche solo le colonne pubbliche |
| Impronta del documento | il certificato scaricabile da poilove.com dichiarava numeri di un altro file: rigenerato, e ora dice cosa prova e cosa non prova. Via la parola "notarizzazione" |
| Lingua | chi non e' riconosciuto legge **inglese**, non piu' albanese. Vale anche per le pagine dei motori |
| Video (096, video.php) | un video per luogo: ffmpeg sulla macchina, 83 MB diventano 3, lato lungo 1080, MP3/AAC, copertina presa dal video, dati nascosti del telefono rimossi |
| Scheda del luogo | rifatta sul disegno: copertina che scorre, chilometri sulla copertina, titolo con pastiglia della categoria, indirizzo, fascia dell'autore col badge del livello e **Segui vero**, Love bianco a zero e rosso da uno in su, azioni **tre se non e' tuo / cinque se e' tuo**, foto incassate a righe piene con la Copertina marcata, tag, fa parte di, **mappina satellitare inquadrata sul punto**, sei tempi di viaggio uno per riga (a piedi, bici, auto, aereo, nave, e a tutto impulso), chi lo ama, piedino col logo steso centrato, freccia che pulsa al posto della barra di scorrimento |
| Luoghi di prova | **Pizzeria Aurora** (luogo vero da OpenStreetMap, profilo dimostrativo Marta B., senza foto) e **Opa (copia di prova)** intestato a Patrizia, a 362 m da casa: servono a vedere la scheda di un luogo che non e' tuo |

**Guasti trovati e chiusi mentre si lavorava**: sostituire o cancellare la copertina cancellava tutte
le altre foto del luogo; le sezioni nuove erano collegate a una sola delle due strade di apertura della
scheda, quindi non si vedevano mai; il segnaposto della mappina usciva come una cornetta del telefono.

**Regola nuova, scritta**: ogni pezzo finito si segna subito nel programma; le domande si fanno al
momento giusto, cioe' appena finisce il blocco che le precede, mai tutte insieme.

---

## Sessione 20/08/2026 — Revisione sulla scheda POI: due guasti seri chiusi (v4.59 → 4.61)

**SALVA POI in alto** (richiesta del founder, col disegno): pulsante rosso in alto a destra nella
testata, sempre sotto gli occhi; quello in fondo si chiama uguale (prima diceva "Segna sulla mappa").
Riaprendo un luogo per modificarlo la scheda **parte dall'inizio**.

**Revisione del codice (agente code-quality), verdetto iniziale BLOCCATO. Riscontri verificati uno
per uno e chiusi tutti:**

1. **Le foto potevano passare da un luogo a un altro.** Dopo aver salvato un luogo nuovo restavano
   in canna i FILE delle foto (si azzeravano le anteprime, non i file). Aprendo poi un altro luogo
   in modifica e salvando senza toccare le foto, quelle vecchie **sostituivano** le sue. Ora i file
   si azzerano col salvataggio e all'apertura di una modifica.
2. **Chiudere la scheda col gesto (non con la X) lasciava aperta la modifica.** Il "+" successivo
   creava un luogo nuovo che in realta' **sovrascriveva quello vecchio**, senza alcun segnale. Ora
   la chiusura col gesto chiude anche la modifica e ferma il cronometro.
3. **I due pulsanti dicevano cose diverse**: ora dicono **AGGIORNA POI** quando modifichi e
   **SALVA POI** quando crei, tutti e due, in tutte e tre le lingue.
4. **La linguetta "Luogo dove sono" restava ferma alla prima lettura**: se ti spostavi mentre
   compilavi non lo sapeva. Ora mostra subito quella di prima e intanto rilegge il GPS.
5. **Il nome dell'autore che arriva in ritardo** poteva finire sulla scheda di un altro luogo
   aperto nel frattempo: ora si scrive solo sul luogo che l'ha chiesto.
6. **Migrazione 092** allineata alle altre (`on conflict do nothing`): stesso account su due schermi
   non genera piu' un errore.

Misurato dal vivo: creando i pulsanti dicono SALVA POI, modificando dicono AGGIORNA POI, nessun file
foto ereditato, e dopo la chiusura col gesto la modifica risulta chiusa.

## Sessione 19/08/2026 (15) — Chi migliora un luogo prende punti e viene ringraziato (v4.57 → 4.58)

**4.58 — due difetti trovati e chiusi**
1. **Il grazie non usciva.** Il numero del luogo veniva letto DOPO il salvataggio, ma nel frattempo
   la scheda si chiude e azzera quel numero: il premio non veniva mai chiesto (nel registro punti
   non c'era nessun `poi_improved`). Ora il numero si prende all'ingresso della funzione. Provata la
   regola sul database: accredita 5 punti, una volta al giorno per luogo.
2. **"Anonimo" al posto dell'autore.** Nel database l'autore e' sempre giusto: era la scheda a
   scrivere "Anonimo" quando apriva un luogo appena salvato, perche' in quel momento il nome
   dell'autore non e' ancora agganciato. Ora: se il luogo e' mio metto il mio nome, altrimenti lo
   chiedo al database e lo scrivo appena arriva. Misurato su un luogo senza profilo agganciato:
   mostra "Alessandro Castagna", non piu' "Anonimo".


Ordine del founder: "quando vado a modificare acquisisco altri punti e vengo ringraziato, perche' ho
migliorato un posto del cuore e quindi tutta la community, sia in mobile che in desktop".

- **Migrazione 092**: nuovo accredito `poi_improved`, valore **5 punti**, regolabile dal pannello
  admin come tutti gli altri. La funzione `award_poi_improvement` controlla che il luogo sia tuo,
  accredita **una volta al giorno per ogni luogo** (rientrare dieci volte non moltiplica i punti) e
  ha un tetto di 20 miglioramenti premiati al giorno.
- **Nell'app**: appena il salvataggio della modifica va a buon fine si chiede il punto al server; se
  arriva, si apre la finestra **al centro, verde**, con la mano che tiene il cuore, "+5 punti",
  **"Grazie! Hai migliorato un luogo del cuore: ci guadagna chi lo trovera' dopo di te."** e il
  pulsante "Vai al POI". Se il premio non spetta (gia' preso oggi per quel luogo) resta il semplice
  avviso di aggiornamento, senza finestre inutili.
- Stessa finestra su telefono e computer: e' la stessa del salvataggio, quindi e' gia' centrata.

## Sessione 19/08/2026 (14) — La schermata del POI e la ricerca (v4.33 → 4.56)

**4.55-4.56 — guasto mio, trovato e chiuso.** Con un livello di sostegno o professionale
(Mecenate, Professionista…) la testata si rompeva: la targhetta usava il colore SCURO del livello
sopra il fondo scuro del distintivo, quindi il nome spariva, e la barra dava "livello massimo" con
la scritta vuota perche' i livelli di sostegno non hanno una soglia a punti.
Ora: con un livello speciale la targhetta tiene i **suoi** colori (chiaro su fondo scuro) e la barra
legge **sempre** la scala a punti, che continua a esistere. Provati e misurati i quattro casi:
ospite 0 punti, 340 punti, **Mecenate con 340 punti**, 30k punti (livello massimo).


**4.46-4.54 — ricerca e testata, chiuse**
- **Ricerca principale**: prima i tuoi POI, poi un solo elenco di luoghi **dal piu' vicino al piu'
  lontano coi chilometri scritti**. La ricerca parte da **dove sei tu** (Google entro 50 km da te
  piu' una domanda dedicata a OpenStreetMap sulla tua zona): prima Nominatim non riceveva nemmeno il
  punto, per questo i posti vicini non uscivano.
- **Niente piu' righe uguali**: OpenStreetMap spezza una via lunga in tanti tratti con lo stesso
  nome (erano cinque "Rruga 5 Maji" identiche). Ora la stessa via nella stessa citta' compare una
  volta sola, il tratto piu' vicino, anche quando la citta' arriva scritta in due lingue.
- **Testata**: livello col punteggio gia' conseguito ("Viaggiatore · 340"), punti in **blu**,
  cronometro **sulla stessa riga**; sotto la **barra di avanzamento** col traguardo. Livello e barra
  si toccano e aprono il pannello dei livelli.
- I quattro modi restano allineati a sinistra (provato centrato, non piaceva: rimesso com'era) e
  ognuno **si ricorda il suo punto**: torni su GPS e trovi il GPS, torni su Foto e trovi la foto.
- Verificato su schermo largo (1680 px): riga e barra ci sono e sono piene; popup finale **verde**
  sotto il minuto e **oro** sopra, sempre al centro, con "Vai al POI".


**4.44-4.45**
- In testa torna **lo stato del profilo**: livello, punti che stai per prendere e **barra di
  avanzamento** col traguardo scritto ("340 punti · al prossimo livello Giramondo: 660"), coi punti
  veri del profilo.
- I quattro modi di dire dove sei sono **quattro pulsanti tutti in vista** (due per riga sul telefono,
  quattro in fila su schermo largo): niente piu' carrello che scorre di lato. Ogni pulsante mostra il
  **nome intero**, va a capo invece di tagliare le parole.


**4.39-4.43 — le ultime richieste, una per una**
- Il **cronometro non si ferma piu' al minuto**: corre finche' non salvi (misurato 0:59 → 1:05 e oltre).
- Il messaggio del risultato **non esce mentre scrivi**: durante la compilazione parlano solo il
  cronometro e i punti in cima. Esce **quando salvi**, al centro dello schermo: **verde** con la coppa
  sotto il minuto, **oro** col cappello da laureato sopra, e il pulsante porta **dritto al POI appena
  creato** ("Vai al POI": la mappa ci si posa sopra e si apre la sua scheda).
- **"Complimenti"** al posto di "Bravo", in tutte e tre le lingue.
- **La ricerca parte da dove sei**, non da dove guarda la mappa. Nominatim non riceveva nemmeno il
  punto (vuole un riquadro, non le coordinate): per questo i posti vicini non uscivano. Provato da
  Zugliano: "tosano" -> **Iper Tosano, Thiene, 3,1 km** primo; "motta" -> Motta di Costabissara 13 km.
- **Guasto mio, riparato**: per allineare la testata avevo cambiato tre regole (freccia, chiudi,
  cronometro) che sono **condivise da tutte le schede**: erano cambiate le misure ovunque. Rimesse
  identiche all'originale (verificate riga per riga contro ieri), le misure nuove valgono solo dentro
  la testata della scheda POI.


**4.37-4.38 — testata in ordine e ricerca per distanza.**
La testata era in disordine: freccia sopra da sola, targhette impilate, nome del livello giallo su
giallo. Ora **una riga sola** (freccia · titolo · cronometro · chiudi) e **sotto, allineate al
titolo**, le due targhette su una riga: livello (col suo colore scuro, leggibile) e punti.
La ricerca indirizzi ora mostra **il nome del posto** in grande e sotto **via, citta', provincia,
regione, paese**, con la **distanza da dove sei** a destra, e i risultati sono **in ordine di
vicinanza**. Provato da piazza Skanderbeg cercando "bar": Bar Kafe Living Room 702 m, Bar & Restorant
Colombo 952 m, Bar Kruja 1,5 km, Bar Iris 1,5 km, Bar (Zall-Herr) 7,9 km.


**4.36 — anche la schermata finale tiene il colore del traguardo**: bordo e riquadro dei punti
**verdi** sotto i 60 secondi (con la coppa), **oro** sopra (col cappello da laureato), e il numero
dei punti presi davvero, quelli che il server ha accreditato. Misurato: 42 secondi → verde, +16 punti;
95 secondi → oro, +10 punti.


**I quattro modi di dire dove sei**, chiamati con parole vere (titolo grande + sigla piccola):

| Prima | Ora |
|---|---|
| GPS Live | **Luogo dove sono** · GPS LIVE |
| Foto EXIF | **Dove è stata scattata la foto** · DATI EXIF |
| Indirizzo | **Indirizzo** · VIA, NUMERO, CITTÀ |
| Tocca mappa | **Posiziona la mappa** · TOCCA IL PUNTO |

**Il motore degli indirizzi, rifatto.** Prima: un solo motore, dalla terza lettera, che non
perdonava un errore di battitura. Ora due motori insieme (Photon di komoot, nato per scrivere e
tollerante agli errori, e Nominatim, preciso sui numeri civici), dalla seconda lettera, vicino a
dove sta guardando la mappa, senza doppioni, con chi ha il numero civico per primo. Ogni riga mostra
tutta la scala: **via e numero, CAP, città, provincia, regione, stato**, e quella scala finisce nel
POI (migrazione 090: colonne `province`, `region`, `postcode`).
Provato dal vivo con "rruga myslym shyr tiran" scritto male: **7 risultati**, il primo è
"Rruga Myslym Shyri · 1014 · Tiranë · Qarku i Tiranës · Shqipëria".

**"Fissa il punto"**: era una pillolina bianca in alto a destra, ora è un bottone rosso grande al
centro sotto il mirino, con un battito leggero. Non si può non vederlo.

**I punti del POI, a tempo** (migrazione 091). In cima alla scheda: **Salva il tuo POI**, il tuo
livello e i punti che stai per prendere. Si parte da **30** e si scende di uno ogni 3 secondi, mai
sotto **10**. Entro 60 secondi resta la coppa e il "bravo"; oltre i 60 il riquadro diventa **oro**,
la coppa diventa un **cappello da laureato** e il messaggio è "I miei complimenti per l'accuratezza".
Chi **rientra a perfezionare** un POI già salvato non è in gara: nessun conto alla rovescia.
I punti non sono una scritta: il server rifà il conto (`award_poi_speed_bonus`), controlla che il POI
sia tuo e appena creato, accredita una sola volta e ha un tetto giornaliero.

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (13) — I livelli in ordine, e la pagina che li racconta (v4.29 → 4.32)

**Nel pannello dell'app** i livelli sono ora in due famiglie, nell'ordine deciso:

| Famiglia | Livelli, in ordine | Quota | Condizione per tenerlo |
|---|---|---|---|
| Sostegno | Sostenitore | quota libera, soglia minima | il sostegno che si ferma ferma i vantaggi |
| Sostegno | Mecenate | quota mensile | come sopra |
| Professionisti | Influencer | gratuito | almeno 30 POI al mese, altrimenti via vantaggi e spunta |
| Professionisti | Professionista | quota annuale | senza rinnovo i vantaggi si fermano |
| Professionisti | Plus · Locali e attività | quota annuale in definizione | senza rinnovo la scheda del locale torna normale |

Il livello dei locali elenca cio' che avra': 20 foto, listino e menu, sistemi di pagamento, orari,
QR del locale, statistiche. E' marcato **in costruzione**, perche' quelle funzioni vanno ancora fatte.

**Due difetti trovati e chiusi mentre si lavorava**
- Il pannello mostrava le soglie di riserva se veniva aperto prima che arrivassero quelle vere dal
  database: ora si ridisegna da solo appena arrivano.
- Nuovo indirizzo diretto **poilove.com/?livelli=1**: apre il pannello dei livelli, anche da ospite.

**Pagina dedicata**: `livelli.html`, pubblicata su **project.poilove.com** e su **sal.poilove.com**,
**una pagina per lingua** (italiano, albanese, inglese) generata da `scripts/build_livelli.js`.
Ha canonical e hreflang fra le tre lingue, dati strutturati (pagina, briciole, sei domande e risposte,
offerte con quote e periodi), immagine di anteprima 1200x630 costruita con **schermate vere dell'app**
messe di traverso, sitemap e robots. Le soglie dei livelli personali le rilegge dal database, cosi'
la pagina non racconta numeri vecchi quando le cambi dal pannello.

Verificato senza JavaScript (come leggono i motori e gli assistenti): titolo, canonical, lingua,
4 hreflang, 4 blocchi di dati strutturati, 6 domande, 607 parole di testo vero sulla pagina inglese.

## Sessione 19/08/2026 (12) — Revisione del codice su ricerca ed esperienza d'uso (v4.26 → 4.28)

**Pulizia chiusa (4.27-4.28)**, le tre voci che la revisione aveva lasciato aperte:
- la bacheca pubblica del profilo non scrive piu' l'intero POI dentro il comando del tocco: tiene i
  luoghi nell'indice e passa solo la chiave, come tutte le altre liste (e ora fa l'escape di nome e foto);
- `_savedViewRestored` torna ad avere un solo significato: il luogo arrivato per link usa soltanto
  il segno "vista scelta";
- i contatori dei livelli **ripartono da 10.000** quando non resta nessuna finestra aperta, e le
  finestre chiuse perdono il livello rimasto scritto addosso. Misurato: finestra aperta 10.001,
  chiusa -> contatore 10.000 e livello residuo pulito; il messaggino resta a 1.000.000.


Revisione mirata su ricerca e interazione. Riscontri verificati uno per uno prima di correggere.

**Due difetti bloccanti, chiusi**

1. **La mappa poteva ancora tornare a casa da sola.** `reverseGeocodeAndShow` spostava la mappa
   sempre, e veniva chiamata da due risposte GPS in ritardo (avvio dell'app e linguetta GPS della
   scheda "Aggiungi POI"). Chi cercava un posto e apriva la scheda si vedeva la mappa saltare sulla
   propria posizione. Ora la posizione GPS **registra il punto nella scheda ma non muove la mappa**
   se sto guardando altrove per mia scelta; il punto scelto col dito sulla mappa e l'indirizzo
   scritto, invece, la spostano come prima. Misurato dal vivo: ricerca su Valona, risposta GPS
   tardiva da Tirana, la mappa resta su Valona (40,47 · 19,49); punto scelto sulla mappa, la mappa
   ci va (39,88 · 20,01).
2. **Nome del luogo dentro un comando senza protezione completa** (righe delle liste POI): il nome
   veniva ripulito solo dagli apici, non dalle virgolette. Un nome con una virgoletta poteva
   chiudere l'attributo e infilare codice nella pagina di chiunque vedesse quella lista. Ora si usa
   la protezione di casa (`_escArg`). Provato con un nome costruito apposta: nessun attributo
   iniettato, il nome resta testo.

**Rifiniture della stessa revisione**

- I link condivisi di **itinerario** e **rotta** ora contano come "vista scelta": prima solo `poi` e
  `at` erano riconosciuti, quindi il GPS d'avvio poteva rubare la vista.
- La ricerca usava una protezione piu' debole di quella di casa: unificata su `_escArg`.
- La coda degli indirizzi ha un **tetto di 24** richieste: una lista lunga non tiene piu' occupata
  la rete per minuti.
- La sorveglianza delle finestre guarda **solo il corpo della pagina**: rifare una lista di 50 righe
  non costa piu' nulla.
- Tolti tre **caratteri di controllo** finiti nel sorgente: rendevano il file "binario" per gli
  strumenti di ricerca, che si fermavano a meta'.

Restano in TODO tre pulizie non bloccanti (bacheca pubblica con il POI in JSON dentro il comando,
doppio significato di `_savedViewRestored`, contatori dei livelli che crescono e basta).

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (11) — La mappa resta dove la metti (v4.24 → 4.25)

**4.25**: anche la **lente di ingrandimento** si apre dove sto guardando. Prima partiva sempre dal GPS,
quindi aprirla dopo una ricerca riportava tutto sulla mia posizione. Misurato: ricerca su Valona,
lente aperta dal "+" → resta su Valona (40,47 · 19,49).


**Ordine perentorio**: la mappa torna sulla posizione dell'utente **solo** all'apertura dell'app o
toccando "La mia posizione". Niente altro la sposta.

Cosa succedeva: dopo aver cercato un posto ed esserci andati sopra, toccare il "+" e scegliere
"Crea POI" faceva ripartire la scheda dal GPS, e la mappa tornava a casa.

Cosa fa ora:

| Azione | Prima | Ora |
|---|---|---|
| Scelgo un risultato della ricerca | mappa sul risultato, zoom 16 | mappa sul risultato, **zoom 17**, e le quattro scelte si aprono subito |
| Tocco "+" → Crea POI | la scheda partiva dal GPS | la scheda parte **da dove sto guardando** |
| Apro un luogo, un link condiviso, una tappa | il GPS d'avvio poteva rubare la vista | la vista scelta vince sempre |
| Tocco "La mia posizione" | torna a casa | torna a casa (unico modo, con l'apertura dell'app) |

Misurato dal vivo: posizione fittizia a Tirana, ricerca su Valona, "+" → mappa e mini mappa della
scheda restano a Valona (40,47 · 19,49); toccando "La mia posizione" torna a Tirana (41,33 · 19,82).

Il segno tecnico e' `window._vistaScelta`, acceso da `_vistaDellUtente()` e spento solo da `centerMap()`.

**Cenno di scorrimento sulle card degli itinerari**: piu' ampio (64 px invece di 30) e piu' lento
(2,1 s invece di 1,15 s), come chiesto.

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (10) — Condividere DOVE serve, non solo il link (v4.22 → 4.23)

Il foglio Condividi si adatta a cio' che stai mandando. Ogni voce compare solo se puo' davvero
funzionare: niente pulsanti che non fanno nulla.

| Destinazione | Luogo | Itinerario | Cosa fa davvero |
|---|---|---|---|
| Follower · Amici | si | **si (nuovo)** | Accoda notifiche vere ai destinatari (migrazione 089, RPC `share_trip_with_audience` con le stesse difese della 086) |
| **Compagnia (nuovo)** | si | si | Scrivi un messaggio vero sulla bacheca della compagnia scelta, con titolo e collegamento (tipo `share` in `companion_messages`) |
| **Itinerario (nuovo)** | si | — | Aggiunge il luogo come tappa di un tuo viaggio (salvata su database) |
| **Mappa storica (nuovo)** | — | si | Propone l'itinerario come rotta ufficiale (RPC `propose_trip_official`) |
| Posta di POI•LOVE | si | **si (nuovo)** | `share-mail.php` ora manda anche gli itinerari: l'indirizzo del bottone lo scrive il server, mai chi chiama |
| WhatsApp · Telegram · Email · Facebook · X · Copia | si | si | come prima |

**Migrazione 089** applicata sulla nostra macchina: nuovo tipo di notifica `trip_shared_with_you`,
`companion_messages` accetta il tipo `share` con `share_url`/`share_title`/`share_kind` (con vincolo:
un messaggio `share` deve avere titolo e indirizzo), funzione `share_trip_with_audience`.
Sulla bacheca il messaggio condiviso appare come scheda rossa con "Aprilo"; si apre solo se
l'indirizzo e' di poilove.com, altrimenti il bottone non compare.

**Card degli itinerari**: "Apri" e' salito accanto al titolo, a destra; la riga tappe · km · zona e'
nera in grassetto e non va piu' a capo; entrando negli Itinerari le prime tre card fanno un passo a
sinistra e tornano, cosi' si capisce che sotto ci sono i comandi (il cenno si ferma appena tocchi).

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (9) — Itinerario rifatto, livelli rimessi in ordine (v4.15 → 4.21)

**Scheda dell'itinerario, rifatta**

| Prima | Ora |
|---|---|
| Titolo su una riga a parte sotto la foto | **Nome e numeri sopra la foto** (tappe, km, zona), testata alta 190 px |
| Due riquadri con solo le date | **Cruscotto**: date, durata in giorni, quanto manca alla partenza (o giorno X di Y, o concluso) e **barra di avanzamento vera** con "n di N tappe fatte" |
| Tappe come elenco piatto | **Linea del tempo**: pallino numerato per ogni tappa e **distanza reale fra una tappa e l'altra** |
| Calendario sempre aperto (duplicava le date) | Si apre solo per cambiare le date |
| Link mescolato alle visibilita' | Sezione **Chi lo vede** separata; **barra fissa in basso** con Aggiungi tappa e Condividi |
| Card in lista strette su due colonne | **Una per riga, copertina 16:9**, nome 20 px, descrizione 14 px |

**Livelli (l'ordine di chi sta sopra a chi)**
Difetti trovati e chiusi: il messaggino di conferma stava a quota 999 e finiva **sotto** ogni finestra
aperta (che sale a 10.000); la ricerca foto di repertorio stava a 2.000 e finiva sotto la finestra che
l'aveva chiamata; due finestrelle delle categorie nascevano senza il segno "aperta" e restavano invisibili
(difetto mio, entrato con la centratura del 4.05); i segnaposto della mappa dell'itinerario passavano
sopra la barra dei comandi.
Ora: messaggino sempre in cima, ogni finestra nasce sopra quella che l'ha chiamata, la mappa resta
dentro la sua cornice.

**Guasto introdotto e riparato in 4.21**: la sorveglianza delle finestre reagiva anche alla modifica che
faceva lei stessa, quindi si richiamava all'infinito e **bloccava il browser**. Ora ignora il proprio
ritocco e non rialza una finestra gia' in cima. Verificato dal vivo: pagina reattiva, contatore fermo.

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (8) — Compagnie e scheda itinerario alla stessa misura (v4.13 → 4.14)

**Compagni di Viaggio**

| Elemento | Prima | Ora |
|---|---|---|
| Nome della compagnia | 15 px | 20 px |
| Descrizione | 13 px grigia | 15 px, colore del testo |
| Nome dei membri | 12 px | 14 px (tondino 24 → 28) |
| Codice di accesso | 26 px | 32 px |
| Matita e cestino | 36 px, icona 14 | 38 px, **icona 24 con 7 px di aria** |
| Apri la compagnia | 46 px, testo 14 | 52 px, testo 16 |
| Sottotitolo della pagina | 12 px | 14 px |

**Difetto trovato e chiuso**: la frase di aiuto mostrava i tag come parole (`Tocca <strong>+</strong> per…`).
Il traduttore protegge il testo dal codice, quindi i tag comparivano scritti. Tolti da tutte e nove le frasi
(compagnie e itinerari, tre lingue), e il testo ora nomina il pulsante vero: "Tocca Crea un nuovo gruppo".

**Scheda itinerario**

| Elemento | Prima | Ora |
|---|---|---|
| Titolo | 16 px | 20 px |
| Matita e chiusura | icone nude 15/20 px | pulsanti 38 px, **icona 24 con 7 px di aria**, vicini a destra |
| Riga tappe · km · zona | 12,5 px | 14 px (icone 16 → 19) |
| Descrizione | 14 px | 15 px, microfono 30 → 36 px con icona 22 |
| Pubblico / Compagnia / Amici / Privato / Link | alte 26 px, testo 10 px | alte 34 px, testo 12,5 px, icone 16 px |
| Titoli di sezione e calendario | 10 / 12 px | 11,5 / 14 px |

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (7) — Le righe dei luoghi vanno in colonna (v4.10 → 4.12)

Il disordine aveva due cause, tutte e due chiuse.

1. **Un comando che non serve lasciava il posto vuoto e spostava tutti gli altri.**
   Ora i comandi stanno in una griglia a **otto posti fissi** (quattro nella lista Vicini):
   quando un comando non si applica (per esempio "suggerisci a Google" su un luogo privato)
   il suo posto resta vuoto e gli altri non si muovono. Cestino, matita e condividi cadono
   sempre nella stessa colonna, riga dopo riga.
2. **L'etichetta e i cuori non avevano una colonna loro.** Ora Pubblico/Privato ha la sua
   larghezza minima e i cuori la loro, quindi le etichette partono tutte allo stesso punto e
   i numeri finiscono tutti allo stesso punto.

**Una riga sola solo se ci sta**: sopra i 1400 px di finestra la riga con otto comandi sta su una
linea; sotto (dove la lista occupa mezza finestra) i comandi vanno sulla riga di sotto, altrimenti
il nome verrebbe tagliato dopo tre lettere. La lista Vicini, che ha quattro comandi, resta su una
linea gia' da 1024 px.

Misurato dal vivo: etichette, cuori e primo pulsante allo stesso pixel su tutte le righe, a 375, 1280 e 1600 px.
Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (6) — Le righe dei luoghi si leggono (v4.07 → 4.09)

Vale per tutte le linguette: Personali, I miei POI, Loved, Vicini.

| Elemento | Prima | Ora |
|---|---|---|
| Nome del luogo | 16 px | **20 px** (17 px su computer) |
| Etichetta Pubblico/Privato | in mezzo alla riga sotto | piccola, **a destra accanto al nome** |
| Numero dei cuori | 11 px in mezzo al testo | **20 px, come il nome**, rosso, a destra (a zero cuori non compare) |
| Sotto il nome | categoria vecchia, spesso "natura ·" | **l'indirizzo vero**: via, numero, citta, stato |
| Icone dei comandi | ~16 px dentro un pulsante da 38 | **24 px**, con 7 px di aria tutto intorno |
| Otto comandi sul telefono | uno andava a capo da solo | stanno **su una riga sola** (pulsante 38, spazio 6) |

**L'indirizzo vero**: molti luoghi non ce l'hanno scritto nel database (i salvataggi vecchi ci mettevano
la categoria). Ora si ricava dalle coordinate con OpenStreetMap, una domanda al secondo, una volta sola:
resta messo da parte sul telefono e compare nella riga appena arriva.

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (5) — I pannelli si aprono al centro, la condivisione c'e' ovunque (v4.03 → 4.06)

1. **Tutto quello che si apriva dal basso ora si apre al centro** (v4.03). Sul telefono la parte bassa
   dello schermo e' occupata dalla barra di sistema: i pannelli piccoli finivano sotto le dita e sotto
   il richiamo dell'assistente. Portati al centro: le tendine costruite dal programma (4), i pannelli
   di conferma, il salvataggio, la scelta della foto, la scheda della rotta storica, la bacheca vocale,
   la tappa dell'itinerario.
2. **Condividi su ogni riga** (v4.04). Nella lista dei luoghi vicini c'erano solo tre comandi e la
   condivisione mancava: aggiunta. I comandi della riga ora vanno a capo invece di nascondersi dietro
   uno scorrimento laterale, quindi si vedono tutti.
3. **Riparata la conseguenza della centratura** (v4.05). I pannelli chiusi si nascondevano scorrendo
   sotto il bordo dello schermo: centrandoli restavano mezzi in vista (si vedevano "Itinerario" e il QR
   dietro alla tendina). Ora da chiusi sono invisibili e da aperti salgono di poco.
4. **Larghezza dei pannelli su computer** (v4.06): la tappa e la bacheca vocale non si allargano piu' a
   tutto schermo.

Controllo esterno: **18 prove superate su 18**.

## Sessione 19/08/2026 (4) — Gli inviti: consultare e' libero, iscriversi vale 200 punti a testa (v3.82 → 3.83)

**Il modello degli inviti e' deciso e funzionante** (direttiva di Alessandro: "tutti gli inviti saranno cosi").

1. **Un luogo mandato per email si apre per chiunque, senza accesso.** Nella stessa tendina tre azioni:
   **Vai** (navigatore), **Salva il POI**, **Entra o registrati**. Chi non e' iscritto vede l'etichetta
   rossa **"200 punti per te!"**.
2. **L'invito viaggia col link**: il programma di invio aggiunge `&ref=<handle di chi manda>`, l'app lo
   mette da parte e lo consegna al database appena la persona entra.
3. **200 punti a testa** (migrazione 087): prima l'invitante prendeva 50 e chi arrivava non prendeva nulla.
   Ora `referral_confirmed` e il nuovo `referral_welcome` valgono 200; la regola automatica del database
   accredita tutti e due.
4. **Email di ringraziamento a chi ha invitato** (`referral-mail.php`): "Wow, grazie! +200", nella lingua
   del destinatario, mandata una volta sola (colonna `referrals.notified_at`). Il server legge dal database
   chi ha invitato chi con un utente dedicato di sola lettura (`poilove_web`), il chiamante non decide nulla.
5. **Chi tocca "Salva il POI" senza essere iscritto**: il luogo viene messo da parte e salvato da solo
   appena entra.

Verificato dal vivo da browser azzerato: tendina con le tre azioni e l'etichetta punti, invito catturato
(`poi_ref_pending`), endpoint chiuso a chi non ha accesso (401). Controllo esterno 18/18.

---

## Sessione 19/08/2026 (3) — Pagina POI ristrutturata, invio email dei luoghi, revisione avversariale (v3.75 → 3.81)

1. **Bug collegamenti veloci chiuso** (3.75): il bottone tratteggiato AGGIUNGE sempre, anche la seconda casa;
   per andare in un luogo salvato c'e' la sua scheda.
2. **Pagina POI come il concept approvato** (3.76-3.77): cinque linguette in cima con "Personali" davanti,
   ogni linguetta a pagina intera, schede che non sbordano, **indirizzo pulito** (via, numero, citta', stato)
   al posto delle categorie vecchie, ricavato dalle coordinate e salvato; i sei tratteggiati sempre visibili
   in una fila unica, icona sopra e nome sotto.
3. **Invio di un luogo per email** (3.78-3.80): nuova voce "Manda per email" nel pannello Condividi,
   template POI•LOVE trilingue con parte testuale, dalla casella no-reply@poilove.com.
4. **Revisione avversariale con 33 agenti**: 21 difetti confermati, tutti chiusi. I tre gravi:
   - il NOME di chi manda ora lo decide il server dall'identita' verificata (prima il chiamante poteva
     travestirsi e usare la nostra casella firmata per il phishing);
   - il tetto giornaliero e' contato PRIMA di spedire, con blocco esclusivo del file, e se non si riesce
     a contare NON si spedisce (prima era aggirabile in parallelo e si spegneva in silenzio);
   - il dialogo con la posta ha tempi massimi veri e legge le risposte per intero (niente piu' falsi
     successi ne' falsi errori); testo libero ripulito da indirizzi web e caratteri di controllo.
5. **CONSULTARE E' LIBERO** (3.80, direttiva di Alessandro): un luogo mandato per email si apre per
   chiunque, senza accesso, col marcatore, il nome e il bottone "Vai". L'accesso resta solo per creare,
   lovvare e per la condivisione dentro la community.
6. **Difetto d'avvio trovato per caso e chiuso** (3.81): la mappa veniva avviata due volte, la seconda
   chiamata andava in errore e **fermava in silenzio tutto il resto dell'avvio** (link in arrivo compresi).
   Ora si avvia una volta sola.

Verificato dal vivo da browser azzerato: il link email apre il punto senza accesso. Controllo esterno 18/18.

---

## Sessione 19/08/2026 (2) — La home di presentazione e il concept dell'app (v3.73)

**poilove.com ha finalmente una porta d'ingresso vera.** Chi arriva per la prima volta trova
la pagina di presentazione; chi ha gia' toccato "Entra" o "ospite" viene riconosciuto (segnalibro
pl_app, 1 anno) e finisce sempre dritto in app; i link condivisi e ogni indirizzo con parametri
passano diretti. Smistamento lato server (nginx, stessa radice per tutte e due le pagine).

1. **Concept grafico dell'app** (5 schermate, Nano Banana Pro): mappa col marcatore definitivo,
   pagina POI ristrutturata a linguette ("Personali · I miei POI · Loved · Vicini · Liste"),
   dettaglio, profilo. Testi grandi: la critica leggibilita' diventa la direzione di design.
2. **Pagina di presentazione ufficiale** (webapp/presentazione.html): ILLI fluttuante sul titolo,
   "I luoghi del cuore, che puoi ritrovare", copy in positivo (regola nuova: mai negazioni,
   mai contro gli altri), i tre colori dei luoghi, le 5 schermate in cascata, il lancio scritto
   dalla community col viaggio di ILLI, chiusura "Vuoi far parte di questo progetto?" verso
   project.poilove.com, footer standard 321 col logo vero. Trilingue SQ/IT/EN auto-device.
3. **Webapp 3.73**: segnalibro pl_app a ogni avvio; ?ospite=1 entra da ospite senza schermata;
   link "Scopri POI•LOVE" nella schermata d'accesso (trilingue).
4. **Verificato dal vivo**: percorso nuovo arrivato (presentazione → ospite → app con 12 POI),
   ritorno (dritto in app), link con parametri (dritto in app). Controllo esterno 18/18.
5. Nel giro sono nati anche: regola marketing in memoria, TODO per accesso professionisti
   (ristoranti: menu, orari, piu' foto), bug collegamenti veloci, ristrutturazione pagina POI.

Ritorno indietro: /etc/nginx/sites-available/poilove-ssl.bak-pre-presentazione sulla macchina.

---

## Sessione 19/08/2026 — La posta degli accessi: da zero a firmata (v3.71 → 3.72)

**Scoperta partita da un collaudo di Alessandro** ("il biometrico non funziona sul telefono"):
il bottone impronta era finto (mandava un magic link travestito) e, peggio, il servizio
accessi non aveva NESSUN server di posta: "Invia link" accettava e non spediva niente.

1. **Bottone biometria RIMOSSO** (3.71, regola mai finto): tornera' solo con un backend WebAuthn vero.
2. **Posta vera in casa**: dominio poilove.com + casella no-reply@poilove.com creati su Stalwart
   (mail.themeli.al, flotta Hetzner); password custodita solo sulle macchine e in • chiavi/.
3. **GoTrue agganciato via SMTP** (465). Primo invio rifiutato da Google: mancava il Message-ID;
   ora Stalwart completa le intestazioni mancanti in uscita. Consegna verificata dal registro (250).
4. **Email in UNA lingua sola** (3.72): la lingua del device viaggia con la richiesta e si scrive
   sul profilo (user_metadata.lang); template brandizzato col logo vero, SQ/IT/EN separate,
   oggetto per lingua. Gli 8 account esistenti impostati su italiano. Collaudata da Alessandro.
5. **Firme DNS su Cloudflare** (token via • chiavi/, mai in chat): DKIM ed25519+RSA freschi da
   Stalwart, SPF pulito "v=spf1 a mx -all" (via il vecchio server.321.it), DMARC quarantine con
   rapporti a postmaster, MX di poilove.com verso mail.themeli.al. Verificati dall'esterno.

Controllo esterno: 18/18. Ritorno indietro: /etc/gotrue.env.bak-pre-smtp sulla macchina app.

---

## Sessione 18/08/2026 (sera) — Mappa: marcatore definitivo, mappa piena anche per gli ospiti (v3.62 → 3.70)

**Il marcatore ufficiale è deciso e in linea**: goccia rossa col cuore bianco inciso (variante A
scelta da Alessandro), cerchietto dei love a cavallo della spalla destra, numero nero centrato.

1. **Cerchietto dei love, tre difetti chiusi in fila**:
   - era tagliato dalla scatola del marcatore (3.67: riportato dentro, scatola senza tagli);
   - era COPERTO dal cuore: il cuore, da figlio flex, faceva valere una priorità di disegno 200
     anche da statico. Ora cuore a z:1, cerchietto a z:300, misurato con la pila di pittura (3.69);
   - con zero love il cerchietto NON esiste proprio: nasce col primo love (3.70).
2. **Numeri grandi compatti**: 2000 → "2k", 2330 → "2,3k", 12000 → "12k"; il numero esatto resta
   nella scheda. Collaudato dal vivo col POI Prova portato a 2330 love nel DB.
3. **Mappa vuota per gli ospiti, difetto vero trovato per caso**: "Entra e guarda, senza account"
   mostrava la mappa SENZA nessun POI (si caricavano solo al login). Chiuso in 3.68, verificato:
   l'ospite ora vede subito i 12 luoghi della community.
4. Se un POI ha sigillo ufficiale o stella, il cerchietto passa a sinistra per non accavallarsi.

Tutto in linea su entrambe le macchine, controllo esterno 18/18 a ogni giro.

---

## Sessione 18/08/2026 — POI•LOVE è indipendente: database e accessi sulla macchina propria

**Il passaggio è completo.** poilove.com non dipende più da Supabase per entrare né per i dati:
tutto vive sulla macchina dedicata. Collaudato dal vivo da Alessandro: accesso con Google,
12 luoghi ritrovati, nome, avatar e sfondo al loro posto.

### Cosa è stato fatto

1. **Servizio accessi proprio** (GoTrue, lo stesso motore che usa Supabase) su `accessi.poilove.com`,
   con i 7 account trasferiti a identificativi invariati: ognuno ritrova i propri luoghi.
   La schermata di Google non dice più `ptppxwl…supabase.co`.
2. **Database PostgreSQL 17 + PostGIS sulla macchina**: 56 tabelle, 427 righe fresche,
   161 regole di sicurezza, 90 funzioni, chiavi e vincoli. Verificato tabella per tabella.
3. **Foto in casa**: 41 file portati sulla macchina (`media.poilove.com/sb/`), indirizzi
   riscritti nel database, 23 su 23 raggiungibili.
4. **Velocità misurata**: mediana da 152 a 136 ms, ma soprattutto **punte da 770 a 147**:
   le impuntature sono sparite. Terza colonna di `sal/velocita.html` compilata con dati veri.
5. **Ritorno indietro sempre pronto**: `scripts/ritorno-accessi.sh` (un minuto, Supabase resta
   acceso e intatto per 30 giorni). Fotografie della macchina prima e dopo il passaggio.

### Difetti storici trovati e chiusi durante il lavoro (v3.51 → 3.55)

- **Nome del profilo mai renderizzato** (id morto da un rinominamento) — 3.51
- **Avatar e sfondo mai salvati nel DB** (upsert parziale che moriva sul vincolo username) — 3.52/3.53
- **L'assassino dell'avatar**: ogni salvataggio di POI azzerava avatar_url — 3.54
- **37 salvataggi con errori ingoiati in silenzio**: ora tutti passano da `salvataggioFallito()`,
  contenuto utente a schermo, servizio nel registro — 3.54 (caccia fatta con scansione a 5 agenti)
- Schermata Google: nome app, privacy/termini e domini sistemati nella console (client rinominato,
  dominio morto demo.poilove.com rimosso, chiave di programma rigenerata)

### Restano su Supabase (per scelta, raggiunti dal ponte /db/)

I **6 programmi**: illi-chat, send-email, transcribe, image-search, place-enrich, admin-ai.
Da traslocare in una sessione dedicata. Le foto NUOVE caricate dagli utenti passano ancora
dallo storage Supabase attraverso il ponte.

### Architettura attuale

`poilove.com` → nginx → SPA + `/db/rest` (PostgREST locale) + `/db/auth` (GoTrue locale)
+ `/db/storage` e `/db/functions` (ponte verso Supabase). App v3.55.
`prova.poilove.com` = ambiente di collaudo identico. Plesk = riserva, spegnibile fra 30 giorni.

---

## Sessione 17/08/2026 — POI•LOVE è passata sulla macchina propria

**Il dominio non vive più sul server condiviso.** `poilove.com` e i suoi indirizzi rispondono dalla macchina dedicata. Il server storico resta acceso e intatto per almeno 30 giorni: il ritorno indietro costa un minuto.

### Come è andata

1. **Collaudo di Alessandro** dal suo Mac, prima di toccare il DNS: mappa con i 13 luoghi, elenco "I miei POI", apertura delle schede, caricamento foto che persiste dopo uscita e rientro, condivisioni, link brevi, admin, `project`, `sal`, ILLI. Superato.
2. **Copie di sicurezza attivate** da Alessandro (Backups automatici del provider) e prima copia eseguita, prima del passaggio.
3. **Nameserver girati** su Aruba verso Cloudflare (`algin` e `pam`). Il registro `.com` ha preso il cambio.
4. **Certificati veri** Let's Encrypt emessi per i sei nomi con validazione via DNS, mentre il traffico andava ancora al server vecchio. Ricarica automatica di nginx al rinnovo installata.
5. **Spostamento dei record**: `@`, `www`, `admin`, `sal`, `project`, `media` sulla macchina nuova. **Non toccati** `mail`, `webmail`, `ipv4`, `ns1`, `ns2`, `go`, `ftp`, SPF/DKIM/DMARC e i record della posta: restano dove sono.
6. **Verifica dal mondo**: i cinque indirizzi rispondono 200 con i contenuti giusti, webapp v3.44, zero errori PHP. I 404 e 403 nei registri sono robot che cercano falle note (`/.env`, `/.git/config`): le protezioni rispondono correttamente.

### Difetti chiusi in questa sessione

- **Le tre foto nere** (`Aeroporto di Tirana`, `Giardino di Via Padova`, `Emerald Center`) non erano immagini rotte: stavano su `media.poilove.com`, che aveva ancora il certificato provvisorio. Il browser blocca in silenzio le immagini servite con un certificato non valido. Col certificato vero rispondono tutte.
- **ILLI diceva "Vicino a te"** senza nominare il posto. Il dato c'era già, il testo non lo usava e il grassetto era vietato dalle regole di ILLI. Ora apre con il nome del luogo in maiuscolo e in grassetto: *"Vicino a **THIENE**, puoi visitare…"*. Versione 3.44.

### Stato misurato della macchina

Accesso a sole chiavi, firewall attivo, protezione tentativi ripetuti attiva, ora italiana, zero aggiornamenti in attesa, rinnovo certificati automatico, 1,9 GB usati su 301, memoria 0 su 30 GB.

### Cosa resta

Lista completa e ordinata in `RIFINITURE-MACCHINA-NUOVA.md` (fuori da GitHub). In cima: **snapshot a rotazione con prova di ripristino** (per poter spegnere i Backups a pagamento), **schermo Cloudflare**, **riallineamento del repository** con i file modificati sul server fino al 31/07, **nuovo modo di pubblicare** al posto della copia file per file. Sul prodotto: qualità della ricerca di ILLI, marcatori della mappa, anteprima delle condivisioni, `sal` e `project` da riscrivere.

---

## Sessione 26/07/2026 — Trasloco cartella, dossier commerciale (riservato), Scheda Professionale su project.poilove.com

Sessione di riordino e di documentazione commerciale. Nessuna modifica alla webapp.

### Trasloco del progetto e riparazione dei riferimenti

Il progetto è passato da `AI (produzione)/POI•LOVE/POI•LOVE/` a `AI (produzione)/• POI•LOVE/`, cartella singola come gli altri progetti della root.

- **Memoria del progetto recuperata.** Claude indicizza la memoria in base al path: col cambio di cartella le **59 schede** (regole, feedback, decisioni: `regola_mai_finto`, `feedback_no_emdash`, `regole_di_ferro`, `user_profile`) puntavano alla vecchia posizione e la cartella nuova era vuota. Copiate al posto giusto, originale lasciato intatto.
- **Path corretti**: `.claude/launch.json` (server di anteprima verso una cartella inesistente), `CLAUDE.md` riga 202, `ADMIN-BUILD-SPEC.md` riga 7, più la root `AI (produzione)/CLAUDE.md` (tabella progetti, mappa struttura, regola 4, path memoria) e i permessi `git -C` in `.claude/settings.local.json` di root.
- **50 autorizzazioni recuperate** dal vecchio wrapper e unite a `.claude/settings.local.json` del progetto: senza, Claude avrebbe richiesto conferma per ogni comando già approvato in mesi di lavoro.
- **Verifiche**: `git fsck` pulito, remote `acastagna/poi-love` intatto, 254 file tracciati. I workflow GitHub Actions usano solo path relativi al repo, non toccati.
- I due file TopMarket rimasti nel wrapper (`topmarket-servizi.html`, `topmarket-setup-costi.html`) verificati come unici (nessuna collisione di nome, nessun duplicato MD5 fra i 12 HTML di `Projects/TopMarket`) e spostati in `Projects/TopMarket/`. Wrapper vuoto archiviato in `_archivio/POI-LOVE-wrapper-2026-07-26`.

### Dossier commerciale (RISERVATO, fuori da questo repo)

La cartella riservata locale è stata riorganizzata e ampliata: ai documenti di prodotto già esistenti
si aggiungono sei documenti nuovi (posizionamento, target, scelta dei nomi, modello di business,
piano di marketing) e una presentazione trilingue.

**Contenuti volutamente NON riportati qui**: nomi commerciali, listini, cifre, scenari di ricavo e
piano di marketing vivono SOLO nella cartella riservata. Questo file è tracciato e il repository
`poi-love` su GitHub è **pubblico**: vedi la regola in `CLAUDE.md`.

**⚠️ Cartella riservata**: esclusa in `.gitignore`, verificato con `git check-ignore`.

### Scheda Professionale in project.poilove.com

Nuova sezione `#professionale` in `web/index.html`, inserita fra POILOVE e POIVOICE, con voce di menu dedicata.

Contenuto: i tre problemi di un bar a Tirana, i tre blocchi (menù multilingua, galleria estesa, recensioni in aquile) più il canale WhatsApp, i quattro piani con la licenza annuale, il voto in aquile con la ragione legale per cui l'aquila è disegnata da noi e non è quella di Stato, la distinzione fra love e recensione, cosa il prodotto non è.

Verificato dal vivo: sezione alta 2318 px, 8 card, 9 passi, **44 chiavi i18n tradotte in tutte e tre le lingue, zero mancanti** in IT, EN e SQ. Sintassi JS controllata come da convenzione (l'unico blocco che node rifiuta è il JSON-LD schema.org, pre-esistente e valido come JSON).

**Deployato** su richiesta di Alessandro come **`https://project.poilove.com/stay.html`** (path nuovo, ack esplicito in chat), non su `index.html`: la versione nuova è online e l'attuale home resta intatta finché non si decide di promuoverla. Dry-run prima, rsync di un solo file, nessun `--delete`. Verificato live: stay.html HTTP 200 · 655.514 byte con la sezione `#professionale` e la voce di menu presenti; index.html invariato a 632.780 byte.

Listino sulla pagina pubblica: scelta di Alessandro di mostrare le cifre, che nella documentazione di prodotto sono ancora indicate come da confermare.

Pubblicata anche la presentazione dei due progetti su project.poilove.com (URL nella cartella riservata). Scelta consapevole di Alessandro dopo la segnalazione che contiene scenari di ricavo e piano di marketing: vedi ALLERTA in cima a questo file.

### ILLI nella presentazione, e panorama albanese (primo confronto con la concorrenza)

- **ILLI nell'hero di `il secondo progetto.html`**, con didascalia tradotta in tre lingue. Su richiesta di Alessandro l'immagine non è stata toccata: `Illi500tras.png` incorporata byte per byte, MD5 `09cf5103…` identico prima e dopo, verificato anche sulla copia online. Nessun ridimensionamento, nessuna ricompressione.
- **`07-panorama-albanese.md`**, documento nuovo, e sezione corrispondente in fondo alla presentazione. Premessa importante: **quell'analisi non era mai stata fatta.** Nel progetto la parola "concorrenti" compariva due volte, una come affermazione senza fonte in SAL e una nel senso di utenti simultanei. Ricognizione svolta il 26/07/2026 con fonti citate.

**Ricognizione sulla concorrenza albanese**: fatta e archiviata nella cartella riservata (`06-concorrenza-albania.md`). Non riportata qui: il repository e pubblico.


Altri fatti verificati e pubblicati, tutti datati: Tirana Map and Walks fermo all'aggiornamento del 16/12/2017 con una sola valutazione; l'app Into Albania non più reperibile in cinque negozi App Store; delle cinque startup turistiche censite da Invest in Albania nel maggio 2016, Sotours e ShareAlbania senza più record DNS e Tung.al irraggiungibile. Nessun fornitore di concierge per hotel con sede in Albania è emerso dalla ricerca.

**Come è stato scritto sulla pagina pubblica**: con i nomi, ma **solo fatti verificabili con la data del controllo**. Nessun giudizio su qualità o interfaccia, con un riquadro che lo dichiara apertamente, perché nessuno di quei prodotti è stato provato. Segnalato anche che Visit Tirana è verosimilmente legata al Comune, quindi possibile interlocutore istituzionale e non bersaglio.

### Modello a tre sponsor: eliminato ovunque

Alessandro ha rilevato che su `stay.html` convivevano **due modelli di business in contraddizione**: la vecchia sezione Economia (tre main sponsor da 3.000 €, "coprono interamente tutto, autosufficiente a costo zero dal mese 9") e la nuova Scheda Professionale (licenza annuale pagata dal locale). Un investitore che legge "siamo gia autosufficienti con gli sponsor" e poi "vendiamo licenze ai locali" trova due promesse che si tolgono forza a vicenda.

Direttiva: **quella fase non esiste più, i tre sponsor spariscono da ogni MD e da ogni pagina.** Censimento e rimozione completi:

- `web/index.html`: eliminata l'intera sezione `#economia` (le tre card sponsor e l'evidenza "9.000 €/anno"), la voce di menu Economia, il blocco CSS `.sp*`, il simbolo `ico-sponsor` e la sua icona nella galleria Brand, le chiavi `eye_eco`, `eco_title`, `eco_body`, `sp_title`, `sp1-3`, `sp_period`, `sp_b1-4`, `sp_hl` in **tutti e tre** i dizionari.
- Riscritte le voci di timeline dei mesi 06 e 09, che parlavano di "avvio ricerca sponsor" e "presentazione ai tre main sponsor": ora sono conquista della zona pilota col piano Zero e conversione dei primi locali alla Scheda Professionale. In tre lingue.
- Riscritto il passo 6 del circolo virtuoso: "nuovi sponsor e partner" è diventato "nuovi locali e partner". In tre lingue.
- `TIMELINE.md`: la riga di crescita non cita più gli sponsor.
- `webapp/admin.html`: tolto il riferimento "coincide con l'arrivo dei 3 sponsor (mese 9)" dalla nota sul piano Supabase.

Verificato dal vivo: **zero occorrenze di "sponsor" in tutto il progetto** e zero nel testo reso della pagina in IT, EN e SQ. Nessuna chiave i18n orfana introdotta (`brand_all_icons`, `eye_vis`, `vis_title`, `vis_body`, `brand_icon` risultano già così in HEAD, pre-esistenti). Sintassi JS controllata, bilanciamento `div` identico a HEAD.

Ripubblicato `stay.html`: 649.340 byte, zero "sponsor", sezione `#economia` assente, `#professionale` presente. `index.html` sempre intatto a 632.780 byte.

### Da confermare

1. Nel documento di target del secondo prodotto ho letto "le 4 iniziali" come le quattro categorie di ricettività da cui si parte, le stesse già approvate nella tassonomia. Se l'intenzione era un'altra, si corregge solo quel documento.
2. Prezzi del secondo prodotto: proposta costruita per coerenza, nessuna ricerca di mercato fatta (dettagli nella cartella riservata).
3. Costo reale del canale WhatsApp, mai stimato: può cambiare la marginalità di un piano intero.
4. Disponibilità del dominio e ricerca di anteriorità sul marchio del secondo prodotto (classi 35 e 43, Albania e UE).
5. Chi esegue le visite ai locali a Tirana: e il vincolo piu stretto (dettagli nella cartella riservata).
6. Nota di servizio: la sezione qui sotto è datata 26/07/2026 ma il suo contenuto descrive la giornata del 13/07 (cita "richiesta 13/07"). Data da correggere, non l'ho toccata per non riscrivere lo storico.

---

## Sessione 26/07/2026 — Loghi ufficiali nei template + ILLI trasparente

Tutto verificato DAL VIVO (mail: HTML dal DB; landing: screenshot su lp.php).

- **Logo steso ufficiale pubblicato**: `img/logo-steso.png` + `.svg` (dal `logo-completo.svg` fornito da Alessandro) e `img/logo-poivoice.png` + `.svg` (POI•VOICE, pronto per le audioletture). Nomi nuovi, a prova di cache.
- **4 template mail** (benvenuto, novita, invito-amico, evento-invito): il vecchio logo quadrato `logo-email.png` sostituito col logo steso orizzontale (180px) in fondo su fondo bianco. Verificato l'HTML reso di tutti e 4.
- **5 landing** (condividi-poi/itinerario/rotta, invito-community, evento-poilove): aggiunto il logo steso SVG trasparente, centrato, sotto la card e sopra il footer. Verificato live su `lp.php?s=invito-community`.
- **ILLI trasparente**: le due immagini originali fornite (500 e 1000px, fondo trasparente) pubblicate COSÌ COME SONO su `img/illi-trasparente-500.png` e `-1000.png`, nessuna trasformazione. Nei template resta la versione fondo scuro approvata.
- **Documenti del founder committati**: `GO-LIVE-PREMORTEM-POSTMORTEM.md` e `ORCHESTRAZIONE-ADMIN-POILOVE.md` (12/07), tracce per go-live e revisione admin: sono la base dei prossimi giri.
- **Firma nei template (richiesta 26/07)**: in fondo a TUTTE le landing e mail ora ci sono i due loghi piccoli affiancati (POI•LOVE + POI•VOICE) e sotto la firma BILINGUE, albanese sopra e italiano sotto con una linea sottilissima in mezzo: "Inxhinieruar nga Alessandro Castagna · 321.AL / EVOLAB • Tiranë" / "Ingegnerizzazione di Alessandro Castagna · 321.AL / EVOLAB • Tirana". Motore: footer multi-riga con divisore + footer email centrato (migliorie sincronizzate su POI•LOVE, Top Market e builder standalone). Verificati live tutti e 9 i documenti: esattamente 2 loghi ciascuno (il "POI•LOVE doppio" era un residuo intermedio, già tolto). Moduli admin a v341.
- **Landing multilingua + chiaro/scuro (richiesta 26/07)**: le landing ora si aprono nella lingua del dispositivo (SQ/IT/EN, ripiego EN per le altre; override con ?lang=) e seguono il tema chiaro/scuro del sistema (variabili CSS + prefers-color-scheme). Motore: varianti di lingua per titolo/testo/pulsante (b.tr, campi Shqip/English nell'editor pagina), colori adattivi, engine v342 sincronizzato su tutte le installazioni. Le 5 landing tradotte (SQ rivisto da revisione dedicata: "me shoqëri", "kopjo/lansim", "që të kemi", "të reja", "linku i ftesës"). Verificato live: scuro+SQ, chiaro+IT, EN.
- **Mail in 3 lingue**: create le versioni sq/en delle 4 mail (12 righe totali, oggetto+corpo tradotti, stessi 2 loghi e firma bilingue). L'edge send-email ora filtra per lingua richiesta con ripiego su IT e solo template attivi (rideployata, verify_jwt invariato). Il mittente di ripiego in lp.php è neutro ("POI•LOVE") così funziona in ogni lingua.
- Nota: gli invii automatici (benvenuto ecc.) NON sono ancora collegati: parte tutto quando Alessandro mette la chiave ACUMBA_KEY nei segreti. La prova dall'admin invia nella lingua del template scelto.
- **"Diffondi POI•LOVE" → landing (bug segnalato da Alessandro 26/07)**: la condivisione dal profilo mandava testo semplice col link nudo `poilove.com/?ref=`. Ora (v3.34): il link porta alla landing brandizzata `lp.php?s=invito-community&ref=<handle>` (nuovo Uso 'invito', mig 084, agganciato via loadCommTemplates), e i testi di mail/social sono nella lingua dell'app (SQ/IT/EN). La mail continua a partire dal client di posta dell'utente (lì la grafica non è controllabile): la mail HTML dal server arriverà col motore email attivo. Verificato live: url, testi, landing con "Ti invita @alessandrocastagna".
- **Fix loghi su telefono (WhatsApp test di Alessandro)**: sul mobile le due colonne dei loghi si impilavano sparpagliate. Motore v343: nuova opzione di riga "Colonne affiancate (non impilare)" (st.noStack), attiva su pagina E email; applicata alla riga loghi di 5 landing + 12 mail, tutte rigenerate. Verificato live su viewport iPhone (scuro + firma bilingue ok).
- **Condivisione = landing OVUNQUE (direttiva 26/07: social→landing, email→mail)**: censiti TUTTI i flussi di condivisione dell'app (ricognizione completa in chat). Ora (v3.36) POI, itinerari, tappe, rotte storiche, compagnie e Diffondi passano dal foglio proprietario e condividono la LANDING brandizzata (helper `_lpUrl`, slugs caricati da landing_pages per uso). Eliminati i `navigator.share` di sistema (itinerario, tappa, compagnia). Il testo condiviso ora contiene SEMPRE il link (prima su WhatsApp il POI con indirizzo partiva senza link). X unificato su x.com/intent.
- **Landing compagnia NUOVA** (`condividi-compagnia`, Uso 'compagnia', mig 085): lp.php compila {{codice}} da &join=CODICE e il bottone porta a poilove.com/?join=CODICE&ref=; trilingue, scuro/chiaro. Verificata live con codice ABC123.
- **Mail scura**: il motore ha il tema email Chiara/Scura (impostazioni generali del Mail Builder, engine v344); la mail invito-amico (3 lingue) ora è SCURA coi nuovi loghi trasparenti `logo-steso-alpha.png` / `logo-poivoice-alpha.png` (fondo bianco tolto matematicamente). Le altre mail restano chiare. Verificata live con screenshot.
- Nota itinerari: la landing mostra i dati solo se l'itinerario è pubblico (RLS corretta); l'app rende pubblico l'itinerario prima di condividere, con conferma. Nessun itinerario pubblico esiste ancora nel DB.
- DA FARE quando arriva ACUMBA_KEY: canale email del foglio → invio della MAIL brandizzata dal server (oggi apre il client di posta con testo+link landing); serve allargare send-email ai non-admin SOLO per i template di invito, con tetto giornaliero.
- **Teaser POI allineato alla regola "storia visibile, punto protetto" (deciso col founder 26/07)**: da sloggato il POI condiviso ora mostra nome vero, foto in chiaro (niente blur) e zona; lat/lng restano FUORI anche dalla risposta di rete. Testi nuovi in 3 lingue: "Entra gratis e aprilo sulla mappa", "punto esatto, navigazione e love si sbloccano dopo l'accesso" (v3.37). Verificato live da ospite con POI reale.
- **Revisione avversariale 26/07 (sera) e correzioni, v3.39**: passata di review su tutto il lavoro della giornata, 15 rilievi, 11 corretti e verificati dal vivo.
  - **CRITICO (regressione mia di oggi)**: il foglio di condivisione veniva richiamato anche da dentro la scheda ROTTA (z-index 9600) e COMPAGNIA (9100), ma il gestore di sovrapposizione partiva da 9400: il foglio finiva sotto e sembrava che il tasto non funzionasse (condivisione rotta e invito compagnia MUTI). Base portata a 10000 + regola dedicata sul foglio. Verificato con prova visiva sopra una scheda simulata a 9600.
  - Referral: i link condivisi usavano `_myHandle` (valorizzato solo dopo il giro di loadCommTemplates) e spesso partivano SENZA `&ref=`, perdendo i punti. Ora fonte unica `_myRefHandle()` disponibile subito dopo il login; unificati i tre costruttori di link (updateShareLink e _referralUrl ora passano da `_lpUrl`).
  - `_lpUrl` rifiuta identificativi non validi (itinerario mai salvato, codice compagnia malformato): si torna al link diretto invece di spedire una landing che non riesce a compilarsi.
  - Landing: query con ordine per data (con due modelli pubblicati per lo stesso uso vinceva uno a caso) e guardia contro il doppio caricamento.
  - Copia link: aggiunto ripiego per browser senza clipboard API (prima non copiava e non diceva nulla); `noopener` su tutte le aperture social; mailto senza scheda vuota residua.
  - Tre lingue: titolo del foglio, voce "Amici" e toast "POI non trovato" erano solo in italiano proprio ora che il foglio e universale.
  - Teaser: lucchetto spostato in angolo (30px) perche al centro copriva la foto che la nuova regola vuole mostrare; commento e testi di ripiego allineati alla regola nuova.
  - lp.php: landing compagnia senza codice valido ora da 404 onesto invece di una pagina con "Codice:" vuoto.
  - Motore builder v345: in tema scuro lo sfondo scelto veniva ignorato (controllo che non faceva nulla); bottoni Chiara/Scura con padding corretto.
  - Trattini lunghi (em dash) eliminati da 3 testi condivisi: violavano la regola di progetto e finivano nei messaggi WhatsApp/email degli utenti.
  - **Verificato NON reale** il sospetto di fuga privacy sui POI condivisi: le policy del database bloccano davvero i POI privati agli sloggati (provato dal vivo). Nota: i POI `suggested_google` sono leggibili da tutti per scelta di design (sono luoghi pubblici suggeriti), come gia avviene sulle pagine SEO.
  - Restano segnalati e NON risolti (scelta consapevole): "Condividi con follower/amici" e ancora un segnaposto ("prossimamente"), da non mostrare in demo.
- **Fine dei segnaposto (v3.40, mig 086)**: chiuse in modo LOGICO le voci che mostravano solo "prossimamente" (violavano la regola di ferro).
  - **Condividi con follower / amici: ora e REALE.** Nuova RPC `share_poi_with_audience` (SECURITY DEFINER, eseguibile solo da utenti autenticati) che accoda notifiche vere ai follower o ai soli reciproci, rispettando le preferenze notifiche di ciascuno, con tetto giornaliero anti abuso. Il collaudo sul database ha trovato un mio errore (si poteva notificare un POI privato, che il destinatario non avrebbe potuto vedere): corretto, ora si condividono solo POI davvero visibili e approvati. Verificato: POI community ok, POI privato anche se proprio RIFIUTATO.
  - **Rotte storiche, tasto "+"**: apriva un "presto disponibili"; ora apre il modulo REALE di proposta rotta all'amministrazione (esisteva gia ed era solo scollegato).
  - **Menu "Aggiungi a…"**: aveva 4 voci di cui 3 finte (Compagnia, Rotta Storica, Categoria). Rimosse dall'interfaccia (restano commentate nel codice con la traccia di cosa costruire); il tasto Aggiungi ora va dritto all'itinerario, unica destinazione vera.
- Resta aperto: sottodominio builder.321.al (serve OK esplicito per crearlo su Plesk).

## Sessione 12/07/2026 (seguito lungo) — Immagini multi-sorgente, tastiera, ruoli

Tutto verificato DAL VIVO. Webapp fino a v3.31; edge `image-search` ACTIVE.

- **Scheda POI admin = frontend** + affidamento utente/ILLI + correzione inline + editor largo 2 colonne + foto 3 slot "+" + mic + AI (accorcia/allunga/approfondisci) + posizione solo via GPS-foto (EXIF) o ricerca indirizzo intelligente. Sezione Crea ripulita (rimosso form POI ridondante).
- **Media Manager** (admin): sezione Immagini di moderazione (POI/avatar/cover/tappe, ingrandisci+rimuovi) + Cerca online multi-sorgente.
- **Ricerca immagini MULTI-SORGENTE via edge `image-search`** (chiavi Unsplash/Pexels/Pixabay come segreti server + Openverse/Wikimedia): usata da admin E frontend, mescolata e con etichetta fonte. Chiavi tolte dal client (media-keys.js eliminato). Stock nel frontend su tappe, cover itinerario, compagnia; NIENTE stock sui POI.
- **Messaggi**: realtime dal login (mig 077).
- **Tastiera iOS**: campo chat ILLI + "Rispondi al team" convertiti a contenteditable → sparisce l'intera barra "Inserisci info" (v3.29).
- **Itinerari archiviati**: riesumazione lato ADMIN (Attivi/Archiviati + Riesuma).
- **RUOLI super vs moderatore** (mig 079-080): `admin_role`, `is_super_admin`, `admin_set_role` super-gated, `is_admin` cambiabile solo via role_op; moderatore vede solo le sezioni di moderazione; controllo Ruolo + tier solo per il super.
- Da Alessandro: chiavi immagini fornite (in segreti edge). Restano aperti: email drag-and-drop, gestione itinerari "intelligente", (opz.) gating server di TUTTE le RPC config al super.


## Sessione 12/07/2026 (notte, seguito) — Rifiniture admin + fix messaggi + editor immagini

Tutto verificato DAL VIVO sul pannello del founder (Chrome connesso) e sull'app.

- **FIX MESSAGGI (bug reale del founder):** le risposte degli utenti arrivavano nel DB ma il pannello non le mostrava (nessun realtime/polling) e mancava la policy SELECT admin. Aggiunta migrazione 077 (`sm_admin_select`) + canale realtime su `support_messages` + polling 15s. Verificato: risposta utente comparsa DA SOLA in ~2s. Commit `66f49a3`.
- **Color picker EvoLab + Gradiente** per i badge e per il colore delle Categorie (Tinta/Gradiente, 2 stop + angolo). `admin/js/color-picker.js`. Commit `96c3a78`.
- **Media Manager** (`admin/js/media-manager.js`, mig 076 `media_assets`): scelta immagini via Carica o Libreria, mai URL. Collegato all'editor POI. Commit `5fa4094`.
- **Editor POI largo "come l'app"** + sezione BADGE E ASSEGNAZIONE (@handle). `openModal({wide})`. Commit `0183401`.
- **Messaggi**: destinatario a tendina in alto + Invio per inviare. Commit `33e652c`.
- **App (v3.26)**: tastiera smartphone (foglio sopra la tastiera, `visualViewport`) + **badge personalizzati mostrati nel dettaglio POI** (`loadBadges`/`window.BADGES`). Commit `5d32778`, `5beea23`.
- **Scheda utente**: cambia AVATAR e COPERTINA dal Media Manager (mig 078 `admin_set_user_cover`). Commit `5beea23`, `2d36622`.
- **Cache-busting** `?v=` sui 7 moduli JS admin (il server non manda Cache-Control sui .js). Commit `2d36622`.
- **Immagini tappe**: menu Ingrandisci/Modifica/Cambia/Rimuovi + **editor immagini reale** (ruota, zoom, ritaglia, esporta JPEG). `admin/js/image-editor.js`. Commit `45d4cb9`.

## Sessione 12/07/2026 (notte) — Revisione pannello Admin: avvio (Fase 0)

Base: `ORCHESTRAZIONE-ADMIN-POILOVE.md` (piano founder) + `ADMIN-STATO.md` (audit 11/07). Decisioni e tracker completo in **`ADMIN-DECISIONI.md`**.

**Decisioni chiuse col founder:** moduli JS (componenti condivisi in `admin/js/`); ricerca immagini = Wikimedia+Openverse+Unsplash; generazione immagini AI = fal.ai; provider AI = Grok+OpenAI+Anthropic+Google Gemini+Mistral.

**Risolto da solo (verificato sul DB live):** Compagnie esistono già (`companions`); pgvector da abilitare (solo postgis ora); libreria media = estendo tabella `media` esistente; **bug Messaggi T3**: a lettura statica il flusso è CORRETTO end-to-end (admin scrive, RLS utente legge, webapp ha la casella in ILLI•AI con realtime/badge/toast, `support_messages` è in realtime) → nessun guasto evidente, va riprodotto con un test (probabile invio a user_id diverso).

**Fatto e LIVE/verificato stanotte:**
- **A6 — Tema a 6 palette** (calda/neutra/fredda × chiaro/scuro): `admin/css/palette.css` (definizione unica) + `admin/js/theme.js` (controller modulare) + selettore a 3 pastiglie in barra. Il rosso brand resta costante (elimina/banna rossi); l'atmosfera la danno sfondo/bagliori/accento oro→pietra→acciaio. **+2 fix visivi**: topbar Dashboard padding (screenshot 1), contatore Tag leggibile anche sul chiaro (screenshot 2). Live su admin.poilove.com, verificato dal vivo con harness (6 combinazioni). Commit `8db4d1b`.
- **A3 — Badge + assegnazione (lato DB)**: mig 073, colonne uniformi `badge_official/essential/tier` + `assigned_user_id` su pois/trips/companions + RPC `admin_set_badge_and_owner` (gate is_active_admin, audit, blindata). Verificato. Commit `d925a9f`. Resta il selettore UI da montare negli editor.

**Prossimo (Fase 0/1):** selettore badge UI (`badge-picker.js`), A1 scheda POI riusabile, A2 scheda utente, A4/A5 immagini+libreria, poi T3 test, T1 dashboard, T9/T10. Nessun lavoro non committato.

---


> **Prossima ripresa — passi che spettano ad Alessandro (tutto il codice è già live):** (1) chiave AcumbaMail come segreto `ACUMBA_KEY` nei Supabase Edge Secrets → accende l'invio email; (2) ID pixel social nell'admin (Media → Pixel) + SPF/DKIM su poilove.com; (3) inviare `sitemap.php` a Google Search Console + Bing Webmaster Tools (per l'indicizzazione SEO/AIO). Restano aperti: trigger notifiche mancanti, voce iperrealistica ILLI, collaudi manuali (checklist 04/07 + claim a pagamento + copilota foto).
> Checkpoint sessione: tag `checkpoint-2026-07-11-seo-aio` (HEAD `9f33cdf` su origin/main, webapp **v3.24**). Zona Media (v3.23) + strato SEO/GEO/AIO (v3.24) entrambi live. Review avversariale a 20 agenti: 10 findings confermati (1 XSS critico JSON-LD, 2 alti), TUTTI corretti e verificati dal vivo. **Nessun lavoro non committato.**

## Sessione 11/07/2026 (2ª parte) — Strato SEO/GEO/AIO + condivisione OpenGraph (webapp v3.24)

Costruito lo strato di indicizzazione: la webapp è una SPA JS invisibile ai crawler, quindi le landing PHP server-rendered sono la superficie SEO/AIO del sito. Basato su una ricerca web (6 agenti, best-practice 2025-2026) + review avversariale. Tutto live e verificato su poilove.com.

**Nuovi/potenziati file (in `webapp/`, deployati su httpdocs):**
- `seo_lib.php`: libreria condivisa (fetch solo-pubblici via anon+RLS, hreflang reciproco it/sq/en + x-default, geo-meta, JSON-LD @graph, mappa categoria→@type schema.org, FAQ, CSS brand chiaro/scuro). `seo_get` ritorna solo liste (scarta gli oggetti-errore PostgREST).
- `poi.php` (riscritto): Place/TouristAttraction + PostalAddress + GeoCoordinates + BreadcrumbList + FAQPage; corpo crawlable (indirizzo, coordinate, link mappa, foto, luoghi vicini, FAQ dai dati reali, data aggiornamento); niente aggregateRating (i love come `interactionStatistic`/LikeAction, non un rating finto); `noindex` se il POI non è pubblico.
- `route.php` (riscritto): TouristTrip + itinerary ItemList di TouristAttraction; tappe crawlabili, badge reali Ufficiale/Indispensabile.
- `trip.php` (riscritto): TouristTrip itinerario + proxy `?img=` per la cover (anche data-URL); FAQ dai dati.
- `esplora.php` (nuovo): HUB directory dei luoghi/rotte pubblici per città e categoria, con link interni a ogni scheda (booster di crawl: tutto a 2-3 click) + JSON-LD CollectionPage/ItemList; filtri `?city=`/`?type=`, ricerca `?q=` (sanitizzata dai caratteri PostgREST).
- `sitemap.php` (nuovo, servita application/xml): elenca solo contenuti pubblici, hreflang xhtml:link + x-default, image:image, lastmod reale da updated_at, niente priority/changefreq.
- `robots.txt` (nuovo): permette Google/Bing + i bot AI di retrieval (OAI-SearchBot, PerplexityBot, Claude-SearchBot, ecc.) per farsi citare, blocca solo Bytespider, punta alla sitemap.
- `llms.txt` (nuovo): vetrina machine-readable per i motori AI.

**Condivisione (webapp index.html, v3.24):** i tasti Condividi dei POI puntano ora a `poi.php` (anteprima OG ricca); aggiunto il tasto Condividi nella scheda rotta → `route.php` (i18n it/sq/en); gli itinerari già usavano `trip.php`. QR e deep-link `?poi=` restano diretti all'app.

**Verificato dal vivo:** version 3.24; robots/llms 200 text/plain; sitemap 200 application/xml (XML valido); poi.php JSON-LD ben formato (Restaurant+FAQPage), 3 lingue reali, canonical self + x-default; esplora conta i luoghi reali. Bug corretti in fase di test: seo_get sugli oggetti-errore, breadcrumb con livello città assente, deprecation curl_close, injection-hardening di `?q=`.

**Resta ad Alessandro:** inviare `https://poilove.com/sitemap.php` a Google Search Console + Bing Webmaster Tools (ChatGPT Search usa l'indice Bing).

---

## Sessione 11/07/2026 (1ª parte) — ZONA MEDIA completa (webapp v3.23, edge send-email, mig 072)

Costruita da zero la **Zona Media** dell'admin richiesta dal founder: template email, OpenGraph, deep-link tracciati, pixel social con manuale. Tutto reale e verificato dal vivo, checkpoint `checkpoint-2026-07-11-media-full` (HEAD `34d906a`, **v3.23**). Nessun lavoro non committato.

**Cosa è ONLINE e funzionante ora:**
- **Consenso marketing + pixel social**: l'overlay del consenso ha l'opt-in marketing separato (append-only, `CONSENT_VERSION` 2026-07-11). I pixel dei social si iniettano **solo dopo** il consenso marketing, leggendo gli ID dalla tabella `social_pixels` (8 network: Meta, GA4, Google Ads, TikTok, LinkedIn, Pinterest, Snap, X). Verificato dal vivo: senza consenso `fbq` non parte; con consenso parte e carica lo script Facebook con l'ID dal DB.
- **Admin → sezione Media (4 schede, tutta nostra CSS, nessun popup di sistema):**

## Sessione 11/07/2026 — ZONA MEDIA completa (webapp v3.23, edge send-email, mig 072)

Costruita da zero la **Zona Media** dell'admin richiesta dal founder: template email, OpenGraph, deep-link tracciati, pixel social con manuale. Tutto reale e verificato dal vivo, checkpoint `checkpoint-2026-07-11-media-full` (HEAD `34d906a`, **v3.23**). Nessun lavoro non committato.

**Cosa è ONLINE e funzionante ora:**
- **Consenso marketing + pixel social**: l'overlay del consenso ha l'opt-in marketing separato (append-only, `CONSENT_VERSION` 2026-07-11). I pixel dei social si iniettano **solo dopo** il consenso marketing, leggendo gli ID dalla tabella `social_pixels` (8 network: Meta, GA4, Google Ads, TikTok, LinkedIn, Pinterest, Snap, X). Verificato dal vivo: senza consenso `fbq` non parte; con consenso parte e carica lo script Facebook con l'ID dal DB.
- **Admin → sezione Media (4 schede, tutta nostra CSS, nessun popup di sistema):**
  - *Email*: impostazioni mittente (da `media_settings`) + CRUD template (invio/automatiche/invito) con editor e "Prova". Invio onesto: finché manca la chiave mostra "Motore email non configurato".
  - *OpenGraph*: template per entità (poi/route/trip/profile) con titolo/descrizione/immagine e variabili `{name}`/`{desc}`/`{area}`/`{stops}`.
  - *Deep-link*: costruttore con UTM, lista con conteggio clic, URL breve `poilove.com/go.php?s=<slug>`.
  - *Pixel*: per ogni network campo ID + **mini-manuale "dove trovarlo"** + link diretto ufficiale, on/off.
- **Landing OpenGraph reali (PHP, RLS anon, solo contenuti pubblici):** `webapp/poi.php` (POI community approvati) e `webapp/route.php` (rotte storiche pubblicate, con badge Ufficiale/Indispensabile/tappe). Prendono titolo/descrizione/immagine dai template `og_templates` configurati nell'admin. Verificato 200 + `og:title`.
- **Redirect deep-link tracciato:** `webapp/go.php?s=<slug>` risolve via RPC `resolve_deep_link` (conta il clic), poi 302 alla destinazione con UTM. Nessun open-redirect (target lo imposta solo l'admin). Verificato dal vivo: 302 + Location + clic incrementato.
- **Edge `send-email` (AcumbaMail):** deployata via Management API (status ACTIVE, `verify_jwt` true). Verifica utente + gate admin con service_role, legge il template, rende `{{var}}`, invia via AcumbaMail, logga in `email_sends`. Senza la chiave risponde onestamente `engine not configured` (nessun invio finto). Verificato dal vivo: 401 senza auth, "invalid auth" con sola anon key, admin-gate a valle.
- **mig 072** applicata e verificata: 8 tabelle Zona Media (email_templates, email_campaigns, email_sends, og_templates, deep_links, deep_link_clicks, social_pixels, media_settings) + `record_consent` a 5 argomenti (aggiunge il consenso marketing), `my_consents` con `marketing_ok`, `set_optional_consent` allargata, RPC `resolve_deep_link`, seed `media_settings` email.
- **Deep-link in-app**: la webapp ora apre `?trip=`/`?route=` direttamente nella scheda giusta (itinerario/rotta pubblici) invece di ignorarli.

**Cosa manca (spetta ad Alessandro, non bloccante per il resto):**
1. Segreto `ACUMBA_KEY` nei Supabase Edge Secrets → accende l'invio email vero.
2. Inserire gli ID dei pixel social nell'admin (scheda Media → Pixel).
3. SPF/DKIM su poilove.com per la deliverability delle email.
4. (Opzionale) edge-worker cron per le email automatiche sugli eventi.

---

> Checkpoint precedente: tag `checkpoint-2026-07-10-admin-rich` (v3.20).
> Code-review completa (22 agenti) su tutta la sessione 10/07: 14 findings confermati, TUTTI corretti (mig 068 + v3.14), verificati sul live poilove.com. Aperto solo: nota OSM lato-client (funziona, gratis; hardening server-side con edge function OAuth = miglioria futura, non bloccante).

## Sessione 10/07/2026 — Giornata piena: itinerari, categorie, rotte, pulizia finti (v3.02 → v3.14, mig 063-068)

Tutto live e verificato, checkpoint finale `checkpoint-2026-07-10-review-fixes` (HEAD su origin/main, **v3.14**). Nessun lavoro non committato. Riepilogo dell'intera giornata (18 commit, 6 migrazioni 063-068, 3 checkpoint):

**Blocco 1 — Itinerari e admin (v3.02 → v3.08, mig 063):**
- **v3.02**: le copertine degli itinerari usavano immagini AI inventate (digitando "Tirana" non usciva Tirana). Ora **foto reali** da Wikimedia Commons.
- **v3.03**: creando un itinerario si perdevano le date e usciva un **duplicato** (chiave locale mai riconciliata). Corretto: date salvate alla creazione, niente più doppione.
- **Admin editor tappe ridisegnato**: card grandi con trascina-per-riordinare, foto per tappa (ricerca Wikipedia), descrizione inline + AI, ordina con AI, duplica, sospendi/elimina. Stessa UI riusata sia per Rotte Storiche sia per Itinerari utente.
- **v3.04 + mig 063 — gesti swipe sulle card itinerario**: dito a sinistra = Archivia/Elimina; dito a destra = Condividi/Pubblico/Proponi come ufficiale (RPC `propose_trip_official`). mig 063: `trips.archived` + `official_requested`. Rifiniture UI v3.05→v3.07 su richiesta founder (bottoni impilati in una colonna, stondature pulite, card quadrata + angoli tondi solo sul contenitore).
- **v3.08 — riordino scheda Crea POI**: TAG in alto blu, fascia "Aggiungi a una lista" evidenziata, categorie sotto, il **+ rosso sparisce** quando la scheda è aperta.

**Blocco 2 — Categorie, itinerario, rotte, pulizia finti (v3.09 → v3.14):**

- **v3.09 + mig 064 — fino a 3 categorie (intreccio)**: nella scheda Crea POI un POI può avere fino a 3 categorie. Si scelgono dalla griglia e appena scelte la griglia si **compatta**, restano solo i chip scelti (con X per togliere) + "Aggiungi" finché sotto le 3; al terzo blocca e nasconde Aggiungi. Salvate come `pois.categories text[]` (mig 064, + indice GIN per la ricerca incrociata). La categoria/subcategoria primaria resta per l'icona del marker. Verificato dal vivo: 3 scelte, compattazione, array salvato, 4ª bloccata.
- **v3.10 + mig 065 — tolte le rotte storiche FINTE, messe due funzioni reali**: il vecchio menu rotte (Via Egnatia/Serenissima/Terre Illiriche/Colonie Greche) era cosmetico e non salvava nulla. Sostituito con: (1) **"Aggiungi a un itinerario"** — chip con gli itinerari reali dell'utente (col conteggio tappe); alla creazione/modifica il POI diventa una **tappa vera** dell'itinerario scelto (trip_stops via `_persistTripStops`/replace_trip_stops); (2) **"Proponi come tappa di rotta storica"** — manda il POI all'admin (RPC `propose_poi_as_route_stop`, solo autore). Il **+ rosso** già spariva a scheda aperta (`body.sheet-open`).
- **Admin (panel.html)**: nuovo pannello **"POI proposti come tappa"** nella sezione Rotte (`loadProposedPois`). Ogni proposta: foto/nome/autore/coordinate + descrizione, link Google Maps, **"Aggiungi a una rotta"** (sceglie la rotta storica e inserisce la tappa collegata al `poi_id`) e **"Segna gestita"** (`admin_clear_poi_route_proposal`). Trilingue IT/SQ/EN.
- **mig 065**: `pois.route_proposed` + `route_proposed_at` (+ indice parziale); RPC `propose_poi_as_route_stop` (solo autore) e `admin_clear_poi_route_proposal` (solo admin). Applicata e verificata; RPC registrate e protette (anon → "not your POI" / "not authorized").
- **Restano su questo filone**: filtro/scoperta incrociata dei POI per categoria (l'array c'è, manca la UI di filtro); provare su telefono reale l'aggiunta di una tappa da un POI creato dal vivo.

- **Categoria personalizzata REALE + pulizia finti nella scheda Crea POI (v3.11→v3.12, mig 066+067), tutto live e verificato.** Richiesta founder: le categorie le governa l'admin, un utente può avere UNA sola categoria personalizzata sua, appare all'admin che la approva subito, e a 20 usi diventa pubblica da sola. Fatto REALE (workflow ultracode: mappatura + design + implementazione + review avversariale a 13 agenti, 6 fix confermati e applicati):
  - **mig 066**: la categoria custom vive dentro `poi_categories` con `owner_id` + `active=false` (la vede/usa solo il proprietario via RLS) + contatore `uses`. Indice unico parziale = "una sola non pubblica per utente". Trigger sui POI mantiene `uses` e a 20 POI che la usano la pubblica DA SOLA (verificato: 19→privata, 20→pubblica). RPC `request_custom_category` (crea/usa, blocca la seconda), `delete_my_custom_category`, `admin_approve_category` (pubblica in 1 click), `admin_reject_category`, `admin_list_custom_categories`. Webapp: "Altra categoria" reale (niente più localStorage finto), sezione "La mia categoria", usa/sostituisci. Admin: pannello con proprietario + barra usi/20 + Approva ora/Rifiuta (via il "Promuovi" cosmetico).
  - **mig 067** (fix review): `request_custom_category` non riusa/espone più la pendente PRIVATA altrui (niente leak owner_id) ed è race-safe (collisione key → namespaced). Verificato: due utenti stesso termine → categorie separate e private.
  - **Finti eliminati nella scheda**: (1) Visibilità Pubblico/Privato/Condividi ora SALVA davvero (prima sempre 'community' hardcoded), in creazione+modifica, con preset in modifica e reset a Pubblico su scheda nuova (fix major: un POI nuovo non eredita più "Privato"); (2) tolto il blocco tag-tappa morto (toast "memorizzato" che non salvava); (3) via il vecchio auto-promote a righe (aggirabile) e i commenti/i18n fuorvianti.
  - **Risolto in v3.13**: tolto il finto "Consiglia a Google Maps" (impossibile: Google ha rimosso "Place Add" nel 2017, nessuna API per aggiungere posti; Foursquare solo legacy + a pagamento, scartato). Al suo posto **"Segnala su OpenStreetMap"** REALE e gratis: crea una Nota anonima via `api.openstreetmap.org` (CORS aperto, nessuna API key), verificata dal vivo dal browser (POST → nota creata). Più "Apri su Google Maps" onesto. Placeholder link condivisione reso onesto. Checkpoint `checkpoint-2026-07-10-custom-cat-final` → v3.13.

**Blocco 3 (sera) — Scheda itinerario + admin ricco + badge rotte (v3.15 → v3.20, mig 069-070):**
- **Scheda itinerario** (richieste founder): descrizione con AUTOSAVE immediato ('salvo…/salvato ✓'), frontalino sotto il titolo con tappe · km totali · area coinvolta (regioni tappe o centroide OSM), mappa a TUTTA larghezza (fix aspect-ratio che lasciava il vuoto a destra) con re-inquadramento automatico (ResizeObserver) e fix riapertura (mappa non resta più vuota). CARD in lista ricca: descrizione 2 righe + tappe/km/area.
- **Direttiva business registrata** (memoria business-moderation-pipeline): il creato dagli utenti si modera → si ufficializza col credito → si VENDE alle catene. Admin SOLO desktop, mai al risparmio.
- **Editor POI admin RICOSTRUITO** (prima: 5 campi): foto con miniature/principale/elimina/URL/upload reale, macro + 3 categorie a chips dalla tassonomia, tag, indirizzo preciso + città + geocodifica nei 2 sensi (Photon/Nominatim) + coordinate + apri su Maps, visibilità+approvato; righe tabella con miniatura, autore, conteggi. mig 069 (grant is_approved). DA COLLAUDARE col login MFA di Alessandro (il gate admin mi ferma, giusto così).
- **Badge rotte** (mig 069+070): Ufficiale e Indispensabile = toggle admin con audit; Più votato = dai salvataggi REALI via RPC trip_save_counts (la RLS di trip_saves mostra solo i propri, un conteggio client sarebbe falso). Webapp: chips oro/viola/rosso + ♥ conteggio sulle card rotte, verificate dal vivo.
- **SCOPERTA: nel DB ci sono ZERO rotte pubblicate.** "Le rotte non esistono" è vero alla lettera: il prossimo blocco è il CONTENUTO (prime rotte vere da admin) + la pagina rotte "meravigliosa" (nozioni, strumenti, foto). In TODO.


## Sessione 07/07/2026 — Consensi, notifiche, geofence + batch UI (v2.56 → v2.62)

**Batch UI da feedback founder (screenshot ricerca), v2.60 → v2.62, tutto live e verificato:**
- **v2.60**: (1) tolta la versione accanto al logo nella fascia nera, resta solo nella credit strip sotto; (2) distanza nelle card ILLI SEMPRE su una riga sola: "Xm da te · Ykm dal centro di <luogo>" (nowrap); (3) la risposta ILLI compare con fade dall'alto (1000ms); (4) **voce meccanica del browser DISATTIVATA** (founder: "una voce meccanica neanche per sbaglio"): speakText è no-op, tolto il bottone voce. Se in futuro si vuole la voce, serve Google TTS o simile (iperrealistica), non SpeechSynthesis.
- **v2.61 — ricerca mappa multi-tipo**: prima usciva solo "Rotte Storiche". Ora fonde più fonti, ≥2 per tipo: POI•LOVE cerca anche i POI REALI della community (`window._dbPOIs`, si aprono col loro id), sezione "Punti di interesse" da place-enrich discover (Google/Apple-style, attorno al centro mappa, in parallelo), "Luoghi" Nominatim non filtra più via le città (Tirana esce come luogo), + Rotte + Indirizzi. Collaudo live: "ristorante" a Tirana → Odas Garden/La Gioia (Google) + Pomo d'oro/Valledoria (OSM).
- **v2.62 — freccia "indietro" in alto a sinistra su ogni pagina**: funzione `_injectSheetBackButtons` aggiunge la freccia a OGNI testata sheet riusando la chiusura esistente (X spostata a destra); dettaglio POI con freccia flottante speculare a sinistra; pannello notifiche con freccia nell'header. Collaudo live: 7/7 sheet + dettaglio + notifiche, la freccia chiude davvero.
- Nota item founder "il commento/recensione è utile": feedback positivo, le card ILLI già mostrano voto + n. recensioni + fascia prezzo + il "perché" del posto. Tenuto così.
- **v2.63 + mig 048 — consenso microfono + testo GPS**: aggiunto il flag opzionale MICROFONO (dettatura) alla schermata consensi, registrato in DB (enum consent_type += 'mic', record_consent a 4 arg, my_consents ritorna mic_ok); riscritto il testo del consenso posizione con le parole esatte del founder ("visualizzare i luoghi più vicini e ottenere un avviso quando mi sto avvicinando"); CONSENT_VERSION → 2026-07-07.2 (ri-accettazione). Confermato al founder che il flag GPS c'era già. Collaudo live: 4 flag, mic salvato, 3 lingue.
- **v2.64 — logo consensi**: messo il logo POI•LOVE completo in cima alla schermata consensi al posto del cuore (scelta founder).
- **v2.65 + mig 049 — review qualità avversariale (5 agenti + verifica)**: trovati e CORRETTI i problemi reali dei cambiamenti della sessione. **BLOCKER**: (1) XSS stored nel pannello notifiche (username/titolo POI/nome compagnia iniettati in innerHTML) → `notifText` ora escapa via `_escHtml`; (2) race doppio `watchPosition` geofence (guard prima dell'await) → lock `_geoStarting`; (3) geofence non fermato al logout (su device condiviso il nuovo utente vedeva "sei vicino" dei POI del precedente) → `stopGeofence` + reset in `signOut` e su sessione finita. **MAJOR**: escape backslash negli `onclick` della ricerca (3 punti, `_escArg`); `loadBelovedIds` con filtro `user_id` esplicito; realtime notifiche ri-armato al cambio utente; geofence aspetta il caricamento POI (primo avviso non salta, tetto 4s); **consenso microfono ORA applicato** (dettatura bloccata + riapre il gate se manca); dead code voce rimosso; fade ILLI non rianima più tutta la chat (`insertAdjacentHTML`); testo consenso non promette più "dal profilo". mig 049: tetto 5000 al fan-out notifiche + `set_optional_consent` accetta 'mic'. Verificato live: XSS escapato, iniezione onclick neutralizzata, gate mic riapre, consenso salva senza errori.
  - **Rimandati (non bloccanti, tracciati)**: pannello "Privacy e consensi" nel Profilo con 3 toggle (geo/photo/mic via `set_optional_consent`, ora pronta lato DB); fan-out notifiche asincrono con coda quando gli autori superano ~1000 follower; audit XSS degli altri `showToast`/innerHTML preesistenti fuori sessione (stesso pattern, es. nomi amici riga ~9613).

- **v2.66 + mig 050 + edge transcribe — BACHECA VOCALE della compagnia (walkie-talkie)**. Richiesta founder: ogni compagnia diventa anche una bacheca di soli vocali, in stile interfono. Fatto: vista di dettaglio per compagnia (bottone "Bacheca vocale" sulla card) con **pulsante grande walkie-talkie "PREMI E PARLA"** (pointer capture, tieni premuto e parla, rilascia per inviare), non la cornetta. Flusso: MediaRecorder registra l'audio → upload nel **bucket privato companion_audio** → insert in `companion_messages` → **trascrizione async Whisper** (edge `transcribe`, il più stabile, deciso dal founder; l'audio resta SEMPRE anche se la trascrizione fallisce). Vocali **sottili**: avatar, autore+tempo, play (signed URL), trascrizione nella lingua del cellulare, **@menzioni linkate**, e SOLO **Like/Dislike/Rispondi** (no love). Risposte con `parent_id` (rientro visivo), realtime, gate consenso microfono (riusa `_micConsent`). mig 050: `companion_messages` + `companion_message_reactions` + bucket + RLS solo-membri (`is_companion_member`). Edge `transcribe` (verify_jwt, Whisper whisper-1, verifica autore, service_role per download+update). 3 lingue. **Collaudo live**: bacheca rende (autore/trascrizione/menzione/play/azioni), like salva nel DB, edge risponde autenticata (cached + not-found). **Da provare su telefono reale**: la registrazione col microfono e la trascrizione Whisper di un vocale vero (nel preview headless il MediaRecorder non registra audio reale).
  - **Fix critico apertura compagnia (v2.71)**: cliccando una compagnia usciva "Compagnia non ancora sincronizzata". Causa REALE (non cache): su `companions` un `insert().select('id')` insieme FALLISCE la RLS (interazione col select policy `is_companion_member` durante il RETURNING), quindi `createCompagnia` non salvava mai l'id → la bacheca non si apriva. Fix: **insert semplice + select separata** per l'id, in `createCompagnia` e in `_resolveCompanionId` (auto-riparazione: all'apertura, se manca l'id, la ricrea nel DB per codice). Card compagnia ora **tutta cliccabile** (v2.68) apre la bacheca. Versione resa **visibile** (bianca) sotto la licenza (v2.69). Collaudo live: compagnia senza id → ricreata → bacheca aperta.
  - **Dati in cima nella bacheca (v2.72)**: testata ricca sopra la conversazione = avatar membri + conteggio **/20**, tipo+date, **codice compagnia cliccabile** che condivide/copia il link di join per invitare. Visione founder: dati in cima, conversazione al centro, immagini sotto.
  - **Card compagnia ridisegnata (v2.74)**: la card nella lista Compagni (era "orribile") ora è pulita: header con avatar creatore + nome + ruolo/membri + icone admin piccole a destra, descrizione, avatar membri in tondini sovrapposti, riga di 3 bottoni uguali (tipo/scopo → apre bacheca · invita col codice · immagini). Tutta cliccabile. Screenshot confermato.
  - **Cancellazione vocale (v2.73 + mig 052)**: policy DELETE su companion_messages ora = autore OR owner (admin); cestino nel vocale per chi puo' cancellare. Collaudo live: admin cancella il vocale di un membro.
  - **Immagini + date (v2.75 + mig 053)**: zona IMMAGINI nella bacheca (strip di thumbnail) con **avatar di chi l'ha postata in alto a sinistra + data**; barra in basso a **3 pulsanti** (nero aggiungi-foto a sx, rosso premi-e-parla al centro, **Fuori Rotta** a dx segnaposto "presto"); upload con compressione WebP; **data anche sui vocali**. mig 053: companion_images + bucket privato companion_photos, RLS solo-membri, cancellazione autore/admin, gate consenso foto. Collaudo live: upload end-to-end -> thumbnail con avatar+data, riga nel DB.
  - **Restano (visione bacheca completa del founder, ordine layout dall'alto)**: (a) **stato live di ogni membro** ("fermo da +mezza giornata" / "in cammino"): serve posizione live per-membro (oggi il campo `friends` è mock, non reale); (b) **piantina** sotto con le posizioni dei vari membri della compagnia; (c) **immagini** sotto la piantina, ciascuna con **l'avatar di chi l'ha postata in alto a sinistra** (galleria condivisa, tutti i membri, con limite); (d) **cap 20 persone** enforced (oggi solo mostrato /20): serve `max_members` su companions + controllo in `join_companion`, con allargamento admin. Nota: (a)+(b) dipendono dalla posizione live reale (infra location-sharing), (c) è autonoma (bucket + upload + RLS), (d) è una migrazione piccola.
  - **Fase 2 bacheca FATTA (v2.67 + mig 051)**: (1) **itinerari/varianti della compagnia sopra la bacheca** (liste con `companion_id`, strip di chip name+conteggio sopra i vocali, tap apre la scheda Itinerari); (2) **notifica ai membri** all'arrivo di un nuovo vocale (evento `companion_new_voice` + trigger su `companion_messages` che avvisa tutti i membri tranne l'autore, rispetta le preferenze; icona/testo/gruppo impostazioni/3 lingue); (3) **riprova trascrizione** (`_compTranscribe` 3 tentativi + backoff, e recupero automatico dei propri vocali rimasti senza testo al load). Collaudo live: strip mostra la lista collegata, owner notificato (autore no), board rende. Resta da provare su telefono reale la registrazione mic + Whisper vero.

- **Dettaglio itinerario REALE, revisione grossa richiesta dal founder ("tutta finta") — blocco 1 (v2.83, mig 057) + blocco 2 (v2.84, mig 058), live**. Prima era pieno di finto: mappa con coordinate hardcoded, calendario "undefined null", visibilità che non salvava, tappe modificabili solo nel nome. **Blocco 1**: calendario vero (fix undefined null, mese dalle date reali) con **periodo tocca-inizio/fine** evidenziato più grande e colorato (giorni rossi, bordi pieni); **mappa con coordinate VERE** delle tappe + **bloccata** (no drag/zoom) + **quadrata**; **visibilità che SALVA** su DB con 4 opzioni (Pubblico/**Compagni**/Amici/Privato); **rinomina itinerario**; **riepilogo in alto**: date partenza/arrivo + lunghezza percorso (haversine, in linea d'aria per ora) + n. tappe. mig 057: trips.visibility/start_date/end_date, trip_stops.stay_label/image_url/region. **Blocco 2**: **modifica completa tappe** (nome, prefettura/regione/luogo, data, tempo di rimanenza, immagine, note) — prima solo il nome; numero tappa mostrato; riordino drag/sospendi/elimina già attivi; mig 058 aggiorna il RPC replace_trip_stops per PRESERVARE i nuovi campi (altrimenti il riordino li cancellava). Collaudo preview: dettaglio con calendario Agosto 2026 + periodo 12-16 evidenziato, mappa Tirana reale bloccata, editor tappa con tutti i campi. **Restano (blocco 3)**: percorso su STRADA (OSRM, non linea d'aria); popup di condivisione con OpenGraph + link reale (compagnia/amico/esterno); velocità aggiornamento copertina.

- **Copertina itinerari che SI SALVA + incidente/fix limite 1 MB (webapp v2.81, live)**. Il founder: la copertina dell'itinerario non si salva. Bug REALE trovato: cambiando la cover di un viaggio esistente `confirmPhotoPicker` aggiornava solo memoria + card, **mai il DB** → persa al reload. Fix: `update trips.cover_url` + localStorage; aggiunta la **copertina con bottone Carica/Cambia nel dettaglio** del viaggio (prima assente, la si cambiava solo dalla card). **INCIDENTE**: al deploy di v2.81 il sito è andato in **500** perché l'app ha superato **1 MB** e il WAF ModSecurity (`SecResponseBodyLimit 1048576`, Reject) rifiuta la risposta. Ripristinato subito v2.80 (sotto il limite) → sito su. **Soluzione senza toccare il server**: il deploy ora **divide** il file unico in `index.html` (~348 KB, con `<script src=app.js>`) + `app.js` (~700 KB), ognuno < 1 MB → nessun 500. La sorgente nel repo resta **un file unico** (principio invariato); lo split avviene al deploy (`scratchpad/deploy_split.js`, poi rsync dei DUE file). **Collaudo live** (poilove.com caricato in browser): UI completa renderizzata, zero errori console, v2.81. Vedi [[deploy_split_1mb]]. Server NON modificato (la modifica al firewall richiede OK esplicito del founder, non fatta).

- **Avatar proprio della COMPAGNIA (webapp v2.80 + mig 056), live e verificato**. Il founder ha chiarito che il cerchione grande della card/bacheca è l'identità del GRUPPO, non del creatore. Fatto: `companions.avatar_url` (data-URL WebP 256px, come gli avatar profilo, nessun bucket); l'owner tocca il tondino (badge fotocamera) e carica la foto del gruppo (`compPickAvatar`/`compAvatarUpload`, update su `companions` via policy owner già esistente). Il cerchione ora mostra la **foto della compagnia** o, se assente, le **iniziali del NOME della compagnia** (non più la faccia del creatore); il creatore resta in "Creato da" + chip membro. Foto mostrata anche nella **testata della bacheca** (quadrotondo 48px). **Collaudo preview**: card con foto gruppo → mostra la foto + badge fotocamera; card senza → iniziali "LA" (nome compagnia) + badge. Nota avatar PERSONA ([[avatar_everywhere]]) confermato funzionante sul telefono del founder (v2.79: "AL" + "Creato da Alessandro Castagna"). Deploy v2.80, mig 056.

- **Costo Google azzerato: tetto mensile free tier + cache arricchimento (webapp v2.79 + edge place-enrich v22 + mig 055), live e verificato**. Il founder ha chiesto "1000 e non di più, gratis". Analisi costi (workflow 3 fonti + verifica): il costo dominante era l'**arricchimento** ILLI (fino a 8 chiamate `searchText` Enterprise+Atmosphere a 0,04$, MAI cachate) = ~0,32$/ricerca; da marzo 2025 Google ha tolto il credito 200$/mese, sostituito con ~1000 chiamate gratis/mese per SKU. Fatto: (1) **tetto mensile globale** di **1000 chiamate Google** (env `GPLACES_MONTHLY_CAP`): mig 055 crea `api_budget` + `budget_hit(bucket,cap)` (contatore per mese di calendario, atomico); l'edge chiama budget_hit **prima di ogni fetch Google reale** (nearby/discover/enrich); oltre il tetto NON chiama Google e degrada ai dati **OSM** gratuiti. Sotto 1000 totali/mese ogni SKU resta sotto il suo free tier → **0 spesa**. (2) **cache dell'arricchimento** (prima assente): default mode ora cachea per 7gg su `enrich:{nome}:{lat.3}:{lng.3}`; i posti già visti non ripagano Google né consumano il tetto. (3) **5 schede invece di 8** (`merged.slice(0,5)`): meno chiamate a parità di qualità. **Collaudo live**: enrich su Komiteti (Tirana) → dati veri + riga in `places_cache`; 2ª chiamata identica = cache-hit; contatore `gplaces:2026-07` incrementa solo sulle chiamate reali e **NON** sui cache-hit (verificato: resta a 1 dopo una ripetuta); `budget_hit` testato taglia a cap. Quando vorrà crescere, basta alzare `GPLACES_MONTHLY_CAP`. Vedi [[gplaces_free_tier_cap]].

- **Card compagnia ridisegnata + avatar veri + Deviazione/Fuori Rotta (webapp v2.78 + mig 054), live e verificato**. Feedback founder su screenshot del tab Compagni: (1) **avatar**: la card mostrava una "T" al posto della sua faccia. Causa REALE: `syncCompagnieFromDB` scriveva `creatorName:'Tu'` (→ iniziale 'T') e leggeva l'avatar dai `user_metadata` auth (vuoti), ignorando `profiles.avatar_url` (dove sta l'avatar caricato). Fix: la sync ora fa il join `owner:owner_id(username,avatar_url)` + carica i **membri joined veri** (username+avatar) in una query sola; salvato anche `window._myAvatarUrl`/`_myUsername` dal profilo per la creazione immediata. Ora l'avatar dell'utente compare davvero ovunque ci sia il tondino ([[avatar_everywhere]]). (2) **card ridisegnata**: header con avatar+nome creatore e "Creato da @user · N membri"; descrizione; **elenco membri con avatar+nome** (corona sul creatore); **riga grande col codice d'accesso** + spiegazione "invialo a un amico, dovrà inserire questo codice per essere dei nostri"; **un solo bottone nero** "Apri la compagnia" al posto dei 3 pulsanti inutili. (3) **Deviazione (Fuori Rotta)**: il tasto a destra della bacheca era solo un "presto"; ora apre un **popup centrale** per proporre una deviazione (testo + luogo facoltativo + allega posizione), che finisce nella bacheca come **box VERDE** con voto **Approvo (verde) / No (nero)** riusando le reazioni like/dislike; se prende meno della metà dei voti (i no superano i sì, quorum 2) **sparisce** per tutti (all'autore resta sbiadita). mig 054: `companion_messages` + `kind`('voice'|'deviation')+`body`+`place_name/lat/lng`; il trigger notifiche "nuovo vocale" ora scatta solo per kind='voice'. **Collaudo preview** a 375px: card con avatar reale (immagine, non 'T'), creatore+membri+codice+bottone nero; box deviazione verde con voti e stato; logica "cade sotto metà voti" verificata (1/2 e 2/3 → cade, pari/quorum-1 → resta). Deploy webapp v2.78, mig 054 applicata. **Da provare su telefono reale** col suo account (avatar caricato) e con più membri.

- **Schede ILLI ridisegnate (webapp v2.77 + edge place-enrich v21), tutto live e verificato**. Feedback founder secco sulle card dei posti trovati da ILLI. Sistemate le 4 cose: (1) **icona per TIPO, non per nome**: mappa autorevole `_ICON_BY_GTYPE` sul `primaryType` di Google (bar→caffè, pub→birra, sushi→nigiri, fine dining→forchetta...), ha la precedenza sul testo libero → un bar ha SEMPRE il caffè, mai un'icona pescata dal nome; (2) **spesa media CHIARA**: riga a sé con icona portafoglio "Spesa media 2000-4500 L" usando la **fascia prezzo reale in denaro** di Google (`priceRange`, valuta→simbolo, Lek per Tirana), fallback a €/€€/€€€ con etichetta ("nella media"); (3) **descrizione = recensione VERA**: la edge ora chiede `places.reviews` (stesso SKU di editorialSummary, costo zero) e ritorna `reviewText` = estratto pulito della recensione più rilevante (≥40 char, tagliata a ~220 su confine di parola); `_placeDesc` la mostra tra «virgolette», non più una parola secca; (4) **distanze leggibili in due colori**: tolti nowrap+ellipsis che tagliavano il "dal centro"; ora "Xm da te" in **rosso** e "Ykm dal centro di <luogo>" in **blu**, due chunk interi che vanno a capo tutti insieme (mai spezzati/tagliati). **Collaudo live**: edge testata su Mullixhiu (Tirana) → recensione IT reale + 2000-4500 L + fork-knife; card renderizzata nel preview a 375px → icona giusta, spesa chiara, recensione intera, distanze rosso/blu su due righe leggibili. Deploy edge (v21, verify_jwt invariato false) + webapp (poilove.com v2.77).

## Sessione 07/07/2026 (mattina) — Consensi GDPR, sistema notifiche, geofence foreground (v2.56 → v2.59)

Il founder ha chiesto: cosa serve chiedere all'utente una volta sola (GPS, Termini, privacy/dati sensibili, camera/galleria/microfono, notifiche) e di organizzare tutte le notifiche attivabili/disattivabili. Prima ho aperto un lavoro strutturato (8 agenti) per verificare i fatti tecnici/legali senza andare a memoria. **Verità emerse (verificate in modo avversariale)**: sul WEB l'unico permesso "chiedi una volta e resta" è il GPS (su iPhone tende a richiederlo ogni sessione); camera/galleria = file-picker one-shot, NON esiste permesso "galleria completa" come nel nativo; microfono via SpeechRecognition; le notifiche PUSH oggi sono impossibili (serve un service worker, che non c'è) e su iPhone servono la PWA installata in Home (iOS 16.4+); il **geofence in background (avviso ad app chiusa) è impossibile su web** su iOS e Android → va sull'app nativa (Expo). Le tre feature "cuore" (avviso arrivo, condivisione posizione continua, album foto completo) sul web funzionano SOLO in foreground; il background reale è nativo. Consegnato in 3 checkpoint atomici, tutti verificati dal vivo, deployati e pushati:

- **Consensi GDPR + Legge AL 124/2024 (webapp v2.57 + mig 046)**. Prima c'era solo la frase passiva "Accedendo accetti": non è un consenso valido. Ora schermata one-time dopo il login: bundle obbligatorio **Termini+Privacy+età≥16** (soglia 16 secca, valida IT+AL, scelta dal founder) + due consensi **opzionali separati** (posizione GPS, foto). Registrato server-side via RPC `record_consent`: tabella `consents` append-only (user_id, tipo, versione testo, IP, User-Agent, timestamp), RLS, insert solo via SECURITY DEFINER; `my_consents` legge lo stato (se la versione cambia → ri-accettazione), `set_optional_consent` per i toggle futuri. `CONSENT_VERSION='2026-07-07'` nel client. Trilingue IT/SQ/EN. **Collaudo live**: gate scatta per chi non ha consentito, salva 5 righe con IP/versione, idempotente (chi ha già accettato non lo rivede), blocca sotto 16.

- **Sistema notifiche (webapp v2.58 + mig 047)**. Backend: tabelle `notification_prefs` (per utente/tipo/canale) e `notifications` (coda/storico in-app), realtime, RLS (insert solo via SECURITY DEFINER), producer `enqueue_notification` che rispetta le preferenze. **Trigger reali additivi** (non toccano quelli esistenti): nuovo follower, LOVE ricevuto, nuovo POI di un seguito (verso tutti i follower), invito compagnia, ingresso in compagnia. UI: **campanella in topbar** con badge non-letti (realtime), pannello con **lista** notifiche localizzata (nome attore via join, tempo relativo, letto/non letto, segna tutte lette) e scheda **Impostazioni** con interruttori per-evento e per-canale (📱 in-app, ✉️ email; **push mostrato come "Presto"** perché manca il service worker), 3 gruppi Sociale/Compagnie/Rotte. Trilingue. **Collaudo live**: trigger accodano dagli eventi reali (follower, LOVE con titolo POI), badge conta i non-letti, gate preferenze blocca (spengo in-app → niente notifica), toggle salva nel DB.

- **Geofence foreground "sei vicino a un luogo che ami" (webapp v2.59)**. Gated dal consenso posizione: `watchPosition` gentile (bassa precisione, maximumAge 20s) che, ad **app aperta**, avvisa con un toast quando entri nel raggio (150m) di un luogo che ami (LOVE) o che hai creato. Debounce per luogo + riarmo se ti allontani (350m). Riusa `haversineKm` e `_dbPOIs`. **Onesto in UI e nel consenso**: solo foreground; il background reale (telefono in tasca/app chiusa) resta per l'app nativa. **Collaudo live**: avvisa da vicino ("Sei vicino a Bar Amato"), non ripete se resti fermo, si riarma da lontano.

**Restano (dichiarati, non a metà)**: canale EMAIL delle notifiche (serve la chiave AcumbaMail nei segreti + un edge worker che legge le prefs email e invia); trigger notifiche per "rotta pubblicata/rifiutata/adottata" (dentro le RPC admin esistenti); notifiche non fattibili ora e correttamente NON promesse (chat utente-utente inesistente, SOS reale, push di sistema, badge gamification). Il **push di sistema** e il **background reale** sono un cantiere a sé (service worker mirato + VAPID, e app nativa Expo per il geofence in tasca).

## Sessione 06/07/2026 — Ricerca avanzata, lente nera, teaser condivisione (v2.14 → v2.56)

- **Link condiviso vince sul GPS (webapp v2.56)**. Richiesta founder: aprendo un link condiviso, la mappa deve aprirsi sul luogo del link, non dove sei col GPS. Causa: race — il GPS `getCurrentPosition` (riga ~5418) faceva `map.setView(gpsPos)` quando risolveva (spesso DOPO handleDeepLink a 800ms), sovrascrivendo il posto condiviso. Fix: flag `_deepLinkActive` (true se l'URL ha `?poi=` o `?at=`) che BLOCCA l'auto-center GPS; il deep-link centra sul posto e vince. Anche `openPendingSharedPoi` (riapertura post-OAuth, URL senza `?poi=`) imposta il flag. `centerMap` (mirino "centra su di me") lo azzera, così l'utente può tornare a sé. Collaudato in preview: con `?at=41.3275,19.8187` la mappa si centra sul link (41.327,19.819), flag attivo, nessun override. Deployato (v2.56).

- **ILLI schede: qualità cucine + 4+altri + due distanze + icone da categoria (webapp v2.55 + place-enrich v20)**. Feedback founder su schermata (messicano "non trovo" ma ce ne sono 8; una risposta sola; icone dal nome; distanza ambigua). Fatto:
  - **Query cucine migliore**: aggiunto `gq` (query Google in inglese) a ogni cucina — "mexican restaurant"/"vegan restaurant"/"sushi restaurant" trovano i posti VERI (prima "messicano" tornava Serendipity/Wild West a caso o nulla). Nuova categoria **vegano/vegetariano** (Fresh Garden, green & protein...). Aggiunta pesce.
  - **4 risultati + "Ne vuoi altri? (+4)"**: `_renderPlaceCards` a batch (4 visibili, bottone rivela altri 4), `aiMoreResults`.
  - **Due distanze**: `p.distGpsM` (da te, GPS) + `p.distCityM` (dal centro della città chiesta). `_distLine`: se lontano dalla città → "X dal centro di Tirana · Y da te"; se in zona → "Y da te · X dal centro"; se qui → "da te". (Il "da te" reale compare col GPS vero; nel test window.gpsPos non tocca la var di modulo.)
  - **Icone dalla CATEGORIA/tipo, non dal nome**: `_iconForPlace` usa gType/typeLabel/cuisine/kind (+ `catIco` fallback per categoria), rimosso il nome. "Tony's Coffee Shop" (ristorante americano) ora ha la forchetta, non la tazzina. Ogni categoria ha la sua `ico`.
  - **Voto allineato**: riga voto pulita (⭐ 4,7 · recensioni · €€), "Aperto ora" e distanza (con pin) su righe proprie.
  - Collaudo e2e reale da loggato: "ristorante messicano a tirana" → Serendipity Tex-Mex ⭐4,7, French Tacos... 4 schede + "altri", icone giuste, voto+distanza allineati. Screenshot confermato. Deployato (v2.55).

- **ILLI: distanza + orario + selettore paese (webapp v2.54 + place-enrich v20)**. Richieste founder: (a) "vicino a valona, max 30 km, aperto alle 23:00" → cerca entro 30km e solo chi è aperto a quell'ora, con intelligenza; (b) bottoni Italia/Albania + campo libero paese, ed è lì che ILLI cerca. Fatto:
  - **Distanza**: `_parseRadiusKm` ("a 30 km", "entro 20 km") → raggio di ricerca + filtro finale; alzati i tetti discover/fsq a 50km (edge) per coprire raggi larghi.
  - **Orario**: `_parseWantedTime` ("alle 23", "alle 23:30", "a mezzanotte", "stasera tardi"); place-enrich TEXT ora ritorna `regularOpeningHours.periods`; `_openAtDatetime` calcola chi è aperto a quell'ora (gestisce anche l'attraversamento della mezzanotte); i posti aperti a quell'ora vanno DAVANTI e il grounding istruisce ILLI a proporli, marcando "aperto/CHIUSO alle HH:MM".
  - **Selettore paese**: barra "Cerca in: Albania / Italia / Auto" + campo libero "Altro paese" sopra la chat (persistito in localStorage). Filtra il gazetteer (IT/AL) e Nominatim (countrycodes / paese custom). 3 lingue.
  - **BACO trovato e corretto**: nel `wantsSearch` avevo messo stem con `\b` finale ("\bmangi\b" NON matcha "mangiare"); le frasi lunghe con vincoli (30km/23:00) non facevano partire la ricerca → categoria null → niente grounding. Sistemato coi prefissi + "voglio/vorrei". Collaudo e2e reale da loggato: "voglio mangiare vicino a valona, massimo 30 km, aperto alle 23:00" → ILLI "diverse opzioni tutte aperte fino alle 23:00: Taverna Xhakaj 517m 4,8, Taverna Shushica 544m 4,8..." con 7 schede entro 30km, aperte alle 23. Screenshot confermato. Deployato (v2.54).

- **ILLI: refusi città + correzione mostrata + coniugazioni verbi (webapp v2.53)**. Il founder: "se digito 'vl0ona' lo devi capire e correggere, magari facendomelo notare". Fatto: (1) nuovo **gazetteer città** con coordinate + alias IT/SQ (Valona/Vlorë, Tirana, Durazzo/Durrës, Scutari/Shkodër, Saranda/Sarandë, Berat... + zona Veneto del founder), riconoscimento **fuzzy** (Levenshtein ≤2, riusa `_lev2`) TYPO-PROOF: "vl0ona"→Valona, "tiran4"→Tirana, "durrazzo"→Durazzo, "t1rana"→Tirana; se non è città→NULL (xyzkwq/Patrizio). Il regex ora cattura anche le CIFRE dopo la prima lettera (altrimenti "vl0ona" veniva troncato a "vl"). (2) La correzione viene **passata al grounding**: ILLI inizia con "Immagino tu intenda Valona..." e poi risponde. (3) Trovato un altro buco: "dove **mangio** bene" non era rilevato (il regex categoria aveva solo "mangiare", non le coniugazioni) → nessun grounding → il modello INVENTAVA i nomi. Aggiunte le coniugazioni (mangio/mangi/mangiamo/ceno/pranzo/pranziamo...), senza falsi positivi (centro/cento→null). Collaudo e2e reale da loggato: "dove mangio bene a vl0ona?" → ILLI "Immagino tu intenda Valona. Ti consiglio il Paradise Beach Restaurant, 3,3 km, aperto adesso..." con 8 schede vere. Screenshot confermato. Deployato (v2.53).

- **ILLI: bug città in minuscolo (webapp v2.52) — avevo cantato vittoria troppo presto**. Il founder ha riprovato "Dove posso mangiare bene **a valona** stasera tardi?" e ILLI falliva ancora ("non ho info su Valona... Zugliano"). Causa: `_geocodeAskedPlace` accettava solo toponimi con la MAIUSCOLA ([A-ZÀ-Ù]); "valona/tirana/durazzo" minuscoli non venivano rilevati → ricaduta sul GPS (Zugliano). I miei test precedenti usavano "Valona" maiuscolo, quindi non avevo visto il baco reale. FIX: riconoscimento case-insensitive + stoplist di parole comuni ("mangiare/cena/stasera/ristorante/qualsiasi"...) + rimozione parole-tempo in coda ("valona stasera"→"valona") + accetto il risultato Nominatim SOLO se è un vero luogo (`_isPlaceResult`: city/town/village/...), così "con Patrizio"/"a cena"/"mangiare qualcosa" → nessun falso positivo. Collaudo esaustivo: valona/tirana/durazzo/saranda/berat/scutari minuscoli → città giuste; non-luoghi → NULL. E2E reale da loggato con la frase esatta del founder: ILLI → "A Valona, Paradise Beach Restaurant a 3,6 km, aperto fino alle 23:30..." con 8 schede. Deployato (v2.52).

- **ILLI VELOCE + schede tornate (webapp v2.51)**. Collaudo end-to-end reale (utente usa-e-getta loggato nel preview): la domanda "sushi vicino Valona" dava "non trovo" con ZERO schede. Causa: con tutte le fonti nuove in SEQUENZA (OSM multi-raggio + Google nearby+discover + Foursquare + POI•LOVE + arricchimento) la ricerca sforava il timeout di 9s del flusso → tornava vuota → nessuna scheda. FIX: fonti tutte IN PARALLELO (Promise.all), tetto 3s su Overpass e 4.5s sull'arricchimento, race a 12s. Da **11.9s a ~3.8s**. Riprovato end-to-end da loggato: ILLI risponde "UMAMI Sushi Restaurant Vlore, 1,6 km, 4,9 su 107 recensioni..." con **8 schede** (UMAMI Sushi ⭐4,9 "Ristorante di sushi", NISHIKI ⭐4,8 "Ristorante giapponese"...) — voto, tipologia, spiegazione e i 4 bottoni POI/Vai/Aggiungi/Condividi. Le schede non erano sparite: mancava solo che la ricerca trovasse posti in tempo. Screenshot confermato. Deployato (v2.51). Nota Foursquare: chiave installata e codice giusto (API aggiornata al formato 2025-06-17) ma l'account Foursquare dà 429 "no API credits" (serve billing loro); resta fail-open, il founder ha scelto di lasciarlo dormire.

- **ILLI cerca su PIÙ fonti = un solo insieme (webapp v2.50 + place-enrich v13 fsq)**. Richiesta founder: ILLI deve cercare su Google + altre fonti con recensioni + i dati POI•LOVE (titolo, zona, categoria, tag), tutto fuso in un insieme. Fatto:
  - **POI•LOVE cercato a fondo**: `_localPoiPlaces` ora matcha su titolo+categoria+sottocategoria+**tag**+descrizione (helper `_poiHaystack`), e nuova `_poilovePlaces` interroga LIVE il DB `pois` vicino all'origine chiesta (bounding-box+haversine, non solo la cache client): così i luoghi amati dalla community entrano SEMPRE nell'insieme ovunque cerchi l'utente, con priorità (+100). Rispetta la RLS (i non-approvati restano nascosti agli altri, corretto). Verificato: match per tag reale (tag "monumenti" fa emergere Piazza Skanderbeg cercando attrazioni, zero falsi positivi).
  - **Foursquare** = altra fonte con recensioni (place-enrich mode `fsq`, key-gated `FOURSQUARE_KEY`, fail-open totale: senza chiave ritorna vuoto, zero rischio per la lente; cache 7gg; rating 0-10 normalizzato a 0-5). Nel client `_fsqPlaces` entra nel merge accanto a Google/OSM/POI•LOVE. **Per Alessandro**: per accenderla, metti FOURSQUARE_KEY (chiave gratuita Foursquare Places) nei segreti Supabase; la verifico live appena c'è.
  - **Insieme unico**: `_fetchRealPlaces` fonde OSM + Google(nearby+discover) + Foursquare + POI•LOVE(live), dedup per nome, ordinato per qualità reale. Etichetta voto onesta per fonte (Google/Foursquare/community). Collaudato: "ristorante a Tirana" fonde OSM+Google (6 posti coi voti); POI•LOVE live trova i POI della community vicino a Tirana. Zero errori JS. Deployato (webapp v2.50, place-enrich v13).

- **ILLI grounding RIFATTO: trova posti VERI nella città giusta (webapp v2.49 + edge place-enrich v12 discover)**. Il founder ha mostrato ILLI rotto: chiede "sushi vicino Valona" e ILLI risponde "non trovo... a Zugliano" (città GPS sbagliata, nessun posto reale). Diagnosi: (1) la scoperta posti usava SOLO OpenStreetMap, vuoto in Albania, mentre Google (place-enrich) trova tutto; Google serviva solo ad arricchire, mai a scoprire. (2) "Vicino Valona" non veniva riconosciuto (regex città solo "a/in/verso/per"). (3) "Valona" geocodificato senza bias finiva in **Belgio**. (4) la città chiesta non veniva ricordata nei follow-up → riappariva Zugliano. (5) il prompt bloccava su Zugliano ("MAI altre città"). Fix completo:
  - **Scoperta Google**: `_googleNearbyPlaces` (nearby, come la lente) + nuova modalità **discover** in place-enrich v12 (searchText mirato per cucine specifiche tipo sushi/kebab, cache 7gg). `_fetchRealPlaces` ora fonde OSM + POI•LOVE + Google; per una cucina specifica usa discover filtrato per distanza, e se davvero non c'è nulla ripiega su ristoranti generici ("sushi dedicati non ne trovo a X, ma questi ristoranti sì").
  - **Riconoscimento città**: regex ampliato (vicino, presso, zona di, nei pressi di, dalle parti di, dintorni di) + **bias geografico Italia+Balcani** (viewbox) così Valona→Vlorë Albania, Berat/Durazzo/Saranda corretti, non più Belgio.
  - **Memoria città** per i follow-up + `_looksLikeFollowUp` ampliato (tira fuori, cerca, dai, mostra, segnala...) → "tiramelo fuori tu" ora ri-cerca a Valona, non a Zugliano.
  - **Prompt** ammorbidito: usa la città chiesta, si fida del blocco GROUNDING.
  - Collaudo live reale: "sushi a Tirana" → Watami ⭐4.8, Sakura Sushi Bar, SushiCo (sushi veri); "sushi vicino Valona" → UMAMI Sushi Restaurant Vlore ⭐4.9, Valis Japanese Gastrobar ⭐4.7 (città giusta!); Berat/Durazzo geocodati bene. Zero errori JS. Deployato (webapp v2.49, edge place-enrich v12).

- **Segnalazioni di rotte storiche dagli utenti + credito pubblico (mig 045 + webapp v2.48 + panel)**. Richiesta founder: gli utenti segnalano rotte storiche → popup di ringraziamento → l'amministrazione valuta, sceglie le immagini giuste e la descrizione attinente, pubblica con "Ringraziamento a: Nome" linkato al profilo. Implementato tutto:
  - Backend (mig 045): tabella `route_suggestions` (RLS: l'utente crea/vede le sue, l'admin tutte); colonne `trips.description` (contenuto editabile) e `trips.suggested_by` (credito, scrivibile SOLO via RPC così nessuno si autoaccredita); 3 RPC SECURITY DEFINER — `submit_route_suggestion` (login obbligatorio, anti-spam max 5 in attesa), `admin_route_from_suggestion` (crea rotta bozza col credito già attaccato, marca la segnalazione published), `admin_dismiss_route_suggestion`.
  - Webapp (v2.48): bottone "Segnala una rotta storica" nell'area Rotte, form (nome/zona/descrizione) → RPC → **popup di ringraziamento** ("Grazie di cuore! Se la pubblichiamo apparirà col tuo nome linkato al profilo"). Nel rendering delle rotte: riga "Ringraziamento a: [Nome]" cliccabile che apre il profilo REALE del segnalatore (`openProfileByUsername` → `openUserProfile`). Tutto in 3 lingue.
  - Admin: nuova sezione "Segnalazioni dalla community" in Rotte (lista in attesa con nome segnalatore, "Crea rotta"/"Scarta"); il modal di modifica rotta ora ha **descrizione + immagine di copertina** (l'admin trova l'immagine giusta e scrive la descrizione attinente); ogni rotta mostra il credito 🙏 nella lista admin.
  - Collaudo e2e reale con utente usa-e-getta (poi eliminato): utente segnala via RPC REST → admin crea la rotta (credito attaccato) → join pubblico mostra il credito col username del segnalatore → segnalazione marcata published+linkata. Popup ringraziamento verificato in preview, zero errori JS. Deployato (webapp v2.48, panel md5 match).

- **Motore ILLI multi-provider, scelto dal pannello admin (mig 044 + edge illi-chat v5 + panel)**. Richiesta founder: "il motore illi lo si fa dal pannello admin". Prima illi-chat era OpenAI hardcoded (gpt-4o-mini). Ora legge la config `gamification_config.illi_engine` ({provider, model}) e instrada a OpenAI o Anthropic; la risposta Anthropic è normalizzata alla shape OpenAI, così il client non cambia. Le CHIAVI restano nei segreti Deno.env (OPENAI_KEY, ANTHROPIC_KEY): il pannello sceglie SOLO provider+modello, mai la chiave (regola di ferro). Fail-safe: se il provider scelto non ha la chiave, ripiega su OpenAI. Nuova modalità admin-only `engine_status` (403 per i non-admin) che dice al pannello quali chiavi sono configurate senza esporle. Pannello: card "Motore di ILLI" nella sezione Limiti AI (provider+modello, stato chiavi, nota che Anthropic va abilitato coi segreti Supabase), 3 lingue. Collaudo e2e reale con utente usa-e-getta (poi eliminato): OpenAI risponde (zero regressione), engine_status respinge i non-admin, admin vede {openai:true, anthropic:false}, e con motore=anthropic senza chiave la chat ripiega su OpenAI e funziona. Default resta OpenAI gpt-4o-mini. **Per Alessandro**: per accendere Claude, imposta ANTHROPIC_KEY nei segreti Supabase (Edge Functions), poi scegli Anthropic nel pannello.

- **Cache Google Places sulla lente (mig 043 + edge place-enrich v11)**. La modalità NEARBY (la lente, il vero costo Google) ora passa da una cache condivisa: utenti diversi che guardano la STESSA zona ricevono un'unica risposta, si taglia drasticamente la spesa API al lancio. Tabella `places_cache` (chiave: coordinate ~110m + raggio bucket 100m + lingua, TTL 7 giorni perché rating/tipo sono stabili), accessibile solo dal service_role (RLS on, nessuna policy → invisibile a anon/authenticated; l'edge bypassa). Design FAIL-OPEN tassativo: se la cache è giù o in errore, l'edge chiama Google esattamente come prima, la lente non si rompe MAI. La modalità TEXT (arricchimento singolo posto) resta LIVE, non cachata, perché include openNow che scade a ore. Deployato io via Management API (v11, verify_jwt=false preservato per gli ospiti). Collaudo live reale: Tirana e Trieste restituiscono 20 POI veri (Piazza Skënderbeg, L'Antica Pizzeria da Michele), 2a chiamata identica byte-per-byte = HIT con zero chiamate Google, TEXT mode ancora vivo (rating 4.5, openNow true), bad_request gestito. 2 righe in cache dopo il test.

- **Verifica avversariale finale (workflow 6 agenti, Opus) + v2.47**. Rivisti in parallelo 4 fronti toccati oggi: coerenza trilingue tassonomia+SOS, integrità admin (tag+soft-delete), pipeline immagini, sicurezza RPC nuove (041/042). Le dimensioni i18n-tassonomia e rpc-security: PULITE, zero problemi (conferma che la tassonomia è pienamente trilingue e le 6 RPC sono SECURITY DEFINER + is_admin gate + REVOKE/GRANT corretti). Trovati e CORRETTI 2 bug minori reali (verificati avversarialmente): (1) chiave i18n `pf_removed` mancante nel blocco albanese del pannello → un admin SQ vedeva l'ultima voce del filtro POI in italiano; aggiunta traduzione SQ. (2) `compressToDataURL`: un throw dentro `img.onload` (es. getContext null) lasciava la Promise appesa e non revocava l'objectURL; ora il corpo di onload è in try/catch che revoca e risolve ''. Collaudato in preview: caso normale comprime in WebP, caso degradato risolve '' invece di appendere. Entrambi deployati e verificati live (webapp v2.47, admin md5 identico, pf_removed SQ live).

- **v2.46 ottimizzazione immagini + soft-delete POI admin (mig 042)**.
  - **Immagini ottimizzate** (lamentela founder "le immagini non sono ottimizzate"). Trovato il vero problema: avatar, sfondi profilo e copertine itinerario venivano salvati come data-URL base64 PIENO (una foto da 5 MB → ~6.7 MB di stringa in profiles.avatar_url/cover_url, ritrascinata a ogni join autore/muro sostenitori). Le foto dei POI erano già compresse (compressToWebP 1200px); avatar/sfondi/copertine no. Aggiunto helper `compressToDataURL` (canvas → WebP, lato max configurabile) e instradati: avatar 384px q0.85, sfondi 1280px q0.82, copertine itinerario 1280px q0.82. Collaudo reale in preview: PNG 3.2 MB → avatar WebP 13 KB (247x più leggero), sfondo WebP 35 KB (92x). Verificato: nessun avatar/cover base64 esistente in DB da ripulire (tutti URL), la compressione vale da qui in avanti. Zero errori JS, deployato (v2.46 live).
  - **Soft-delete POI reversibile nell admin** (regola di ferro "niente si cancella"). Il delete admin era HARD (irreversibile). Le RLS di pois sono 4 policy SELECT permissive (rischio alto a toccarle): scelto un approccio SENZA modifica RLS. Mig 042: colonne removed_at/removed_by/removed_reason/prev_visibility/prev_is_public + 2 RPC SECURITY DEFINER gate is_admin — `admin_soft_delete_poi` (salva stato, mette private+non-public+non-approvato → le policy esistenti lo nascondono ai non-proprietari, audita) e `admin_restore_poi` (ripristina lo stato esatto di prima). UI admin: filtro "Rimossi (nascosti)", i rimossi esclusi dalla vista normale, bottoni Rimuovi (soft, con motivo)/Ripristina; "Elimina per sempre" (hard) resta solo sui già-rimossi. Collaudo e2e reale (JWT admin + rollback): soft-delete nasconde e salva prev (community→private), restore riporta identico, gate respinge i non-admin, dati reali intatti. Deployato (panel md5 identico).

- **v2.45 numeri SOS ufficiali + admin gestione TAG + coerenza trilingue tassonomia**. Tre direttive del founder chiuse e live.
  - **Numeri di emergenza VERI nella scheda SOS** (v2.45): blocco toccabile con 112 unico (Europa/Albania/Italia/internazionale, tel: diretto), Albania 129 polizia / 127 ambulanza / 128 pompieri, Italia 118 / 115 / 113, internazionale 112 GSM / 911 USA-Canada / 999 UK, nota "112 funziona da qualsiasi cellulare anche senza credito o SIM". Tutto in 3 lingue (it/sq/en). Verificato nel DOM live: titolo giusto, 10 link tel: presenti, zero errori JS. Deployato (md5 identico, footer v2.45).
  - **Coerenza trilingue tassonomia — VERIFICATA**. Categorie/sottocategorie UFFICIALI già pienamente trilingui (poi_categories.label_it/sq/en + _catLabel + gruppi + famiglie agganciati a `lang`). L autopromozione a 20 richieste (mig 039/040) popola sempre le 3 label (non-null) e mette la sottocategoria nella famiglia giusta, official=false così l admin la rifinisce. I tag restano liberi/mono-parola per scelta del founder. Nessuna modifica necessaria: era già a posto.
  - **Admin = cuore: gestione TAG** (mig 041 + nuova sezione "Tag" nel pannello). Backend: tabella `curated_tags` (featured/blocked) + 4 RPC SECURITY DEFINER gate is_admin — `admin_list_tags` (elenco community con conteggi + stato), `admin_rename_tag` (rinomina/unisce su tutti i POI con dedup), `admin_delete_tag` (rimuove da tutti i POI), `admin_curate_tag` (evidenzia/blocca). `suggest_tags` aggiornata: include gli evidenziati, esclude i bloccati. UI admin: lista tag con ×conteggio, filtro, azioni Rinomina/Evidenzia/Blocca/Elimina, form evidenzia-tag, tutto in it/sq/en. Collaudo e2e reale (JWT admin simulato + rollback): gate respinge i non-admin, admin vede i tag veri (monumenti/piazza/tirana), rename fa il dedup, blocco fa sparire il tag dai suggerimenti, dati reali intatti dopo rollback. Deployato (panel md5 identico).
  - **AI auto-compilazione RIMOSSA dal pannello POI** (v2.43, "togli l ai che compila"): tolti i bottoni nome-AI e descrizione-AI, disattivato l auto-suggerimento nome. Resta dettatura (microfono) + scrittura manuale; ILLI chat resta e funziona. Corretti anche (v2.40-2.42) i punti dello screenshot: chiavi tier grezze tradotte, bottone crea compagni, foto che restava tra un POI e l altro (reset), copertina itinerario caricabile.

- **Verifica finale end-to-end (workflow 7 agenti) + v2.36-2.38**. v2.36-2.37: coppa VERDE entro 60s, MEDAGLIA "Complimenti" con messaggio caldo oltre 60s (non piu coppa). Verifica finale: verdetto PRONTO CON NOTE, ZERO bloccanti, sicurezza pulita al 100% (edge protette, RLS su 28 tabelle, colonne pois/trips scrivibili solo via RPC, nessuna chiave nel client, 14 RPC client-server coerenti). Sweep live: 4 URL 200, tutte le RPC/tabelle presenti, 6 tier nei limiti AI. Unico bug funzionale trovato e CORRETTO (v2.38): i chip-filtro CATEGORIA cercavano l etichetta sottocategoria ma la riga aveva solo il macro, davano "Nessun risultato"; ora l etichetta e nel testo cercabile. Collaudato (chip "Pizzeria" trova "Da Mario"). +2 note cosmetiche chiuse. TUTTO live (v2.38).

- **v2.35 QR business (perk Professionista+) — CLUSTER TIER COMPLETO**: nel dettaglio di un proprio POI, il professionista trova "QR business" che apre un QR stampabile (blu, punta a poilove.com/?poi=id) con nome del posto e download ad alta risoluzione. Collaudato in browser (bottone visibile al pro proprietario, modale, QR col poi id, download). Con questo TUTTI i 7 vantaggi tier sono reali e live: limiti ILLI per tier, spunta verifica, punti x2, POI in evidenza (tetto), Muro dei Sostenitori, itinerario in evidenza, adotta rotta, QR business. Live (v2.35).

- **v2.34 adotta una rotta (perk Professionista+)**: un professionista sostiene una rotta storica pubblica con una dedica visibile (mig 038: adopt_route/release_route RPC definer, colonne adopted_by/dedication protette). Nella lista rotte compare "Adottata da @utente: <dedica>" e un bottone Adotta/Rilascia per i tier idonei; la dedica appare anche nel popup della rotta sulla mappa. Collaudo e2e: pro adotta con dedica, join adottante ok, un altro pro non puo rubarla (already adopted), rilascio ok; TROVATO E CORRETTO un baco NULL (v_tier NULL not in (...) e NULL, non true: un free passava il controllo) con is null or not in. Live (v2.34). Resta 1 solo perk tier: QR business.

- **v2.33 itinerario in evidenza (perk Mecenate/Plus)**: stesso schema sicuro dei POI in evidenza (mig 037): colonna trips.is_featured protetta (revoca UPDATE + grant colonne, scrive solo la RPC), set_trip_featured con tetto per tier (Mecenate/Plus 1), badge "In evidenza" sulle card e toggle stella per i tier idonei. Aggiunte anche colonne adopted_by + dedication (pronte per "adotta una rotta"). Collaudo e2e: edit trip ok, is_featured diretto 403, RPC mecenate ok; in browser badge e toggle funzionanti. Live (v2.33). Restano 2 perk tier: adotta rotta, QR business.

- **Audit backend completo (workflow 22 agenti) + hardening (mig 034/035, v2.32)**. Verifica live: RLS su tutte le 28 tabelle, tutte le RPC SECURITY DEFINER col search_path, edge sane (illi-chat/admin-ai 401, place-enrich Google reale), flussi business collaudati (cessione POI, richiesta proprieta con embed_code, love, featured, tier, punti). L audit del codice ha trovato 12 problemi; distinti i veri dai falsi (i finding "official/enum" nascono da database/schema.sql VECCHIO: il DB vivo ha visibility text con official valido, i POI ufficiali funzionano). CORRETTI i veri: (1) colonne sensibili di pois (is_featured, love_count, is_approved, author_id) erano scrivibili in diretta dal client bypassando i perk e i controlli: ora revocate a livello colonna, si toccano SOLO via RPC/trigger definer (trigger love reso definer per continuare a funzionare); collaudato: edit normale ok, is_featured/love_count diretti 403, RPC featured/love ok. (2) tier nuovi professionista_plus/influencer ricadevano sui limiti AI free: aggiunti in config. (3) referral: un iscrizione confermava TUTTE le referral pendenti del referrer: ora ne conferma una sola. (4) category_requests: insert diretto anonimo illimitato tolto, solo via RPC. (5) place-enrich era un proxy Google aperto (chiunque con la anon key bruciava quota): aggiunto gate auth utente nell edge + client manda il token; Scoperto che bloccare gli ospiti svuotava la lente (la riserva OSM/Overpass e flaky): soluzione migliore e allineata al founder = rate limit PER IP (mig 036, rl_hit 150/ora) invece dell auth, cosi la lente resta piena di POI Google per TUTTI ma nessuno brucia la quota. **Deployato LIVE da me via Management API (place-enrich v10)**: niente comando per Alessandro. Verificato: ospite ottiene 20 POI Google, il limitatore conta per IP. Webapp v2.32 live.

- **v2.31 filtri POI + compliance tappa**: chip filtro (categorie + tag) nella lista POI, tocco e vedo solo quelli, combinati con la ricerca. Tolta la tendina dal nome della tappa itinerario (regola tendine-solo-sull-indirizzo). Collaudo e2e ok. Live (v2.31).

- **v2.30 Muro dei Sostenitori**: vetrina pubblica di chi ha un tier di sostegno, raggruppata per livello (Mecenate, Professionista Plus, Professionista, Influencer, Sostenitore) con le card nello stile del tier (avatar, nome, badge). Si apre dal popup livelli ("Vedi il Muro dei Sostenitori") con CTA "Unisciti a loro". Parte vuota finche non ci sono sostenitori; collaudato in browser assegnando 2 tier reali (Mecenate viola + Sostenitore blu, raggruppati giusti), poi tier rimessi a null. Live (v2.30).

- **Sprint pre-14/07 (nuova deadline: tutto perfetto per il 14 luglio) — cluster tier/featured + BACO GAMIFICATION**. v2.29: POI "in evidenza" (perk tier) con RPC set_poi_featured a tetto server-side (Sostenitore/Pro 3, Mecenate/Plus/Influencer 5, free 0), badge nel dettaglio e accento sul marker; 3 bandierine di stato (Ufficiale, In evidenza, Suggerito per autori Plus/Influencer/Mecenate); punti x2 per i tier che lo promettono (mig 032). Collaudo e2e reale: tetto rispettato (3 ok, 4° bloccato, slot liberato riapre), x2 verificato (professionista 20 pt vs free 10 su stesso POI). **BACO GROSSO trovato e risolto (mig 033)**: il trigger protect_gamification_columns azzerava OGNI aumento di punti fatto da award_points (perche arriva con un JWT) e annullava pure il cambio tier dell RPC admin (reset di special_tier non condizionato ad admin_op). Risultato: point_events accumulava (225 pt su 22 eventi) ma profiles.points restava a 0 per TUTTI, badge e livelli morti, e il pannello tier non attecchiva. Fix: punti modificabili solo con app.points_op='1' (impostato da award_points), tier solo con app.admin_op='1' (RPC admin); ricostruiti i totali dai point_events. Verificato che ora i punti salgono davvero via app. Deployato e live (v2.29).

- **Testi legali allineati alla realta (privacy + termini)**. Audit multi-agente (4 agenti: inventario reale dal codice, estrazione claim dai due doc, riconciliazione DPO) che ha confrontato i documenti (datati 27/06) con quello che l app fa DAVVERO al 06/07. Verdetto: ben scritti ma disallineati, non pubblicabili cosi. Gap piu grave: il media server media.poilove.com (processore foto esterno) del tutto assente dai destinatari, e una lista fornitori dichiarata "completa" che ometteva qrserver (che riceve lo username), ui-avatars, pollinations, tile ESRI/CDN/font, deep-link mappe; OAuth incompleti (mancavano Facebook e Apple); tier obsoleti (mancavano Professionista Plus e Influencer); novita non coperte (tag community, category_requests con user_id, cessione/reclamo POI, knowledge base ILLI). Applicati 12 edit chirurgici (7 privacy, 5 termini), data portata a 06/07/2026, deployati e verificati live (md5 identici, rendering confermato: 36 righe di tabella, 6 nuove righe fornitori, nuove sezioni presenti). Restano i nodi che solo un legale puo sciogliere (elencati in CONTRATTO): consenso lente pre-login verso Google, contratti SCC/DPF di trasferimento extra-UE, ruolo formale del media server, nomina DPO e rappresentante in Albania, dati di terzi. La nota "Bozza da validare" resta in testa ai documenti, correttamente.
- **NOTA per Alessandro**: i testi legali sono ancora SOLO in italiano (con nota che saranno in 3 lingue). La traduzione professionale SQ/EN conviene farla DOPO la validazione legale, cosi si traduce la versione definitiva una volta sola.

- **v2.28 knowledge base ILLI**. Tabella illi_knowledge (mig 031): voci curate dall admin (titolo, parole chiave, contenuto, lingua opzionale, attiva); RLS lettura pubblica delle attive + scrittura admin. Pannello admin: nuova sezione "Knowledge ILLI" con form (titolo, parole chiave, contenuto, lingua, attiva) e lista con modifica/elimina. Client (v2.28): la KB si carica al boot; quando la domanda a ILLI contiene una parola chiave di una voce attiva, la voce viene iniettata nel grounding come CONOSCENZE VERIFICATE (whitelist di fatti veri, prima dei luoghi OSM). Cosi ILLI sa cose che l AI generica non conosce, senza inventare. Collaudo e2e: inserita "Bunk Art 2" (parole chiave bunkart/bunker), la domanda "cosa mi dici del bunker a Tirana" fa match e inietta il fatto, "dove mangio una pizza" no. Voce di test eliminata. Webapp e panel deployati e verificati live (md5 identici, v2.28).

- **Fase finale, cluster tier+badge (pannello + v2.27)**. Trovato e corretto un baco DB: c erano DUE vincoli CHECK su special_tier in conflitto, l intersezione ammetteva solo sostenitore/mecenate, quindi impostare "professionista" falliva (mig 029: un unico vincolo con 5 tier). Nuova RPC sicura admin_set_user_tier (solo admin aal2, passa l anti-tamper, audita; mig 030): collaudata (non-admin respinto "not authorized", vincolo accetta i 5 tier e blocca gli inventati). Pannello admin: nella sezione Utenti il tier ora e un menu a tendina che cambia il livello all istante. Webapp v2.27: due nuovi tier renderizzati (Professionista Plus verde-teal, Influencer rosa-magenta) con badge, pitch e perk trilingui; badge UFFICIALE sui POI (sigillo oro nel dettaglio con la sottocategoria nell etichetta, e marker sulla mappa con anello oro + sigillo). Collaudato in browser (tier mostrati, POI ufficiale con sigillo e marker oro). Tutto deployato e verificato live (panel md5 identico, webapp v2.27).

- **Review code-quality (v2.22-2.25) + pannello categorie admin + v2.26 fix**. La revisione ha dato PRONTO CON RISERVE: 1 BLOCKER (XSS reale) + 3 MAJOR. BLOCKER: i suggerimenti tag e il selettore categorie costruivano i bottoni con onclick STRINGATO interpolando dati utente; le entity HTML nell attributo onclick vengono decodificate dal browser prima del JS, quindi un tag salvato come `x'"'"');codice;('"'"'` eseguiva codice arbitrario verso un altro utente. Riscritti entrambi con createElement + addEventListener + dataset (niente onclick stringato): collaudato con un tag malevolo, ZERO esecuzione, nessun onclick nel markup, il tag entra come testo puro. MAJOR corretti: window._pendingOpened azzerato a ogni ciclo auth (un secondo login nella stessa sessione non blocca piu l apertura del profilo/POI condiviso); commento obsoleto di sharePoiByKey; em dash tolto dal testo di condivisione. NIT enum verificato (benessere e lavoro esistono davvero). **Pannello admin: nuova sezione "Categorie"** (curation della tassonomia): triage delle richieste della community raggruppate per termine con conteggio, "Promuovi" che precompila il form categoria, creazione/modifica con macro+3 lingue+icona+colore+ordine, accensione/spegnimento categorie; scrive su poi_categories (mig 028: policy DELETE admin su category_requests). Panel deployato e verificato live. Webapp v2.26 live (md5 identico).

- **v2.25 condivisione proprietaria**: prima ogni condivisione apriva il menu di sistema del telefono (navigator.share) in 9 punti sparsi, con comportamento diverso e fuori dal brand. Ora c e UN solo foglio POI•LOVE: sezione "Community POI•LOVE" (Follower/Amici, visibile solo per i POI) e "Manda il link" (WhatsApp, Telegram, Email, Facebook, X, Copia via web intent, che l utente completa). Instradati TUTTI i 9 punti (dettaglio POI, lista, itinerario landing, luogo personale, lente, ILLI place card, contatto preciso dalla mappa, disambig). Tolto del tutto navigator.share (verificato: 0 occorrenze nel sorgente e nel live) e il bottone "Altro..." di sistema. Collaudo in browser: foglio unico apre da piu punti, community nascosta per le liste e visibile per i POI, WhatsApp genera l intent corretto senza menu di sistema. Live verificato (md5 identico, v2.25).

- **v2.24 tassonomia POI a 3 livelli (data-driven)**. L1 CATEGORIA ora e un set RICCO e curato: 29 sottocategorie trilingui (Ristorante, Pizzeria, Bar/Caffe, Hotel, B&B, Museo, Parco, Spiaggia, Negozio, Benessere/Spa, Locale/Notte...) in una TABELLA (poi_categories, mig 026), non piu array hardcoded: si aggiornano senza toccare il codice. Nel form il finto "0/3 categorie" e sostituito da un selettore a scelta SINGOLA, raggruppato in 6 famiglie con icone e colori. La categoria macro (enum) resta stabile; la sottocategoria fine va nella nuova colonna pois.subcategory. L3 TAG: la colonna tags[] esisteva ma non veniva MAI salvata, ora si salva davvero, con AUTOCOMPLETE dai tag gia usati dalla community (RPC suggest_tags) e niente duplicati; i tag entrano nella ricerca (lista POI e mappa). Autoaggiornamento data-driven: "Altra categoria" e le richieste lasciano una traccia in category_requests (RPC log_category_request, anche da ospite) che l admin analizzera per promuoverle. **Collaudo end-to-end VERO** con utente usa-e-getta: picker con 6 gruppi e 29 voci, Pizzeria selezionata, tag preso dall autocomplete (storico) + tag manuale, POI salvato e riletto a DB con category=cibo, subcategory=pizzeria, tags=[romantico,storico,forno a legna]; richiesta "spiaggia per cani" registrata. Utente e dati eliminati. Live verificato (md5 identico, v2.24). Resta la UI admin per curare le categorie proposte.

- **v2.23 review avversariale del giorno: 16 difetti confermati, tutti corretti**. Squadra di 24 agenti (4 revisori + verifica scettica di ogni finding, 4 confutati). Il piu grave: il fix del love atomico era agganciato a una funzione MORTA, il bottone vero usava ancora il vecchio percorso, e sui POI degli altri il contatore non si salvava affatto (bloccato in silenzio dalle RLS): ora il bottone vivo chiama la RPC e il collaudo incrociato vero (utente B che lovva il POI di A dal bottone) da 0 a 1 a 0 anche a DB. Gli altri: XSS da attributo nelle miniature liste (escape completo), love possibile ai bannati via SECURITY DEFINER (mig 025: blocco is_active + search_path blindato), policy anti-bannati mai arrivate su poi_lists (il loop della 012 puntava alla tabella inesistente), selezione liste azzerata dal refresh token col form aperto, pending POI cancellato entrando da ospite (funnel rotto) e CTA morta in guest mode, riordino liste con salvataggi sovrapposti (ora in coda), pending senza scadenza (ora 7 giorni) e doppio modal possibile, query teaser che scaricava comunque nome e coordinate (ora select minimale), tagline e tooltip non tradotti, 2 funzioni morte rimosse. Tutto deployato e verificato live (md5 identico, v2.23).

- **v2.22 box foto fluidi**: i 3 riquadri foto del form Crea POI erano fissi a 350px (enormi, sbordavano dalla spalla con uno scroll orizzontale scomodo). Ora sono un terzo della larghezza del pannello ciascuno, quadrati, e si adattano da soli al ridimensionamento. Misurato dal vivo: spalla 626px, box 184px; telefono 375px, box 105px; mai overflow.

- **v2.21 love atomico + 2 difetti audit trovati e corretti**: il toggle love faceva 4 query separate (due tocchi simultanei perdevano love) e usava una chiamata RPC malformata. Ora un unica RPC transazionale `toggle_love` (mig 023): il contatore e sempre il conteggio vero, solo utenti loggati (anonimo respinto 42501, verificato). Collaudando ho trovato: 1) ogni love scriveva una riga di audit perche love_count era tra i campi sensibili (rumore infinito), 2) eliminare un utente con anche una sola riga di audit era IMPOSSIBILE (admin_id NOT NULL + FK SET NULL). Mig 024 corregge entrambi. Test REST reali con utente usa e getta: love on 1, love off 0, anonimo respinto. Live verificato (md5 identico, v2.21).

- **v2.20 POI dentro le liste (e bug grosso trovato)**: la webapp interrogava la tabella `list_pois` che NON è mai esistita (quella vera si chiama `poi_lists`): per questo i conteggi delle liste erano sempre a zero e nessun POI si poteva collegare. Corretto il nome ovunque. Ora il dettaglio lista mostra i POI VERI (miniatura, nome, indirizzo), con: aggiunta dal picker dei propri POI, riordino con le frecce (persistito a DB, migrazione 022 con la policy UPDATE che mancava), rimozione, e tocco che apre il POI sulla mappa. I chip "Aggiungi a una lista" nel form di creazione ora salvano davvero il collegamento. Bonificati 3 duplicati di chiavi di traduzione. **Collaudo end-to-end VERO** con utente usa-e-getta: 2 POI + 1 lista creati, aggiunti dal picker (conteggio 0→1→2), riordino persistito dopo ricarica dal DB, rimozione (2→1), tocco che apre la scheda, conteggio card allineato, chip con id nel form. Utente e dati di prova eliminati. Live verificato (md5 identico, v2.20 nei footer).

- **v2.19 landing personale del profilo**: chi apre `poilove.com?@nome` (o /@nome) da sloggato non vede piu il login nudo: vede la vetrina della persona a tutto schermo (copertina scelta come sfondo, avatar, nome, @handle, bio, numeri veri di POI pubblici e love, bottone "Entra in POI•LOVE" nelle 3 lingue). Dopo il login il profilo si apre da solo (handle in localStorage, regge il giro OAuth); da ospite pure, perche il profilo pubblico e visibile anche senza account. Collaudato in browser: vetrina con 5 POI e 1 love, CTA che scopre il login, ingresso ospite che apre il profilo giusto. Live verificato (md5 identico, v2.19 nei footer).

- **v2.18 menu e lente su richiesta**: "Segna un luogo" rinominato "Crea POI" e messo al primo posto del menu +, Lente di ingrandimento al secondo, nelle 3 lingue. Tolto il long-press sulla mappa che apriva la lente da sola dopo 300ms: ora la lente si apre SOLO quando la chiedi (menu + o "Tocca mappa" nella creazione POI). Verificato in browser: long-press simulato non la apre, dal menu si apre. Live verificato (md5 identico, v2.18 nei footer).

- **v2.17 teaser condivisione POI**: chi apre un link `?poi=<id>` da sloggato non vede più solo il login: vede una card misteriosa sopra (foto del posto SFOCATA con lucchetto, categoria e zona senza via né civico, conteggio love, bottone "Registrati e scoprilo" nelle 3 lingue). Il nome e il punto esatto restano nascosti. L id resta in localStorage: dopo il login il POI si apre da solo, anche se la registrazione passa dal giro OAuth che perde i parametri URL. Da ospite il gate resta (niente auto-rivelazione). **Collaudo end-to-end VERO**: utente usa-e-getta creato, login in pagina, POI "Opa" aperto da solo con teaser chiuso e chiave pulita; utente eliminato. Live verificato (md5 identico, v2.17 nei footer). Commit di questo giro.

- **v2.14**: menu "+" riordinato con la Lente di ingrandimento al primo posto, lente e mappa precaricate all'avvio con zoom medio-largo (14); frecce della ghiera incise a 3 passate con punta grande.
- **v2.15**: ricerca con correzione avanzata: normalizzazione accenti/ç/ë, tolleranza refusi fino a 2 lettere (fuzzy+Levenshtein), "Forse cercavi" istantaneo su un dizionario di luoghi albanesi, Albania sempre prima nei risultati (Nominatim countrycodes=al prima del resto), rotte storiche cercabili. Commit `9f82b3a`.
- **v2.16**: "Sono qui: crea POI" rimosso dal menu "+" (il POI si crea dalla lente con "Salva il POI"); lente NERA al posto del grigio che non si vedeva: ghiera, mirino e campana in nero quasi pieno, faccette della zigrinatura chiare sul nero, frecce orario/antiorario e segni +/− BIANCHI nitidi come le marcature degli obiettivi fotografici. Verificata in browser (screenshot ok) e live (md5 identico, versione nei footer). Commit `2d65e85`.

## Sessione 04/07/2026 — Review avversariale completa: 51 fix confermati, TUTTO deployato e verificato live

Review multi-agente su tutto il sistema AI e creazione POI (6 revisori paralleli + verifica avversariale di ogni finding: 51 confermati, 1 confutato). Tutti corretti, deployati, verificati dal vivo. Commit `34d797c` (pannello+edge+migrazioni) e `57984f5` (webapp), tag `checkpoint-2026-07-04`.

- **Sicurezza chiave OpenAI**: la vecchia chiave esposta in `poilove.com/config.js` era GIA MORTA (verificato live: OpenAI risponde 401; quasi certamente revocata dallo scanner anti-leak di OpenAI, da cui il "ha smesso di funzionare dopo 3 centesimi"). File svuotato sul server (ack di Alessandro) e verificato. La chiave viva (`sk-...xW0A`) sta SOLO nei secrets Supabase: non serve ruotarla, non serve toccarla.
- **Edge `illi-chat` blindata e deployata**: auth JWT obbligatoria (verificato live: 401 senza login), limiti giornalieri per tier applicati (RPC `increment_ai_usage` + config `ai_limits_per_tier`), status HTTP veri (fine dei 200 finti mascherati da "Nessuna risposta."), storia sanitizzata (il campo `places` rompeva OpenAI dal 2° turno), timeout 20s.
- **Webapp (22 fix, deployata)**: EXIF ora compila campi VISIBILI (la causa del "non prende i dati" era il pannello display:none); stato posizione `currentLocLatLng` (stop alle coordinate finte di Tirana o ereditate dal POI precedente; salvataggio bloccato senza posizione reale); toast onesti per foto senza GPS e da fotocamera in-app; fallback CDN exifr; `aiSummarize` usa i dati reali del posto e non cancella MAI gli appunti dell'utente; auto-suggerimento nome+categoria appena c'è la posizione; ILLI con token di sessione su tutte le chiamate (`_aiAuthHeaders`), errori 401/429 tradotti e mai salvati in storia, grounding ereditato solo sui follow-up, geocoding della città nominata nella domanda, timeout allineati; rimossi config.js/_groqKey dal client.
- **Edge `admin-ai` (10 fix, deployata)**: loop non muore più su finish_reason; regex intento con boundary veri; sintesi finale a MAX_ROUNDS; descrizione (>=40 char) e coordinate OBBLIGATORIE nel validatore delle proposte; retry provider con backoff; fallback senza proposte duplicate; tetto spesa fail-closed; parità proattiva Anthropic.
- **Pannello admin (10 fix, deployato)**: sezione "POI creati" LIVE (vedi/modifica/pubblica/elimina + filtri AI/ufficiali/bozze); storico chat copilota persistente; `title` al posto di `name` in createPoi (prima la creazione manuale falliva SEMPRE); categorie form allineate all'enum reale (prima erano inglesi, insert impossibile); visibility `official`; rilevamento falso successo RLS; proposte pending recuperabili al reload.
- **DB**: migrazioni **015** (ai_chats + policy admin su pois) e **016** (apply_ai_proposal robusta: tetti caratteri, coordinate obbligatorie, risoluzione link sicura, audit title; trigger updated_at; ai_daily_usage + RPC testata; audit modifiche sensibili POI) **APPLICATE e verificate con query**.
- **Nota di processo (ultimatum)**: la frustrazione nasceva dal pannello nuovo MAI deployato dalla sessione precedente, interrotta a metà giro. Regola permanente (memoria `regole-di-ferro`): ogni modifica chiude il giro scrivi→valida→deploya→verifica live, e gli stati a metà si dichiarano SEMPRE qui.
- **Limite onesto**: il percorso autenticato (ILLI da utente loggato, copilota con MFA) non è collaudabile da terminale: serve il collaudo di Alessandro (checklist consegnata in chat).
- **Collaudo totale automatico (stesso 04/07, commit `f078167`)**: superficie live tutta 200 (webapp, admin, panel, privacy, terms, project) con live=repo bit per bit; CORS preflight OK su entrambe le edge; DB sano (RLS ovunque tranne la tabella di sistema PostGIS, 4 RPC, 3 trigger, zero proposte bloccate, zero POI monchi). **Test end-to-end VERO con utente usa-e-getta**: signup → login → ILLI risponde (200) → contatore segna 1 → limite forzato a 10 → 429 daily_limit → non-admin respinto da admin-ai (403) → utente distrutto e pulizia verificata. Webapp avviata in browser reale: zero errori console, guard posizione verificato dal vivo ("Imposta prima la posizione"), ILLI da sloggato mostra "Accedi per usare ILLI". Bonus: eliminati i 16 trattini lunghi dalle stringhe visibili (regola del founder), rideployata e verificata.
- **Secondo giro qualità (code-quality, stesso 04/07, commit `a7ba1f8`)**: verdetto PRONTO CON RISERVE → riserve chiuse e rideployate tutte: check aal2 dell'edge copilota reso FAIL-CLOSED (prima un errore di parsing del JWT faceva passare senza secondo fattore), quota ILLI rimborsata se OpenAI fallisce (mig 017 `decrement_ai_usage`, applicata e testata), categoria delle proposte normalizzata sui 12 valori enum (la card mostra ciò che finisce davvero a DB), rimosso dal pannello il percorso morto `createRouteFromAi` che poteva scavalcare la coda approvazioni. Un finding del revisore (off-by-one sul limite giornaliero) verificato e SMENTITO: il limite è esatto, aggiunto commento anti-equivoco. Verifiche live: entrambe le edge 401 senza token, pannello live senza bypass.

- **Titolo intelligente del luogo + versione 2.00 (stesso 04/07, commit `7deb621`, LIVE)**: nella creazione POI la riga blu e il pannello posizione non mostrano piu la via ma il POSTO vero: nuova `_smartPlaceTitle` (OSM doppio raggio: 80m locale preciso, 400m grande struttura tipo aeroporto/mall/stazione/museo), titolo composto "Locale · Struttura" o "Interno Struttura", trilingue. Verificata in browser sul caso reale del founder (lounge aeroporto Tirana): "Lahuta · Tirana International Airport Nënë Tereza". Versione app ufficiale v2.00 visibile nel footer del login e nella brand strip (costante APP_VERSION, unica fonte).


## Sessione 05/07/2026 (mattina) — Titoli in lingua, stop tendina sul nome, CONTRATTO.md

Feedback di Alessandro dal collaudo live (aeroporto di Tirana). Commit `33bb50f`, tutto deployato e verificato.

- **Titoli nella lingua dell'app**: il titolo intelligente ora sceglie name:it / name:sq / name:en da OSM in base alla lingua, e tra i candidati vince chi HA il nome tradotto. Verificato in browser: "Lahuta · Aeroporto Internazionale di Tirana Madre Teresa" (prima usciva in inglese).
- **Tendina sul campo NOME rimossa (deprecata per regola del founder)**: le scelte a tendina esistono SOLO sull'indirizzo (ricerca manuale). Era la causa dei suggerimenti folli dal Kosovo: il prefill "Lahuta" riapriva la ricerca Nominatim globale. onNameInput ridotta a validazione, markup e handler eliminati.
- **suggestPoiName** ora propone il titolo contestuale intelligente come prima scelta (non piu la prima parola secca), nomi vicini solo come ripiego; categoria sempre dal tipo OSM.
- **Mini-mappa del punto POI (commit successivo, LIVE)**: nello sheet "Salva questo posto", tra i riferimenti del luogo e le foto, mappa interattiva larga tutta (180px mobile / 230px desktop), pallino rosso brand, pinch-zoom e trascinamento; appare quando c'e una posizione reale, si nasconde su nuovo POI, segue anche il flusso modifica. Verificata in browser (tile+marker+show/hide).
- **Mini-mappa strumento attivo (LIVE)**: si apre SUBITO nello sheet anche senza posizione, centrata sul GPS o sul centro mappa; mirino al centro, bottone "Fissa il punto" in alto a destra che geocodifica il centro e compila tutti i riferimenti (verificato in browser: Skanderbeg → coordinate+indirizzo+marker). Versione v2.00 anche nel footer nero della mappa. 3 lingue.
- **LENTE ESPLORATORE, v2.04 (LIVE)**: dentro il cerchio ora c'e una vista IBRIDA a colori (stradale sotto + satellite Esri sopra al 40% di trasparenza + etichette nitide, via il filtro grigio); i PUNTI DI INTERESSE REALI compaiono dentro la lente (OSM raggio adattivo allo zoom, pallini colorati per tipo + etichette per gli 8 piu vicini + cuoricini POI•LOVE); NUOVO GESTO: sfiorando il bordo tondo in senso orario lo zoom si rafforza, antiorario si allontana fino a livello mondo (~5 livelli a giro completo, badge di feedback); il titolo della lente usa il titolo intelligente; "Tocca mappa" ora APRE LA LENTE sul punto e il bottone diventa "Usa questo punto": conferma la posizione nel form gia aperto SENZA toccare i campi scritti. Bug trovato al collaudo e corretto: una risposta Overpass fallita veniva messa in cache e la lente restava vuota. Verificato in browser: 3 strati, zoom anello 4-19, 9 punti reali con 8 etichette su Skanderbeg, screenshot.
- **Correzione di ricerca avanzata + contesto Albania, v2.15 (LIVE)**: motore fuzzy locale (accenti ignorati, refusi fino a 2 lettere per parola, prefissi, parole estranee respinte) su POI propri e ROTTE STORICHE (ora cercabili dalla barra); Nominatim con chiamata dedicata all'ALBANIA in testa + mondo in coda (dedup); "Forse cercavi" ISTANTANEO da gazetteer albanese (citta', Blloku, Skanderbej...) prima di qualsiasi AI. Verificato in browser: tirna->Tirana, blloko->Blloku, "tirana storca" trova la rotta.
- **Frecce INCISE davvero, v2.14 (LIVE)**: via l'effetto adesivo nero appoggiato: incisione a 3 passate (ombra sul bordo alto del solco, filo di luce sul bordo basso, fondo quasi nero ben visibile) su frecce, punte e segni +/-. Verificata con screenshot.
- **Lente nel menu +, precaricata, v2.13 (LIVE)**: prima voce del menu + e' ora "Lente di ingrandimento" (icona viola), "Sono qui: crea POI" scala al secondo posto; la lente si apre sulla posizione con zoom MEDIO-LARGO gia' impostato (14: la ghiera ha strada in entrambe le direzioni) e viene PRECARICATA al boot (istanza + tile scaldate con overlay invisibile): la prima apertura e' istantanea. Verificato in browser: istanza viva prima dell'apertura, ordine menu, zoom 14 esatto.
- **Rotte Storiche vive, v2.12 (LIVE, mig 021 applicata)**: le rotte pubblicate sono PUBBLICHE (verificato da anonimo via REST) e l'admin le governa tutte; seminata la prima rotta VERA "Tirana Storica" (5 tappe reali: Skanderbeg, Et'hem Bej, Torre dell'Orologio, Bunk'Art 2, Kalaja); webapp: via la polyline demo, le rotte vere si disegnano sulla mappa (linea viola + tappe numerate) e compaiono nel tab Itinerari>Rotte con "Vedi sulla mappa" (il "presto disponibili" sparisce da solo); pannello: sezione Rotte Storiche completa (crea bozza, pubblica/nascondi, tappe con aggiungi/elimina, rinomina, elimina). Bug trovato al collaudo browser e corretto: il caricamento rotte era chiuso dietro il login, ora parte per tutti al boot.
- **Foto libere dei luoghi (Wikimedia), v2.11 (LIVE, mig 020 applicata)**: per i luoghi noti il form propone LA foto rappresentativa dell'articolo Wikipedia (coerente e a licenza libera): chip con anteprima + "Usa", se accettata diventa la principale; nel dettaglio ogni foto Wikimedia porta il credito "CC · Wikimedia" che linka la pagina Commons (attribuzione); il copilota admin allega la foto da solo alle proposte e l'approvazione la salva nel POI (mig 020). Verificato in browser: Skanderbeg trova la foto vera di Commons, chip funziona, credito presente, derivazione pagina corretta anche dalle thumb. Limite onesto: il giro copilota+approvazione con foto lo collauda Alessandro (MFA).
- **Claim proprieta' POI a pagamento, v2.10 (LIVE, mig 019 applicata)**: "Reclama questo luogo" sul dettaglio dei POI altrui (utenti loggati); solo i TIER PAGANTI passano (il free riceve il messaggio onesto e gli si aprono i livelli, upsell gentile); pratica con codice PLB-XXXX-XXXX; ALLARME in admin (Moderazione) con codice embed iframe copiabile, nome richiedente, nome cedente, messaggio, Approva-e-trasferisci/Rifiuta via RPC; badge sidebar somma segnalazioni+richieste. BONUS: sistemato il CHECK obsoleto su special_tier che RIFIUTAVA 'professionista' (ora 4 tier ammessi, incluso professionista_plus futuro). Collaudo end-to-end reale: free respinto, pagante ok (PLB-Q6U5-E3YS), doppione respinto, non-admin respinto; gating browser su anonimo/proprietario/non-proprietario tutto verde. Limite onesto: l'approvazione dall'admin la collauda Alessandro (serve MFA).
- **Frecce piene + zoom istantaneo, v2.09 (LIVE)**: frecce piu spesse quasi nere con PUNTE GRANDI (prima quasi assenti); lo zoom dell'anello ora risponde ai primi gradi (passo 0.25, sensibilita ~9 livelli/giro, fascia tocco piu larga, vibrazione al passo dove supportata). Verificato in browser: 12 gradi antiorari muovono gia lo zoom (19 -> 18.75), quarto di giro = 2.5 livelli.
- **Ghiera raffinata con frecce incise, v2.08 (LIVE)**: zigrinatura piu fine e realistica (144 faccette, 72 creste sottili, luce del metallo dall'alto, bordi incisi) e al posto dei segni secchi due FRECCE INCISE lungo la ghiera: oraria che finisce sul +, antioraria sul -, effetto incisione a doppia passata (scuro + filo di luce). Screenshot verificato.
- **Ghiera zigrinata stile orologio, v2.07 (LIVE)**: via tacche bianche e cerchietti (giudicati orrendi dal founder), la ghiera ora e' zigrinata come il bordo di un quadrante: 72 faccette alternate luce/ombra sul grigio brand, bordi incisi, + e - incisi discreti. Screenshot di verifica in browser.
- **Scheda pulita + il POI ha un NOME SUO, v2.06 (LIVE)**: aprendo qualunque scheda il menu del + si chiude (prima le pillole flottavano sopra la scheda, screenshot del founder); il titolo del POI si rinomina IN LOCO dal proprietario (matita nella fascia rossa, autosave, mai vuoto); la riga indirizzo non resta mai vuota (reverse geocode al volo + autosave silenzioso se proprietario); REGOLA DURA: mai la via o la citta come nome del POI, salvataggio bloccato con messaggio trilingue (verificato in browser: "Via Ca' Nova" e "Zugliano" respinti) e il suggerimento EXIF non precompila piu il campo col nome della strada.
- **Ghiera visibile + punti Google nella lente, v2.05 (LIVE)**: la ghiera dello zoom ora SI VEDE (48 tacche da obiettivo attorno al bordo, segni + e -, suggerimento trilingue al primo uso); i punti di interesse della lente arrivano da GOOGLE (place-enrich mode nearby, Places v1 searchNearby per POPOLARITA', lingua dell'app, ordinati per recensioni, chiave sempre server-side) con il voto nella etichetta (es. "Bunk'Art 2 ★4.3"), OSM resta come riserva se Google tace. Verificato live: Skanderbeg → Piazza ★4.5 (13827 rec.), Bunk'Art 2, Toptani, Castello, Moschea Et'hem Bej; in browser 20 punti, 48 tacche, screenshot.
- **POI del proprietario: modifica con AUTOSAVE + codice di migrazione, v2.03 (LIVE)**: quando il POI e' tuo, dalla scheda modifichi foto (max 3, upload WebP sul media server, mai base64 nel DB, rollback se l'upload fallisce) e descrizione (INLINE nella fascia rossa, matita + contatore 200, salvataggio automatico con verifica righe); azioni visibili solo al proprietario. Mig 018 APPLICATA e collaudata end-to-end con 2 utenti veri: generate_poi_transfer_code (solo owner/admin, PL-XXXX-XXXX, 30gg, nuovo codice revoca il vecchio) + redeem_poi_transfer_code (uso singolo, trasferisce author_id, audit): A genera, B riscatta, proprieta' passata, riuso rifiutato, ex proprietario rifiutato. UI: bottone "Cedi il POI" nella scheda + "Riscatta codice" nel profilo, 3 lingue. Scoperto e aggirato nel collaudo: profiles_username_check limita lo username a 30 caratteri (email lunghe in signup falliscono, nota per il futuro).
- **Titoli informativi + descrizioni sui FATTI, v2.02 (LIVE)**: il titolo dice cos'e il posto (etichetta tipo OSM in lingua: "Ristorante Lahuta · Aeroporto..."), con guardia anti-doppione. Motore descrizioni rifatto: _gatherPoiFacts raccoglie tag OSM ricchi (orari, cucina, costi, wifi, asporto), struttura contenitore, estratto Wikipedia (CORS origin=*) e Google (voto, recensioni, fascia prezzo, aperto ora) via place-enrich; prompt severo (cosa/costi/come funziona, lista parole vietate, niente inventato), temperatura 0.9->0.4. Verificata la pipeline in browser su Sheshi Skenderbej (Wikipedia + Google 4.5/13827 + aperto ora). Il testo finale AI va collaudato da Alessandro loggato.
- **Scheda POI: striscia foto adattiva (LIVE)**: niente piu linguette vuote nel dettaglio POI. Zero foto = fascia bassa con solo il + nel cerchio bianco in alto a destra; 1 foto = piena larghezza (16:9); 2 = 50/50; 3 = 33/33/33; il + resta finche c'e posto, cancellando una foto le altre si allargano. Verificato in browser (classi n0-n3 e flex-basis calcolati).
- **CONTRATTO.md creato**: la traccia madre chiesta da Alessandro, ogni passo per settore con stato e tempistiche, da aggiornare a ogni giro insieme a SAL e TODO.

## Sessione 28/06/2026 (sera e notte) — ILLI, Itinerari, profilo, fix vari + TODO riscritto

Sessione lunghissima, tutto deployato e verificato dal vivo. Commit fino a `ae70c35`.

- **Itinerari: Liste → Rotte Storiche**. Sub-tab Liste rimosso (le liste sono gia nei POI), al suo posto Rotte Storiche con intro tematica + badge "presto disponibili", 3 lingue SQ/IT/EN.
- **Fix AI suggerimenti POI**: il "suggerisci nome" ora legge i locali reali da OSM (`_realNamesNear`) invece di inventare dal nome della via (caso "Contra della Ceramica" → "Pizzeria Scaligera"); la descrizione AI non allucina piu. Verificato dal vivo.
- **ILLI cerca davvero**: il grounding eredita la categoria dai messaggi precedenti (`_lastPlaceCatFromHistory`), i follow-up ("E domani?") continuano a cercare posti reali; il prompt vieta lo scarica-barile e le risposte vaghe. Verificato che il contesto si eredita.
- **Profilo snellito**: fascia "Come mi vedono" piu sottile; rimosse Le mie liste, Le mie rotte storiche, I miei tag; restano Connessioni e I miei POI. Handle apre solo la modifica handle (non piu "Diffondi"); handle sempre slug pulito (minuscolo, niente %20), il nome resta come scritto; la statistica "Liste" porta ai POI/Liste.
- **Mega-ricerca nel tab POI**: ogni riga ha `data-search` con nome+categoria+indirizzo+citta+descrizione+tag; `_poiSearch` cerca li dentro. Verificato dal vivo.
- **Termini/Privacy nel footer**: pulsanti bianchi ai lati del logo nel footer nero della mappa, e a pie di pagina nella schermata di accesso.
- **TODO.md riscritto** ordinato e prioritizzato.
- **(notte fonda, in autonomia)** indirizzo POI **Albania-first** (Nominatim, risultati AL per primi); **estetica pannello admin ONLINE** (icone Phosphor ovunque + tema chiaro crema morbido/scuro con interruttore sole-luna, persistito); **copilota AI agentico PROGETTATO** (tool use nativo, proposte con approvazione umana, 5 poteri: query_data/historic_analysis/propose_poi/propose_historic_route/propose_project) + **migration `014_ai_copilot.sql` PRONTA nel repo ma NON applicata** (tabella ai_proposals, pois.is_approved/visibility 'official', trips.is_historic, RPC apply_ai_proposal; tocca pois/trips → serve OK). Design completo in scratchpad `copilota_design.md`.

**Catturate (memoria `admin-phase2-requirements`, `poi-location-and-lens`):** switch tier da admin, tier Professionista Plus, livello Influencer (badge colore nuovo); schermata POI "dove si trova" (GPS, EXIF prima foto, tocca-mappa→lente, lente che intercetta i POI da OSM/Google; TripAdvisor/Facebook senza API pubbliche).

**Prossimo grande lavoro (con Alessandro sveglio, e critico):** implementare il copilota agentico (applicare mig 014 + edge admin-ai con tool use + UI proposte nel panel).

**Design fissato (NON ancora implementato), in memoria `poi-share-and-integrations`:**
- Condivisione POI = teaser misterioso (zona + immagine AI + CTA; niente titolo/foto/indirizzo reali fino alla registrazione).
- Landing profilo personale (sfondo + avatar + "Entra in POI•LOVE"), generata per ogni profilo.
- Sistema email admin + AcumbaMail (template + webhook), primo mattone del middleware.
- SOS sanitario = progetto a se (delicato, da non improvvisare).

## Sessione 27/06/2026 — Pannello admin, MFA forte, legali aggiornati, fix AI suggerimenti POI

Giornata molto densa. Tutto deployato e verificato dal vivo. Commit chiave fino a `4ddb78b` su origin/main.

**Pannello admin (`admin.poilove.com`) costruito da zero e messo online**

- Sottodominio `admin.poilove.com` creato su Plesk: vhost, SSL Let's Encrypt, `.htaccess` no-cache. DocumentRoot `/var/www/vhosts/poilove.com/admin.poilove.com/`.
- Login (`admin/index.html`): estetica "cammino" (immagine evocativa, card glass), trilingua IT/SQ/EN, accesso con Google OAuth (nessuna password). URL `admin.poilove.com` autorizzato negli allowed-redirect Supabase.
- Database: migration `012_admin.sql` applicata. Introduce: ruolo `is_admin` sui profili, stato moderazione utenti, tabelle `reports` e `admin_audit_log`, limiti AI per tier in `gamification_config`, RLS solo-admin via funzione `is_admin()` SECURITY DEFINER, trigger anti-tamper esteso, RPC `admin_set_user_status`, funzione `is_active()` con policy RESTRICTIVE che rende il ban davvero efficace sul lato data API. Alessandro (it@altrostile.app) promosso admin.
- Proxy AI sicuro `admin-ai` (Edge Function) deployato: gate `is_admin` + `aal2`, tetto di spesa giornaliero, supporto Claude e gpt-4o, `service_role` mai esposta al client.
- Pannello `admin/panel.html` a 7 sezioni: dashboard KPI, moderazione, utenti, limiti AI, copilota Claude, crea POI/percorsi, audit log. XSS neutralizzato, gate `aal2` su tutte le chiamate privilegiate.

**MFA forte attiva e verificata dal vivo**

- Migration `013` applicata: `is_admin()` ora richiede `aal2` (secondo fattore), enforcement lato server.
- TOTP authenticator: enroll via QR nel pannello, confermato dall'utente con codice reale, verificato dal vivo.
- Biometrico WebAuthn: predisposto nel client (codice pronto), ma il dashboard Supabase ha restituito 422 all'abilitazione. Resta da abilitare quando Supabase espone correttamente l'API (azione manuale nel dashboard).

**Legali aggiornati e online**

- `poilove.com/privacy` e `poilove.com/terms` aggiornati al 27/06: aggiunti sub-responsabili del trattamento (Google Places, OpenAI, Anthropic, Supabase), sezioni moderazione, abbonamenti, trasferimenti internazionali, conformi legge AL 124/2024 e GDPR. Resta il disclaimer "bozza da validare da un legale" prima del lancio pubblico.

**Fix bug AI suggerimenti POI (deployato su poilove.com)**

- Il "suggerisci nome" non inventa più dal nome della via: ora cerca i nomi reali dei locali vicini su OpenStreetMap via `_realNamesNear` (caso "Contrà della Ceramica" che suggeriva un nome finto per una pizzeria).
- Il prompt della descrizione AI vieta esplicitamente di inventare fatti e di farsi influenzare dall'indirizzo. Verificato dal vivo: suggerisce "Pizzeria Scaligera".

**Cosa resta (prossime sessioni)**

- Admin FASE 2 (vedi TODO): icone Phosphor duotone ovunque nel pannello, tema chiaro/scuro, rotte storiche, badge elementi ufficiali, tier Professionista Plus nuovo, area knowledge base AI, pannello multi-provider AI, POI ufficiale con badge, categorie più richieste.
- Biometrico WebAuthn: da abilitare nel dashboard Supabase quando l'API lo supporta.
- Presentazione `project.poilove.com` da aggiornare con screenshot delle novità per la demo del 1/07.
- Validazione legale di Privacy e Terms con un consulente prima del lancio del 17/08.

---

## Sessione 26/06/2026 — ILLI con voti Google, sicurezza chiavi, Privacy/Terms, liste e luoghi personali

Giornata molto densa, ~19 commit, tutto deployato e pushato.

**ILLI•AI (qualità della ricerca, il cuore della demo)**
- **Voti Google reali**: Edge Function `place-enrich` (proxy a Google Places API New, chiave segreta server-side) porta voto medio, numero recensioni, fascia prezzo, stato apertura, descrizione (`editorialSummary`) e tipo in chiaro. Ordina per qualità reale. Live `3e580db`.
- **Match sbagliati filtrati** (`85c4a8a`): `_googleMismatch` scarta i match in cui Google restituisce una via (tutti i campi null, es. "Via Ca' Nova") o un'attività di tipo incoerente (gioielleria al posto della pizzeria, caso "Leon d'oro"). `_localPoiPlaces` filtra i POI•LOVE per pertinenza.
- **Filtro categoria + cucine etniche** (`8862ba8`, `4d63c91`): "voglio mangiare sushi" non cade più su "ristorante"; messicano/cinese/indiano/thai/kebab/hamburger con raggio largo (fino a 35 km); ILLI dice onestamente "il più vicino è a 8 km" invece di rifilare ristoranti a caso.
- **Box ridisegnato**: icona per tipo reale (nigiri sushi, peperoncino messicano, pizza, forchetta), voto+prezzo+distanza+stato, descrizione vera senza ripetere il voto. Output a prosa pulita (niente R1/R2, emoji, markdown, inglese misto).
- **Memoria chat persistente** (`fa806ef`): la storia conserva testo **e** risultati (le card dei posti) dopo il reload, con le azioni che puntano al posto giusto.
- **Proxy ILLI** (`c9f7fa9`): le chiamate al modello passano per la Edge Function `illi-chat`, chiave OpenAI come segreto server-side (prima pubblica in `config.js`).

**Sicurezza (era messa male)**
- Chiave Google Maps rimossa dai file e **revocata** lato Google (era nel repo pubblico). `8b62ae1`.
- `.htaccess` che blocca i file interni del repo (CLAUDE.md, sorgenti, deploy.php) dalla docroot pubblica di poilove.com. `35c8ccd`.

**Legale**
- Privacy Policy e Terms of Service **live** su `poilove.com/privacy` e `/terms` (`d9ffb36`): bozze conformi legge AL 124/2024 + GDPR, generate col caso Agi-Kons come checklist anti-violazioni. RESTANO da far validare da un consulente legale prima del lancio.

**POI e liste**
- Cassaforte: dalla lista POI un pulsante manda un POI in un luogo personale.
- Luoghi personali come **scorciatoie** (SPECS, `ff790d6`): tocco categoria → ci vai / scegli / cerchi tra i tuoi POI per assegnarne uno. Card a doppia colonna. Prima icona = "Vai verso" (navigatore); "rimuovi" chiarito (toglie solo la scorciatoia, non il POI).
- **Ricerca interna** nella lista POI (Miei/Loved/Vicini) per nome e indirizzo (`c48859f`).
- **Quarto sub-tab "Liste"** dentro POI (`e827cf1`): riusa il sistema liste esistente (crea, visibilità privata/pubblica/compagnia, condividi, elimina), con conteggio POI e ricerca.

**Limite noto da chiudere (primo punto della ripresa)**: aprendo una lista, il dettaglio non mostra ancora i POI dentro (non carica i `list_pois`).

---

## Sessione 24/06/2026 (parte 5) — Fix popup/handle + i18n completo

- **Fix z-index popup**: stacking dinamico via MutationObserver; l'ultimo overlay/sheet aperto va sempre sopra. Confirm proprietari (`_uiModal`) su contatore separato, sempre in cima. Risolve il caso "popup sotto popup".
- **Fix handle**: funzione unica `_sanitizeHandle` (spazi rimossi, niente simboli, accenti via, solo a-z0-9_-). Corretto bug: l'upsert profilo in `savePOIToDB` resettava l'handle a ogni salvataggio POI — ora insert solo se utente nuovo.
- **i18n COMPLETO delle aree principali** (~220 chiavi nuove IT/SQ/EN): Tier+Referral (48 chiavi), Compagnie+Follow (87), Itinerari+Liste (58), POI+Mappa+Profilo+Varie (32). Le stringhe erano hardcoded in italiano (`showToast`, popup, label). Restano poche varianti minori documentate (varianti POI "non trovato" con emoji, ambiente avatar ILLI•AI, tooltip "rotta ufficiale").
- Commit chiave: `bceec24` (popup+handle), `4732d7e` (i18n tier/ref), `22cb88e` (i18n compagnie/follow), `3c41109` (i18n itinerari/liste), `7b96981` (i18n POI/mappa/profilo).

---

## Sessione 24/06/2026 (parte 4) — Frontend itinerari + Follow + user_routes backend

- **Frontend itinerari agganciato a Supabase**: `saveNewTrip` fa insert su `trips`, `syncTripsFromDB` al login, `_persistTripStops` sincronizza add/delete/suspend/reorder/nota. Migrazione 007 (`trip_stops.note`) + 008 (RPC transazionale `replace_trip_stops`: BLOCKER bloccante risolto, delete+insert non atomico rischiava perdita dati, ora RPC + debounce per la race da drag). Itinerari ora persistenti end-to-end.
- **Fix loremflickr**: sostituito `source.unsplash.com` (deprecato) con `loremflickr` ovunque.
- **Follow persistente (migrazione 009)**: tabella `follows` creata (mancava, il toggle falliva in silenzio). Frontend `togglePublicFollow` era già pronto: ora il follow persiste. Nota pre-lancio: SELECT pubblica = rischio scraping grafo sociale, da rivedere prima del 17/08.
- **Rotte utente (migrazione 010)**: tabella `user_routes` creata, owner-based. Frontend rotte V2 ancora incompleto (creazione via AI non salva, aggiunta POI placeholder): nessun aggancio frontend fatto in questa sessione.
- **CLAUDE.md aggiornato**: tutte le tabelle reali documentate (companions, trips, follows, user_routes, ecc.) + RPC.
- Commit chiave: `d65a274` (frontend itinerari), `6ddb6f0` (follow), `ebd4869` (user_routes).

### Stato persistenza per modulo

| Modulo | Stato |
|---|---|
| Liste | Completa |
| Compagnie | Completa (manca presence live realtime) |
| Itinerari | Completa |
| Follow | Completa |
| Rotte utente | Backend pronto, frontend V2 da costruire |

## Sessione 24/06/2026 (parte 3) — Persistenza COMPAGNIE + ITINERARI backend + Valore tier paganti

- **Migrazione 005 applicata**: tabelle `companions` + `companion_members`, RLS con funzione SECURITY DEFINER `is_companion_member` (elimina ricorsione), RPC `join_companion`, FK `lists.companion_id`.
- **Frontend compagnie FASE A**: create/edit/delete su Supabase, `syncCompagnieFromDB` al login (merge con locali).
- **Frontend compagnie FASE B**: inviti email via `companion_members`, join da link (`?join=CODE` chiama RPC). Compagnie ora persistenti end-to-end; manca solo presence live realtime.
- **3° stato lista "compagnia"**: `lists.companion_id` persiste la lista associata a una compagnia specifica.
- **Valore reale tier paganti**: Sostenitore e Mecenate hanno perks concreti e differenziati (AI potenziata/illimitata, verifica profilo, POI in evidenza, punti x2, adotta rotta, QR business incluso), mostrati come card nella popup livelli con CTA `becomeSupporter`. Sono PROMESSE: i meccanismi vanno implementati uno a uno.
- **Migrazione 006 applicata**: tabelle `trips` + `trip_stops`, RLS owner-based, FK `lists.itinerary_id`, trigger `set_updated_at` su trips e companions. Frontend itinerari NON ancora agganciato (TRIPS resta in localStorage).
- Ogni step passato per code-quality, commit + deploy + push a ogni passo.
- Commit chiave: `409c1b1` (compagnie FASE A), `8ce7e71` (valore tier), `483cc91` (compagnie FASE B + 3° stato lista), `24503a9` (backend itinerari 006).

## Sessione 24/06/2026 (parte 2) — Persistenza LISTE su Supabase

- **Bug colonna `is_public` vs `visibility`**: il codice usava `is_public` ma lo schema `lists` ha `visibility` (enum `private`/`public`). Le liste non persistevano davvero. Corretto in `createList`, `loadMyLists`, `renderItinLists`.
- **`saveListDetail` e `deleteListDetail`**: agganciati a Supabase (update/delete con guardia `owner_id`). La delete non rimuove dal DOM se il DB fallisce: nessun disallineamento UI-DB.
- **Sicurezza XSS**: escape applicato nei nomi lista e in `_mapPopupCtx.name` negli innerHTML; ripristinato dove l'escape era inappropriato (showToast, input.value).
- **Liste hardcoded rimosse**: eliminate le 3 liste-esempio finte ("Lista libera", "Tirana Top", "Segreti").
- **Migrazione 004 applicata**: colonne `lists.companion_id` e `lists.itinerary_id` aggiunte.
- Processo: 2 round `/code-quality`, 4 BLOCKER intercettati e corretti prima del deploy.
- **CLAUDE.md aggiornato**: documentazione schema `lists` corretta (`visibility`, non `is_public`).
- Commit: `6b0ecaa` (mig 004), `deaa0e0` (persistenza liste), `4ee3dd9` (fix xss). Deployato su `httpdocs/index.html`, pushato su `origin/main`.
- **Ancora in localStorage (prossimo blocco)**: compagnie (`companions`), itinerari (`trips`), follow (`follows`), rotte utente (`user_routes`). Il campo `companion_id` su `lists` si popolerà solo quando esisterà la tabella `companions` (guardia già nel codice).

## Sessione 24/06/2026 (parte 1) — BACKEND avviato + workflow code-quality
- **Migrazione 001 gamification** applicata a Supabase e versionata in `supabase/migrations/`: tabelle `gamification_config` (punti per azione e soglie livelli, regolabili da admin), `point_events` (log azioni, anti-abuso), `referrals` (inviti). Colonne nuove su `profiles`: `points`, `special_tier`, `referred_by`.
- **RLS blindate**: trigger `protect_gamification_columns` impedisce al client di auto-assegnarsi punti/tier; scrittura punti solo server-side (service_role). Referral creabili solo a proprio nome.
- **Workflow code-quality attivato** (richiesto dal founder): la prima stesura aveva 2 BLOCKER di sicurezza RLS, scovati dall'agente e corretti prima di toccare il DB. Da ora ogni migrazione/codice importante passa da code-quality.
- **Push a ogni passaggio** ripristinato come regola (errore del giorno: 41 commit accumulati senza push; ora salvati su GitHub + tag `checkpoint-2026-06-24`).
- **Migrazione 002 accredito punti** applicata: `award_points` (atomica, anti-abuso) + trigger su pois/loves/lists (accredito automatico e verificato dal DB quando l'azione reale avviene) + trigger referral + RPC `award_share` (validazione entità reale + tetto giornaliero). 2° giro code-quality: altri 2 BLOCKER (spam share, REVOKE incompleto) corretti prima del deploy.
- **Aggancio frontend gamification FATTO**: badge e popup "I livelli" leggono i `points` reali da Supabase; il love ricarica i punti (accreditati dal trigger DB); lo share chiama la RPC `award_share`. Display badge passato da "love" a "punti" (livello = punti, formattazione compatta). 4 BLOCKER frontend corretti da code-quality in 2 round.
- Gamification ora END-TO-END per POI/love/share: azione → trigger accredita → badge mostra i punti reali.
- **GAMIFICATION COMPLETA end-to-end**: referral signup fatto (cattura `?ref`, RPC `claim_referral` sicura e atomica al login, +50 all'invitante via trigger). Migrazione 003 applicata. Tutto il backend gamification passato da code-quality: 8 BLOCKER di sicurezza corretti in 4 round (manomissione punti, spam share, REVOKE incompleti, auto-referral, race condition).
- **Prossimo blocco: PERSISTENZA** — tabelle `companions`/`trips`/`follows`/rotte-utente su Supabase (le liste `lists` e le rotte ufficiali `cultural_routes` già esistono); poi aggancio frontend (liste/itinerari/compagnie da localStorage a DB reale e sincronizzato webapp↔app). Poi: email HTML invito, liste pubbliche POI, admin desktop.

## Sessione 24/06/2026 (pomeriggio) — Fase 1 avviata: UI proprietaria
Tutto deployato live su poilove.com, verificato in preview a ogni passo.
- **Modali proprietarie** `uiPrompt`/`uiConfirm` (grafica POI•LOVE, fade, focus, Enter/Esc, variante danger rossa): sostituiti TUTTI i 13 dialoghi nativi del browser (`prompt`/`confirm`). Zero interfacce native.
- **Accesso ospite "Entra e guarda"** ri-aggiunto onesto: si naviga mappa e POI pubblici senza login e senza utente finto (`currentUser` resta null). Trilingue.
- **Popup lista ridisegnato**: due modalità (vista / modifica col pennino), nome+descrizione+visibilità a 3 stati (privata/pubblica/compagnia) inline, selettori chip "quale compagnia" e "quale itinerario" (una lista può entrare in un itinerario). X di chiusura esterna alla card, una sola penna. Tolto un residuo demo (POI a caso nel popup).
- **Tutte le icone Phosphor**: motore `emoToIcons()` converte le emoji in icone Phosphor a runtime (toast + renderer i18n); bandiere → globo Phosphor + sigla; Luoghi Personali, header, chip, badge e ~34 icone HTML/JS convertite. Zero emoji visibili nell'UI.
- Regole nuove in `SPECS.md`: UI proprietaria, X esterna al box, solo Phosphor.
- Resta (Fase 1): persistenza Supabase delle liste (oggi vivono nel profilo senza id reale), rotte modificabili (utente sì, ufficiali bloccate).

## Sessione 24/06/2026 — Fase 0: pulizia del finto COMPLETATA
Rimosso tutto il contenuto finto spacciato per reale dalla webapp (`webapp/index.html`), 8 checkpoint committati, JS valido a ogni passo, verifica preview superata (carica pulita, zero errori console, bottone demo sparito):
- Modalità demo (bottone + `enterDemoMode`) rimossa, l'app richiede login reale
- 3 utenti finti (@test.com) → stati vuoti onesti, pronti per Supabase `follows`
- Compagnie di viaggio finte → solo quelle reali
- Immagini AI (Pollinations/Flux): foto POI rimosse del tutto (slot vuoto col "+"); avatar e sfondo scollegati da Pollinations, l'opzione AI resta come "in arrivo con motore di qualità"
- Array `POIS` hardcoded (5 POI Tirana) svuotato → i POI reali vengono da Supabase
- Statistiche `Math.random()` + bio fissa nel profilo pubblico → neutre, da caricare da Supabase
- Avatar di default col nome del founder → neutro
- Testi UI che citavano "Flux" → puliti
- Itinerari (`TRIPS`) già vuoti da prima.

Restano (minori, NON finti): pulsanti "prossimamente" (onesti), dead code residuo da ripulire (`stopCoords`, `_photoPrompt`, `openUserRowProfile`).

**Deploy LIVE**: webapp pulita su poilove.com, verificata al 100% (zero demo, zero POI finti, zero @test.com, zero Pollinations, zero stats random). La verifica live ha scovato e rimosso altre 4 POI card hardcoded (sezione "I miei POI" + anteprima profilo pubblico) che il postmortem aveva mancato, più stringhe i18n demo e CSS morto. Backup del precedente in `/root/bak-httpdocs-index-20260624.html`.

## Sessione 23/06/2026

### SVOLTA: da prototipo a PRODOTTO REALE + Visione (sera 23/06)
**Postmortem** (vedi `POSTMORTEM.md`): code review completo, 8 BLOCKER + 14 MAJOR. Verdetto: la webapp era una vetrina, infrastruttura vera ma dati quasi tutti finti (utenti @test.com, POI hardcoded, statistiche `Math.random()`, modalità demo, immagini AI scadenti). **Decisione del founder: trasformarla in prodotto REALE.**

**Backend reso più reale stasera:**
- Bucket Supabase `poi_photos` creato + policy (fallback foto). Primario resta media.poilove.com (verificato sano, DNS ora risolve supabase.co).
- Catena upload foto pronta a funzionare end-to-end.

**VISIONE PRODOTTO raccolta in `SPECS.md`** (da implementare, non ancora fatta. È anche materiale di marketing/investitori):
- **Creazione POI ripensata**: menu "+", mirino/lente spostabile, tap breve (mai long-press, lasciato alla copia), timer 60s con coppa verde + media velocità nel profilo.
- **Schermata POI**: nome e descrizione con 3 vie (Suggerisci AI, Detta a voce, Scrivo io); AI che pesca il nome dal contesto geografico; foto opzionali, MAI generate da AI.
- **Sistema codice-POI**: ogni POI ha un codice di trasferimento (come l'authinfo dei domini), si può REGALARE o CEDERE un POI. Feature distintiva, nessun concorrente ce l'ha.
- **3 QR fisici = modello di business**: universale (crescita gratis), del locale (venduto, preciso con coordinate dentro il codice), POIVOICE (audio-guida).
- **Gamification**: lovvare genera PUNTI (per il luogo e per il viaggiatore); badge a livelli regolabili con nome e icona elegante; sfide stagionali e per zona annunciate dall'admin.
- **AI di qualità** (Claude Sonnet o GPT-4o) al posto di Groq scadente; limite 3 consultazioni/giorno/persona; costo stimato $45-450/mese fino a 1.000 utenti.
- **Admin desktop** (admin.poilove.com): moderazione, scelta AI, rotte ufficiali, gamification, analytics.
- **Rotte storiche** con pagina propria (ufficiali curate dall'admin + create dagli utenti).
- **Luoghi Personali** come scorciatoie intelligenti ai propri POI (ricerca, scelta multipla, aggiunta).
- **Avatar e sfondo** generabili con AI di QUALITA' (opzione), oltre a upload, colori e sfumature.

**Pulizia richiesta** (ancora da fare): via tutto il finto, love-count atomico, `prompt()` sostituiti da editing inline.

### Data di lancio pubblico FISSATA
- **17 agosto 2026 (lunedì)** — data ottimale Kairos (score 74/100). È lo stesso "Lancio Tirana" prima previsto a giugno, spostato. Allineati `CLAUDE.md`, `README.md` (IT/EN/SQ) e creato `TIMELINE.md`.

### Accessi — diagnosi completa + fix
Mappato tutto il sistema di login in `webapp/index.html` (ex `webapp/`) e verificata la config Supabase via Management API.
- **Stato reale provider** (Management API): `email`, `google`, `linkedin_oidc`, `x` attivi con credenziali; `facebook`/`apple` off. Site URL + Redirect allow-list già corretti su poilove.com.
- Fix X: il codice chiamava `provider:'twitter'` (OAuth1, spento) invece di `'x'` (OAuth2, attivo) → login X era rotto, ora riparato.
- Fix biometria: rimosso `prompt()` nativo (rotto su iOS PWA) → focus sul campo email + toast.
- Hardening: `getSession()` con fail-safe; `signOut()` pulisce i marker (privacy device condiviso).
- Facebook/Apple: bottoni mostrati come "presto" (disattivati), in attesa dei prerequisiti.
- Aggiunta i18n `auth_soon` (it/sq/en). Sintassi JS verificata, fix testati in preview.
- **Login funzionanti ora: 5** (email/magic link, Google, LinkedIn, X, biometria).

### project.poilove.com — sbloccato e live in HTTPS
Era bloccato (`domains.status=2`, "subscription suspended") perché creato il 22/06 mentre l'account Plesk era sospeso → nessun comando standard lo sbloccava (catch-22: client/customer --on, webspace-on, toggle, repair, tutti falliti). **Risolto** ricreando il sottodominio pulito: backup → `subdomain --remove` → `--create` (rinato `status=0`) → ripristino file dal backup + `chown` → SSL Let's Encrypt. Ora **project.poilove.com è live in HTTPS** con la presentazione marketing (cert valido fino al 21/09/2026). Causa+fix salvati in memoria (`plesk_subdomain_stuck_status2`).

### Pagina marketing (`web/index.html`) — rimossa la parola "demo"
- Bottone hero "Apri la Demo" → "Apri POI•LOVE"; link aggiornato a `https://poilove.com`.
- Meta aggiornata a "poilove.com"; sub-testo "Apri la demo" → "Apri l'app".
- Da deployare su project.poilove.com (path nuovo, richiede ok deploy).

### Date allineate
- **Finestra presentazioni — Tirana: 13-17 luglio 2026** (nuova milestone in `TIMELINE.md`).
- Lancio pubblico confermato **17 agosto 2026**; corretta la tappa nella timeline marketing da "Lug 2026" → "Ago 2026".

## Sessione 21/06/2026

### Fatto
- X (Twitter) OAuth attivato su Supabase
- LinkedIn (OIDC) OAuth attivato su Supabase
- Code review completo: trovati 6 BLOCKER + 8 MAJOR (vedi TODO.md sezione bug)
- Fix: marker Leaflet duplicati ad ogni login OAuth
- Fix: deep-link `name` → `name:title` (link condivisione POI erano rotti)
- Fix: query deep-link aggiunto `.limit(500)`
- Fix: `toggleLoveDB` — `sb.rpc()` usato erroneamente come valore, ora legge count reale dal DB
- Fix: GPS watcher leak in `startLocShare` — `locShareWatchId` salvato e pulito
- Feature: bottone "Sono qui — crea POI" nel FAB menu (GPS → form precompilato)
- Feature: AI descrizione POI migliorata con coordinate, categorie, prompt unicità
- Bottone AI rinominato "Suggerisci"
- Decisione: passare direttamente a poilove.com ufficiale, eliminare demo quando pronti

### Sessione 22/06/2026 — migrazione live

- project.poilove.com creato su Plesk con pagina marketing
- Webapp portata live su poilove.com
- Groq key rimossa dal sorgente HTML — spostata in config.js server-only (gitignore)
- Supabase: Site URL → poilove.com, Redirect URLs aggiornati via Management API
- Vecchio sotto-dominio temporaneo dismesso (tutto su poilove.com)
- URL hardcoded aggiornati a poilove.com nel codice
- Ricerca mappa migliorata: luoghi + vie separate, icone per tipo, correzione spelling AI
- Deploy autonomo abilitato via rsync file singolo

### Data di lancio app mobile (Kairos — Framework Esoterico Integrato)

Analisi condotta con il calcolatore Kairos (kairos/calcolatore-data-favorevole.html) applicando il framework a 6 livelli sul nome "POI LOVE".

**Calcolo Destiny caldeo**: P(8)+O(7)+I(1)+L(3)+O(7)+V(6)+E(5) = **37** → base **1** (Leadership Solare, Compound 37 "Buona Sorte negli Affetti")

**Vincolo critico luglio 2026**: Mercurio retrogrado 29/06-23/07, shadow ±5gg → penalità -60 su tutti i giorni 1-28 luglio. Solo i giorni 29-31 luglio sono liberi. Ulteriore problema: la Luna Piena cade il ~29 luglio (-30) colpendo anche gli ultimi giorni del mese.

**Data suggerita per luglio — 29 luglio 2026 (mercoledì)**
- Primo giorno post-shadow Mercurio
- Universal Day = 28→1 = Destiny (risonanza piena +25)
- Compound giorno 29 = "Prove e Tradimenti" (avverso, -25): i due si bilanciano
- Luna: gibbosa crescente giorno ~14 (neutro, non ancora piena)
- Raggio: Mercurio/R4 +4 | Ora Venere disponibile alle 6:00 +8
- **Score framework: +12 (accettabile, non eccellente)**

**Data ottimale assoluta — 17 agosto 2026 (lunedì)** *(se si vuole posticipare al mese successivo)*
- Luna nuova giorno 3 (+25) — massima apertura per la semina
- Universal Day = 26→8, complementare a Destiny 1 (+12)
- Compound 17 = "Stella dei Magi" — molto favorevole (+25)
- Nessuna retrogradazione attiva
- Ora di Venere disponibile alle 12:00 +8
- **Score framework: 74/100 — uno dei piu' alti possibili**

→ Raccomandazione: **29 luglio** per rispettare il mese di luglio; **17 agosto** se si può slittare di 3 settimane.

### In sospeso
- config.js sul server (chiave Groq) — ILLI•AI non funziona senza
- LinkedIn redirect URI → aggiungere poilove.com nell'app LinkedIn Developer Console
- Facebook OAuth — dopo Terms & Privacy
- Bug rimanenti da code review (vedi TODO.md)

---

## Sessione precedente (11/05/2026)
- 16 commit su origin/main (HEAD 3bc28c0)
- UX overhaul: photo picker, popup OSM, nav picker, profilo pubblico, map search, ILLI•AI, doppio tap mappa
- Fix geolocalizzazione (GPS reale, non Tirana hardcoded)
- Luoghi Personali (Casa/Lavoro) in localStorage
- Fix sistema Love (DB reale, non solo CSS)
- Compressione WebP automatica upload foto


- **v2.39 FIX descrizione AI (bug reale segnalato dal founder da casa)**: creando un POI a casa sua (Via Ca Nova 47, Zugliano) l AI generava "Ristorante... piatti tipici... prezzi variabili... prenotazione consigliata" — puttanate inventate, e Google Maps diceva altro. Causa: _gatherPoiFacts faceva `match = match || primo_locale_vicino`, cioe adottava il locale piu vicino (il ristorante "Opa" a ~80-90m sulla stessa via) come identita di QUESTO posto. Fix: un locale conta come questo posto SOLO se il nome combacia o se e proprio li (distM<=40m); altrimenti niente identita rubata. Inoltre, se non c e identita reale (OSM/Wikipedia/Google) e si sta generando, l AI NON inventa piu: chiede all utente di scrivere lui cos e (toast ai_no_facts). Rinforzato il prompt contro i riempitivi (prezzi/orari/prenotazione se non nei fatti). Collaudo deterministico: Opa a 60m NON adottato (fatti = solo indirizzo), a 15m adottato. Il titolo resta vuoto a casa (nessuna attivita li: giusto, lo scrive lui). Live (v2.39).

- **Bug reali segnalati dal founder dal vivo, corretti (v2.39-2.42)**. (1) Descrizione AI inventava un ristorante rubando l'identita al locale OSM piu vicino: paletto 40m/nome, e se nessuna identita reale l'AI NON inventa (chiede all'utente) — e ammesso onestamente che avevo asserito la distanza di "Opa" senza verificarla. (2) v2.40: i tier Professionista Plus e Influencer mostravano le CHIAVI grezze (tier_proplus_p1...) perche mancavano le traduzioni: aggiunte in 3 lingue + fallback nel render; pulsante CREA aggiunto nella sezione Compagni (c'era solo il FAB della mappa); foto del POI che riappariva nel POI successivo (openAddPOI non azzerava photoData/slot/unsplash): ora ogni nuovo POI parte pulito. (3) v2.41: categorie custom usabili SUBITO per il POI e persistenti nel profilo ("Le mie categorie"), pubbliche per tutti dopo 20 richieste (trigger mig 039). (4) v2.42: copertina itinerario caricabile in creazione, tolta l'immagine AI automatica (pollinations), fallback gradiente. Tutto collaudato in browser e live.

- **v2.43-2.44 su richiesta founder**: (2.43) RIMOSSA l'AI che compilava i campi nel pannello POI (bottone AI su nome e descrizione + auto-suggest del nome): si scrive/detta a mano. ILLI (chat) e la dettatura microfono restano intatte, sono la base. (2.44) Tassonomia definita: TAG liberi; SOTTOCATEGORIE aggiungibili libere con scelta della famiglia (macro), usabili subito per il POI e persistenti nel profilo; dopo 20 volte la stessa sottocategoria diventa ufficiale per tutti NELLA FAMIGLIA GIUSTA (mig 040: macro nella richiesta + promozione col macro corretto). Collaudato: chooser famiglia -> cibo, promozione a 20 in cibo. Live.