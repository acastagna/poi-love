<!--
© Alessandro Castagna : 321.al / EVOLAB
Tutti i diritti riservati. Uso non autorizzato vietato.
info@321.al · https://321.al
-->

# CONTRATTO DI LAVORO · POI•LOVE

> **Questa è la traccia ufficiale del progetto.** Ogni passo che facciamo è definito qui: cosa, in quale settore, con quale stato e quale tempistica. Si aggiorna a OGNI giro di lavoro, insieme a SAL.md (il diario) e TODO.md (la lista operativa).
> Versione app corrente: **2.00** (partenza ufficiale 04/07/2026). Lancio pubblico: **lunedì 17/08/2026, Tirana**.

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
| Descrizione AI dai dati reali, mai cancellare gli appunti | ✅ Fatto e live | 04/07 |
| Mini-mappa del punto POI nello sheet (zoom con le dita) | ✅ Fatto e live | 05/07 |
| Mini-mappa come strumento: mirino + "Fissa il punto" prende i riferimenti | ✅ Fatto e live | 05/07 |
| Versione visibile anche nel footer nero della mappa | ✅ Fatto e live | 05/07 |
| Scheda POI senza slot foto vuoti: + nel cerchio, foto a larghezza adattiva (1=100%, 2=50/50, 3=33x3) | ✅ Fatto e live | 05/07 |
| Titoli che dicono COS'È (tipo + nome + contesto, in lingua) | ✅ Fatto e live | 05/07 |
| Descrizioni AI sui FATTI (OSM+Wikipedia+Google: cosa/costi/come funziona, vietate le frasi vuote) | ✅ Fatto e live, da collaudare con login | 05/07 |
| Descrizione 200 caratteri nella fascia rossa del dettaglio POI (+ modifica inline del proprietario) | ✅ Fatto e live | 05/07 |
| Immagini licenziate del luogo (Wikimedia con attribuzione): proposta nel form, credito CC sulla foto, copilota le allega da solo | ✅ Fatto e live | 05/07 |
| Ricerca con correzione avanzata: fuzzy senza accenti, refusi fino a 2 lettere, "Forse cercavi" albanese istantaneo, Albania sempre prima, rotte cercabili | ✅ Fatto e live | 06/07 |
| Tassonomia POI a 3 livelli: categoria ricca curata + luogo personale privato + tag autocomplete (memoria `poi_taxonomy_plan`) | ⬜ Studiato, da fare (FASE A client, FASE B DB) | prima del lancio |
| Categorie autoaggiornanti per analisi della richiesta (data-driven, con curation admin) | ⬜ Studiato, da fare | dopo tassonomia |
| Lente: "Tocca mappa" apre la lente senza resettare i campi scritti ("Usa questo punto") | ✅ Fatto e live | 05/07 |
| Lente esploratore: vista IBRIDA (stradale+satellite 40%+etichette), POI reali dentro il cerchio, zoom ad anello orario/antiorario fino a livello mondo, titolo intelligente | ✅ Fatto e live | 05/07 |
| Lente: ghiera VISIBILE (48 tacche + segni piu/meno + suggerimento primo uso) e punti di interesse di GOOGLE col voto (OSM riserva) | ✅ Fatto e live | 05/07 |
| Scheda aperta = zero bottoni flottanti; titolo POI rinominabile in loco; indirizzo mai vuoto; MAI la via/citta come nome (blocco) | ✅ Fatto e live | 05/07 |
| Menu "+": Lente di ingrandimento al primo posto (precaricata, zoom medio-largo), "Sono qui" al secondo | ✅ Fatto e live | 06/07 |
| POI dentro le liste (openListDetail: aggiungi/rimuovi/riordina) | ⬜ Da fare | prima del lancio |
| Filtri tag e categoria nel profilo (tocco un tag, vedo solo quelli) | ⬜ Da fare | prossimi giri |
| Condivisione proprietaria (foglio POI•LOVE unico, mai il menu di sistema, oggi in ~8 punti) | ⬜ Da fare | prima del lancio |
| Timer 60s con coppa verde / frase gentile; via le immagini AI dal POI (SPECS) | ⬜ Da fare | prossimi giri |
| Tendina residua sul nome TAPPA itinerario da bonificare (tendine solo sull'indirizzo) | ⬜ Da fare | prossimi giri |
| TTS voci iperrealistiche esterne (serve chiave + deroga no-TTS) e tastiera assistita | ⬜ Studiato (memoria `lente_mappa_strumento`) | dopo il lancio |

### 2. ILLI (l'AI degli utenti)
| Passo | Stato | Quando |
|---|---|---|
| Solo utenti loggati, limiti giornalieri per livello, rimborso su errore | ✅ Fatto e live | 04/07 |
| Chat riparata dal 2° messaggio, errori gentili in 3 lingue | ✅ Fatto e live | 04/07 |
| Cerca nella città nominata nella domanda, non solo vicino a te | ✅ Fatto e live | 04/07 |
| Knowledge base admin a supporto di ILLI (voci per luoghi che l'AI non capisce, iniettate nel grounding) | ⬜ Da fare | prima del lancio |
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
| Cambio tier utenti da admin + tier Professionista Plus + livello Influencer | 🔶 Vincolo DB sistemato (4 tier ammessi), UI admin da fare | prima del lancio |
| Claim proprietà POI a pagamento: bottone webapp, allarme in admin con embed+nomi, approva/rifiuta, collaudato | ✅ Fatto e live | 05/07 |
| Categoria custom da "Altri" + zona "categorie più richieste" (rinomina e metti a sistema) | ⬜ Da fare | prima del lancio |
| Badge visivo elementi UFFICIALI (rotte, POI, liste) + "in evidenza"(Pro) e "suggerite"(Plus) | ⬜ Da fare | prima del lancio |
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
| verify_jwt esplicito per funzione (config.toml versionato) | ⬜ Da fare | prossimo giro |
| Love count atomico (RPC, oggi race condition) | ⬜ Da fare | prossimi giri |
| Cache Google Places su tabella (7-30 giorni, tiene bassi i costi) | ⬜ Da fare | prima del lancio |
| Soft-delete POI dal pannello + allineare database/schema.sql al DB vivo + UA Nominatim con contatto | ⬜ Da fare | prossimi giri |
| Minori: deep-link senza limit, listener avatar duplicati, dead code, i18n residui, cache PWA meno aggressiva | ⬜ Da fare | prossimi giri |
| Presence live compagnie (realtime Supabase) | ⬜ Da fare | dopo il lancio |
| Media server: DNS Plesk da riparare (piano B Supabase copre) · WebP pull Plesk | ⬜ Da fare | quando serve |
| App mobile Expo: push dei 17 file, test su device, build EAS | ⬜ Da fare | dopo il lancio |

### 5. Condivisione e landing
| Passo | Stato | Quando |
|---|---|---|
| Condivisione POI col teaser misterioso (zona + immagine AI + registrati) | ⬜ Da fare | prima del lancio |
| Landing personale del profilo (sfondo + avatar + Entra in POI•LOVE) | ⬜ Da fare | prima del lancio |
| Rotte storiche VISIBILI agli utenti: mappa (linea+tappe) e lista nel tab Itinerari; prima rotta reale "Tirana Storica" pubblicata | ✅ Fatto e live (resta la landing /route/slug) | 05/07 |
| Frontend rotte utente V2 (tabella user_routes pronta, UI da costruire, flusso via AI) | ⬜ Da fare | prima del lancio |

### 7. Tier paganti e piattaforma (visione)
| Passo | Stato | Quando |
|---|---|---|
| Vantaggi tier UNO A UNO (memoria `tier_benefits`): punti x2, POI in evidenza, Muro Sostenitori, adotta rotta, QR business, itinerario in evidenza Mecenate | 🔶 In parte (limiti ILLI per tier FATTI, spunta verifica FATTA) | prima del lancio |
| Tier Professionista Plus + livello Influencer (badge colore nuovo) | ⬜ Da fare | prima del lancio |
| API pubblica / middleware per professionisti (tassisti, runner, Wolt, Patoko), import/export, webhook | ⬜ Visione studiata (memoria `poi_share_and_integrations`) | dopo il lancio |
| POI•LOVE come sistema di consegna (delivery) | ⬜ Visione | dopo il lancio |
| SOS sanitario con percorso preferenziale | ⬜ PROGETTO SEPARATO (deciso 28/06) | a parte |

### 6. Legale e lancio
| Passo | Stato | Quando |
|---|---|---|
| Termini e Privacy online in 3 lingue | ✅ Fatto e live | 27/06 |
| Validazione legale dei testi (professionista) | ⬜ Da fare | prima del lancio |
| Collaudo finale di Alessandro (checklist 5 prove) | ⬜ In attesa | adesso |
| Presentazione aggiornata su project.poilove.com (screenshot delle novità) | ⬜ Da fare | prima del lancio |
| OAuth: Facebook (App Review Meta) · Apple ($99/anno) | ⬜ Da fare | prima del lancio |
| ProductHunt + candidatura Claude for OSS | ⬜ Da fare | col lancio |
| Lancio pubblico Tirana | 🎯 Obiettivo | 17/08/2026 |

---
*Aggiornato: 05/07/2026 (inventario COMPLETO: raccolto tutto da TODO, SAL e memoria) · si aggiorna a ogni giro di lavoro*
