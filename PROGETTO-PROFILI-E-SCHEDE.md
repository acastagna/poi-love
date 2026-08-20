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
- sezioni che compaiono solo se il livello dell'autore ne ha diritto.

Tocca: `pois` (nuove colonne), regole di caricamento, la scheda nella webapp, `poi.php` per i motori.

### Blocco 2 · Recensioni
Non esiste nessuna tabella di recensioni. Serve tutto:
- tabella `reviews`: chi scrive, su cosa (luogo o persona), voto da 0 a 5 con decimali nella media, testo, data;
- **regola di amicizia**: sui locali scrive solo chi e' amico, una a testa. Oggi esiste `follows`, che e' a senso unico:
  va deciso se "amico" vuol dire seguirsi a vicenda o se serve una tabella di amicizia vera **(decisione tua)**;
- il locale puo' bandire una persona (le recensioni restano), la persona che toglie l'amicizia fa sparire le sue;
- medie calcolate e tenute aggiornate, moderazione dall'amministrazione, +200 punti a chi recensisce;
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

### Blocco 8 · Audioguide POI•VOICE
- caricamento dell'audio dal telefono, limiti veri: **1 minuto** al professionista, **3 minuti** al locale;
- conversione immediata in MP3 192 sulla macchina;
- ascolto dentro la scheda e scaffale delle audioguide del Mecenate.

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
| 1 | Scheda del luogo, struttura vera | 2 |
| 2 | Recensioni | 3 |
| 3 | Profilo pubblico dell'utente | 4 |
| 4 | Vantaggi dei livelli resi veri | 3 |
| 5 | Controllo automatico delle condizioni | 1 |
| 6 | Locale Plus (orari, menu, CSV, Chef, statistiche) | 4 |
| 7 | Cambio Banca d'Albania | 0,5 |
| 8 | Audioguide POI•VOICE | 2,5 |
| 9 | QR veri | 1 |
| 10 | Rapporto notarizzato | 1,5 |
| 11 | Abbonamenti in amministrazione (fase 1) | 2,5 |
| 12 | Mercato professionisti e influencer (fase 1) | 3 |
| 13 | Amministrazione trasversale | 2 |
| 14 | Tre lingue, motori di ricerca, collaudo | 2,5 |
| | **Totale fase 1** | **32,5** |
| 15 | Incasso con carta (dipende dall'incassatore) | 2 |
| 16 | Pagamento trattenuto e commissione del mercato | 2,5 |
| | **Totale con la fase 2** | **37** |

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
| Via libera alla **fase 1 degli abbonamenti** (registrazione, pagamento fuori dal sistema) | Blocco 11 |
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
