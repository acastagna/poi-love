# SAL — Stato Avanzamento Lavori · POI•LOVE

## Sessione 23/06/2026

### 🎯 Data di lancio pubblico FISSATA
- **17 agosto 2026 (lunedì)** — data ottimale Kairos (score 74/100). È lo stesso "Lancio Tirana" prima previsto a giugno, spostato. Allineati `CLAUDE.md`, `README.md` (IT/EN/SQ) e creato `TIMELINE.md`.

### 🔐 Accessi — diagnosi completa + fix
Mappato tutto il sistema di login in `demo/index.html` e verificata la config Supabase via Management API.
- **Stato reale provider** (Management API): `email`, `google`, `linkedin_oidc`, `x` attivi con credenziali; `facebook`/`apple` off. Site URL + Redirect allow-list già corretti su poilove.com.
- ✅ **Fix X**: il codice chiamava `provider:'twitter'` (OAuth1, spento) invece di `'x'` (OAuth2, attivo) → login X era rotto, ora riparato.
- ✅ **Fix biometria**: rimosso `prompt()` nativo (rotto su iOS PWA) → focus sul campo email + toast.
- ✅ **Hardening**: `getSession()` con fail-safe; `signOut()` pulisce i marker (privacy device condiviso).
- ✅ **Facebook/Apple**: bottoni mostrati come "presto" (disattivati), in attesa dei prerequisiti.
- Aggiunta i18n `auth_soon` (it/sq/en). Sintassi JS verificata, fix testati in preview.
- **Login funzionanti ora: 5** (email/magic link, Google, LinkedIn, X, biometria).

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
- ✅ Webapp spostata da demo.poilove.com → poilove.com (live)
- ✅ Groq key rimossa dal sorgente HTML — spostata in config.js server-only (gitignore)
- ✅ Supabase: Site URL → poilove.com, Redirect URLs aggiornati via Management API
- ✅ demo.poilove.com → redirect automatico a poilove.com
- ✅ URL hardcoded aggiornati da demo.poilove.com a poilove.com nel codice
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
