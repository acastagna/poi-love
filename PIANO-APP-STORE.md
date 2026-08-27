# PIANO APP STORE, POI•LOVE
> Relazione operativa del 22/08/2026. Scritta per essere data in pasto a una sessione
> di Claude: contiene tutto il contesto per lavorare all'app nativa senza altre fonti.
> Fonti di verita' collegate: `CLAUDE.md` (regole progetto), `SAL.md` (diario),
> la tabella `programma` sul database (stato blocchi), `webapp/index.html` (il prodotto
> di riferimento), `scratchpad/schede2/mock.html` (mockup schede in sei tipologie).

## 1. Il quadro

| Fronte | Stato al 22/08/2026 |
|---|---|
| Webapp poilove.com | Il prodotto vero e vivo: 91 giornate su 113 del programma. v5.74. Push web spedite dalla macchina, audioguide POI•VOICE, rapporti notarizzati su blockchain, lingue parametriche, notifiche, moderazione. |
| App nativa (Expo, `poi-love-app/`) | Scheletro di maggio piu' due tessere di oggi (marcatore definitivo, barra di ricerca). Da fare: blocchi 33-44, circa 24 giornate. |

**Ordine perentorio del founder (22/08):** l'app nativa deve avere TUTTI i principi
e le logiche funzionali ed estetiche della webapp DI OGGI, non dello scheletro di
maggio. Ogni schermata si costruisce col confronto davanti: webapp aperta, mockup
aperto, e non e' "fatta" finche' il confronto non regge all'occhio del founder.

## 2. Architettura tecnica dell'app

- Cartella: `poi-love-app/` dentro il repo `poi-love` (Mac: `/Users/alessandrocastagna/AI (produzione)/• POI•LOVE/`).
- Expo SDK 54, expo-router, React 19.1.0 accoppiato a react-dom 19.1.0, React Native 0.81.
- Trappole gia' pagate (NON ripeterle): babel-preset-expo deve restare `~54`;
  reanimated 4 vuole `react-native-worklets/plugin` come ULTIMO plugin babel;
  @gorhom/bottom-sheet deve essere v5; niente PROVIDER_GOOGLE su iOS dentro Expo Go.
- Backend: lo stesso della webapp, macchina nostra. `constants/config.ts` punta gia' a
  `https://poilove.com/db` (PostgREST + GoTrue), funzioni su `/db/functions/v1`,
  media su `https://media.poilove.com`. RLS attive: il client usa la chiave pubblica.
- Dati: `lib/db.ts` ha gia' fetch dei luoghi nel riquadro visibile (visibility
  community+official, approvati, non rimossi), titoli in tre lingue (title_it/sq/en),
  `testoLuogo()` per scegliere la lingua.
- GoTrue: la allow list contiene gia' `poilove://**` e `exp://192.168.50.38:8081/**`.

## 3. Regole non negoziabili (dal CLAUDE.md, valgono anche sull'app)

1. MAI cose finte: niente mockup spacciati per funzioni, niente dati inventati,
   tutto collegato al database vero e verificato dal vivo.
2. Icone Phosphor OVUNQUE, in vettoriale (react-native-svg coi tracciati Phosphor).
   Mai emoji, mai lettere al posto di icone.
3. Tre lingue (sq/it/en) su tutto, apertura nella lingua del telefono. Il blocco 43
   completa le lingue, ma le stringhe si scrivono da subito in un dizionario centrale.
4. Niente trattini lunghi nei testi. Date in formato europeo.
5. Chiavi e segreti mai nel client ne' nel repo.
6. Header di copyright 321.al/EVOLAB in cima a ogni file sorgente nuovo.

## 4. Il linguaggio visivo da copiare (webapp di oggi)

- Colori: rosso #D42B2B, blu POI•VOICE #285EA7, sfondo caldo #EAE4D8. Font Montserrat.
- **Cartografia**: dal 23/08 la webapp usa le tegole OpenStreetMap standard
  (Carto/Voyager ha messo la chiave obbligatoria); nomi sul satellite dal
  livello Reference di Esri. Sull'app si montano le STESSE con UrlTile di
  react-native-maps: l'occhio deve restare identico alla webapp. Satellite:
  ArcGIS World Imagery (gia' nella webapp). Vestito definitivo in valutazione
  (voce in TODO.md).
- **Marcatore definitivo** (variante A del founder, 18/08, gia' portato nell'app in
  `components/PinCuore.tsx`): goccia paffuta col cuore bianco inciso; i MIEI luoghi
  rossi, chi seguo verde #1a7f45, la community grigia #8a8a8a e piu' piccola
  (30x36 contro 42x50); ufficiali/in evidenza rossi col sigillo d'oro #c9a22e;
  numerino dei love nero su disco bianco a cavallo della spalla destra (a sinistra
  per gli ufficiali), sparisce a zero, forma compatta (2k, 2,5k); nome SEMPRE sotto
  su pillola scura rgba(0,0,0,.72), troncato a 11 caratteri (8 per la community).
- Fogli che salgono dal basso (bottom sheet), pillole, toast propri (mai popup di
  sistema), FAB rosso. La scheda del luogo e' il cuore del prodotto: copertina,
  galleria a multipli di tre, badge, tag, dove si trova, chi lo ama, recensioni,
  audioguida con lettore POI•VOICE, QR. Le sei tipologie di scheda sono specificate
  in `TODO.md` sezione "SCHEDA PUBBLICA DEL LUOGO" e nel mockup `scratchpad/schede2/`.

## 5. I blocchi da costruire (tabella `programma` sul database)

Accesso stato: `ssh -i ~/.ssh/poilove_srv root@178.104.87.47` poi
`sudo -u postgres psql -p 5433 -d poilove`. A blocco finito e verificato:
`update programma set stato='fatto' where id=N;` e commit.

| Id | Blocco | Giornate | Note |
|---|---|---|---|
| 33 | Mappa, lente, marcatori, ricerca | 3.0 | IN CORSO. Fatti: marcatore definitivo, ricerca (nostri luoghi + Nominatim con garbo: 1 richiesta/secondo, User-Agent POI-LOVE). Mancano: tile Voyager, raggruppamenti (cluster), tu-sei-qui blu, doppio tap per aggiungere |
| 34 | Luoghi: elenco, scheda, creazione | 4.0 | La scheda completa dalla webapp + creazione in meno di 90 secondi (GPS/foto/indirizzo/tocco mappa) |
| 35 | Profili nelle cinque tipologie | 2.5 | Dal mockup schede2 + profilo webapp (livelli, punti, badge, muro sostenitori) |
| 36 | Itinerari e compagnie | 2.5 | Liste, itinerari, compagnie con bacheca |
| 37 | Notifiche vere | 1.5 | Push native (expo-notifications): si estende il postino `push-notifiche.php` della macchina con un canale Expo, la tabella `push_iscrizioni` esiste gia' |
| 38 | Avviso quando arrivi vicino | 2.0 | Geofence in background (expo-location), impossibile sul web, qui si' |
| 39 | Audioguide, QR, condivisione | 1.5 | Lettore audio nativo, QR, foglio condividi (modello: destinazioni vere, voci nascoste se non applicabili) |
| 40 | Cancellazione account, segnalazione, blocco | 1.5 | OBBLIGO degli store: cancellazione account dentro l'app |
| 41 | Abbonamenti con Apple e Google | 1.5 | Sul telefono la cassa e' di Apple/Google (trattengono 15-30%); si collegano ai livelli esistenti (Sostenitore, Mecenate...) |
| 42 | Account Apple e Google Play | 0 | LO FA ALESSANDRO: Apple Developer 99$/anno, Google Play 25$ una tantum |
| 43 | Tre lingue, icone, immagini per gli store | 1.5 | Dizionario completo sq/it/en + schede store |
| 44 | Invio agli store e correzioni | 2.5 | EAS Build in nuvola, TestFlight, revisione Apple (1-3 giorni, rimbalzi normali) |

## 6. Xcode e la strada per lo store

- **Xcode serve per gli OCCHI, non per il pacchetto**: il simulatore di iPhone dentro
  il Mac permette a Claude di guardare e rifinire da solo (lingue, schermi, tema),
  senza passare dal telefono del founder a ogni ritocco.
- Il Mac e' un **iMac Pro 2017 Intel con macOS 15.7** (oltre il suo limite ufficiale):
  l'Xcode dell'App Store richiede macOS 26 e NON si installa. La versione giusta e'
  **Xcode 16.4**, scaricata da https://developer.apple.com/download/all/?q=Xcode
  col suo Apple ID (gratis, file .xip da ~8 GB). Spacchettamento e configurazione
  li fa Claude; la password di amministratore la mette Alessandro.
- Nel simulatore si usa Expo Go: niente compilazioni locali pesanti.
- **Il pacchetto vero per gli store lo costruisce EAS Build (la nuvola di Expo)**:
  codice su, app firmata giu'. L'iMac Intel non deve compilare nulla. TestFlight
  porta l'app sul telefono vero prima del pubblico.
- Requisiti store gia' coperti dal progetto: privacy e condizioni live su poilove.com,
  moderazione contenuti attiva. Da fare nei blocchi: cancellazione account (40),
  motivazioni dei permessi (GPS, foto, notifiche), acquisti in-app (41).

## 7. Divisione dei compiti

| Chi | Cosa |
|---|---|
| Alessandro | Scaricare Xcode 16.4 (in corso); aprire l'account Apple Developer e Google Play (settimana del 24/08); approvare prezzi abbonamenti; collaudare su TestFlight; l'ultima parola estetica su ogni schermata |
| Claude | Tutto il resto: fondamenta visive, blocchi 33-41 e 43-44, confronto costante con webapp e mockup, verifica dal vivo, stato nel database, commit e SAL |

## 8. Metodo di lavoro (anti-delusione)

1. Prima le fondamenta visive comuni (tema, componenti, cartografia), POI le schermate.
2. Ogni schermata: riferimento webapp/mockup aperto, costruzione, confronto fianco
   a fianco. Mai dire "adesso e' come la webapp" per un pezzo singolo: si dice quale
   pezzo e' stato fatto e quanto manca.
3. Il banco di prova: `npx expo start` in `poi-love-app/` (porta 8081); il founder
   guarda con Expo Go sul telefono (stessa rete), Claude col simulatore quando c'e'.
4. Fine sessione: commit, SAL.md aggiornato, stato blocchi nel database.
