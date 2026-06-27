# SAL — Stato Avanzamento Lavori · POI•LOVE

> **Prossima ripresa: da definire.** Checkpoint sessione: `ae70c35` (HEAD su origin/main, 28/06/2026 notte).
> **Priorità prossima sessione (vedi TODO riscritto): landing profilo personale, condivisione POI col teaser, sistema email + AcumbaMail nell'admin, presentazione 1/07, validazione legale, Admin FASE 2.**

## Sessione 28/06/2026 (sera e notte) — ILLI, Itinerari, profilo, fix vari + TODO riscritto

Sessione lunghissima, tutto deployato e verificato dal vivo. Commit fino a `ae70c35`.

- **Itinerari: Liste → Rotte Storiche**. Sub-tab Liste rimosso (le liste sono gia nei POI), al suo posto Rotte Storiche con intro tematica + badge "presto disponibili", 3 lingue SQ/IT/EN.
- **Fix AI suggerimenti POI**: il "suggerisci nome" ora legge i locali reali da OSM (`_realNamesNear`) invece di inventare dal nome della via (caso "Contra della Ceramica" → "Pizzeria Scaligera"); la descrizione AI non allucina piu. Verificato dal vivo.
- **ILLI cerca davvero**: il grounding eredita la categoria dai messaggi precedenti (`_lastPlaceCatFromHistory`), i follow-up ("E domani?") continuano a cercare posti reali; il prompt vieta lo scarica-barile e le risposte vaghe. Verificato che il contesto si eredita.
- **Profilo snellito**: fascia "Come mi vedono" piu sottile; rimosse Le mie liste, Le mie rotte storiche, I miei tag; restano Connessioni e I miei POI. Handle apre solo la modifica handle (non piu "Diffondi"); handle sempre slug pulito (minuscolo, niente %20), il nome resta come scritto; la statistica "Liste" porta ai POI/Liste.
- **Mega-ricerca nel tab POI**: ogni riga ha `data-search` con nome+categoria+indirizzo+citta+descrizione+tag; `_poiSearch` cerca li dentro. Verificato dal vivo.
- **Termini/Privacy nel footer**: pulsanti bianchi ai lati del logo nel footer nero della mappa, e a pie di pagina nella schermata di accesso.
- **TODO.md riscritto** ordinato e prioritizzato.

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
