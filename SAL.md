# SAL — Stato Avanzamento Lavori · POI•LOVE

## Sessione 24/06/2026 (notte) — BACKEND avviato + workflow code-quality
- **Migrazione 001 gamification** applicata a Supabase e versionata in `supabase/migrations/`: tabelle `gamification_config` (punti per azione e soglie livelli, regolabili da admin), `point_events` (log azioni, anti-abuso), `referrals` (inviti). Colonne nuove su `profiles`: `points`, `special_tier`, `referred_by`.
- **RLS blindate**: trigger `protect_gamification_columns` impedisce al client di auto-assegnarsi punti/tier; scrittura punti solo server-side (service_role). Referral creabili solo a proprio nome.
- **Workflow code-quality attivato** (richiesto dal founder): la prima stesura aveva 2 BLOCKER di sicurezza RLS, scovati dall'agente e corretti prima di toccare il DB. Da ora ogni migrazione/codice importante passa da code-quality.
- **Push a ogni passaggio** ripristinato come regola (errore del giorno: 41 commit accumulati senza push; ora salvati su GitHub + tag `checkpoint-2026-06-24`).
- Prossimi passi backend: Edge Function per accredito punti server-side; aggancio frontend (badge legge `points` reali, referral scrive in `referrals`); tabelle `companions`/`trips`/`follows`/rotte-utente; email HTML invito; liste pubbliche POI.

## Sessione 24/06/2026 (pomeriggio) — Fase 1 avviata: UI proprietaria

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
- ✅ Modalità demo (bottone + `enterDemoMode`) rimossa, l'app richiede login reale
- ✅ 3 utenti finti (@test.com) → stati vuoti onesti, pronti per Supabase `follows`
- ✅ Compagnie di viaggio finte → solo quelle reali
- ✅ Immagini AI (Pollinations/Flux): foto POI rimosse del tutto (slot vuoto col "+"); avatar e sfondo scollegati da Pollinations, l'opzione AI resta come "in arrivo con motore di qualità"
- ✅ Array `POIS` hardcoded (5 POI Tirana) svuotato → i POI reali vengono da Supabase
- ✅ Statistiche `Math.random()` + bio fissa nel profilo pubblico → neutre, da caricare da Supabase
- ✅ Avatar di default col nome del founder → neutro
- ✅ Testi UI che citavano "Flux" → puliti
- Itinerari (`TRIPS`) già vuoti da prima.

Restano (minori, NON finti): pulsanti "prossimamente" (onesti), dead code residuo da ripulire (`stopCoords`, `_photoPrompt`, `openUserRowProfile`).

**Deploy LIVE**: webapp pulita su poilove.com, verificata al 100% (zero demo, zero POI finti, zero @test.com, zero Pollinations, zero stats random). La verifica live ha scovato e rimosso altre 4 POI card hardcoded (sezione "I miei POI" + anteprima profilo pubblico) che il postmortem aveva mancato, più stringhe i18n demo e CSS morto. Backup del precedente in `/root/bak-httpdocs-index-20260624.html`.

## Sessione 23/06/2026

### 🚀 SVOLTA: da prototipo a PRODOTTO REALE + Visione (sera 23/06)
**Postmortem** (vedi `POSTMORTEM.md`): code review completo, 8 BLOCKER + 14 MAJOR. Verdetto: la webapp era una vetrina, infrastruttura vera ma dati quasi tutti finti (utenti @test.com, POI hardcoded, statistiche `Math.random()`, modalità demo, immagini AI scadenti). **Decisione del founder: trasformarla in prodotto REALE.**

**Backend reso più reale stasera:**
- ✅ Bucket Supabase `poi_photos` creato + policy (fallback foto). Primario resta media.poilove.com (verificato sano, DNS ora risolve supabase.co).
- ✅ Catena upload foto pronta a funzionare end-to-end.

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
- **Avatar e sfondo** generabili con AI di QUALITÀ (opzione), oltre a upload, colori e sfumature.

**Pulizia richiesta** (ancora da fare): via tutto il finto, love-count atomico, `prompt()` sostituiti da editing inline.

### 🎯 Data di lancio pubblico FISSATA
- **17 agosto 2026 (lunedì)** — data ottimale Kairos (score 74/100). È lo stesso "Lancio Tirana" prima previsto a giugno, spostato. Allineati `CLAUDE.md`, `README.md` (IT/EN/SQ) e creato `TIMELINE.md`.

### 🔐 Accessi — diagnosi completa + fix
Mappato tutto il sistema di login in `webapp/index.html` (ex `webapp/`) e verificata la config Supabase via Management API.
- **Stato reale provider** (Management API): `email`, `google`, `linkedin_oidc`, `x` attivi con credenziali; `facebook`/`apple` off. Site URL + Redirect allow-list già corretti su poilove.com.
- ✅ **Fix X**: il codice chiamava `provider:'twitter'` (OAuth1, spento) invece di `'x'` (OAuth2, attivo) → login X era rotto, ora riparato.
- ✅ **Fix biometria**: rimosso `prompt()` nativo (rotto su iOS PWA) → focus sul campo email + toast.
- ✅ **Hardening**: `getSession()` con fail-safe; `signOut()` pulisce i marker (privacy device condiviso).
- ✅ **Facebook/Apple**: bottoni mostrati come "presto" (disattivati), in attesa dei prerequisiti.
- Aggiunta i18n `auth_soon` (it/sq/en). Sintassi JS verificata, fix testati in preview.
- **Login funzionanti ora: 5** (email/magic link, Google, LinkedIn, X, biometria).

### 🌐 project.poilove.com — sbloccato e live in HTTPS
Era bloccato (`domains.status=2`, "subscription suspended") perché creato il 22/06 mentre l'account Plesk era sospeso → nessun comando standard lo sbloccava (catch-22: client/customer --on, webspace-on, toggle, repair, tutti falliti). **Risolto** ricreando il sottodominio pulito: backup → `subdomain --remove` → `--create` (rinato `status=0`) → ripristino file dal backup + `chown` → SSL Let's Encrypt. Ora **project.poilove.com è live in HTTPS** con la presentazione marketing (cert valido fino al 21/09/2026). Causa+fix salvati in memoria (`plesk_subdomain_stuck_status2`).

### 🔘 Pagina marketing (`web/index.html`) — rimossa la parola "demo"
- ✅ Bottone hero "Apri la Demo" → **"Apri POI•LOVE"**; link aggiornato a **`https://poilove.com`**.
- ✅ Meta aggiornata a "🌐 poilove.com"; sub-testo "Apri la demo" → "Apri l'app".
- ⏳ Da deployare su project.poilove.com (path nuovo, richiede ok deploy).

### 🗓️ Date allineate
- **Finestra presentazioni — Tirana: 13–17 luglio 2026** (nuova milestone in `TIMELINE.md`).
- Lancio pubblico confermato **17 agosto 2026**; corretta la tappa nella timeline marketing da "Lug 2026" → "Ago 2026".

## Sessione 21/06/2026

### Fatto
- ✅ X (Twitter) OAuth attivato su Supabase
- ✅ LinkedIn (OIDC) OAuth attivato su Supabase
- ✅ Code review completo: trovati 6 BLOCKER + 8 MAJOR (vedi TODO.md sezione bug)
- ✅ Fix: marker Leaflet duplicati ad ogni login OAuth
- ✅ Fix: deep-link `name` → `name:title` (link condivisione POI erano rotti)
- ✅ Fix: query deep-link aggiunto `.limit(500)`
- ✅ Fix: `toggleLoveDB` — `sb.rpc()` usato erroneamente come valore, ora legge count reale dal DB
- ✅ Fix: GPS watcher leak in `startLocShare` — `locShareWatchId` salvato e pulito
- ✅ Feature: bottone "Sono qui — crea POI" nel FAB menu (GPS → form precompilato)
- ✅ Feature: AI descrizione POI migliorata con coordinate, categorie, prompt unicità
- ✅ Bottone AI rinominato "Suggerisci"
- Decisione: passare direttamente a poilove.com ufficiale, eliminare demo quando pronti

### Sessione 22/06/2026 — migrazione live

- ✅ project.poilove.com creato su Plesk con pagina marketing
- ✅ Webapp portata live su poilove.com
- ✅ Groq key rimossa dal sorgente HTML — spostata in config.js server-only (gitignore)
- ✅ Supabase: Site URL → poilove.com, Redirect URLs aggiornati via Management API
- ✅ Vecchio sotto-dominio temporaneo dismesso (tutto su poilove.com)
- ✅ URL hardcoded aggiornati a poilove.com nel codice
- ✅ Ricerca mappa migliorata: luoghi + vie separate, icone per tipo, correzione spelling AI
- ✅ Deploy autonomo abilitato via rsync file singolo

### 🗓️ Data di lancio app mobile (Kairos — Framework Esoterico Integrato)

Analisi condotta con il calcolatore Kairos (kairos/calcolatore-data-favorevole.html) applicando il framework a 6 livelli sul nome "POI LOVE".

**Calcolo Destiny caldeo**: P(8)+O(7)+I(1)+L(3)+O(7)+V(6)+E(5) = **37** → base **1** (Leadership Solare, Compound 37 "Buona Sorte negli Affetti")

**Vincolo critico luglio 2026**: Mercurio retrogrado 29/06–23/07, shadow ±5gg → penalità -60 su tutti i giorni 1–28 luglio. Solo i giorni 29–31 luglio sono liberi. Ulteriore problema: la Luna Piena cade il ~29 luglio (-30) colpendo anche gli ultimi giorni del mese.

**Data suggerita per luglio — 29 luglio 2026 (mercoledì)**
- Primo giorno post-shadow Mercurio ✓
- Universal Day = 28→1 = Destiny (risonanza piena +25)
- ⚠ Compound giorno 29 = "Prove e Tradimenti" (avverso, -25): i due si bilanciano
- Luna: gibbosa crescente giorno ~14 (neutro, non ancora piena)
- Raggio: Mercurio/R4 +4 | Ora Venere disponibile alle 6:00 +8
- **Score framework: +12 (accettabile, non eccellente)**

**Data ottimale assoluta — 17 agosto 2026 (lunedì)** *(se si vuole posticipare al mese successivo)*
- Luna nuova giorno 3 (+25) — massima apertura per la semina
- Universal Day = 26→8, complementare a Destiny 1 (+12)
- Compound 17 = "Stella dei Magi" — molto favorevole (+25)
- Nessuna retrogradazione attiva ✓
- Ora di Venere disponibile alle 12:00 +8
- **Score framework: 74/100 — uno dei più alti possibili**

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
