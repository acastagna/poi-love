<!--
© Alessandro Castagna : 321.al / EVOLAB
Tutti i diritti riservati. Uso non autorizzato vietato.
info@321.al · https://321.al
-->

# CONTRATTO DI LAVORO · POI•LOVE

> **Questa è la traccia ufficiale del progetto.** Ogni passo che facciamo è definito qui: cosa, in quale settore, con quale stato e quale tempistica. Si aggiorna a OGNI giro di lavoro, insieme a SAL.md (il diario) e TODO.md (la lista operativa).
> Versione app corrente: **2.51** (partenza ufficiale 2.00 il 04/07/2026). Lancio pubblico: **lunedì 17/08/2026, Tirana**.

## Le regole del contratto (valgono per ogni passo)

1. Un passo è FATTO solo se: scritto, validato, deployato, **verificato dal vivo**. Mai "dovrebbe funzionare".
2. Tutto il nuovo esce in **3 lingue** (SQ, IT, EN) con apertura automatica sulla lingua del telefono.
3. Niente trattini lunghi nei testi. Chiavi e segreti solo lato server. Passi atomici e reversibili.
4. Le tendine di scelta esistono SOLO sul campo indirizzo (ricerca manuale). I titoli li propone il sistema.
5. Ogni sessione chiude con: commit, tag se importante, SAL aggiornato, questo contratto aggiornato.
6. **Ogni passata pubblicata fa crescere la versione di 0.01** (costante APP_VERSION nella webapp, visibile nei footer). Il numero racconta quanta strada abbiamo fatto.

## Stato per settore

### 1. Webapp · creazione POI
| Passo | Stato | Quando |
|---|---|---|
| EXIF compila campi visibili, posizione obbligatoria, stop coordinate finte | ✅ Fatto e live | 04/07 |
| Titolo intelligente del luogo (capisce aeroporto/mall/museo, non la via) | ✅ Fatto e live | 04-05/07 |
| Titoli nella lingua dell'app (it/sq/en da OpenStreetMap) | ✅ Fatto e live | 05/07 |
| Tendina rimossa dal campo nome (resta solo sull'indirizzo) | ✅ Fatto e live | 05/07 |
| AI di compilazione RIMOSSA dal pannello POI (nome + descrizione) su richiesta founder 06/07: si scrive/detta a mano. La descrizione fact-based resta nel codice ma non e piu triggerata | ✅ Rimossa e live (v2.43) | 06/07 |
| Mini-mappa del punto POI nello sheet (zoom con le dita) | ✅ Fatto e live | 05/07 |
| Mini-mappa come strumento: mirino + "Fissa il punto" prende i riferimenti | ✅ Fatto e live | 05/07 |
| Versione visibile anche nel footer nero della mappa | ✅ Fatto e live | 05/07 |
| Scheda POI senza slot foto vuoti: + nel cerchio, foto a larghezza adattiva (1=100%, 2=50/50, 3=33x3) | ✅ Fatto e live | 05/07 |
| Titoli che dicono COS'È (tipo + nome + contesto, in lingua) | ✅ Fatto e live | 05/07 |
| Descrizioni AI sui FATTI (OSM+Wikipedia+Google: cosa/costi/come funziona, vietate le frasi vuote) | ✅ Fatto e live, da collaudare con login | 05/07 |
| Descrizione 200 caratteri nella fascia rossa del dettaglio POI (+ modifica inline del proprietario) | ✅ Fatto e live | 05/07 |
| Immagini licenziate del luogo (Wikimedia con attribuzione): proposta nel form, credito CC sulla foto, copilota le allega da solo | ✅ Fatto e live | 05/07 |
| Ricerca con correzione avanzata: fuzzy senza accenti, refusi fino a 2 lettere, "Forse cercavi" albanese istantaneo, Albania sempre prima, rotte cercabili | ✅ Fatto e live | 06/07 |
| Tassonomia POI a 3 livelli: L1 categoria RICCA data-driven (29 sottocategorie curate trilingui in tabella poi_categories, scelta singola, 6 gruppi con icone/colori), L2 luogo personale (esiste), L3 tag REALI salvati con autocomplete dalla community (RPC suggest_tags); mig 026-027 | ✅ Fatto e live (v2.24) | 06/07 |
| Categorie autoaggiornanti per analisi della richiesta: traccia in category_requests + UI admin "Categorie" (triage richieste raggruppate, Promuovi che precompila il form, gestione categorie attive/spente, salva su poi_categories); curation completa | ✅ Fatto e live | 06/07 |
| Lente: "Tocca mappa" apre la lente senza resettare i campi scritti ("Usa questo punto") | ✅ Fatto e live | 05/07 |
| Lente esploratore: vista IBRIDA (stradale+satellite 40%+etichette), POI reali dentro il cerchio, zoom ad anello orario/antiorario fino a livello mondo, titolo intelligente | ✅ Fatto e live | 05/07 |
| Lente: ghiera VISIBILE (48 tacche + segni piu/meno + suggerimento primo uso) e punti di interesse di GOOGLE col voto (OSM riserva) | ✅ Fatto e live | 05/07 |
| Scheda aperta = zero bottoni flottanti; titolo POI rinominabile in loco; indirizzo mai vuoto; MAI la via/citta come nome (blocco) | ✅ Fatto e live | 05/07 |
| Menu "+": Lente di ingrandimento al primo posto (precaricata, zoom medio-largo); "Sono qui: crea POI" RIMOSSO (il POI si crea dalla lente col bottone Salva) | ✅ Fatto e live | 06/07 |
| Lente NERA per visibilità: ghiera, mirino e campana neri, faccette chiare, frecce e +/− bianchi da obiettivo fotografico | ✅ Fatto e live | 06/07 |
| Box foto del form fluidi: un terzo della spalla ciascuno, quadrati, si adattano al ridimensionamento (via i 350px fissi che sbordavano) | ✅ Fatto e live (v2.22) | 06/07 |
| Teaser misterioso sul link POI condiviso: da sloggato foto sfocata + categoria + zona (mai nome o punto esatto) + gate di registrazione; dopo il login il POI si apre da solo (regge anche il giro OAuth) | ✅ Fatto e live | 06/07 |
| Menu "+": "Crea POI" (ex Segna un luogo) al primo posto, Lente al secondo; lente aperta SOLO su richiesta (tolto il long-press che la apriva da solo) | ✅ Fatto e live | 06/07 |
| POI dentro le liste: dettaglio con POI veri (miniatura+indirizzo), aggiungi dal picker, riordina con frecce (persistito), rimuovi, tocca e si apre sulla mappa; chip liste nel form creazione ora salvano davvero; FIX tabella giusta poi_lists (list_pois non esisteva: conteggi rotti da sempre); migrazione 022 policy UPDATE | ✅ Fatto e live (v2.20) | 06/07 |
| Filtri tag e categoria nella lista POI: chip categoria+tag, combinati con la ricerca | ✅ Fatto e live (v2.31) | 06/07 |
| Condivisione proprietaria: UN solo foglio POI•LOVE (Follower/Amici per i POI + WhatsApp/Telegram/Email/Facebook/X/Copia), instradati tutti i 9 punti (POI, lista, itinerario, luogo personale, lente, ILLI, contatto); tolto il menu di sistema del telefono ovunque (zero navigator.share) | ✅ Fatto e live (v2.25) | 06/07 |
| Timer 60s con coppa VERDE + frase gentile (3 lingue) FATTO; resta: togliere le immagini AI generate dalle foto POI (photo picker usa pollinations) | 🔶 Timer/coppa fatti, foto-AI da decidere | prossimi giri |
| Tendina rimossa dal nome TAPPA itinerario (tendine solo sull'indirizzo) | ✅ Fatto e live (v2.31) | 06/07 |
| TTS voci iperrealistiche esterne (serve chiave + deroga no-TTS) e tastiera assistita | ⬜ Studiato (memoria `lente_mappa_strumento`) | dopo il lancio |

### 2. ILLI (l'AI degli utenti)
| Passo | Stato | Quando |
|---|---|---|
| Solo utenti loggati, limiti giornalieri per livello, rimborso su errore | ✅ Fatto e live | 04/07 |
| Chat riparata dal 2° messaggio, errori gentili in 3 lingue | ✅ Fatto e live | 04/07 |
| Cerca nella città nominata nella domanda, non solo vicino a te | ✅ Fatto e live | 04/07 |
| Knowledge base admin a supporto di ILLI: tabella illi_knowledge (titolo, parole chiave, contenuto, lingua, attiva), pannello admin per crearle/modificarle, iniezione nel grounding quando la domanda contiene una parola chiave | ✅ Fatto e live (v2.28) | 06/07 |
| Collaudo descrizioni sui FATTI da utente loggato | ⬜ In attesa di Alessandro | adesso |
| Voce e audio (POIVOICE) | ⬜ Fase 2 | dopo il lancio |

### 3. Copilota e pannello admin
| Passo | Stato | Quando |
|---|---|---|
| Copilota che crea POI completi (descrizione da ricerca web, indirizzo vero) | ✅ Fatto e live | 04/07 |
| Sezione "POI creati": vedi, modifica, pubblica, elimina | ✅ Fatto e live | 04/07 |
| Storico chat del copilota | ✅ Fatto e live | 04/07 |
| Sicurezza: doppio fattore obbligatorio senza scappatoie | ✅ Fatto e live | 04/07 |
| Rotte storiche: sezione admin completa (crea/pubblica/tappe/rinomina/elimina) | ✅ Fatto e live | 05/07 |
| Sistema email + AcumbaMail (serve la chiave da Alessandro) | ⬜ Da fare | prima del lancio |
| Cambio tier utenti da admin (menu a tendina, RPC admin_set_user_tier sicura) + tier Professionista Plus + livello Influencer (badge dedicati nella webapp); vincolo DB ripulito (erano 2 CHECK in conflitto, ora 5 tier) | ✅ Fatto e live | 06/07 |
| Claim proprietà POI a pagamento: bottone webapp, allarme in admin con embed+nomi, approva/rifiuta, collaudato | ✅ Fatto e live | 05/07 |
| Categoria custom da "Altri" + zona "categorie più richieste" (rinomina e metti a sistema) | ⬜ Da fare | prima del lancio |
| Badge visivo: sigillo Ufficiale (POI+marker), In evidenza (POI featured+marker), Suggerito (autori Plus/Influencer/Mecenate) tutti live | ✅ Fatto e live (v2.29) | 06/07 |
| Pannello multi-provider AI (immagini e testo, chiavi server-side, provider per funzione) | ⬜ Da fare | prima del lancio |
| Biometrico WebAuthn: accenderlo dal dashboard Supabase (client già pronto) | ⬜ Da fare (manuale, 5 min) | quando vuoi |
| Codice di migrazione POI: cedi e riscatta (utenti e admin), collaudato end-to-end | ✅ Fatto e live | 05/07 |
| Modifica POI del proprietario con AUTOSAVE (foto max 3 su server, descrizione inline) | ✅ Fatto e live | 05/07 |

### 4. Backend, database e sicurezza
| Passo | Stato | Quando |
|---|---|---|
| Migrazioni 012-017 applicate (moderazione, copilota, chat, contatori, audit) | ✅ Fatto e verificato | 04/07 |
| Chiave AI solo server-side, file pubblico ripulito | ✅ Fatto e verificato | 04/07 |
| Collaudo automatico end-to-end (utente vero usa-e-getta) | ✅ Fatto | 04/07 |
| Backend blindato dopo audit: colonne POI sensibili solo via RPC, tier nuovi con limiti AI, referral corretto, category_requests solo via RPC, place-enrich protetto da rate limit per IP (150/h) e deployato LIVE (v10) da me via Management API | ✅ Fatto e live | 06/07 |
| Love count atomico: RPC toggle_love transazionale (mig 023), solo utenti loggati, contatore sempre esatto; bonus mig 024: love fuori dall audit (era rumore) e utenti eliminabili anche con audit | ✅ Fatto e live (v2.21) | 06/07 |
| Review avversariale del giorno (24 agenti): 16 difetti confermati e TUTTI corretti, tra cui il bottone love vero non agganciato alla RPC (i love sui POI altrui non si salvavano), XSS negli attributi delle miniature liste, love dei bannati (mig 025 con is_active + search_path blindato), policy anti-bannati mancanti su poi_lists, selezione chip persa al refresh token, pending con scadenza 7gg | ✅ Fatto e live (v2.23) | 06/07 |
| Cache Google Places su tabella (7-30 giorni, tiene bassi i costi) | ⬜ Da fare | prima del lancio |
| Soft-delete POI dal pannello + allineare database/schema.sql al DB vivo + UA Nominatim con contatto | ⬜ Da fare | prossimi giri |
| Minori: deep-link senza limit, listener avatar duplicati, dead code, i18n residui, cache PWA meno aggressiva | ⬜ Da fare | prossimi giri |
| Presence live compagnie (realtime Supabase) | ⬜ Da fare | dopo il lancio |
| Media server: DNS Plesk da riparare (piano B Supabase copre) · WebP pull Plesk | ⬜ Da fare | quando serve |
| App mobile Expo: push dei 17 file, test su device, build EAS | ⬜ Da fare | dopo il lancio |

### 5. Condivisione e landing
| Passo | Stato | Quando |
|---|---|---|
| Condivisione POI col teaser misterioso (zona + foto sfocata + registrati) | ✅ Fatto e live (v2.17) | 06/07 |
| Landing personale del profilo: vetrina su ?@nome da sloggato (copertina, avatar, bio, numeri veri POI/Love, Entra in POI•LOVE); dopo login o da ospite il profilo si apre da solo | ✅ Fatto e live (v2.19) | 06/07 |
| Rotte storiche VISIBILI agli utenti: mappa (linea+tappe) e lista nel tab Itinerari; prima rotta reale "Tirana Storica" pubblicata | ✅ Fatto e live (resta la landing /route/slug) | 05/07 |
| Frontend rotte utente V2 (tabella user_routes pronta, UI da costruire, flusso via AI) | ⬜ Da fare | prima del lancio |

### 7. Tier paganti e piattaforma (visione)
| Passo | Stato | Quando |
|---|---|---|
| Vantaggi tier UNO A UNO TUTTI FATTI: limiti ILLI, spunta, punti x2, POI in evidenza, Muro Sostenitori, itinerario in evidenza, adotta rotta, QR business | ✅ Fatto e live (v2.35) | 06/07 |
| Tier Professionista Plus + livello Influencer (badge colore nuovo) | ✅ Fatto e live (v2.27) | 06/07 |
| API pubblica / middleware per professionisti (tassisti, runner, Wolt, Patoko), import/export, webhook | ⬜ Visione studiata (memoria `poi_share_and_integrations`) | dopo il lancio |
| POI•LOVE come sistema di consegna (delivery) | ⬜ Visione | dopo il lancio |
| SOS sanitario con percorso preferenziale | ⬜ PROGETTO SEPARATO (deciso 28/06) | a parte |

### 6. Legale e lancio
| Passo | Stato | Quando |
|---|---|---|
| Termini e Privacy online in 3 lingue | ✅ Fatto e live | 27/06 |
| Testi legali allineati al codice reale (privacy+termini: media server, tag community, tracciamento categorie, cessione/reclamo POI, OAuth Facebook/Apple, tier Plus/Influencer; data 06/07) | ✅ Fatto e live | 06/07 |
| Validazione legale FINALE (legale): rimandata a dopo, non bloccante per il lancio (analisi testi gia fatta, testi allineati). Eda in pista quando sara il momento | 🕓 Rimandata (decisione 06/07) | dopo |
| Collaudo finale di Alessandro (checklist 5 prove) | ⬜ In attesa | adesso |
| Presentazione aggiornata su project.poilove.com (screenshot delle novità) | ⬜ Da fare | prima del lancio |
| OAuth: Facebook (App Review Meta) · Apple ($99/anno) | ⬜ Da fare | prima del lancio |
| ProductHunt + candidatura Claude for OSS | ⬜ Da fare | col lancio |
| Lancio pubblico Tirana | 🎯 Obiettivo | 17/08/2026 |

---
*Aggiornato: 05/07/2026 (inventario COMPLETO: raccolto tutto da TODO, SAL e memoria) · si aggiorna a ogni giro di lavoro*
