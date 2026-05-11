# POI•LOVE — CLAUDE.md
> Leggi questo file per intero prima di ogni sessione. È la fonte di verità del progetto.
> Vedi anche `STORICO-LAVORI.md` per il registro cronologico delle sessioni.

---

## 🟢 STATO AL 11/05/2026 sera — Beta-ready per Tirana

**Partenza utente**: 12/05/2026 per Tirana, presentazione SAL finestra 13-17/05.

**HEAD GitHub `main`**: `3bc28c0`
**Commit di oggi (11/05) — 16 push su origin/main**:
```
3bc28c0 fix(demo): ILLI•AI tab — testata duplicata rimossa + residuo blu fixato
fcc8445 feat(demo): nuova mascot ILLI•AI (PNG Midjourney v8.1)
6e610ca fix(demo): doppio tap su mobile — detector custom su click event
1a93074 fix(demo): matita Modifica POI + modal al centro + sub-livelli scelta itin/rotta
5e4ae06 fix(demo): chat ILLI•AI riempie altezza fino a 5px sopra il FAB
c104503 feat(demo): doppio clic/tap mappa → popup OSM con 4 azioni (reverse geo)
f6513fb feat(demo): nav picker (Apple/Google/Waze) + modal Aggiungi/Condividi + askIlliAbout + dblTap dev
048e70a feat(demo): photo picker mobile semplificato + compagni/liste/autore POI cliccabili
a3b6dd4 feat(demo): map search bar (POI locali + Nominatim) con marker + 4 azioni
32c7aa6 feat(demo): photo source desktop-aware + inversione File/Rullino mobile
b35d8ab feat(demo): ILLI•AI place suggestions con 4 azioni + map-types allineati
8e89c40 feat(demo): photo picker → popup centrale 2 quadrati
1720f30 chore(demo): brand-strip logo height 20→14px
fa82eb8 chore(demo): brand-strip usa logo-bianco.png (1000x188 RGBA)
187c0b9 fix(demo): sposta fascia brand in basso, topbar trasparente
881fcbb feat(demo): fascetta nera v1 + foto griglia 33% + stat tap-nav + sub-tab Liste
```

**Stato live siti**:

| URL | Live HEAD | Note |
|---|---|---|
| https://demo.poilove.com/ | `47fb29b` (10/05) | **DA PULLARE** su Plesk — 16 commit nuovi |
| https://poilove.com/ | `04e2e71` (08/05) | da pullare |
| https://sal.poilove.com/ | `04e2e71` (08/05) | da pullare |
| https://media.poilove.com/test.php | 503 | DNS server-side rotto (pre-esistente) |

**Branch backup ancora attivo**:
- `origin/wip/2026-05-10-task7-auth` → `4f38c83` (feature in attesa di re-merge: salvataggio profilo Supabase, upload media, diagnostica boot, migration SQL — molte già reimplementate o riassorbite oggi).

### 📋 Quick start prossima sessione (in ordine, post-Tirana)

1. **Leggere `STORICO-LAVORI.md` sezione 11/05** per il dettaglio completo della giornata
2. **Leggere REGOLE HARD** sotto in questo file (non negoziabili dopo incident 10/05)
3. **Plesk pull `demo/`, `web/`, `sal/`** per allineare i sotto-domini al HEAD GitHub `3bc28c0`
4. **Bloccanti del briefing rimasti** (richiedono Supabase auth attivo):
   - Test Google OAuth live sul demo (`signInWithGoogle()` già esiste, mai testato dopo restyle)
   - Salvataggio reale profilo (avatar/cover/bio/lists/follows)
   - Upload foto via media.poilove.com con fallback Supabase Storage
   - Migration SQL `002_profile_cover.sql` (Supabase SQL Editor)
5. **Setup altri OAuth provider** (bottoni X/LinkedIn/Facebook esistono ma danno errore "provider not configured"):
   - X (Twitter) — gratis, ~10-15 min
   - LinkedIn OIDC — gratis, ~10 min
   - Facebook — gratis ma richiede privacy policy + App Review Meta, ~15-25 min
   - Apple Sign In — RIMANDATO a giugno (lancio Tirana, $99/anno Developer)
6. **Rotte storiche con AI** (V2): data model `routes`, flow ILLI•AI per creazione, editor tappe, landing `/route/slug` — già linkato da modal "Crea nuova rotta con ILLI•AI" nel popup OSM
7. **Fix DNS server-side media.poilove.com** (SSH server): `8.8.8.8` in `/etc/resolv.conf`
8. **App Expo**: push 17 file TypeScript già scaffolded, test su device, build EAS

### ⚠️ Quello che la prossima sessione NON deve fare senza ack

- Modificare `.github/workflows/*.yml`
- Eseguire `gh secret set`, `gh workflow run`, `gh secret delete`
- Eseguire `git push --force` o `--force-with-lease`
- Riattivare `push:` trigger nei workflow disattivati
- Usare `--delete` in rsync
- Usare scrittura SSH su `/var/www/vhosts/poilove.com/`

---

## 🚨 INCIDENT REPORT — 10/05/2026 · cancellati 740 file in produzione

**Cosa è successo**: nella sessione del 10/05/2026, riattivando i workflow GitHub Actions di deploy (`deploy-web.yml`, nuovo `deploy-demo.yml`), il run #25627558418 ha eseguito `rsync -avz --delete demo/ user@host:${PLESK_DEMO_PATH}/`. Il secret `PLESK_DEMO_PATH` non era ancora settato → GitHub ha risolto la stringa come vuota → rsync ha sincronizzato `demo/` (5 file) verso **`/`** del server (root filesystem) con `--delete`. Risultato: **740 file cancellati** su `/var/www/vhosts/poilove.com/` (httpdocs 117, demo 91, sal 178, media 16, git/ bare repos 126, .ssh 5, logs 144, ecc.). I 4 sotto-domini sono andati down.

**Recovery**: l'utente ha ripristinato il backup Plesk del 09/05/2026. I siti sono tornati al contenuto del commit `04e2e71` (08/05/2026). Le feature scritte oggi sono salvate nel branch `wip/2026-05-10-task7-auth`.

**Costo**: 4 sotto-domini down per ~3 ore in piena finestra pre-presentazione SAL (13-17 Maggio).

**Run di riferimento** (per audit futuro):
- `25627558401` Deploy → poilove.com (root) · success · sha:`a76d209` · 4 file innocui
- `25627558418` Deploy → demo.poilove.com · failure · sha:`a76d209` · **740 file cancellati**
- `25627614938`, `25627614939`, `25627650997` · failure · SSH key revocata dopo brute-force protection

---

## 🔒 REGOLE HARD — Claude DEVE rispettare in ogni sessione

Queste regole sono **non negoziabili**. Sono nate dall'incident del 10/05/2026.

### Deploy & infrastruttura
1. **MAI usare `--delete` in rsync** in alcun workflow o script. Sostituire con `--ignore-existing` o `--update`. Se serve davvero pulizia, usare `--dry-run` prima e chiedere conferma scritta.
2. **MAI riattivare un workflow disattivato** (`workflow_dispatch only`) senza:
   - dry-run preventivo
   - conferma scritta dell'utente
   - verifica che TUTTI i secret richiamati esistano e siano valorizzati
3. **MAI modificare file in `.github/workflows/`** senza ack esplicito dell'utente. La modifica del solo file workflow può triggerare deploy se il path è incluso in `paths:`.
4. **MAI eseguire `gh secret set`, `gh workflow run`, `gh secret delete`** senza ack scritto.
5. **MAI `git push --force` o `--force-with-lease`** senza ack scritto.
6. **MAI eseguire comandi Plesk REST API** o `ssh` con scrittura su path di produzione (`/var/www/vhosts/poilove.com/`). Lettura/diagnostica OK, scrittura NO.

### Path safety in deploy YAML
- **OGNI** workflow di deploy DEVE avere come primo step una guardia che blocca se i secret PATH sono vuoti o non iniziano con `/var/www/vhosts/poilove.com/`. Esempio:
  ```yaml
  - name: Verifica secrets
    env:
      P: ${{ secrets.PLESK_*_PATH }}
    run: |
      if [ -z "$P" ] || [[ "$P" != /var/www/vhosts/poilove.com/* ]]; then
        echo "::error::Path non valido"; exit 1
      fi
  ```

### Workflow di lavoro corretto
- Modifiche al codice in `demo/`, `web/`, `sal/`, `plesk-media-server/` → push su `main` libero (non triggera deploy se workflow disattivati)
- Pubblicazione live → SOLO **manuale tramite Plesk → dominio → Git → "Estrai ora" + "Implementa ora"**
- Niente più auto-deploy GitHub Actions finché non sono stati testati con dry-run + secret tutti validati

### Date
- Sempre formato europeo `dd/mm/aaaa` o `dd/mm/yyyy` (mai `mm-dd` o testo "8 maggio" senza specifica anno)

---

## 🔄 Sessione 2026-05-08 — Tutto LIVE in produzione

**Architettura attiva e funzionante:**

| URL pubblico | Cartella repo | Cosa serve | SSL |
|---|---|---|---|
| `https://poilove.com/` | `web/` | Presentazione progetto v9 17:09 (612 KB) + PDF v5 + notarizzazione SHA-256 (hash `2e543e7a...`) | Let's Encrypt R13 (scade 6 ago 2026) |
| `https://demo.poilove.com/` | `demo/` | Webapp ufficiale 341 KB (7 tab: Mappa · ILLI•AI · POI · Itinerari · Compagni · Profilo · SOS) | Let's Encrypt R13 |
| `https://sal.poilove.com/` | `sal/` | SAL v2.4 — finestra presentazioni 13-17 Maggio (root = il SAL completo, no redirect) | Let's Encrypt R13 |
| `https://media.poilove.com/` | `plesk-media-server/` | Media server PHP (foto upload + card SHA-256) | Let's Encrypt R13 |

**Plesk Git pull-based deploy** (modalità Manuale, no auto-deploy GitHub Actions):
- Subscription `poilove.com` (id 124) — 4 domini
- Repo Git collegati con deploy SSH key id GitHub `150897309` (read-only)
- 3 repo bare locali in Plesk: `git/poi-love-web.git`, `git/poi-love.git` (demo), `git/poi-love-sal.git`
- Document root personalizzato per ogni dominio: punta alla **sotto-cartella** del repo
  - poilove.com → `httpdocs/web`
  - demo.poilove.com → `demo.poilove.com/demo`
  - sal.poilove.com → `sal.poilove.com/sal`
- Cache-Control no-cache + kill-switch JS per evitare cache PWA stale della vecchia webapp

**Workflow operativo definitivo:**
```
Locale (Claude) → git push origin main
                       ↓
Plesk → dominio → Git → "Estrai ora" (pull) → "Implementa ora" (deploy)
                                     ↓
                                sito live
```
Sempre **2 click** in sequenza: Estrai (git pull) + Implementa (rsync to docroot).

**Workflow GitHub Actions disabilitati**: `deploy-web.yml` e `pages.yml` sono in `workflow_dispatch only` (non scattano da soli al push). Solo `deploy-media-server.yml` resta attivo (media server già live, deploy continuo).

**Roadmap aggiornata (SAL v2.4):**
- 27 Apr → 6 Mag · ✅ Webapp HTML + Infrastruttura
- 7-9 Maggio · 🔄 Rifinitura demo + ILLI•AI mascot + Compagni form
- **10-12 Maggio · pre-presentazione** (slide demo, dry-run, dress rehearsal)
- **13-17 Maggio · 🎤 Finestra presentazioni** (5 giorni hand-picked, partner+investitori)
- 18 Mag → Giugno · 🚀 Pre-lancio Tirana
- **Giugno 2026 · Lancio Tirana fisico**

**Webapp demo features chiave (commit `9bdc402`):**
- Bottom nav 7 tab (Mappa · ILLI•AI · POI · Itinerari · Compagni · Profilo · SOS)
- Mappa fullscreen su tab Mappa, 50/50 desktop sulle altre
- ILLI•AI tab dedicata (#illiView) con chat Travel Advisor + guida piattaforma
- ILLI•AI prompt sistema doppio ruolo (suggerimenti viaggio + how-to app)
- ILLI•AI mascot SVG in `demo/illi-ai.svg`
- POI tab con 3 sub-tab: Miei · Loved · Vicini (haversine sort)
- Compagni di Viaggio: form CREA completo (Per sempre/Viaggio/Cena · date+ora · descrizione · inviti · codice 6 char) + lista compagnie con status amici live (🟢 in viaggio · ⚪ offline · 🔴 fermo +1g)
- Profilo: 12 sfondi gradient moderni (Tirana Sunset · Aurora del Drin · Skanderbeg Gold · ecc.) + Avatar modal 3 tab (Upload · Unsplash · AI Pollinations/Flux con prompt enhancement)
- 232 icone Phosphor variante **duotone** ovunque
- POI detail close fix (X button + Escape)
- FAB z-index 350 (sopra nav, sotto sheet/popup)

**Setup secrets GitHub** (già configurati, non toccare):
- DEPLOY_SECRET, PLESK_HOST, PLESK_USER, PLESK_SSH_KEY, PLESK_PORT, PLESK_PATH, PLESK_WEB_PATH

**Path locale (mac)**: `/Users/alessandrocastagna/AI (produzione)/POI•LOVE/POI•LOVE/`

**Repository GitHub**: https://github.com/acastagna/poi-love (public, MIT)

**Ultimi commit chiave**:
- `19f55a0` architettura 4 sotto-domini (cartelle web/demo/sal)
- `feef947` bottom nav 6 tab + ILLI•AI + Compagni
- `cec8667` mappa fullscreen + ILLI•AI tab + form Compagni
- `69769ad` 12 sfondi + Avatar 3 tab + Pollinations
- `a5e615a` fix POI detail close
- `307125f / 1fbb4fc` fix FAB z-index
- `9bdc402` icone Phosphor duotone (232 occorrenze)
- `3561cce` sal/index.html = SAL completo (no redirect)
- `279a814` kill-switch SW + no-cache headers su poilove.com

---

## ⚡ Aggiornamento 2026-05-08 — Architettura a 4 sotto-domini

**IMPORTANTE:** L'architettura è stata divisa in 4 ambiti separati. NON è più "tutto in `web/`".

| URL | Cartella repo | Cosa contiene |
|---|---|---|
| **poilove.com** | `web/` | 📄 Presentazione del progetto (v9 17:09 · PDF v5 + notarizzazione SHA-256) |
| **poilove.com/dev/**, `/v2/`, `/preview/` … | `web/dev/`, `web/v2/`, `web/preview/` … | versioni in sviluppo (sotto-livelli del dominio principale) |
| **demo.poilove.com** | `demo/` | ⭐ versione **ufficiale blessed** della webapp |
| **sal.poilove.com** | `sal/` | SAL — Stato Avanzamento Lavori (per investitori/partner) |
| **media.poilove.com** | `plesk-media-server/` | Media server PHP (foto upload) |

**Workflow di promozione**: una versione WIP gira in `web/<nome>/` → quando approvata, la copiamo in `demo/` (il `cp -r web/wip/* demo/` poi `git push` poi su Plesk → `Pull updates`).

**Deploy**: passato da GitHub Actions auto-deploy → **Plesk Git pull manuale**. I workflow `deploy-web.yml` e `pages.yml` sono in `workflow_dispatch only` (non scattano da soli al push). Setup Plesk dettagliato in `PLESK-GITHUB-DEPLOY.md`.

Vedi la sezione **Struttura del repository** sotto per la mappa file aggiornata.

---

## Identità progetto

**POI•LOVE** è una mappa comunitaria dei luoghi amati — un'alternativa umana e culturale a Google Maps. Primo lancio: **Tirana, Albania — giugno 2026**. Framework open source: **Cultural Bridge OS** (MIT).

Founder e direttore creativo: **Alessandro Castagna** (it@altrostile.app) — operativo tra Tirana e Italia tramite AltroStile.NET e 321.AL.

---

## Regole di lavoro

- Rispondi **sempre in italiano** salvo diversa indicazione.
- Output code: **pulito, commentato, funzionante**. Niente scorciatoie.
- Prima di rispondere: analizza il problema, valuta le strade, scegli quella più solida.
- Icone: **Phosphor v2.1.1** — nessun'altra libreria di icone.
- A fine sessione: aggiorna `web/SAL-data.json` con avanzamento e changelog.

---

## Brand Identity

| Variabile | Valore |
|-----------|--------|
| Rosso POI•LOVE | `#D42B2B` |
| Blu POI•VOICE | `#285EA7` |
| Sfondo Light | `#EAE4D8` |
| Logo SVG | `https://poilove.com/img/logo-completo.svg` |
| Favicon | `https://poilove.com/img/favicon.ico` |

---

## Struttura del repository

```
poi-love/
├── web/                        ← App web PWA (file principale)
│   ├── index.html              ← UNICO FILE — tutta l'app SPA (5000+ righe)
│   ├── itinerari.html          ← pagina itinerari separata
│   ├── manifest.json           ← PWA manifest
│   ├── .htaccess               ← routing SPA su Apache/Plesk
│   └── SAL-data.json           ← stato avanzamento lavori (aggiornare a fine sessione)
├── docs/                       ← documentazione tecnica
│   ├── architecture.md
│   └── card-system.md
├── .github/
│   └── workflows/
│       └── deploy-web.yml      ← GitHub Actions → deploy SSH su Plesk (poilove.com)
├── CLAUDE.md                   ← questo file
├── README.md                   ← trilingue IT/SQ/EN
└── LICENSE                     ← MIT
```

---

## Deploy

**Flusso:** commit su `main` → GitHub Actions → SSH su Plesk → copia `web/` in `httpdocs/` su `poilove.com`.

```bash
# Deploy manuale (se Actions non bastano)
git add web/index.html web/SAL-data.json  # o altri file
git commit -m "feat: descrizione"
git push origin main
```

Il sito è live su **https://poilove.com** (non su GitHub Pages — quello è solo demo).

---

## Tech Stack

### Frontend (web/)
- **Vanilla JS** — nessun framework, nessun bundler, tutto in un singolo `index.html`
- **Leaflet.js** — mappa interattiva (tile OpenStreetMap)
- **Supabase JS v2** — auth, DB, storage
- **Phosphor Icons v2.1.1** — CDN
- **Nominatim** — reverse geocoding (OpenStreetMap, no API key)
- **loremflickr.com** — placeholder immagini per itinerari (no API key)
- **api.qrserver.com** — generazione QR code per profili (no API key)

### AI
- **Groq · llama-3.3-70b-versatile** — POI•AI Travel Advisor + generazione descrizioni
  - Chiave: XOR-encoded nel sorgente (array di interi, decodifica con `^7`)
  - Endpoint: `https://api.groq.com/openai/v1/chat/completions`
  - Formato: OpenAI-compatible

### Backend / Infrastruttura
- **Supabase** — PostgreSQL + RLS + Auth + Storage
  - Project: `ptppxwlafswfhbueakjt.supabase.co`
  - Publishable key: `sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V`
- **Plesk** — hosting Apache su poilove.com (hPanel)
- **Plesk Media Server PHP** — `media.poilove.com` (upload.php, delete.php)
- **Google OAuth** — login via Supabase Auth
  - OAuth Client ID: `750440485410-sjknbfn1jnlu2s33tirdjd3d55e474tn.apps.googleusercontent.com`
- **Google Maps API** (solo app mobile Expo, non nella web app)
  - Maps API Key: `AIzaSyA8NN65J6s2Yf-FRfpbgVMZFMn1n8Q_zEM`

---

## Database Supabase — tabelle principali

```sql
profiles       -- id (=auth.users.id), username, avatar_url, bio, updated_at
pois           -- id, author_id→profiles.id, name, description, lat, lng,
               --   category, photos[], love_count, visibility, created_at
lists          -- id, owner_id→profiles.id, name, is_public
list_pois      -- list_id, poi_id
loves          -- user_id, poi_id (UNIQUE)
follows        -- follower_id, following_id
```

**⚠️ Nota critica:** `pois.author_id` è FK → `profiles.id` (NON `user_id`).

**Visibility POI:** `'private'` | `'community'` | `'suggested_google'`

---

## Funzionalità implementate (stato al 2 maggio 2026)

### App web (index.html) — COMPLETO
- [x] Mappa Leaflet con POI da Supabase + marker custom
- [x] Aggiungi POI: GPS live / EXIF foto / Indirizzo / Tocca mappa
- [x] Upload foto a Supabase Storage
- [x] Modifica POI (da web e da app)
- [x] Love/unlike su POI con contatore
- [x] Profilo utente: vanity URL (`@handle`) programmabile + QR code
- [x] Liste personali: crea/modifica/condividi
- [x] Itinerari di viaggio: crea/modifica/tappe/cover/landing page `/trip/slug`
- [x] POI•AI Travel Advisor (Groq llama-3.3-70b)
- [x] Generazione descrizione POI con AI
- [x] Condivisione posizione con durata (1h/1g/1M/sempre)
- [x] Layout desktop 50/50: mappa sinistra, contenuto destra
- [x] PWA manifest
- [x] Trilingue: IT / SQ / EN (rilevamento automatico lingua browser)
- [x] Landing page itinerari con URL personalizzato + `.htaccess` routing
- [x] QR code profilo scaricabile (600×600px, rosso POI•LOVE)

### Infrastruttura — COMPLETO
- [x] Deploy automatico GitHub Actions → Plesk SSH
- [x] Google OAuth (Supabase)
- [x] Media server PHP (media.poilove.com)
- [x] Schema Supabase con RLS

### App mobile Expo (React Native) — IN CORSO
- [x] Scaffold 17 file TypeScript in `app/poi-love-app/`
- [ ] Push su GitHub e test su device fisico
- [ ] Build Expo EAS per TestFlight/Play Store

---

## Prossime priorità (sprint giugno 2026)

1. **Rotte storiche** — visualizzazione, creazione, landing page `/route/slug`
2. **App Expo push** — committare i 17 file, test su device fisico
3. **Candidatura Claude for OSS** — 5000 stelle GitHub o exception clause (missione culturale)
4. **ProductHunt launch** — solo con app mobile funzionante

---

## Strategia lancio

Messaggio chiave: *"Anyone can fork this for their own country or the country they love — creating inclusivity and welcoming across geographies."*

Canali in ordine di priorità:
1. **Hacker News** — "Show HN: POI•LOVE — open source community map of beloved places, launching in Tirana"
2. **Reddit** — r/opensource, r/albania, r/italy, r/digitalnomad, r/travel
3. **Twitter/X + LinkedIn** — thread con storia + demo live
4. **Awesome lists GitHub** — PR su awesome-geospatial, awesome-albania
5. **Dev.to / Medium** — articolo su Cultural Bridge OS
6. **ProductHunt** — solo al lancio giugno con app mobile pronta

---

## Convenzioni di codice

- Tutto il JS di `index.html` è in un singolo `<script>` inline (no bundle)
- Variabili globali chiave: `currentUser`, `gpsPos`, `currentPOI`, `TRIPS`, `map`
- Funzioni di sheet: `openSheet(ovId, bgId, sheetId)` / `closeSheet(...)`
- Multilingue: oggetto `T` con chiavi `it`/`sq`/`en`, rilevamento via `navigator.language`
- Deploy: `git push origin main` → Actions automatico (non serve script Python)
- Syntax check prima di ogni push: estrarre `<script>` e passare a `node --check`

---

## Note TTS / Audio

**NO ElevenLabs, NO servizi TTS esterni.** Modulo audio proprietario pianificato per Fase 2. Nella web app: solo `SpeechSynthesis` nativa del browser per la voce POI•AI.
