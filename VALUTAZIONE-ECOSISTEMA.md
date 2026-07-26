# VALUTAZIONE. Da progetto scritto da un'AI a ecosistema modificabile
Ecosistema 321 / EvoLab. Redatto il 26/07/2026 su richiesta del founder.
Base: analisi automatica del codice a 6 squadre (monolite, configurazione, admin, dati/operativita, Themeli) con numeri **misurati** sul sorgente vivo e riverificati a campione.

---

## 1. Il verdetto, senza giri di parole

**Oggi il progetto non e modificabile a mano. Ma non serve riscrivere niente: mancano due passi meccanici.**

Il paradosso e che la parte difficile e gia fatta bene:
- 43 tabelle, 85 funzioni SQL, sicurezza a livello di riga su tutto
- un pannello admin con 18 sezioni che gia scrive su 22 tabelle
- una tabella di configurazione generica (`gamification_config`) gia in produzione e gia pilotata dal pannello: **il modello da clonare esiste gia**
- il costruttore EVOLAB gia condiviso fra POI•LOVE, Top Market e prodotto standalone

Quello che manca e il **ponte**: testi, colori, parametri e interruttori stanno ancora dentro il codice invece che in un file o in una tabella.

### I numeri veri (misurati, non stimati)

| Cosa | Numero |
|---|---|
| `webapp/index.html` | **16.973 righe, 1,16 MB in un unico file** |
| di cui JavaScript inline | 12.505 righe (74%) |
| Funzioni in un unico spazio globale | **739** |
| Funzioni gia definite due volte (collisione silenziosa) | 2 |
| Chiavi di traduzione sepolte nel codice | 814 per 3 lingue, righe 6360-6664 |
| Colori scritti a mano invece che come variabile | 826 |
| `onclick` scritti dentro il markup | 537 |
| Interruttori per spegnere una funzione senza rideploy | **0** |
| Test automatici | **0** |
| Sezioni gia marcate con banner di commento (i confini per spezzare) | 76 |

Il lato admin sta molto meglio: 12 moduli JS separati, tutti isolati, il 41% del codice gia fuori dal monolite. **La disciplina giusta esiste gia dentro casa**, va solo estesa alla webapp.

---

## 2. I rischi concreti di oggi

1. **Collisione silenziosa di nomi.** 739 funzioni in un unico spazio: se tu (o un'AI) aggiungi una funzione con un nome gia usato, la vecchia sparisce **senza nessun errore**. E gia successo 2 volte.
2. **Nessun interruttore.** Se il giorno del lancio ILLI o i vocali danno problemi, l'unica leva e modificare il codice e rifare il deploy. In un momento di panico e la leva sbagliata.
3. **Nessuna rete di sicurezza.** Zero test: un difetto arriva in produzione e lo scopre un utente. Il contatore dei luoghi negli itinerari era rotto da oltre un mese e nessuno se n'era accorto (corretto il 26/07).
4. **Cambiare una parola** significa aprire un file da 1,16 MB e trovare la riga giusta fra 16.973. E esattamente il motivo per cui oggi devi chiamare un'AI per ogni modifica.
5. **I tetti di spesa AI** vivono nei segreti delle edge function, fuori dal pannello: le tabelle che contano l'uso esistono ma nessuna schermata le legge.

---

## 3. Le tre mosse che cambiano tutto (2,5 giorni, tutte reversibili)

### MOSSA 1 — Spezzare il monolite in tre file veri *(4 ore)*
`index.html` (solo HTML, ~2.400 righe) + `app.css` + `app.js`. **Puro spostamento, zero logica cambiata**, verificabile con un confronto automatico e annullabile in un minuto. Sostituisce anche lo script fragile che oggi spezza il file al volo per non sforare il limite del server.

### MOSSA 2 — Le parole fuori dal codice *(1 giorno)*
Le 814 frasi in tre file separati `it.js`, `sq.js`, `en.js`. **E il primo pezzo che modifichi da solo**: apri un file di sole frasi, cambi la parola, salvi. Nessun rischio di rompere il codice. Toglie 108 KB dal monolite.

### MOSSA 3 — La tabella degli interruttori *(1 giorno)*
Una tabella `app_config` clonata da `gamification_config` (che gia funziona), con una sezione nel pannello. Da quel momento **regoli parametri e spegni funzioni da un pannello, senza deploy**: limiti AI, tetti di spesa, funzioni accese o spente, soglie, chiavi non segrete.

**Prima di tutto, mezza giornata di pulizia gia misurata** *(2 ore)*: rimuovere le due funzioni morte, unire le due funzioni gemelle, e aggiungere al deploy due controlli automatici (JavaScript valido, nessun nome duplicato, peso sotto il limite). Costa pochissimo e blocca in anticipo le tre cose che oggi arrivano in produzione senza avviso.

---

## 4. Themeli: cosa fare e cosa NON fare

Themeli/Top Market e gia strutturato bene (96 file PHP, include condivisi, autenticazione, ruoli, bacheca, ticket) ed e gia il posto giusto per lo **Studio tecnico**. Ma la tentazione da evitare e farne subito una console che governa tutto.

**Primo aggancio, uno solo: il registro dei rilasci** *(1 giorno, dopo il lancio)*.
Top Market ha gia il meccanismo di deploy: si aggiunge una tabella `releases` (progetto, versione, data, chi, cosa) e una schermata che mostra **lo stato di tutti i progetti in un colpo d'occhio**. Risolve un problema concreto e quotidiano: oggi le versioni vanno ricordate a mano in due posti diversi.

**Poi, e solo poi**, Themeli puo crescere per strati, uno per volta e solo quando serve:
1. registro rilasci (sopra)
2. lettura dei consumi e dei tetti (le tabelle esistono gia, manca la schermata)
3. interruttori centralizzati (dopo la MOSSA 3: la tabella e gia li)
4. registro delle decisioni: ogni scelta di prodotto scritta in una riga, non in una chat

**Cosa NON fare, mai:**
- riscrivere la webapp con un framework (React, Vue): mesi di lavoro, zero valore per l'utente, e perdi il vantaggio del "niente da compilare"
- microservizi o architetture distribuite: sei uno, non un reparto
- un pannello Themeli che duplica l'admin di POI•LOVE: l'admin governa i **contenuti**, Themeli governa la **tecnica**. Confonderli raddoppia il lavoro
- spostare i segreti dai segreti Supabase a una tabella: i segreti stanno dove sono

---

## 5. La sequenza consigliata rispetto al lancio (17/08)

| Quando | Cosa | Perche |
|---|---|---|
| **Dopo le presentazioni (17/07)** | pulizia 2 ore + MOSSA 1 (4 ore) | rischio zero, sblocca tutto il resto |
| **Settimana del 20/07** | MOSSA 2 (parole) + MOSSA 3 (interruttori) | da qui **modifichi da solo**, e hai le leve per il giorno del lancio |
| **Fine luglio** | controlli automatici al deploy + collegare le rotte utente al database (oggi vivono solo nel telefono) | rete di sicurezza prima del traffico vero |
| **Dopo il lancio** | spezzare `app.js` nei 15-20 file gia disegnati dai banner + registro rilasci su Themeli | lavoro grosso ma meccanico, si fa a mente fredda |

---

## 6. Cosa cambia per te, in pratica

Oggi: *"devo chiamare un'AI per cambiare una parola."*

Dopo 2,5 giorni: *"apro un file di sole frasi e cambio la parola"*, oppure *"apro il pannello e sposto un interruttore"*.

E il punto non e usare meno l'AI: e che **l'AI lavora dentro una struttura che puoi controllare**, invece di essere l'unica che sa dov'e la riga giusta. Le migliorie continuano ad arrivare in fretta, ma tu resti il proprietario della manopola.
