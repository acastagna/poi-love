# POI•LOVE — CLAUDE.md
> Leggi questo file per intero prima di ogni sessione. È la fonte di verità del progetto.

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
