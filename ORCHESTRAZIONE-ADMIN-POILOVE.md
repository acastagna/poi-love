# ORCHESTRAZIONE. Revisione del pannello Admin POI•LOVE
Ecosistema 321 / EvoLab. Redatto il 12/07/2026. Destinatario: Claude Code con Opus 4.8.
Base di partenza: ADMIN-STATO.md dell'11/07/2026 (pannello reale, 15 sezioni, 19 tabelle e 22 RPC verificate su Supabase live), più le richieste del founder del 12/07/2026 e due screenshot (barra Dashboard senza padding; contatore usi dei tag illeggibile).

Principio guida: il pannello ha una base solida. Non si riscrive: si estende per componenti riusabili. Ogni task ha criteri di accettazione. Le decisioni marcate DA DECIDERE vanno chieste al founder prima di implementare, non ipotizzate.

---

## PARTE A. Componenti trasversali (si costruiscono una volta, li usano tutti)

### A1. Scheda POI completa riusabile (drawer/popup)
L'editor ricco di "Modifica POI" esiste già (foto con lightbox, rendi principale, upload/URL, 3 categorie a chip, tag, indirizzo con geocodifica bidirezionale, coordinate). Va estratto in un componente unico richiamabile da ovunque: Dashboard (click sugli ultimi POI), sezione POI, pulsante Crea POI, proposte del Copilota.
- Il componente ha due modalità: crea e modifica, stessa interfaccia.
- Aggiunte rispetto all'editor attuale: selettore badge (vedi A3) e assegnazione a utente registrato (vedi A3).
- Criterio di accettazione: da qualunque punto del pannello si apre la STESSA scheda completa; nessun form ridotto sopravvive.

### A2. Scheda Utente completa riusabile
Profilo identico a quello dell'app (avatar, tier, gamification, contenuti creati, segnalazioni, conversazioni di supporto), in un drawer richiamabile da: Dashboard (ultimi iscritti), Utenti, Moderazione, Messaggi.
- Modalità assistenza: l'admin vede ciò che vede l'utente per aiutarlo, più i comandi admin (tier, stato, messaggia).
- Include: IP di registrazione e ultimo accesso (vedi T1 e nota privacy in Parte D).
- Criterio: click su qualunque utente ovunque nel pannello apre questa scheda.

### A3. Sistema badge e assegnazione (componente unico)
Richiesto identico su POI, Itinerari, Percorsi Storici, Compagnie:
- Badge: "Ufficiale" oppure un livello di utenza (i tier dell'app: sostenitori, professionisti, ecc.).
- Assegnazione: affidare il contenuto a un utente registrato (ricerca utente, l'autore accreditato diventa lui).
- Implementazione: colonne uniformi sulle entità (badge_type, badge_tier, assigned_user_id) più una RPC server-side admin_set_badge_and_owner con scrittura in admin_audit_log.
- Criterio: stesso selettore, stesso comportamento, su tutte e quattro le entità.

### A4. Elaboratore immagini unico
Richiesto in: Crea (tutti i pannelli), POI, OpenGraph, Media, Knowledge. Un solo componente con queste sorgenti e funzioni:
1. Sorgenti: upload dal computer; URL; ricerca da internet; generazione via AI; scelta dalla libreria Media interna (A5). Sempre possibile cambiare la scelta.
2. Elaborazione: ritaglio libero, quadrato, 16:9 e preset 1200x630 (OpenGraph); compressione con anteprima del peso (obiettivo esplicito: file leggeri per WhatsApp e Telegram); regolazioni colore di base; sovrascritta testo.
3. Uscita: salvataggio nella libreria Media con varianti (originale, compressa, ritagliata).
- DA DECIDERE (founder): fonte per la ricerca immagini da internet. Opzioni con licenza pulita: Openverse (Creative Commons), Wikimedia Commons, Unsplash API. Non usare scraping generico di Google Immagini: rischio diritti sulle foto pubblicate.
- DA DECIDERE (founder): motore di generazione AI immagini. Coerenza di ecosistema: fal.ai è già il gateway generativo dello studio (SKUADRA); proposta di default fal.ai via edge function, chiave nei Segreti.
- Criterio: lo stesso popup immagini compare identico in ogni sezione che tocca una foto.

### A5. Libreria Media interna (media kit)
Area centrale per loghi, foto, immagini generate: caricamento, cartelle o tag, richiamo da editor email, landing, OpenGraph, schede POI, Knowledge.
- Tabella media_assets su Supabase Storage, con metadati (peso, dimensioni, varianti).
- Criterio: qualunque campo immagine del pannello ha il pulsante "dalla libreria".

### A6. Tema a 6 palette
Tre famiglie di colore (calda, neutra, fredda) per ciascuna delle due modalità (chiaro, scuro): sei combinazioni totali, selezionabili dal setting personale (A7) con anteprima.
- Implementazione: variabili CSS a livello di root, un solo file di definizione palette; nessun colore hardcoded nelle sezioni (bonifica dove serve).
- Include la correzione dei difetti visivi rilevati: padding e rifinitura della barra superiore della Dashboard (screenshot 1); contrasto e spaziatura del contatore usi nei Tag (screenshot 2).

### A7. Impostazioni personali dell'admin/moderatore
Zona settings nella pagina dell'utente loggato: cambio email e password, palette e luminosità preferita (A6, persistita per utente), lingua base dell'interfaccia (IT/SQ/EN), immagine avatar (via A4), fuso orario, notifiche interne (nuove segnalazioni, nuovi messaggi), gestione MFA (stato TOTP, ri-tentativo passkey/biometria che aveva dato errore 422).

---

## PARTE B. Task per sezione

### T1. Dashboard
1. Ultimi POI cliccabili: aprono la scheda completa A1 in modifica. TASSATIVO: scheda completa, non riassunto.
2. Ultimi iscritti cliccabili: aprono la scheda utente A2.
3. Barra superiore: padding, allineamento e rifinitura (screenshot 1); coerente con A6.
4. Nuovo blocco "Stato del server e consumi", con:
   - Peso dello storage media (totale e per bucket) e banda consumata: da API Supabase Storage e metriche di progetto.
   - Consumo Supabase del progetto (database, storage, egress, edge invocations) rispetto ai limiti del piano: via Supabase Management API se disponibile con le credenziali correnti; altrimenti il blocco mostra i dati recuperabili e un link diretto alla pagina Usage del progetto, senza inventare numeri.
   - Ultimi iscritti con IP di registrazione (vedi nota privacy, Parte D).
- Criterio: nessun numero stimato; ogni valore ha la sua fonte reale o dichiara "non disponibile da API".

### T2. Moderazione
Oggi la sezione appare vuota perché non esistono segnalazioni nel database: non è un guasto. Interventi:
1. Stato vuoto onesto e utile: spiega cosa comparirà qui e come nasce una segnalazione nell'app.
2. Comando "genera segnalazione di prova" (solo admin, marcata test, eliminabile) per verificare l'intero flusso.
3. Verifica end-to-end del percorso app → reports → pannello con un test reale.

### T3. Messaggi (BUG PRIORITARIO)
Difetto riscontrato dal founder: il messaggio inviato dall'admin non arriva all'utente selezionato. Diagnosi da fare in ordine:
1. Verificare la RPC admin_send_support_message: scrittura effettiva, thread corretto, RLS che consenta all'utente destinatario di leggere il messaggio (causa più probabile: policy di lettura lato utente).
2. Verificare che l'app utente mostri il thread di supporto e abbia una notifica (badge o push) all'arrivo.
3. Test di accettazione: admin invia da pannello, utente riceve e visualizza su app entro pochi secondi, il segnato-letto torna indietro.
- Finché il test non passa, la sezione va marcata internamente come non affidabile.

### T4. Utenti
1. Click sull'utente apre la scheda A2 completa (profilo identico all'app più comandi admin).
2. Restano le azioni attuali (tier, sospendi, banna, messaggia) dentro la scheda.

### T5. Limiti AI e motori di ILLI
1. Nuovo pannello motori: elenco provider con stato (configurato / non configurato), attiva, salva, disconnetti. Per ciascuno: mini-guida in pannello con passi e link ufficiale alla pagina delle chiavi API (stesso stile già usato per i Pixel).
   - Provider da includere: OpenAI, Anthropic, Google (Gemini), Mistral, più DA DECIDERE (founder) eventuali altri (OpenRouter come aggregatore? xAI? DeepSeek?).
   - Le chiavi vivono SOLO nei Segreti Supabase, scritte tramite edge function dedicata; il pannello non vede mai il valore, mostra solo "configurata il [data]".
2. Sistema livelli clienti: editor dei tier allineato a quello dell'app (sostenitori, professionisti, ecc.), con possibilità di: rinominare i tier, cambiarne i limiti AI (messaggi/giorno, token, modello) e i parametri di gamification. Fonte unica: gamification_config; l'app legge da lì, così pannello e app restano sincronizzati.
- Criterio: cambiare un limite nel pannello cambia il comportamento dell'app senza deploy.

### T6. Copilota
1. Connessione con chiave propria: il Copilota usa il provider e la chiave scelti in T5 (o una chiave dedicata), sempre via edge admin-ai, mai dal browser.
2. Modalità intervento diretto: oltre a proporre, il Copilota può compilare e modificare direttamente nella piattaforma. Architettura: tool-calling della edge admin-ai su un elenco chiuso di RPC ammesse (crea bozza POI, compila campi, aggiorna descrizioni, gestisci tag), con queste regole di sicurezza:
   - Azioni creative/compilative: esecuzione diretta con notifica in pannello e riga in admin_audit_log con attore "copilota".
   - Azioni distruttive o di moderazione (elimina, banna, cambia tier, pubblica ufficiale): restano a proposta con Approva/Rifiuta.
- Criterio: ogni azione del Copilota è tracciata e reversibile; l'elenco delle RPC ammesse è in configurazione, non nel prompt.

### T7. Crea: i quattro pulsantoni
Quattro pulsanti grandi, ciascuno apre un popup con lo strumento completo:
1. **Crea POI**: scheda ufficiale completa (componente A1 in modalità crea, quindi con foto/upload, EXIF dalla foto, indirizzo con geocodifica, tag), più badge e assegnazione (A3).
2. **Crea Itinerario**: l'editor itinerario completo al massimo delle funzioni (tappe, trascina, foto via A4, descrizioni AI), più badge e assegnazione (A3).
3. **Crea Percorso Storico**: strumento dedicato alle rotte storiche, curato esteticamente (copertina, badge Ufficiale/Indispensabile, tappe con foto e narrazione, modo linea/strada), riusando l'editor rotte esistente come base.
4. **Crea Compagnia**: strumento per la creazione delle compagnie, con badge e assegnazione (A3).
   - ATTENZIONE Code: verificare se l'entità "compagnie" esiste già nello schema (tabella, relazioni con POI/utenti). Se non esiste, proporre al founder lo schema minimo (nome, descrizione, logo via A4, contatti, POI collegati, utente assegnatario) PRIMA di creare la migrazione. Non inventare campi di business.
- Criterio comune: ogni contenuto creato da qui è riapribile nel suo pannello completo per correzioni (nessun contenuto orfano di editor).

### T8. POI
1. Ogni POI dell'elenco apre il pannello completo A1 (già quasi vero: uniformare).
2. Aggiunta di badge e assegnazione (A3) nell'editor e come colonna/filtro in elenco.

### T9. Categorie
1. Layout a tre colonne per compattezza.
2. Schede per macrocategoria (le famiglie già in schema) più la scheda "Tutte".
3. Resta tutto il funzionamento attuale (custom categories con soglia 20, approvazioni).

### T10. Tag
1. Correzione del difetto visivo (screenshot 2): il contatore usi ("x1") è quasi invisibile; serve contrasto pieno, spaziatura corretta e stile coerente.
2. Layout a tre colonne, stessa qualità visiva delle Categorie.
3. Restano le azioni attuali (evidenzia, blocca, rinomina/fondi, elimina).

### T11. Conoscenza di ILLI
1. **Libri PDF**: caricamento fino a 150 MB, estrazione testo, spezzettamento e vettorializzazione. Architettura proposta: Supabase Storage per il file, pgvector per gli embedding, edge function di ingestione asincrona con stato di avanzamento visibile (i 150 MB non si processano in una richiesta sola).
   - DA DECIDERE (founder): provider degli embedding (OpenAI, Google, Mistral), coerente con i motori di T5.
2. **Multilingua**: la conoscenza vale per IT, SQ, EN. Ogni voce ha lingua sorgente e traduzioni collegate; pulsante "traduci in albanese/inglese" via AI con revisione prima del salvataggio. ILLI risponde pescando nella lingua dell'utente.
3. **Notizia singola assistita**: inserimento di una notizia con AI che aiuta a generarla e a ricercarla (ricerca web via edge, bozza proposta, l'admin approva).
4. **Immagini nella conoscenza**: possibilità di allegare immagini (via A4) che ILLI mostrerà in chat con bordi arrotondati e ombra (stile definito una volta nel componente chat dell'app).

### T12. Media (il cantiere più grande della revisione)
1. **Editor email e landing vanity drag-and-drop**: costruttore a blocchi (testo, immagine dalla libreria A5, pulsante, spaziatore, intestazione con logo dal media kit), non complicato ma completo, sul modello degli strumenti di mail automation (riferimento dichiarato: AcumbaMail). Salvataggio come template email (email_templates) e come landing pubblicabile.
   - DA DECIDERE (founder): dominio di pubblicazione delle landing vanity (sottodominio di poilove.com? short domain dedicato?).
   - Scelta tecnica proposta a Code: valutare una libreria open source di email building a blocchi prima di scrivere un editor da zero; motivare la scelta nel repo.
2. **OpenGraph**: immagine pescabile dalla libreria A5, caricabile ed elaborabile con A4; ritaglio libero, quadrato, 16:9 e 1200x630; compressione con anteprima peso perché l'immagine renda bene su WhatsApp e Telegram.
3. **Deep link**: oltre allo strumento attuale, una guida in pannello che spiega cosa sono le sorgenti e i parametri UTM (testo base in appendice E1 di questo documento), con esempi precompilati e link generati corretti.
4. **Pixel**: revisione di controllo (ID, manuali, link ufficiali): verificare che le istruzioni per ciascun social siano attuali.
5. **SMTP configurabile**: in alternativa ad AcumbaMail, possibilità di configurare un SMTP proprio (host, porta, utente, password nei Segreti, TLS), con invio di prova. Il selettore "motore di invio" sceglie tra AcumbaMail API e SMTP.
6. **Guida Segreti e deliverability in pannello**: sezione di aiuto con i passi esatti per: mettere ACUMBA_KEY (o le credenziali SMTP) nei Segreti Supabase; configurare SPF e DKIM sul dominio mittente. Testo base in appendice E2. Nota per Code: i record DNS del mittente si configurano su Plesk (server.321.it), dove lo studio gestisce le zone.

### T13. Impostazioni personali (vedi A7)
Implementazione della zona settings per admin e moderatori.

---

## PARTE C. Ordine di build e dipendenze

Fase 0, fondamenta (prima di tutto):
- A6 tema a 6 palette con bonifica colori, incluse le due correzioni visive (topbar Dashboard, contatore Tag). Sblocca subito la qualità percepita.
- A1 scheda POI riusabile e A2 scheda utente riusabile.
- A3 badge/assegnazione (migrazione più RPC).
- A4 elaboratore immagini e A5 libreria media (A4 dipende da A5 per il salvataggio).

Fase 1, correzioni ad alto impatto:
- T3 bug Messaggi (prioritario dichiarato).
- T1 Dashboard (click-through più blocco consumi).
- T10 Tag e T9 Categorie (piccoli, chiudono i difetti visivi).
- T2 Moderazione (stato vuoto e test end-to-end).

Fase 2, creazione e contenuti:
- T7 i quattro pulsantoni di Crea (dipende da A1, A3, A4; per Compagnie serve la decisione schema).
- T8 POI (estensione badge).
- T4 Utenti (dipende da A2).

Fase 3, intelligenza e media:
- T5 pannello motori AI e tier (prima di T6 e T11 che ne dipendono).
- T6 Copilota con intervento diretto.
- T11 Knowledge (PDF, multilingua, notizie, immagini).
- T12 Media (editor drag-and-drop per ultimo: è il pezzo più grande e non blocca nulla).

Fase 4, rifiniture:
- T13/A7 impostazioni personali, biometria/passkey (ritentare l'abilitazione che dava 422), pulizia e documentazione.

---

## PARTE D. Regole di build (vincolanti per Code)

1. Nessuna chiave o segreto lato client, mai: tutte le chiavi (AI, AcumbaMail, SMTP, fal.ai) nei Segreti Supabase, usate solo da edge function. Il pannello mostra al massimo "configurata il [data]".
2. Ogni azione delicata resta su RPC server-side con controllo admin più aal2, come già impostato. Ogni nuova azione scrive in admin_audit_log.
3. Niente innerHTML grezzo (standard già rispettato: mantenerlo).
4. Componenti riusabili in file separati: la scheda POI, la scheda utente, l'elaboratore immagini e il selettore badge esistono in UNA sola implementazione. Se panel.html (4060 righe) rende difficile la modularità, proporre al founder una scomposizione in moduli JS senza cambiare stack, PRIMA di procedere.
5. Test di accettazione per ogni task come descritti; il bug T3 ha priorità e va chiuso con test riproducibile.
6. Migrazioni database sempre come file versionati; nessuna modifica manuale allo schema live.
7. Decisioni architetturali annotate nel CLAUDE.md del repo.
8. Nota privacy (IP degli iscritti, T1): la raccolta e l'esposizione degli IP nel pannello è un trattamento di dati personali. Va annotata nel registro trattamenti di POILOVE con base giuridica (legittimo interesse: sicurezza e antifrode) e retention definita. Lo studio ha già la pratica privacy interna: allineare, non improvvisare.
9. Lingue: interfaccia del pannello predisposta IT/SQ/EN coerente con la regola dell'ecosistema (il selettore IT/SQ/EN esiste già in testata).

---

## PARTE E. Appendici: testi base per le guide in pannello

### E1. Cosa sono sorgenti e parametri UTM (testo per la guida Deep link)
I parametri UTM sono etichette aggiunte in coda a un link per sapere da dove arriva chi lo clicca. Si leggono poi nelle statistiche (Matomo, pixel social). I cinque parametri standard:
- utm_source: la sorgente, cioè il luogo dove il link è stato pubblicato (esempio: instagram, newsletter, whatsapp).
- utm_medium: il mezzo, cioè il tipo di canale (esempio: social, email, referral, cpc per la pubblicità a pagamento).
- utm_campaign: il nome della campagna (esempio: lancio_rotte_estate2026).
- utm_content: quale variante del contenuto (esempio: post_a, post_b, storia).
- utm_term: la parola chiave, usata quasi solo nelle campagne a pagamento.
Esempio completo: https://poilove.com/rotta/berat?utm_source=instagram&utm_medium=social&utm_campaign=lancio_rotte_estate2026&utm_content=storia
Regole pratiche: sempre minuscolo, niente spazi (usare il trattino basso), stessi nomi sempre uguali altrimenti le statistiche si spezzano. Il generatore del pannello deve comporre l'URL da menu a tendina con i valori già usati, per evitare refusi.

### E2. Segreti Supabase, AcumbaMail, SPF e DKIM (testo per la guida Media)
**Cosa sono i Segreti.** I Segreti (secrets) di Supabase sono variabili protette lette solo dalle edge function sul server: il posto giusto per le chiavi API. Mai incollare una chiave nel pannello o nel codice del sito.
**Dove si mettono.** Dashboard Supabase del progetto → Edge Functions → Secrets (oppure da terminale: supabase secrets set ACUMBA_KEY=valore). Documentazione ufficiale: https://supabase.com/docs/guides/functions/secrets
**La chiave AcumbaMail.** Si genera dal proprio account AcumbaMail (area API: https://acumbamail.com → sezione API/Integrazioni del proprio profilo) e si salva nei Segreti come ACUMBA_KEY. Da quel momento il pannello mostrerà il motore come configurato.
**SPF e DKIM, perché servono.** Sono due record DNS sul dominio del mittente che dicono al mondo "questo servizio è autorizzato a spedire posta a mio nome". Senza, le email finiscono in spam.
- SPF: un record TXT sul dominio che elenca i server autorizzati (AcumbaMail o il proprio SMTP). Il valore esatto lo fornisce il servizio di invio nella propria documentazione.
- DKIM: una firma crittografica; il servizio di invio fornisce un record TXT (o CNAME) da pubblicare sul DNS.
**Dove si configurano nel nostro caso.** I DNS dei domini dello studio sono gestiti su Plesk (server.321.it, nameserver ns1/ns2.321.al): i record TXT di SPF e DKIM si aggiungono lì, sulla zona del dominio mittente. Dopo la pubblicazione, verificare con l'invio di prova del pannello e con un controllo esterno (esempio: mail-tester.com).
**DMARC (consigliato).** Terzo record TXT che dice ai destinatari cosa fare se SPF/DKIM falliscono; partire con p=none per monitorare senza bloccare.

---

## PARTE F. Domande aperte per il founder (da chiudere prima delle fasi indicate)

1. Fonte per la ricerca immagini da internet (A4, serve in fase 0): Openverse, Wikimedia, Unsplash API, o combinazione. Vincolo: licenze utilizzabili commercialmente.
2. Motore di generazione immagini AI (A4, fase 0): confermare fal.ai come default di ecosistema.
3. Elenco definitivo dei provider AI per ILLI (T5, fase 3): base proposta OpenAI, Anthropic, Google, Mistral; aggiungere altri?
4. Provider embedding per la vettorializzazione dei PDF (T11, fase 3).
5. Schema dell'entità Compagnie (T7, fase 2): campi di business e relazioni.
6. Dominio di pubblicazione delle landing vanity (T12, fase 3).
7. Retention degli IP degli iscritti (T1/D8): quanto tempo si conservano.
