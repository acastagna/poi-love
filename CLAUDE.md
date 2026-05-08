# POI•LOVE — CLAUDE.md
> Leggi questo file per intero prima di ogni sessione. È la fonte di verità del progetto.

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
