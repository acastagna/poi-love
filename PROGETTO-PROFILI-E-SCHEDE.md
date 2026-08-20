# Progetto: schede dei luoghi e profili veri, funzionanti

Documento del 20/08/2026. Nasce dalla domanda: cosa serve per rendere **vere** le sei schede del luogo
e i profili pubblici, non un disegno navigabile ma funzioni collegate a tutto POI•LOVE.

Stato di partenza verificato oggi sul database vero (`poilove`, porta 5433, macchina 178.104.87.47),
non a memoria.

---

## 1. Cosa c'e' gia' e si riusa

| Gia' pronto | Dove |
|---|---|
| Persone, punti, livelli speciali, avatar, copertina | `profiles` (points, special_tier, avatar_url, cover_url) |
| Luoghi con foto, tag, categorie, love, visibilita', badge, copertina | `pois` (photos, cover_photo, badge_official, badge_tier, love_count) |
| Chi segue chi | `follows` |
| Love e conteggio | `loves`, `sync_love_count`, `toggle_love` |
| Itinerari e tappe, compagnie e messaggi vocali | `trips`, `trip_stops`, `companions`, `companion_messages` |
| Rotte storiche e adozione | `cultural_routes`, `adopt_route`, `release_route` |
| Punteggi e regole | `gamification_config`, `point_events`, `award_points`, `award_poi_speed_bonus`, `award_poi_improvement` |
| Badge, moderazione, segnalazioni, richieste di proprieta' del luogo | `badges`, `reports`, `poi_ownership_requests`, `admin_*` |
| Avvisi, email, consensi, pixel, pagine di comunicazione | `notifications`, `email_*`, `consents`, `landing_pages` |
| Pagine pubbliche per i motori di ricerca | `webapp/poi.php`, `trip.php`, `route.php`, `esplora.php` |
| Amministrazione a moduli | `admin/panel.html` + 12 moduli in `admin/js/` |

**92 migrazioni** applicate. La base c'e': non si riparte da zero.

---

## 2. Cosa manca davvero

### Blocco 1 · La scheda del luogo, struttura vera
Oggi la scheda esiste ma non ha la forma decisa. Serve:
- copertina separata dalla galleria, galleria sempre a **multipli di tre**, scorrimento automatico regolabile;
- ordine delle sezioni per tipologia di autore, come nel disegno approvato;
- limiti di foto per livello scritti nel database e **fatti rispettare** al caricamento;
- sezioni che compaiono solo se il livello dell'autore ne ha diritto;
- **il video**: chi ne ha diritto ne carica uno. Va compresso sulla macchina, non lasciato come esce dal telefono.
  Regola proposta: **al massimo 60 secondi**, lato lungo 1080, H.264 con audio AAC, circa 2,5 Mbit al secondo,
  immagine di copertina presa dal video. Un filmato da telefono passa cosi' da 80-150 MB a 15-20 MB,
  senza differenza visibile sul telefono. Se vuoi durate diverse si cambia il numero, non il lavoro.

Tocca: `pois` (nuove colonne), regole di caricamento, la scheda nella webapp, `poi.php` per i motori.

### Blocco 2 · Recensioni
Non esiste nessuna tabella di recensioni. Serve tutto:
- tabella `reviews`: chi scrive, su cosa (luogo o persona), voto da 0 a 5 con decimali nella media, testo, data;
- **regola di amicizia, decisa il 20/08/2026**:
  - **Follower** e' chi ti segue, a senso unico. Resta com'e' oggi (`follows`).
  - **Amicizia** e' quando **tutti e due si seguono**, e tutti e due lo sanno. Nessuna richiesta da accettare,
    nessuna schermata in piu': l'amicizia nasce dal secondo "ti seguo".
  - Nel profilo si vedono **tre elenchi**: chi mi segue, chi seguo, chi ho bloccato.
  - Serve la tabella dei **bloccati**: oggi non esiste (verificato sul database). Chi e' bloccato non e' amico,
    non scrive, non segue.
  - Sui locali scrive solo chi e' amico del locale, **una recensione a testa**.

  **Buco trovato subito, e come lo chiudo.** Era gia' stabilito che togliendo l'amicizia le proprie recensioni
  spariscono. Con l'amicizia reciproca, "togliere l'amicizia" lo puo' fare anche **il locale**: gli basterebbe
  smettere di seguire chi lo ha criticato per far sparire la recensione. Regola asimmetrica, quindi:
  - se **chi ha scritto** smette di seguire il locale, la sua recensione sparisce (e' una sua scelta);
  - se **il locale** smette di seguire o blocca, la recensione **resta**. Il locale puo' impedire le prossime,
    non cancellare il passato. E' esattamente quello che era gia' stato deciso il 20/08.
- il locale puo' bandire una persona (le recensioni restano), la persona che toglie l'amicizia fa sparire le sue;
- medie calcolate e tenute aggiornate, +200 punti a chi recensisce;

**Moderazione fatta dall'AI, guidata da direttive scritte (20/08/2026)**
- Le direttive stanno **nell'amministrazione**, scritte da noi e modificabili senza toccare il codice:
  cosa non passa (insulti, razzismo, dati personali di terzi, numeri di telefono e collegamenti,
  attacchi ai concorrenti, testo fuori tema, recensione palesemente falsa), tono ammesso, lingue.
- Ogni recensione nuova passa dal controllo **prima di comparire**. Tre esiti: **pubblica**,
  **mettila in coda per una persona**, **rifiuta con il motivo scritto**.
- L'AI scrive sempre **quale direttiva** ha fatto scattare la decisione: la persona in coda vede il perche',
  non un verdetto muto. Ogni decisione resta scritta, cosi' le direttive si correggono sui casi veri.
- Vale anche per le segnalazioni degli utenti: e' questo che permette di rispondere **entro 24 ore**,
  come pretende Apple, senza che qualcuno stia sveglio a leggere.
- Chiave dell'AI **solo sul server**, tetto mensile di chiamate come gia' fatto per le mappe,
  e ricaduta se il tetto si esaurisce: la recensione resta in coda invece di passare senza controllo.
- La stessa impalcatura servira' domani per i luoghi, le foto e i messaggi delle compagnie:
  si costruisce una volta sola.
- viste: sulla scheda del locale, sul profilo di influencer e professionisti (a scorrimento).

### Blocco 3 · Profilo pubblico dell'utente
Oggi il profilo pubblico e' minimo. Serve la schermata nuova per cinque tipologie:
copertina scelta, viso al centro a meta' copertina, dati, luoghi piu' votati, itinerari e compagnie **pubbliche**,
posizione solo se resa pubblica, colore d'accento personale.
Serve anche la pagina pubblica per i motori di ricerca (`profilo.php`), che oggi non esiste.

### Blocco 4 · I vantaggi dei livelli, resi veri
Oggi i livelli esistono come etichetta, i vantaggi no. Serve:
- limiti di foto e video per livello, applicati davvero;
- Muro dei Sostenitori;
- **15 luoghi in omaggio** al Sostenitore: luoghi preparati dal sistema, assegnati con il bollino Ufficiale;
- itinerari e compagnie in evidenza (uno al Mecenate, tre piu' una compagnia all'Influencer), con i tetti gia' previsti;
- spunta di verifica e badge per tipologia.

### Blocco 5 · Controllo automatico delle condizioni
Il lavoro automatico che verifica ogni notte: 30 luoghi al mese per l'Influencer, rinnovo per Professionista e Plus.
Chi non rispetta la condizione perde i vantaggi da solo, con avviso prima.

### Blocco 6 · Locale Plus
Nessuna delle sue funzioni esiste oggi. Serve:
- orari giorno per giorno, con la pastiglia Aperto/Chiuso che si apre a tendina;
- **menu**: categorie, piatti, prezzi, foto, descrizione. Compilazione a mano dall'amministrazione **e caricamento CSV**;
- doppia valuta automatica lek/euro;
- Consigli dello Chef (tre piatti) e il racconto del proprietario;
- pagamenti accettati, prenotazione, categoria personalizzabile;
- statistiche private del proprietario (visite, navigazioni, QR letti, recensioni).

### Blocco 7 · Cambio Banca d'Albania
Presa una volta al giorno dal sito della banca, tenuta in memoria con la data.
Se la banca non risponde resta l'ultimo cambio noto, con la sua data scritta.

### Blocco 8 · Audio: due cose diverse, non una

**8a. La voce di chi ha il profilo** (professionista, locale, e domani chiunque altro glielo diamo).
E' un messaggio vocale suo, registrato col telefono:
- limiti veri: **1 minuto** al professionista, **3 minuti** al locale;
- conversione immediata in MP3 192 sulla macchina;
- si ascolta dentro la sua scheda. Non e' una guida: e' la sua presentazione.

**8b. Le audioguide ufficiali POI•VOICE**, che mette **POI•VOICE**, non l'utente.
Sono contenuto editoriale nostro:
- **nessun limite di durata**: dura quanto serve al luogo;
- caricate e gestite dall'amministrazione, con testo, lingua e voce;
- in albanese, italiano e inglese, con il marchio POI•VOICE in vista;
- legate al luogo o alla rotta storica, non alla persona;
- sono quelle che il Mecenate e l'Influencer ascoltano **ovunque**, anche lontano dal posto,
  e che il Mecenate raccoglie nel suo scaffale;
- servono elenco, ricerca, ordine e stato (bozza, pubblicata, ritirata) nell'amministrazione.

### Blocco 9 · QR veri
Scheda contatto vera (vCard) generata dal sistema, immagine del QR, stessa destinazione se lo inquadri o lo clicchi,
levetta mostra/nascondi **nel pannello** della persona.

### Blocco 10 · Rapporto notarizzato
PDF con i numeri veri, impronta SHA-256 e data certa, scaricabile dal proprio profilo da Influencer e Professionista.
La notarizzazione interna (impronta + registro) e' quella gia' usata per la presentazione.

### Blocco 11 · Abbonamenti in amministrazione
Tabella degli abbonamenti (chi, livello, prezzo, inizio, scadenza, stato, ricevuta),
attivazione dopo il pagamento, promemoria a 30, 7 e 1 giorno, decadenza automatica alla scadenza.
Fase 1 senza carta: pagamento fuori dal sistema, registrazione dentro.

### Blocco 12 · Mercato professionisti e influencer
Fase 1: l'influencer accende la disponibilita' e pubblica il listino; il professionista e il locale cercano
per zona, tema, numeri veri e recensioni; la proposta e l'accordo passano dentro POI•LOVE.
Fase 2 (dipende dall'incassatore): pagamento trattenuto fino alla consegna e commissione a POI•LOVE.

**Regola di visibilita' del listino (20/08/2026, non negoziabile)**
- Il listino di un influencer lo vedono **solo i professionisti e i locali Plus**. E l'amministrazione.
- **Un influencer non vede mai il listino di un altro influencer.** Vede solo il proprio.
- Chi non ha diritto vede il riquadro "Disponibile per collaborazioni" e il pulsante per proporre,
  ma **non i prezzi**.
- Il divieto si fa rispettare **sul server** (regola per riga sul database), non nascondendo il riquadro
  nella pagina: nascondere non e' proteggere.
- Nel pannello dell'influencer la cosa e' scritta **grande e chiara**, non in una nota a pie' di pagina:
  *"Il tuo listino lo vedono solo i professionisti e i locali. Nessun altro influencer puo' vederlo."*

### Blocco 13 · Amministrazione trasversale
Tipi di scheda organizzabili, tempi di scorrimento, moderazione delle recensioni, gestione del menu,
gestione degli abbonamenti, assegnazione dei luoghi in omaggio.

### Blocco 14 · Tre lingue, motori di ricerca, collaudo
Tutto il testo nuovo in albanese, italiano e inglese. Pagine pubbliche nuove dentro la mappa del sito.
Collaudo end-to-end su telefono e su computer.

---

## 3. Stima

Unita': **giornata di lavoro piena**, comprensiva di database, comandi, pannello, schermate, pubblicazione e verifica dal vivo.
Non comprende il tempo di collaudo di Alessandro.

| # | Blocco | Giornate |
|---|---|---|
| 1 | Scheda del luogo, struttura vera, video compresso compreso | 2,5 |
| 2 | Recensioni, amicizia reciproca, bloccati, moderazione fatta dall'AI su direttive scritte | 4,5 |
| 3 | Profilo pubblico dell'utente | 4 |
| 4 | Vantaggi dei livelli resi veri | 3 |
| 5 | Controllo automatico delle condizioni | 1 |
| 6 | Locale Plus (orari, menu, CSV, Chef, statistiche) | 4 |
| 7 | Cambio Banca d'Albania | 0,5 |
| 8a | Audio della persona (professionista, locale) | 1,5 |
| 8b | Audioguide ufficiali POI•VOICE, gestite dall'amministrazione | 2 |
| 9 | QR veri | 1 |
| 10 | Rapporto notarizzato | 1,5 |
| 11 | Abbonamenti in amministrazione (fase 1) | 2,5 |
| 12 | Mercato professionisti e influencer (fase 1) | 3 |
| 13 | Amministrazione trasversale | 2 |
| 14 | Tre lingue, motori di ricerca, collaudo | 2,5 |
| | **Totale fase 1** | **36,5** |
| 15 | Incasso con carta (dipende dall'incassatore) | 2 |
| 16 | Pagamento trattenuto e commissione del mercato | 2,5 |
| | **Totale con la fase 2** | **41** |

A una giornata al giorno lavorativo: **circa sette settimane** per la fase 1, otto con la fase 2.

---

## 4. Ordine dei lavori, e perche'

1. **Blocco 1** (scheda) e **Blocco 3** (profilo): sono la struttura su cui appoggia tutto il resto.
2. **Blocco 4 + 5** (vantaggi e controllo): rendono veri i livelli, che oggi sono solo etichette.
3. **Blocco 2** (recensioni): serve la struttura del profilo per mostrarle, quindi viene dopo.
4. **Blocco 6 + 7** (locale, cambio): il pezzo piu' grosso, indipendente dagli altri.
5. **Blocco 8 + 9 + 10** (audioguide, QR, rapporto): rifiniture di valore, si possono fare in parallelo.
6. **Blocco 11** (abbonamenti): appena serve incassare i primi professionisti.
7. **Blocco 12** (mercato): per ultimo, perche' ha senso quando ci sono professionisti e influencer veri dentro.
8. **Blocco 13 + 14**: si chiudono insieme alla fine di ogni blocco, non alla fine di tutto.

---

## 5. Cosa serve da Alessandro

| Decisione | Perche' blocca |
|---|---|
| Cosa vuol dire **amico** (seguirsi a vicenda, oppure amicizia da accettare) | senza questo non parte il Blocco 2 |
| Numero di foto del locale: **copertina + 21** oppure restiamo a 20 con una riga monca | Blocco 1 e testo del pannello dei livelli |
| ~~Via libera alla fase 1 degli abbonamenti~~ **DATO il 20/08: si, pagamento fuori dal sistema** | Blocco 11 sbloccato |
| Chi puo' incassare con carta da una societa' albanese | Blocco 15, da verificare prima di promettere date |
| Commissione del mercato: quanto trattiene POI•LOVE | Blocco 16 |
| I 15 luoghi in omaggio: chi li prepara e con quali contenuti | Blocco 4 |

---

## 6. Rischi

- **Amicizia**: se si sceglie l'amicizia da accettare, serve anche la schermata delle richieste. Mezza giornata in piu'.
- **Cambio Banca d'Albania**: il sito non ha un servizio dati ufficiale. Si legge la pagina, e se cambia impaginazione
  la lettura va corretta. Per questo esiste la ricaduta sull'ultimo cambio noto.
- **Audio**: la conversione occupa la macchina. Con molti caricamenti insieme serve una coda.
- **Incasso con carta**: e' l'unico punto che non dipende da noi.

---

## 7. Piano a 20 giorni (superato il 20/08/2026: il perimetro si e' allargato, resta come traccia del primo tratto)

Scadenza: **mercoledi 9 settembre 2026**. Venti giorni pieni, sabati e domeniche compresi.

Il perimetro completo della fase 1 vale 32,5 giornate: **in venti giorni non ci sta tutto**.
Ci sta questo, che e' il prodotto vendibile e completo per l'utente:

| Giorni | Blocco | Giornate |
|---|---|---|
| 21-22/08 | Scheda del luogo, struttura vera | 2 |
| 23-25/08 | Profilo pubblico dell'utente, cinque tipologie | 3 |
| 26-28/08 | Vantaggi dei livelli resi veri (foto, badge, muro, 15 luoghi in omaggio, evidenze) | 2,5 |
| 28-30/08 | Recensioni, sui luoghi e ricevute da influencer e professionisti | 2,5 |
| 31/08-03/09 | Locale Plus: orari a tendina, menu con CSV, doppia valuta, Consigli dello Chef, pagamenti, statistiche | 3,5 |
| 03-04/09 | Cambio Banca d'Albania, QR veri, controllo automatico delle condizioni | 1,5 |
| 05-06/09 | Audio della persona e audioguide ufficiali POI•VOICE | 1,5 |
| 06-07/09 | Abbonamenti in amministrazione, versione minima, e amministrazione trasversale | 2 |
| 08-09/09 | Tre lingue, pagine nei motori di ricerca, collaudo end-to-end | 1,5 |
| | **Totale** | **20** |

### Cosa resta fuori dai venti giorni

| Fuori | Giornate | Quando |
|---|---|---|
| Mercato professionisti e influencer | 3 | settimana successiva |
| Rapporto notarizzato | 1,5 | settimana successiva |
| Promemoria di scadenza e ricevute automatiche | 1 | settimana successiva |
| Incasso con carta | 2 | dipende dall'incassatore, non da noi |
| Coda di conversione degli audio | 0,5 | solo se il carico cresce |

### Condizioni perche' i venti giorni tengano

1. Le due decisioni bloccanti arrivano **entro domani**: cosa vuol dire amico, e le foto del locale (copertina + 21 oppure 20).
2. Il collaudo di Alessandro avviene **strada facendo**, blocco per blocco, non tutto alla fine.
3. Dentro i venti giorni **non entrano funzioni nuove**. Ogni aggiunta fa uscire qualcosa d'altro, e lo diciamo subito.
4. I contenuti dei 15 luoghi in omaggio: se non arrivano, li preparo dai luoghi ufficiali gia' esistenti.
5. Ogni blocco finisce pubblicato e verificato dal vivo, non "pronto ma da provare".


---

## 8. Programma completo, con app e contenuti (deciso il 20/08/2026)

Alessandro allarga il perimetro: oltre al web servono **l'app sugli store**, l'**amministrazione perfezionata**
e **200 luoghi veri in tutta l'Albania, 50 dei quali Ufficiali**. I tempi si allargano di conseguenza.

### 8.1 I quattro cantieri

| Cantiere | Cosa comprende | Giornate |
|---|---|---|
| **A · Web, fase 1** | i blocchi del capitolo 2: schede, profili, livelli, recensioni, locale Plus, audio della persona, audioguide ufficiali, QR, abbonamenti | 36,5 |
| **B · Amministrazione al massimo** | persone, luoghi, moderazione recensioni, menu dei locali, abbonamenti, media, livelli, statistiche, ruoli | 6 |
| **C · Contenuti: 200 luoghi, 50 Ufficiali** | raccolta dai dati aperti, scrittura, foto con licenza, verifica, bollino Ufficiale | 5 |
| **D · App iOS e Android** | dall'impianto esistente fino agli store | 24,5 |
| **E · Fase 2 web** | mercato professionisti-influencer, rapporto notarizzato, promemoria di scadenza | 5,5 |
| | **Totale** | **77,5** |

L'incasso con carta (2 giornate) resta fuori conteggio: dipende da quale incassatore accetta una societa' albanese.

### 8.2 L'app, nel dettaglio

Punto di partenza vero: in `poi-love-app/` c'e' gia' un impianto Expo con mappa, accesso, elenco luoghi,
scheda del luogo e profilo. E' fermo a maggio e parla ancora con Supabase.
**Buona notizia**: dal 18/08 il nostro stack e' PostgREST piu' GoTrue, cioe' esattamente le due interfacce
che quella libreria sa gia' usare. Si cambia l'indirizzo, non si riscrive il collegamento ai dati.

| Passo | Giornate |
|---|---|
| Aggiornare l'impianto alla versione attuale di Expo e agganciarlo al nostro stack | 2 |
| Accesso: Google, email, sessione che dura | 1,5 |
| Mappa, lente, marcatori, ricerca | 3 |
| Luoghi: elenco, scheda pubblica nelle sei tipologie, creazione con posizione, foto e dati della foto | 4 |
| Profilo utente nelle cinque tipologie | 2,5 |
| Itinerari e compagnie | 2,5 |
| **Notifiche vere** (sul web sono impossibili) | 1,5 |
| **Avviso quando arrivi vicino a un luogo, anche con l'app chiusa** (il motivo vero dell'app) | 2 |
| Audioguide, QR, condivisione | 1,5 |
| Tre lingue, icone, schermata d'avvio, immagini per gli store, cancellazione dell'account (Apple la pretende) | 1,5 |
| Compilazione, invio agli store, correzioni dopo l'eventuale rifiuto | 2,5 |
| | **24,5** |

### 8.3 I 200 luoghi, come si fanno davvero

Niente inventato. Si parte dai dati aperti e si verifica uno per uno.

- **Dove si prendono**: OpenStreetMap (gia' collegato per ILLI), Wikidata e Wikipedia per la storia,
  Wikimedia Commons e Openverse per le foto **con licenza utilizzabile** (il gestore dei media le cerca gia').
- **I 150 normali**: nome giusto, coordinate verificate, indirizzo completo, categoria e tag, una foto, descrizione breve.
- **I 50 Ufficiali**: come sopra, piu' descrizione originale nelle tre lingue, almeno tre foto, controllo a mano
  di posizione e nome, collegamento a un itinerario o a una rotta storica dove ha senso, **bollino Ufficiale**
  (la colonna `badge_official` esiste gia' su `pois`).
- **Copertura**: tutte le dodici prefetture, non solo Tirana e la Riviera.

### 8.4 Calendario indicativo

Una giornata al giorno, sette giorni su sette, a partire da venerdi 21/08/2026.

| Traguardo | Quando |
|---|---|
| Web fase 1 completo: schede, profili, livelli, recensioni, locale Plus | **22/09/2026** |
| Amministrazione perfezionata | **28/09/2026** |
| 200 luoghi in linea, 50 con il bollino Ufficiale | **03/10/2026** |
| Fase 2 web: mercato, rapporto notarizzato, promemoria | **09/10/2026** |
| App pronta e inviata agli store | **03/11/2026** |
| App pubblicata (dipende dai tempi di revisione degli store) | **meta' novembre 2026** |

### 8.5 Cosa deve fare Alessandro, e quando

| Cosa | Quando serve | Nota |
|---|---|---|
| ~~Decidere cosa vuol dire amico~~ **RISPOSTO il 20/08: amicizia = seguirsi a vicenda, piu' l'elenco dei bloccati** | fatto | blocco 2 sbloccato |
| ~~Foto del locale~~ **RISPOSTO il 20/08: copertina + 21, mai righe monche. Piu' un video** | fatto | gia' in linea, versione 4.63 |
| **Account Apple Developer** (99 dollari l'anno) e **Google Play** (25 dollari una volta) | entro meta' ottobre | li apre lui: io non apro account ne' inserisco password |
| Chiave per le notifiche del suo account Apple | quando l'app e' pronta | serve per le notifiche vere |
| Chi incassa con carta da una societa' albanese | quando decide di incassare | unico punto che non dipende da noi |
| Commissione del mercato | prima del cantiere E | |

### 8.6 Condizioni

1. Ogni blocco finisce **pubblicato e verificato dal vivo**, non "pronto da provare".
2. Il collaudo di Alessandro avviene strada facendo, blocco per blocco.
3. Funzioni nuove che entrano in corsa spostano la data: lo dico subito, con il conto.
4. Le date degli store non sono nostre: la revisione di Apple e Google puo' aggiungere giorni.


---

## 9. Correzioni dopo il controllo avversariale (20/08/2026)

Il capitolo 8 e' stato passato al setaccio da un controllore indipendente, con verifica sul database vero,
sul codice e sul web. Quello che ha trovato, e come cambia il piano.

### 9.1 Errori miei, corretti

| Cosa avevo scritto | Come stanno le cose | Effetto |
|---|---|---|
| "L'app si aggancia al nostro stack cambiando solo l'indirizzo" | Il protocollo e' compatibile, ma le richieste dell'app usano nomi di colonne che **non esistono piu'** (`user_id, name, latitude, longitude, tag, photo_urls` contro `author_id, title, lat, lng, tags, photos`). Ogni richiesta fallisce. In piu' l'impianto e' fermo a Expo 52 di novembre 2024, tre versioni indietro. | Non e' un cambio di indirizzo: e' una riscrittura del livello dati piu' il porto alla versione attuale. Da 2 a 5 giornate |
| "Rapporto notarizzato con data certa" | L'impronta e la data le scrive il nostro sistema. Nessun ente terzo. Nel repo non c'e' nessuna marcatura temporale di terze parti | Si chiama **impronta digitale con data dichiarata dal sistema**, oppure si aggancia davvero un servizio di marcatura temporale terzo. Non si scrive "notarizzato" a un professionista che lo useta' verso terzi |
| "Foto con licenza utilizzabile, il gestore dei media le cerca gia'" | La ricerca Openverse filtra il commerciale ma **non** i divieti di modifica. La ricerca Wikimedia **non filtra nessuna licenza**. E soprattutto: **nessuna riga di codice salva autore, licenza e fonte** | Le foto esterne usate oggi sono gia' fuori norma. Prima di arrivare a 200 luoghi serve la cattura obbligatoria di autore, licenza e fonte, e l'attribuzione visibile in scheda |
| "5 giornate per 200 luoghi" | Oggi nel database ci sono **18 luoghi e zero Ufficiali**. Solo i 50 Ufficiali, a mezz'ora l'uno, fanno 25 ore | Prima si misurano 10 schede vere, poi si fissa il numero. Stima portata a 9 giornate |
| "Il cambio si legge dalla pagina della Banca d'Albania" | Il numero **non e' nell'HTML**: la pagina lo carica con una chiamata separata e un gettone di sessione. Con una lettura semplice non si trova, non per un cambio di grafica ma perche' il dato non c'e' | Serve la chiamata vera o un browser senza finestra. Da mezza giornata a una |
| "Chi incassa con carta e' da verificare" | La decisione **esiste gia'**, luglio 2026, in `• THEMELI pay/studi/DECISIONE-incasso-carte-Albania.md`: RaiAccept (Raiffeisen, conto gia' aperto) piu' BKT, sotto il 4%. Stripe e' segnato NO-GO per l'Albania | La domanda vera non e' chi accetta l'Albania, ma se quel conto si puo' usare anche per POI•LOVE o serve un contratto separato |

### 9.2 Cose che il piano non nominava

- **Apple e gli abbonamenti**: venduti dentro l'app, passano dal sistema di Apple con la sua percentuale. Alessandro ha detto che gli sta bene: i numeri sono nel capitolo 9.4.
- **Moderazione entro 24 ore**: Apple pretende segnalazione dei contenuti e intervento entro un giorno, con espulsione dell'utente. Oggi la moderazione e' tutta a mano. Serve il giro completo segnalazione, coda, blocco.
- **Posizione in sottofondo**: e' il punto piu' delicato della revisione degli store, non una voce come le altre.
- **Recensioni**: nessun tempo minimo fra "ti seguo" e "ti recensisco", nessun tetto giornaliero, nessuna procedura di contestazione per il gestore. Vanno messi prima di aprire le recensioni. La moderazione con l'AI su direttive scritte (Blocco 2) copre il resto.
- **Chi controlla l'albanese** delle 50 schede Ufficiali. Serve un nome. Erion e' commercialista, non revisore di lingua.
- **Le bozze grafiche stavano solo nella cartella temporanea**: spostate in `docs/mockup-schede-profili/`.

### 9.3 Sicurezza, trovata durante il controllo

L'accesso ai dati pubblici risponde **anche senza chiave** e con una chiave inventata. Verificato:
- scrittura senza accesso: **bloccata** (401), i luoghi privati **non escono** (la protezione per riga funziona);
- ma la tabella delle persone espone a chiunque le colonne **`is_admin`, `admin_role`, `moderation_status`,
  `moderation_reason`, `moderation_until`, `moderation_updated_by`, `referred_by`**.
  Con una riga di comando si scopre chi e' l'amministratore e cosa e' stato scritto nelle note di moderazione.

Correzione: togliere al ruolo pubblico la lettura di quelle colonne (o esporre una vista ridotta).
Lavoro da mezz'ora, tocca il database vivo: si fa con l'ok di Alessandro e si verifica subito dopo.

### 9.4 Quanto prende Apple, e quanto Google

Numeri da confermare al momento dell'iscrizione, cambiano nel tempo.

| Caso | Percentuale | Su 100 euro (Professionista) | Su 250 euro (Plus locale) |
|---|---|---|---|
| Apple, con il programma per piccole imprese (sotto 1 milione di dollari l'anno) | **15%** | restano 85 euro | restano 212,50 euro |
| Apple, senza quel programma, primo anno di abbonamento | 30% | restano 70 euro | restano 175 euro |
| Apple, dal secondo anno dello stesso abbonamento | 15% | restano 85 euro | restano 212,50 euro |
| Google Play, abbonamenti | **15%** | restano 85 euro | restano 212,50 euro |
| Venduto dal sito, non dall'app | 0% agli store, solo il costo dell'incassatore | restano circa 96-97 euro | restano circa 241-242 euro |

Due cose da sapere:
1. Il programma per piccole imprese di Apple **va chiesto**, non e' automatico. POI•LOVE rientra ampiamente.
2. Apple e Google incassano al posto nostro e in molti paesi versano loro l'IVA. E' un fastidio in meno,
   non solo una percentuale in piu'.
3. Conviene comunque vendere anche dal sito: la stessa cosa costa meno. Nell'app le regole su come
   rimandare al sito sono strette fuori da Stati Uniti ed Europa.

### 9.5 Stima aggiornata

| Cantiere | Prima | Adesso | Perche' |
|---|---|---|---|
| Web fase 1 | 36,5 | **40,5** | locale Plus +2, licenze e attribuzione foto +1, anti abuso recensioni +0,5, cambio +0,5. Comprende l'audio della persona e le audioguide ufficiali, separate il 20/08 |
| Amministrazione | 6 | **7** | moderazione entro 24 ore e blocco utenti, richiesti da Apple |
| 200 luoghi, 50 Ufficiali | 5 | **9** | si parte da 18 luoghi e zero Ufficiali |
| App iOS e Android | 24,5 | **30** | riscrittura del livello dati, porto alla versione attuale, tre punti delicati in revisione |
| Fase 2 web | 5,5 | **6** | marcatura temporale vera per il rapporto |
| | **77,5** | **92,5** | |

Calendario aggiornato, una giornata al giorno da venerdi 21/08 (92,5 giornate):

| Traguardo | Prima | Adesso |
|---|---|---|
| Web fase 1 completo | 22/09 | **29/09** |
| Amministrazione perfezionata | 28/09 | **06/10** |
| 200 luoghi in linea | 03/10 | **15/10** |
| Fase 2 web | 09/10 | **21/10** |
| App inviata agli store | 03/11 | **20/11** |
| App pubblicata | meta' novembre | **fine novembre, inizio dicembre** |

### 9.5-bis Chi incassa: la risposta c'e' gia', va solo agganciata

Dal documento di gruppo `• THEMELI pay/studi/DECISIONE-incasso-carte-Albania.md` (luglio 2026):

| Ruolo | Strumento | Costo | Stato |
|---|---|---|---|
| Carte, primario | **RaiAccept**, il VPOS di Raiffeisen | circa 1,5-3,5% | **conto gia' aperto** |
| Carte, secondo binario | **BKT VPOS** | circa 1,5-3,5% | da aprire, serve per le rate e come riserva |
| Comodita' | PayPal | 3,9-8% | acceso, da tenere minoritario |
| Bonifico | IBAN Raiffeisen | sotto l'1% | il piu' economico |
| Stripe | | | **non disponibile per l'Albania** |
| Incassatore che fattura al posto nostro (Polar, 2Checkout) | | 5-6% | scartato: sfora il tetto del 4% |

La regola gia' scelta dal gruppo e' **un contratto per dominio**, cosi' i conti restano puliti.
Quindi per POI•LOVE **non serve cercare un incassatore nuovo**: serve chiedere a Raiffeisen
**un secondo contratto VPOS intestato a poilove.com**, sotto lo stesso conto.
Una telefonata e la firma, non uno studio.

Da riconfermare per iscritto, come dice quel documento: la percentuale vera sulle **carte estere**
(la maggior parte dei professionisti stranieri paghera' con carta non albanese).

### 9.6 Le cinque domande da sciogliere prima del via

1. Il conto RaiAccept e BKT gia' aperto per 321.al si puo' usare anche per POI•LOVE, o serve un contratto separato?
2. Chi controlla la qualita' dell'albanese sulle 50 schede Ufficiali?
3. Gli abbonamenti si vendono anche dal sito oltre che dall'app? (dal sito restano 12-15 euro in piu' su ogni Professionista)
4. Chi si prende la responsabilita' legale della parola scelta per il rapporto, prima che un professionista lo mostri a terzi?
5. Prima di fissare 9 giornate per 200 luoghi: faccio 10 schede complete e misuro il tempo vero?


---

## 10. Incassi: cosa chiedere, a chi, in che ordine (20/08/2026)

Non serve cercare un incassatore nuovo. Il gruppo ha gia' deciso a luglio e il conto Raiffeisen e' aperto.
Per POI•LOVE serve **agganciare**, non studiare.

### 10.1 Le tre telefonate, in ordine

**1. Raiffeisen, ufficio commerciale VPOS.** Chiedere un **secondo contratto VPOS intestato a poilove.com**,
sotto lo stesso conto gia' aperto. Le domande da fare, tutte per iscritto nell'offerta:

| Domanda | Perche' conta |
|---|---|
| Percentuale sulle **carte albanesi** e sulle **carte estere**, separate | i professionisti stranieri pagheranno con carta non albanese: e' li' che il costo esplode |
| C'e' la conversione automatica in valuta (DCC)? Si puo' spegnere? | e' la voce che fa saltare il tetto del 4% senza che te ne accorgi |
| **Pagamento ricorrente**: il VPOS sa tenere la carta e riaddebitare l'anno dopo? | se non lo fa, il rinnovo dell'abbonamento va rifatto a mano ogni anno, con l'avviso e il collegamento di pagamento |
| **Payment Link** (collegamento di pagamento) attivo subito? | permette di incassare i primi professionisti prima che l'integrazione sia finita |
| **3DS2** e pagina di pagamento ospitata da loro | i dati della carta non toccano il nostro server: e' quello che ci tiene fuori dagli obblighi pesanti |
| Prezzi in **euro** o solo in lek? Quando accreditano? | i listini sono in euro |
| Rimborsi e contestazioni: come si fanno e quanto costano | serve prima di vendere, non dopo |

**2. BKT.** Secondo contratto VPOS: serve per le rate e come riserva se Raiffeisen si ferma.
Non urgente, ma va aperto in parallelo perche' i tempi delle banche sono lunghi.

**3. PayPal.** Resta il secondo bottone, per chi si fida solo di quello. Costa 3,9-8%,
quindi va tenuto minoritario, non messo per primo.

### 10.2 Cosa incassa cosa

| Dove compra | Chi incassa | Quanto resta su 100 euro |
|---|---|---|
| Dal sito poilove.com | RaiAccept (o bonifico) | circa 96-97 euro |
| Dentro l'app iPhone | Apple | 85 euro con il programma piccole imprese |
| Dentro l'app Android | Google | 85 euro |
| Bonifico diretto | Raiffeisen | oltre 99 euro |

Per questo la fase 1 degli abbonamenti (registrazione dentro, pagamento fuori) non e' un ripiego:
**e' anche la piu' conveniente**, e resta valida anche dopo.

### 10.3 Quello che POI•LOVE deve avere pronto quando la banca dice si'

Lavoro nostro, non della banca. Si fa mentre la banca risponde:
- pagina di pagamento con il nostro aspetto, che manda al VPOS e torna indietro;
- registro degli abbonamenti gia' previsto nel Blocco 11, con stato pagato, scaduto, rimborsato;
- ricevuta o fattura all'utente, con i dati fiscali giusti;
- riconciliazione: ogni incasso legato al suo abbonamento, per non impazzire a fine anno.


---

## 11. Il mercato: chi prende cosa (deciso il 20/08/2026)

**Gli abbonamenti sono interamente nostri.** Professionista 100 euro l'anno e Plus locale 250 euro l'anno
li paga il cliente a POI•LOVE: non c'e' niente da dividere.

**Sulle trattative dentro il mercato POI•LOVE trattiene il 33% netto.**
Netto vuol dire che il 33% resta pulito: il costo dell'incasso non lo mangia.

### 11.1 Come tornano i conti

Esempio su una collaborazione da 300 euro, con incasso al 3%:

| Voce | Importo |
|---|---|
| Paga il professionista | 300,00 |
| Costo dell'incasso (3%) | 9,00 |
| **Resta a POI•LOVE, netto** | **99,00** (il 33% di 300) |
| Va all'influencer | 192,00 |

Chi si prende il costo dell'incasso e' una scelta: **consiglio di scalarlo dalla quota dell'influencer**,
cosi' il professionista vede un prezzo pulito e il nostro 33% resta netto per davvero.
L'alternativa e' aggiungerlo al totale che paga il professionista: piu' trasparente, meno elegante nel prezzo esposto.

### 11.2 Un avvertimento serio, prima di costruire

"Trattenere il pagamento fino alla consegna e poi girarlo all'influencer" vuol dire **tenere soldi di terzi**.
In molti paesi e' un'attivita' regolata, con licenza. Questo va chiesto al commercialista **prima** di scrivere una riga.

C'e' una strada che evita del tutto il problema e porta allo stesso risultato:

| Modello | Come funziona | Conseguenza |
|---|---|---|
| **Consigliato: POI•LOVE vende la collaborazione** | il professionista compra da POI•LOVE, l'influencer fattura a POI•LOVE il 67% | nessun soldo di terzi da custodire, il 33% e' semplicemente il nostro margine, un solo documento per parte |
| Mercato con soldi trattenuti | POI•LOVE incassa per conto dell'influencer e glieli gira dopo la consegna | possibile obbligo di licenza per servizi di pagamento, da verificare con il commercialista |

Il primo modello si puo' costruire subito. Il secondo va verificato prima.

### 11.3 Cosa resta da decidere

- Chi assorbe il costo dell'incasso: l'influencer (consigliato) o il professionista.
- Quale dei due modelli sopra, da confermare con il commercialista.
- L'IVA sulla commissione e la forma dei documenti: sempre commercialista.
