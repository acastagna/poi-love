# ORCHESTRAZIONE GO-LIVE POI•LOVE. Con premortem e impianto di postmortem tecnico
Ecosistema 321 / EvoLab. Redatto il 12/07/2026. Destinatari: founder (decisioni e contenuti) e Claude Code con Opus 4.8 (esecuzione tecnica).
Perimetro: app consumer poilove.com, pannello admin.poilove.com, backend Supabase (DB, RPC, edge, storage, auth con MFA), AI ILLI, media su CDN. Questo documento governa la messa online; la revisione funzionale del pannello resta in ORCHESTRAZIONE-ADMIN-POILOVE.md.

Principio: non si lancia una data, si lancia una checklist. La data arriva quando i cancelli sono verdi.

---

## PARTE A. Le quattro fasi

### Fase 0. Congelamento e cancelli (1-2 settimane prima)
Si chiude il perimetro: cosa è dentro il lancio e cosa è dichiaratamente dopo. Regola: dal congelamento in poi solo correzioni, nessuna funzione nuova.
Cancelli di uscita dalla fase (tutti verdi, verificati, non presunti):
1. **Sicurezza dati**: audit completo delle policy RLS su tutte le 19+ tabelle. Metodo: per ogni tabella, test automatizzato con tre identità (anonimo, utente normale, admin) che tenta lettura e scrittura; il risultato atteso è scritto accanto al risultato reale. Il bug Messaggi (T3 dell'orchestrazione admin) è il promemoria che le RLS si testano, non si suppongono.
2. **Segreti**: nessuna chiave lato client (ricognizione su tutto il codice), tutte le chiavi nei Segreti Supabase, rotazione delle chiavi usate durante lo sviluppo.
3. **Accessi**: MFA admin funzionante e procedura di recupero documentata (cosa succede se il founder perde l'authenticator: codici di recupero stampati e conservati; secondo admin di emergenza). Un lockout dell'unico admin al giorno 1 è un incidente da manuale.
4. **Backup e ripristino PROVATO**: backup automatici Supabase attivi secondo il piano in essere (VERIFICARE il piano attuale del progetto e la frequenza inclusa), più un export logico programmato fuori da Supabase (dump su storage proprio). Il cancello non è "il backup esiste": è "abbiamo ripristinato il backup su un progetto di prova e l'app funzionava".
5. **Tetti di spesa AI**: limiti per tier attivi e verificati con un test di superamento; tetto globale giornaliero sulla edge illi-chat e su admin-ai (il costo AI è l'unica voce che può scappare di mano in una notte).
6. **Legale**: privacy policy e termini pubblicati in IT/SQ/EN, cookie banner coerente con Matomo, registro trattamenti aggiornato (incluso il trattamento IP se già attivo). Lo studio ha la competenza interna: va solo formalizzato per POILOVE.
7. **Contenuti minimi**: il premortem P1 (sotto) dice perché questo è un cancello tecnico a tutti gli effetti. Soglia proposta, DA CONFERMARE dal founder: almeno 3 rotte storiche pubblicate complete di foto e narrazione, 50 POI curati su Tirana e dintorni, categorie ripulite, tag di prova eliminati (#prova, #prova e), knowledge di ILLI popolata sulle rotte pubblicate.

### Fase 1. Prova generale (una settimana)
Ambiente di produzione vero, pubblico non ancora invitato.
1. **Test di carico realistico**: simulazione di N utenti concorrenti su login, mappa, creazione POI, chat ILLI (N proposto: 200 concorrenti; DA CONFERMARE in base alle attese del lancio). Si misura: tempi di risposta, errori, consumo Supabase.
2. **Percorsi critici end-to-end, eseguiti a mano e filmati**: registrazione nuovo utente (con e senza Google), creazione POI con foto da mobile, salvataggio rotta, chat con ILLI nelle tre lingue, messaggio di supporto admin→utente e ritorno (il test che oggi fallisce), reset password, cancellazione account con verifica che i dati spariscano davvero (obbligo GDPR e test tecnico insieme).
3. **Deliverability email**: SPF/DKIM/DMARC pubblicati su Plesk per il dominio mittente, punteggio verificato con strumento esterno, email di benvenuto e reset che arrivano in inbox (non spam) su Gmail, Outlook e un provider albanese.
4. **Prova su dispositivi reali**: iPhone e Android di fascia media, rete mobile albanese e italiana, non solo il Mac di studio in wifi.
5. **Monitoraggio acceso PRIMA del pubblico**: uptime esterno su poilove.com e admin (con avviso su canale che il founder legge davvero), Matomo attivo, log errori delle edge function con avviso su soglia, cruscotto consumi Supabase (il blocco T1 del pannello) funzionante.
6. **Beta chiusa**: 10-20 persone reali invitate (rete 321, contatti fidati IT e SQ), con canale diretto per i difetti e 3-5 compiti assegnati (trova, crea, chiedi a ILLI). Due cicli di correzione.

### Fase 2. Lancio pubblico
1. **Lancio morbido, non botto**: apertura senza annuncio il giorno 0, annuncio sui canali (AltroStile come dorsale editoriale, rete 321, social) dal giorno 2-3 se i numeri della soft-open reggono. Il picco si sceglie, non si subisce.
2. **Presidio di lancio**: per i primi 3 giorni, finestre di presidio dichiarate (founder più Erion per la lingua): chi guarda il monitoraggio, chi risponde ai messaggi di supporto, chi decide un eventuale rollback.
3. **Criterio di stop dichiarato prima** (così la decisione non si prende nel panico): si sospendono le registrazioni se [errori su percorso critico sopra soglia / consumo Supabase oltre X% del piano / costo AI oltre il tetto giornaliero]. Sospendere le iscrizioni non è fallire: è la valvola.
4. **Pagina di stato semplice** (anche solo una pagina statica su Plesk, fuori da Supabase): se il backend soffre, si comunica da un'infrastruttura indipendente.

### Fase 3. Stabilizzazione (giorni 1-30)
1. Revisione quotidiana breve nei primi 7 giorni: numeri, errori, messaggi utenti, costi.
2. **Retrospettiva di lancio al giorno 7** e **postmortem tecnico programmato al giorno 30** (Parte C): si fanno comunque, anche se è andato tutto bene.
3. Solo correzioni per 2 settimane; le funzioni nuove riprendono dopo il postmortem del giorno 30, con le sue azioni in cima alla coda.

---

## PARTE B. Premortem tecnico

Esercizio: è il 12/09/2026 e il lancio di POILOVE è fallito. Perché? Le cause più probabili, in ordine di rischio (probabilità x danno), ciascuna con la contromossa già decisa. Le contromosse marcate [F0] e [F1] sono cancelli delle fasi sopra.

**P1. L'app era vuota.** I primi visitatori trovano 5 tag di prova e poche rotte: nessun motivo di tornare. È il fallimento più probabile e non è tecnico. Contromossa: cancello contenuti minimi [F0.7]; le prime rotte sono un lavoro editoriale del founder con gli strumenti del pannello, calendarizzato come un task di build, non "quando c'è tempo".

**P2. Il costo AI è esploso.** Qualcuno scopre ILLI, o un bot lo martella, e in una notte la bolletta del provider supera il budget del mese. Contromossa: tetti per tier più tetto globale giornaliero con spegnimento morbido ("ILLI torna domani") [F0.5]; rate limit sulle edge; CAPTCHA o verifica email sulla registrazione.

**P3. Una falla RLS ha esposto dati.** Un utente legge conversazioni o profili altrui; con la testata AltroStile in casa, il danno reputazionale è doppio. Contromossa: audit RLS a tre identità su ogni tabella [F0.1], ripetuto a ogni migrazione; il test è nel repo, non nella memoria.

**P4. Lockout amministrativo.** MFA obbligatorio più un solo admin: telefono perso il giorno del lancio, pannello inaccessibile. Contromossa: codici di recupero conservati offline, secondo profilo admin di emergenza, procedura scritta [F0.3].

**P5. Saturazione o sospensione Supabase.** Picco di iscritti o di media caricati: limiti del piano superati, progetto rallentato o bloccato proprio nel momento di massima visibilità. Contromossa: cruscotto consumi con soglie di avviso al 60 e all'80% [F1.5]; decisione presa PRIMA su quando passare di piano; media pesanti su CDN esterna per togliere l'egress dal conto; criterio di stop [F2.3].

**P6. Le email non arrivavano.** Benvenuto e reset in spam: gli utenti non completano la registrazione e il supporto si intasa. Contromossa: SPF/DKIM/DMARC verificati con punteggio esterno e prova su tre provider [F1.3].

**P7. Il supporto era rotto.** Il difetto già noto (messaggi admin→utente non recapitati) arriva in produzione: gli utenti scrivono nel vuoto. Contromossa: chiusura del bug T3 come prerequisito del congelamento, con test end-to-end filmato [F1.2].

**P8. Abuso e spam.** Registrazioni bot, POI spazzatura, immagini inappropriate. Contromossa: verifica email, rate limit sulle creazioni per utente nuovo, coda di moderazione funzionante e testata (T2), soglia oltre la quale i contenuti dei nuovi utenti nascono in bozza.

**P9. Perdita dati senza ritorno.** Errore umano o migrazione sbagliata, e il backup non era mai stato provato. Contromossa: ripristino provato su progetto di prova [F0.4], export logico esterno, migrazioni solo versionate.

**P10. Dipendenza da una sola persona.** Tutto il sapere operativo nella testa del founder: una settimana di indisponibilità ferma il progetto. Contromossa: runbook operativo (dove sono le chiavi, come si riavvia, chi si chiama), Erion istruito sulle operazioni base del pannello, documenti nel repo.

**P11. GDPR al primo reclamo.** Un utente chiede la cancellazione o si lamenta del tracciamento e manca la risposta pronta. Contromossa: cancellazione account funzionante e testata [F1.2], policy trilingue [F0.6], registro trattamenti aggiornato; la competenza privacy dello studio applicata a se stessi.

**P12. Il lancio ha funzionato, il telefono no.** Tutto regge tecnicamente ma l'esperienza mobile reale (rete lenta, foto pesanti da fotocamera) è frustrante. Contromossa: prova su dispositivi e reti reali [F1.4], compressione immagini lato client al caricamento, pesi delle pagine misurati.

Rilettura del premortem: sette dei dodici fallimenti (P2, P3, P4, P5, P6, P7, P9) si eliminano quasi del tutto con i cancelli della Fase 0. È il motivo per cui la data del lancio la fissano i cancelli.

---

## PARTE C. Impianto di postmortem tecnico

Due usi distinti dello stesso strumento.

### C1. Postmortem di incidente (quando qualcosa si rompe)
Regole: si scrive entro 48 ore dalla risoluzione; è senza colpevoli (si analizzano sistemi e processi, non persone); lo compila chi ha gestito l'incidente; finisce nel repo in /postmortem/AAAA-MM-GG-titolo.md; le azioni correttive entrano in coda di lavoro con un responsabile e una data, altrimenti il documento è un rito vuoto.

Modello (da copiare per ogni incidente):

```
# Postmortem: [titolo breve]
Data incidente: GG/MM/AAAA · Durata: [da/a] · Gravità: [1 critico / 2 serio / 3 minore]
Autore: · Data documento:

## Impatto
Chi e cosa è stato toccato, in numeri (utenti coinvolti, richieste fallite, dati persi: zero o quanti).

## Cronologia
Orari precisi: primo segnale, rilevazione (come ce ne siamo accorti: monitoraggio o segnalazione utente?),
diagnosi, mitigazione, risoluzione.

## Causa radice
Cosa è successo davvero, tecnicamente. La catena, non solo l'ultimo anello
(il "perché" ripetuto finché la risposta non è un sistema o un processo).

## Cosa ha funzionato
Cosa ci ha salvato o accorciato l'incidente (va scritto: è ciò che non bisogna smontare).

## Cosa non ha funzionato
Rilevazione tardiva? Runbook mancante? Backup non pronto? Decisione lenta?

## Fortuna
Cosa poteva andare molto peggio ed è andata bene per caso (la voce più istruttiva).

## Azioni correttive
| # | Azione | Tipo (previeni/rileva/mitiga) | Responsabile | Entro | Stato |
```

### C2. Postmortem di lancio programmato (giorno 30, si fa comunque)
Stesso spirito, domande diverse. Si confrontano le previsioni di QUESTO documento con la realtà:
1. Quali cancelli della Fase 0 si sono rivelati inutili, quali insufficienti?
2. Quali rischi del premortem si sono materializzati, in che forma? Quali fallimenti reali NON erano nel premortem (i più preziosi: sono i punti ciechi)?
3. Numeri contro attese: iscritti, contenuti creati, uso di ILLI, costi reali (Supabase, AI, CDN) contro stime.
4. Il criterio di stop è mai scattato o è mai stato vicino? La soglia era giusta?
5. Tre decisioni per i 90 giorni successivi, motivate dai dati (non dalle sensazioni).
Esito: aggiornamento di questo documento (i cancelli e il premortem si correggono con l'esperienza) e della coda di lavoro.

---

## PARTE D. Cose da decidere o verificare prima di partire (founder)

1. VERIFICARE: piano Supabase attuale del progetto POILOVE e cosa include (backup, limiti). Determina P5 e F0.4.
2. DECIDERE: soglia dei contenuti minimi (F0.7): la proposta 3 rotte / 50 POI va confermata o alzata.
3. DECIDERE: numeri attesi al lancio (per dimensionare il test di carico F1.1 e le soglie di stop F2.3).
4. DECIDERE: chi è il secondo admin di emergenza (F0.3) e il perimetro operativo di Erion nel presidio di lancio.
5. VERIFICARE: che la CDN per i media (Bunny, da vincolo di ecosistema) sia effettivamente in linea per POILOVE prima del lancio, o dichiarare che il lancio parte su storage Supabase con migrazione CDN pianificata (scelta legittima, ma va scritta).
6. DECIDERE: la data solo dopo che i cancelli di Fase 0 sono verdi.
