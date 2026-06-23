# POI•LOVE — CLAUDE.md
> Leggi questo file per intero prima di ogni sessione. È la fonte di verità del progetto.
> Vedi anche `STORICO-LAVORI.md` per il registro cronologico delle sessioni.

---

## 🟢 STATO AL 26/05/2026 — AI photo generation + Ownership guard + DB migrazione cover

**HEAD GitHub `main`**: `0b3b64f`
**Ultimo commit**: `0b3b64f feat(demo): AI photo generation su POI senza foto — Pollinations.ai Flux`

**Stato live siti**:

| URL | Live HEAD | Note |
|---|---|---|
| https://demo.poilove.com/ | `914b2d4` (26/05) | ⚠️ da pullare — AI photos in main |
| https://poilove.com/ | `04e2e71` (08/05) | da pullare |
| https://sal.poilove.com/ | `04e2e71` (08/05) | da pullare |
| https://media.poilove.com/test.php | 503 | DNS server-side rotto (pre-esistente) |

**Supabase schema aggiornato 26/05**:
- `profiles.cover_url text` — aggiunto ✅
- `profiles.cover_type text DEFAULT 'gradient'` — aggiunto ✅

**Supabase keepalive**: `supabase-keepalive.yml` attivo su GitHub Actions, ping ogni 3 giorni, ultimo run 25/05 ✅

### 📋 Quick start prossima sessione

1. **Leggere `STORICO-LAVORI.md`** (sezione 26/05 in cima) per il dettaglio completo
2. **Leggere REGOLE HARD** sotto in questo file (non negoziabili dopo incident 10/05)
3. **Bloccanti rimasti** (richiedono Supabase auth attivo):
   - Test Google OAuth live sul demo (`signInWithGoogle()` già esiste, mai testato dopo restyle)
   - Salvataggio reale profilo (avatar/cover/bio) — schema ora corretto
   - Upload foto POI end-to-end via media.poilove.com con fallback Supabase Storage
4. **Setup altri OAuth provider** (bottoni X/LinkedIn/Facebook esistono ma danno errore "provider not configured"):
   - X (Twitter) — gratis, ~10-15 min
   - LinkedIn OIDC — gratis, ~10 min
   - Facebook — richiede privacy policy + App Review Meta, ~15-25 min
   - Apple Sign In — RIMANDATO a giugno ($99/anno Developer)
5. **Fix DNS server-side media.poilove.com** (SSH server): `8.8.8.8` in `/etc/resolv.conf`
6. **App Expo**: push 17 file TypeScript già scaffolded, test su device, build EAS
7. **Rotte storiche con AI** (V2): data model `routes`, flow ILLI•AI, editor tappe, landing `/route/slug`

### ⚠️ Quello che la prossima sessione NON deve fare senza ack

- Modificare `.github/workflows/*.yml`
- Eseguire `gh secret set`, `gh workflow run`, `gh secret delete`
- Eseguire `git push --force` o `--force-with-lease`
- Riattivare `push:` trigger nei workflow disattivati
- Usare `--delete` in rsync
- Usare scrittura SSH su `/var/www/vhosts/poilove.com/`

---

## 🚨 INCIDENT REPORT — 10/05/2026 · cancellati 740 file in produzione

**Cosa è successo**: nella sessione del 10/05/2026, riattivando i workflow GitHub Actions di deploy (`deploy-web.yml`, nuovo `deploy-demo.yml`), il run #25627558418 ha eseguito `rsync -avz --delete webapp/ user@host:${PLESK_DEMO_PATH}/`. Il secret `PLESK_DEMO_PATH` non era ancora settato → GitHub ha risolto la stringa come vuota → rsync ha sincronizzato `webapp/` (5 file) verso **`/`** del server (root filesystem) con `--delete`. Risultato: **740 file cancellati** su `/var/www/vhosts/poilove.com/` (httpdocs 117, demo 91, sal 178, media 16, git/ bare repos 126, .ssh 5, logs 144, ecc.). I 4 sotto-domini sono andati down.

**Recovery**: l'utente ha ripristinato il backup Plesk del 09/05/2026. I siti sono tornati al contenuto del commit `04e2e71` (08/05/2026). Le feature scritte oggi sono salvate nel branch `wip/2026-05-10-task7-auth`.

**Costo**: 4 sotto-domini down per ~3 ore in piena finestra pre-presentazione SAL (13-17 Maggio).

**Run di riferimento** (per audit futuro):
- `25627558401` Deploy → poilove.com (root) · success · sha:`a76d209` · 4 file innocui
- `25627558418` Deploy → demo.poilove.com · failure · sha:`a76d209` · **740 file cancellati**
- `25627614938`, `25627614939`, `25627650997` · failure · SSH key revocata dopo brute-force protection

---

## 🔒 REGOLE HARD — Claude DEVE rispettare in ogni sessione

Queste regole sono **non negoziabili**. Sono nate dall'incident del 10/05/2026.

### 🚨 STRUTTURA SERVER PLESK — FONDAMENTALE, NON DIMENTICARE MAI

**`httpdocs/` È LA ROOT PUBBLICA DI PLESK. È il DocumentRoot di Apache. È il `public/` del server.**

| Path server | Corrisponde a | URL |
|---|---|---|
| `/var/www/vhosts/poilove.com/httpdocs/` | root pubblica | `https://poilove.com/` |
| `/var/www/vhosts/poilove.com/httpdocs/web/` | sottocartella | `https://poilove.com/web/` |
| `/var/www/vhosts/poilove.com/project.poilove.com/` | root pubblica | `https://project.poilove.com/` |
| `/var/www/vhosts/poilove.com/demo.poilove.com/webapp/` | webapp demo | `https://demo.poilove.com/webapp/` |

**Prima di copiare QUALSIASI file sul server: verificare il DocumentRoot con:**
```bash
grep DocumentRoot /var/www/vhosts/system/poilove.com/conf/httpsd.conf
```

**MAI assumere che una sottocartella sia la root. Verificare sempre.**

### Deploy & infrastruttura
1. **MAI usare `--delete` in rsync** in alcun workflow o script. Sostituire con `--ignore-existing` o `--update`. Se serve davvero pulizia, usare `--dry-run` prima e chiedere conferma scritta.
2. **MAI riattivare un workflow disattivato** (`workflow_dispatch only`) senza:
   - dry-run preventivo
   - conferma scritta dell'utente
   - verifica che TUTTI i secret richiamati esistano e siano valorizzati
3. **MAI modificare file in `.github/workflows/`** senza ack esplicito dell'utente. La modifica del solo file workflow può triggerare deploy se il path è incluso in `paths:`.
4. **MAI eseguire `gh secret set`, `gh workflow run`, `gh secret delete`** senza ack scritto.
5. **MAI `git push --force` o `--force-with-lease`** senza ack scritto.
6. **Deploy autonomo consentito — SOLO file singoli via rsync**, senza `--delete`, su path esatti e pre-approvati:
   - `webapp/index.html` → `/var/www/vhosts/poilove.com/httpdocs/index.html` (poilove.com — webapp, ROOT PUBBLICA)
   - `web/index.html` → `/var/www/vhosts/poilove.com/project.poilove.com/index.html` (project.poilove.com — presentazione marketing)
   - Comando deploy webapp: `rsync -e "ssh -i ~/.ssh/evolab_deploy" webapp/index.html root@46.4.70.47:/var/www/vhosts/poilove.com/httpdocs/index.html`
   - Claude esegue questo **automaticamente a fine ogni sessione** dopo il commit.
   - MAI rsync di cartelle intere, MAI `--delete`, MAI altri path non elencati qui.
   - Per nuovi path da aggiungere: ack esplicito di Alessandro prima.

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
- Modifiche al codice in `webapp/`, `web/`, `sal/`, `plesk-media-server/` → push su `main` libero (non triggera deploy se workflow disattivati)
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
| `https://demo.poilove.com/` | `webapp/` | Webapp ufficiale 341 KB (7 tab: Mappa · ILLI•AI · POI · Itinerari · Compagni · Profilo · SOS) | Let's Encrypt R13 |
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
- 18 Mag → Ago · 🚀 Pre-lancio Tirana
- **17 agosto 2026 (lun) · 🎯 Lancio pubblico Tirana** *(spostato da giugno — data Kairos, vedi TIMELINE.md)*

**Webapp demo features chiave (commit `9bdc402`):**
- Bottom nav 7 tab (Mappa · ILLI•AI · POI · Itinerari · Compagni · Profilo · SOS)
- Mappa fullscreen su tab Mappa, 50/50 desktop sulle altre
- ILLI•AI tab dedicata (#illiView) con chat Travel Advisor + guida piattaforma
- ILLI•AI prompt sistema doppio ruolo (suggerimenti viaggio + how-to app)
- ILLI•AI mascot SVG in `webapp/illi-ai.svg`
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
- `19f55a0` architettura 4 sotto-domini (cartelle web/webapp/sal)
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
| **demo.poilove.com** | `webapp/` | ⭐ versione **ufficiale blessed** della webapp |
| **sal.poilove.com** | `sal/` | SAL — Stato Avanzamento Lavori (per investitori/partner) |
| **media.poilove.com** | `plesk-media-server/` | Media server PHP (foto upload) |

**Workflow di promozione**: una versione WIP gira in `web/<nome>/` → quando approvata, la copiamo in `webapp/` (il `cp -r web/wip/* webapp/` poi `git push` poi su Plesk → `Pull updates`).

**Deploy**: passato da GitHub Actions auto-deploy → **Plesk Git pull manuale**. I workflow `deploy-web.yml` e `pages.yml` sono in `workflow_dispatch only` (non scattano da soli al push). Setup Plesk dettagliato in `PLESK-GITHUB-DEPLOY.md`.

Vedi la sezione **Struttura del repository** sotto per la mappa file aggiornata.

---

## Identità progetto

**POI•LOVE** è una mappa comunitaria dei luoghi amati — un'alternativa umana e culturale a Google Maps. Primo lancio: **Tirana, Albania — 17 agosto 2026**. Framework open source: **Cultural Bridge OS** (MIT).

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
- **Supabase `core-321`** — PostgreSQL + RLS + Auth (progetto ex `poi-love`, solo rinominato)
  - Org: `321` · Piano: **Pro** · Project ref: `ptppxwlafswfhbueakjt`
  - API URL: `https://ptppxwlafswfhbueakjt.supabase.co`
  - Publishable key: `sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V`
  - `service_role` key: MAI nel repo né nel client — salvare in `~/.supabase_poilove.env`
- **Plesk** — hosting Apache su poilove.com (hPanel)
- **Plesk Media Server PHP** — `media.poilove.com` (upload.php, delete.php)
- **Google OAuth** — login via Supabase Auth
  - OAuth Client ID: `750440485410-sjknbfn1jnlu2s33tirdjd3d55e474tn.apps.googleusercontent.com`
- **Google Maps API** (solo app mobile Expo, non nella web app)
  - Maps API Key: `AIzaSyA8NN65J6s2Yf-FRfpbgVMZFMn1n8Q_zEM`

---

## Database Supabase — tabelle principali

```sql
profiles       -- id (=auth.users.id), username, avatar_url, bio, updated_at,
               --   cover_url text, cover_type text DEFAULT 'gradient'  ← aggiunte 26/05
pois           -- id, author_id→profiles.id, name, description, lat, lng,
               --   category, photos[], love_count, visibility, created_at
lists          -- id, owner_id→profiles.id, name, is_public
list_pois      -- list_id, poi_id
loves          -- user_id, poi_id (UNIQUE)
follows        -- follower_id, following_id
```

**⚠️ Nota critica:** `pois.author_id` è FK → `profiles.id` (NON `user_id`).
**cover_type** valori: `'gradient'` (CSS gradient string) | `'image'` (URL immagine).

**Visibility POI:** `'private'` | `'community'` | `'suggested_google'`

---

## Infrastruttura dati — Supabase `core-321`

### Architettura multi-schema

Il motore Postgres è **condiviso per schema** con altri prodotti 321.AL. Ogni prodotto è isolato nel proprio schema — nessuna interferenza:

| Schema | Prodotto | Note |
|--------|----------|------|
| `public` | **POI•LOVE** | ← qui vivono tutte le tabelle POI•LOVE |
| `smile` | Diario integratore | non toccare |
| `dieta` | Dieta 321 | non toccare |
| `sal` | SAL interno | non toccare |
| `top_market` | TopMarket | non toccare |
| `progetti` | Gestione progetti (con Erion) | non toccare |

Motore (CPU/RAM) e backup sono condivisi. Quando un prodotto scala, viene promosso su istanza propria via `pg_dump` → `pg_restore`.

### Regole vincolanti (non negoziabili)

1. **Restare in `public`** — tabelle POI•LOVE solo in `public`, mai in altri schemi
2. **Non toccare gli altri schemi** — zero query cross-schema
3. **Identificatori solo con underscore** — mai trattini (`poi_love` ✅ `poi-love` ❌)
4. **Segreti via environment** — `SUPABASE_URL` e `SUPABASE_ANON_KEY` in `.env`; `service_role` MAI nel client né nel repo
5. **RLS obbligatorie** su ogni tabella esposta via Data API
6. **Exposed schemas a mano** — disattivare "Automatically expose new tables" in Settings → Data API
7. **Migrazioni in Git** — DDL/policy/funzioni in file SQL versionati, niente modifiche manuali non tracciate

### Perché Supabase Pro era la scelta giusta (decisione 21/06/2026)

Supabase Pro ($25/mese) non è solo storage immagini — copre tutto ciò che serve per far girare l'app:
- **PostgreSQL** con backup automatici 7 giorni
- **Auth** (Google OAuth, sessioni, JWT)
- **RLS** (sicurezza dati per utente)
- **Nessuna pausa automatica** (il free tier si spegne dopo 7 giorni di inattività)

Senza Pro queste cose non funzionano o costano di più altrove. È la scelta giusta per la fase attuale.

Il problema dell'egress sulle immagini emerge **solo oltre i 10k utenti** — con 100 GB inclusi nel Pro, la beta gira senza costi aggiuntivi.

### Storage immagini — strategia per scala

| Fase | Utenti | Storage | Costo aggiuntivo |
|------|--------|---------|-----------------|
| Beta | → 10k | Supabase incluso (100 GB Pro) | $0 |
| Crescita | 10k → 100k | Migra a **Cloudflare R2** | ~$5-20/mese |
| Scala | 100k → 1M | R2 + CDN Cloudflare | ~$50-150/mese |
| Enterprise | 1M+ | Valuta server ferro proprio | da definire |

**Regola da rispettare ora:** nel DB salvare solo URL/metadati delle immagini, mai i file binari. Le foto vanno su object storage esterno (oggi Supabase Storage, domani R2).

**Compressione WebP obbligatoria** prima di ogni upload — riduce il peso del 70% senza perdita visibile (qualità 82%, max 1200px lato lungo).

### R2 vs server ferro a 1M+ utenti

**Cloudflare R2 vince** finché non c'è un team tecnico dedicato:
- Zero gestione, zero backup manuali, zero aggiornamenti sicurezza
- CDN globale inclusa, egress $0
- Scala automaticamente
- Costo stimato a 1M utenti: ~$100-200/mese

**Server ferro vince** solo se:
- C'è un sysadmin fisso pagato
- Il volume è nell'ordine dei petabyte (non terabyte)
- Il costo fisso del server batte il variabile R2
- Costo stimato server: €80-150/mese ma con ore di gestione settimanali

**Regola pratica:** non valutare il server ferro prima di 1M utenti attivi. Prima fai girare l'app.

### Roadmap promozione futura

Quando POI•LOVE supera 100k utenti attivi:
- `pg_dump` dello schema `public` → `pg_restore` su Postgres dedicato (VPS separato, non Plesk)
- Migrazione immagini Supabase Storage → Cloudflare R2
- Auth: valutare GoTrue self-hosted per azzerare costo per-MAU

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

## Decisioni architetturali pendenti (segnalate il 21/06/2026)

### demo.poilove.com → app ufficiale diretta
`demo.poilove.com` è temporanea. Quando l'app va in produzione reale, diventa il dominio principale (`poilove.com` o un dominio dedicato). La cartella `webapp/` del repo diventa la radice dell'app ufficiale. **Non costruire features pensando che "demo" sia permanente.**

### Terms of Service e Privacy Policy — DA CREARE
Richieste da X OAuth, Facebook OAuth e qualsiasi store (App Store, Play Store). Devono vivere su `poilove.com/terms` e `poilove.com/privacy`.
- Contenuto minimo: raccolta dati (email, posizione GPS, foto), uso dei dati, GDPR, cancellazione account
- Da creare prima di attivare Facebook OAuth e prima del lancio pubblico
- Nel frattempo usare URL placeholder `https://poilove.com/terms` e `https://poilove.com/privacy` nelle configurazioni OAuth

---

## Prossime priorità (sprint giugno 2026)

1. **Terms & Privacy** — creare `web/terms.html` e `web/privacy.html` su poilove.com (blocca Facebook OAuth e lancio)
2. **OAuth attivi** — X (Twitter) in corso · LinkedIn · Facebook (dopo Terms)
3. **Rotte storiche** — visualizzazione, creazione, landing page `/route/slug`
4. **App Expo push** — committare i 17 file, test su device fisico
5. **Candidatura Claude for OSS** — 5000 stelle GitHub o exception clause (missione culturale)
6. **ProductHunt launch** — solo con app mobile funzionante

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
