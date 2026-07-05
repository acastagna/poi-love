# TODO — POI•LOVE
> Aggiornato: **05/07/2026** · L'INVENTARIO COMPLETO e ufficiale e' CONTRATTO.md (questo file e' la lista operativa) · Stato: review completa fatta, 51 fix deployati e verificati live (webapp+admin+2 edge+2 migrazioni), tag `checkpoint-2026-07-04`. Lancio pubblico **17/08**.
> 🔒 Regola di ferro su TUTTO il nuovo: tre lingue perfette, ordine **SQ → IT → EN**, apertura automatica sulla lingua del device. Niente trattini lunghi. Chiavi/segreti solo server-side. **Ogni modifica chiude il giro: scrivi → valida → deploya → verifica live.**

---

## ⚡ SUBITO (dalla sessione 04/07)

- [ ] **Collaudo di Alessandro (checklist in chat del 04/07)**: EXIF che compila i campi, salvataggio bloccato senza posizione, ILLI dal 2° messaggio in poi, copilota che crea POI completo (descrizione+indirizzo+coordinate), sezione "POI creati" nel pannello.
- [ ] **Claim proprietà POI a pagamento** (memoria `poi-ownership-and-media`): pulsante "reclama questo luogo" SOLO tier paganti → allarme in admin con embed code + nome richiedente + nome cedente. Tabella `poi_ownership_requests` + RLS + UI admin.
- [ ] **Immagini licenziate del luogo** (Wikimedia Commons API, licenza CC + attribuzione) nel POI creato dal copilota e come proposta nella webapp.
- [x] **Descrizione 200 char nella fascia rossa del dettaglio POI** — FATTO 05/07 (+ modifica inline del proprietario con autosave).
- [ ] **`supabase/config.toml` versionato con `verify_jwt` esplicito per funzione** (nota della review: oggi il comportamento dipende dal default del deploy).
- [ ] Minori rimandati dalla review: soft-delete POI dal pannello (oggi hard delete con audit), allineare `database/schema.sql` al DB vivo (visibility text, non enum), UA Nominatim con contatto anche nella webapp.

---

## 🔥 PROSSIMI GRANDI PEZZI (in ordine)

> Roba grossa che tocca DB, generazione pagine o integrazioni esterne: si fa lucidi, un mattone alla volta, con verifica live.

1. [x] **Mega-ricerca POI nel profilo** — FATTO 28/06, verificata. — barra sopra "I miei POI" che cerca su **nome + descrizione + indirizzo + tag + categoria** (non solo testo visibile). Stessa logica estesa agli altri punti dove si cercano POI (tab POI, ecc.). Solo frontend. *(in lavorazione autonoma 28/06 notte)*

2. [ ] **Condivisione POI col gate (teaser misterioso)** — DESIGN COMPLETO, vedi memoria `poi-share-and-integrations`. Per il SINGOLO POI l'anteprima NON mostra titolo, foto reale né indirizzo: solo la **zona** ("Qualcuno ti aspetta al Blloku di Tirana") + un'**immagine AI** evocativa + CTA "registrati per scoprire tutto". Dopo la registrazione si rivela tutto. Diverso dalla landing itinerario. Richiede: migration (stato `shared` + `share_token` su pois + RPC anteprima SECURITY DEFINER), landing nella SPA, 3 lingue. *(migration da applicare con OK)*

3. [ ] **Landing profilo personale (invito)** — pagina generata per OGNI profilo, da inviare alle persone: **sfondo** del profilo + **avatar** nel cerchio al centro + "Entra in POI•LOVE" col logo. Si aggancia all'handle e al referral. Solo frontend (genera dai dati del profilo). *(in lavorazione autonoma 28/06 notte)*

4. [ ] **Sistema email nell'admin + AcumbaMail** (primo mattone del middleware) — generatore di **template** per le mail (inviti, link di condivisione) + connessione via **webhook** ai servizi di mail automation, estendibile, primo provider **AcumbaMail**. Chiavi provider solo server-side. *(serve chiave AcumbaMail da Alessandro)*

5. [ ] **Presentazione aggiornata** su `project.poilove.com` con un eccellente set di screenshot delle novità (admin con MFA, ILLI coi voti Google, lente mappa, Itinerari/Rotte, profilo, Privacy/Terms). Verso il 1/07.

---

## 🗺 Schermata POI "dove si trova" + lente (28/06 notte — memoria `poi-location-and-lens`)

> Diagnosi fatta sul codice: tab in `setLocTab` (riga 7856), tap mappa in `_mapTapLocHandler` (7906), lente in `openLens` (4769).

- [x] **GPS** — FATTO 04/07 (flusso verificato, posizione reale): verificare il flusso `setLocTab('gps')` → `reverseGeocodeAndShow`, che mostri la posizione reale e non resti in caricamento.
- [x] **Foto EXIF** — FATTO 04/07 (itera tutte le foto finche una ha il GPS, campi visibili) (`applyExifToForm` deve leggere la prima immagine con GPS, non aspettare un tab).
- [x] **Indirizzo Albania-first** — FATTO 28/06. — alle chiamate Nominatim del tab indirizzo (`locAddrIn`) aggiungere priorità Albania (es. `countrycodes=al` + una seconda query globale, AL primi); se l'utente nomina altri paesi, dare **anche** quei risultati.
- [ ] **Tocca mappa → lente** *(fix mirato)* — oggi `_mapTapLocHandler` mette solo un pin; deve invece **aprire la lente** (`openLens`) sul punto toccato, **senza resettare** i campi già scritti (nome, descrizione).
- [ ] **Lente intercetta i POI (pezzo grosso)** — oggi la lente fa solo reverse-geocode del punto. Deve elencare i **POI reali vicini**: DB POI•LOVE + OSM/Overpass (riuso `_fetchRealPlaces`) + Google Places (`place-enrich`). TripAdvisor/Facebook: niente API pubbliche facili, da valutare con onestà.

## 🟠 Admin FASE 2 (richieste 27-28/06 — vedi memoria `admin-phase2-requirements`)

> Un mattone alla volta, DB/RLS dove serve. Chiavi AI solo nei secret/proxy.

- [x] **Icone Phosphor duotone ovunque** + **tema chiaro/scuro** con interruttore sole/luna — FATTO 28/06, online su admin.poilove.com.
- [x] **Copilota AI AGENTICO** — FATTO 28/06: migration 014 (ai_proposals, POI bozza, RPC apply_ai_proposal), edge con 5 tool (query_data/historic_analysis READ; propose_poi/route/project WRITE), UI proposte nel pannello (Approva/Rifiuta). Motore verificato end-to-end (proposta approvata → POI bozza). L'AI propone, l'admin approva.
- [ ] **Sezione Rotte Storiche**: gestione delle rotte ufficiali dal pannello.
- [ ] **Scheda icone/badge elementi ufficiali**: rotte, POI, liste + "in evidenza" (= **Professionista Pro**) e "suggerite" (= **Professionista Plus**, NUOVO tier da creare nello schema).
- [x] **Visibilità POI "ufficiale"** nel form admin — FATTO 04/07 *(resta il BADGE visivo degli ufficiali)* (oltre a privato/community/suggerito). Schema: `official` tra le visibility o flag `is_official`.
- [ ] **Categoria custom da "Altri"**: scegliendo "Altri" si crea una categoria al volo, l'admin la mette a sistema.
- [ ] **Zona "categorie più richieste"**: classifica delle categorie richieste (incluse le custom); rinomina + ufficializzazione. Collega il piano tassonomia POI.
- [ ] **Area di conoscenza a supporto AI** (knowledge base): voci per luoghi che l'AI non capisce, scritte a mano o da AI, iniettate nel grounding di ILLI.
- [ ] **Pannello multi-provider AI**: API configurabili da admin per immagini (avatar/sfondi) e testo/suggerimenti, chiavi server-side, assegnazione provider per funzione.
- [ ] **Biometrico WebAuthn**: accendere il provider MFA WebAuthn dal dashboard Supabase (l'API ha dato 422); il client e gia pronto.

---

## 🔵 Verso la presentazione 1/07 (da SPECS)

- [ ] **POI dentro le liste**: `openListDetail` non carica ancora i `list_pois` (aggiungi/rimuovi/riordino).
- [ ] **Schermata POI (SPECS)**: togliere le immagini AI dal POI; categorie personalizzabili e opzionali; timer 60s (coppa verde / frase gentile arancione). *(il "suggerisci nome" reale e gia fatto 27/06)*
- [ ] **Menu "+"** come elenco di azioni (crea POI / segna luogo / tappa / compagnia), non il mirino diretto.
- [ ] **Filtri tag e categoria nel profilo**: tocco un tag/categoria, vedo solo i POI con quello.
- [ ] **Condivisione proprietaria**: foglio POI•LOVE unico e curato, mai `navigator.share` (oggi in ~8 punti).
- [ ] **Validazione legale Privacy/Terms** con un consulente prima del lancio (le bozze sono live, marcate "da validare").
- [ ] **Google Places: cache** (tabella Supabase 7-30 giorni) per tenere bassi i costi a scala.

### Blocco "Lente + UX input" (memoria `lente_mappa_strumento`)
- [x] A. Lente-strumento sulla mappa (long-press) — COMPLETA 25/06
- [x] B. Bottoni dentro i campi (Suggerisci/Detta/Scrivo io) — COMPLETA 25/06
- [x] C. Fix dettatura iOS — COMPLETA 25/06
- [ ] D. Voci TTS iperrealistiche via servizio esterno (serve chiave + billing, deroga alla regola no-TTS-esterno)
- [ ] E. Tastiera assistita (basi a scorrimento Piazza/Via/Contrada… + riga numeri stile Waze)

### Altri moduli
- [ ] **Presence live compagnie**: layer realtime Supabase per stato online membri.
- [ ] **Frontend rotte utente V2**: flusso creazione via AI (tabella `user_routes` pronta, UI da costruire).
- [ ] **Meccanismi tier paganti**: implementare uno a uno i perks (AI rate-limit per tier, punti x2 Mecenate, verifica profilo, POI in evidenza, adotta rotta, QR business).

---

## 🟢 FATTO nella maratona 27-28/06

- [x] **PANNELLO ADMIN** (`admin.poilove.com`) costruito da zero: sottodominio + SSL + no-cache, login Google (estetica "cammino", multilingua), pannello `panel.html` a 7 sezioni (dashboard, moderazione, utenti, limiti AI, copilota Claude, crea POI/percorsi, audit log).
- [x] **DB admin** (migration 012, applicata): ruolo `is_admin`, moderazione utenti, `reports`, `admin_audit_log`, limiti AI per tier, RLS solo-admin via `is_admin()` SECURITY DEFINER, `is_active()` (ban effettivo via policy RESTRICTIVE), RPC `admin_set_user_status`, trigger anti-tamper esteso. Alessandro promosso admin.
- [x] **Proxy AI admin** (`admin-ai`): gate is_admin + aal2, tetto di spesa giornaliero, Claude/gpt-4o, service_role mai esposta.
- [x] **MFA forte** (migration 013): authenticator TOTP (enroll + challenge, verificato dal vivo) + enforcement aal2 server-side su `is_admin()` e sul proxy AI. Biometrico WebAuthn nel client (da abilitare lato Supabase).
- [x] **Termini e Privacy aggiornati e online** (`poilove.com/terms`, `/privacy`): sub-responsabili Google/OpenAI/Anthropic/Supabase, moderazione, abbonamenti, trasferimenti. Restano "bozza da validare".
- [x] **Fix AI suggerimenti POI**: "suggerisci nome" legge i locali reali da OSM (`_realNamesNear`), non inventa piu dalla via ("Contra della Ceramica" → "Pizzeria Scaligera"); descrizione AI non allucina piu.
- [x] **ILLI cerca davvero**: il grounding eredita il contesto sui follow-up ("E domani?" continua a cercare); prompt che vieta scarica-barile ("cerca tu nella tab POI") e risposte vaghe.
- [x] **Itinerari: Liste → Rotte Storiche** (Liste gia nei POI), intro tematica + badge "presto" in 3 lingue.
- [x] **Profilo snellito**: fascia "Come mi vedono" piu sottile; tolte Le mie liste/Rotte storiche/I miei tag; restano Connessioni + I miei POI; handle apre solo la modifica handle (non piu "Diffondi"); handle sempre slug pulito (minuscolo, niente %20); stat "Liste" porta ai POI/Liste.
- [x] **Termini/Privacy nel footer**: pulsanti bianchi ai lati del logo nel footer nero della mappa + a pie di pagina nella schermata di accesso.

---

## 🧹 Debiti tecnici / minori

- [ ] **Love count atomico** — race condition in `toggleLove` (riga ~6543), serve RPC atomica.
- [ ] **Query deep-link senza `.limit()`** — scarica tutta la tabella pois.
- [ ] **Avatar addEventListener leak** — listener duplicati a ogni generazione AI.
- [ ] **Dead code**: `stopCoords`, `_photoPrompt`, `openUserRowProfile`; container nascosti (liste/rotte/tag) nel profilo da rimuovere del tutto quando sicuri.
- [ ] **i18n minori**: varianti POI "non trovato", ambiente avatar ILLI, tooltip "rotta ufficiale" ancora in IT.
- [ ] Valutare cache PWA meno aggressiva (così le modifiche si vedono senza svuotare a mano).

## 🔌 OAuth
- [x] Google · [x] X (fix provider `x`) · [x] LinkedIn OIDC
- [ ] Facebook (serve App Review Meta) · [ ] Apple Sign In (serve Service ID + $99/anno)

## 🏗 Infra
- [ ] Compressione WebP upload (manca Plesk pull) · riparare `media.poilove.com` (DNS Plesk rotto, piano B Supabase copre)
- [ ] Cloudflare R2 immagini oltre 10k utenti · GoTrue self-hosted a scala alta
- [ ] App Expo (React Native): push 17 file TS, test su device

## 🚀 Lancio
- [ ] ProductHunt (con app mobile pronta) · Candidatura Claude for OSS (5000 stelle)

---

## ✅ Completati (storico, ultimi 30 giorni)

- [x] Falla follow (RLS) chiusa (mig 011): `follows_select` ristretta ai coinvolti — 25/06
- [x] Tre modi su nome/descrizione POI (Suggerisci AI / Detta / Scrivo io), i18n IT/SQ/EN — 25/06
- [x] Microfono dettatura nella chat ILLI (speech-to-text), i18n — 25/06
- [x] Bottone "Svuota cache" in SOS (cache + SW + sessionStorage, senza sloggare) — 25/06
- [x] Generazione AI avatar/sfondi via Flux (Pollinations), verificata — 25/06
- [x] GPS mirino con causa reale dell'errore + cache posizione — 25/06
- [x] Tier ristrutturati (Professionista forte, Mecenate potenziato), i18n completo — 25/06
- [x] Fix z-index popup (stacking dinamico MutationObserver) — 24/06
- [x] i18n ~220 chiavi nuove IT/SQ/EN — 24/06
- [x] Frontend itinerari su Supabase (`saveNewTrip`, `syncTripsFromDB`, `_persistTripStops`) — 24/06
- [x] Mig 007 `trip_stops.note` · Mig 008 RPC `replace_trip_stops` (race drag risolta) — 24/06
- [x] Follow persistente (mig 009) · Rotte utente (mig 010) — 24/06
- [x] Backend compagnie (mig 005) + frontend FASE A/B (inviti email, join `?join=CODE`) — 24/06
- [x] Backend itinerari (mig 006) · Bug `is_public` vs `visibility` su `lists` corretto — 24/06
- [x] Fix XSS escape nomi lista + map popup · Liste hardcoded rimosse — 24/06
- [x] Gamification backend end-to-end (mig 001-003, RLS, trigger, RPC) — 24/06
- [x] Foto POI funzionanti (bucket `poi_photos` verificato) — 24/06
