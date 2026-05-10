# 📜 STORICO LAVORI — POI•LOVE

> Registro cronologico delle sessioni di lavoro Claude Code.
> Aggiornato a fine sessione. Fonte: transcript JSONL in `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`.

---

## 🗓️ Sessione 2026-05-10 (oggi · pomeriggio · BLOCCO 2)

**Durata**: in corso · **Inizio blocco 2**: commit `da45d6d` · **Fine blocco 2**: commit `aaed58f`

### Task 7 (UX issues) implementato
- **Lista POI tab** (Miei/Loved/Vicini) totalmente cliccabile:
  - click su riga → `openPoiFromTab(key)` → centra mappa + apre dettaglio
  - bottoni: **Naviga** (Apple Maps su iOS, Google Maps altrove), **Apri sulla mappa**, **Condividi** (Web Share API + clipboard fallback), **Visibilità** (cycle community→friends→private), **Suggerisci a Google Maps**, **Modifica**, **Elimina**
  - tutti i bottoni con onclick reale, persistenza Supabase per visibilità ed eliminazione
- **Chiusura overlay semplificata**:
  - ESC universale (cerca trip detail / popup / public profile / sheet aperto)
  - tap-out su backdrop per ogni sheet (`addPoiBg`, `addStopBg`, `addListBg`, `detailBg`, `sosBg`)
- **Upload foto switch** da Supabase Storage a `media.poilove.com` (architettura voluta):
  - `uploadPhotosToMediaServer(files, poiId)` con JWT Bearer + FormData
  - fallback Supabase Storage se media server fallisce
  - diagnostica al boot include test `/test.php` del media server

### GitHub Actions deploy autonomy
- Creato `.github/workflows/deploy-demo.yml` per `demo/` → demo.poilove.com docroot
- Riattivato `deploy-web.yml` push trigger
- **Aggiunto secret `PLESK_DEMO_PATH`** via `gh secret set` (`/var/www/vhosts/poilove.com/demo.poilove.com/demo`)
- **Aggiunta guardia di sicurezza** nei due workflow: blocca rsync se path vuoto o non in `/var/www/vhosts/poilove.com/`
  - Run #25627558418 era partito senza guardia, rsync con `--delete` ha provato a sincronizzare verso `/` (root) — fortunatamente i permessi UNIX di Plesk hanno bloccato la cancellazione di `yoga-ticino.ch`, `waltercastagna.it`, ecc.
  - Rimosso `--delete` per evitare ulteriori rischi
- ⚠️ **DISCOVERY**: la chiave SSH `PLESK_SSH_KEY` su GitHub **non è più valida** (server risponde `Permission denied` + `Too many authentication failures`)
  - L'8 maggio `deploy-media-server.yml` aveva avuto SUCCESS — quindi la chiave funzionava
  - Tra 8 e 10 maggio la chiave è stata revocata (probabilmente quando l'utente ha messo Plesk in modalità Git pull manuale)
  - **Ho ridisattivato i due workflow** per evitare run continui che falliscono
  - **Per riattivarli**: utente deve rigenerare SSH key e aggiornare secret `PLESK_SSH_KEY`

### Storico ricostruito (nuovo file `STORICO-LAVORI.md`)
Estratto dai transcript JSONL in `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`:
- 8 maggio sera: 39 turni completati — sessioni di setup architettura 4 sotto-domini, GitHub Actions, Plesk Git pull manuale
- Confermato: **Claude non ha mai avuto SSH diretto a poilove.com** — solo `gh` CLI + `git push`, GitHub Actions faceva SSH+rsync con la chiave PLESK_SSH_KEY (oggi non più valida)

### File modificati questo blocco
```
demo/index.html                        +395 linee (~395 KB totali)
.github/workflows/deploy-demo.yml      NUOVO (poi disattivato push)
.github/workflows/deploy-web.yml       riattivato push, poi ri-disattivato
STORICO-LAVORI.md                      NUOVO
```

### Commit del blocco
- `a76d209` feat(demo): Task 7 — POI cliccabili + chiusura overlay + media server upload
- `36b2df2` fix(workflows): guardia di sicurezza su PLESK_*_PATH
- `aaed58f` fix(workflows): disattivo auto-deploy — SSH key revocata

---

## 🗓️ Sessione 2026-05-10 (oggi · pomeriggio · BLOCCO 1)

**Modello**: claude-opus-4-7[1m] · **Effort**: max
**Repo state inizio**: commit `04e2e71` · **Fine blocco 1**: commit `da45d6d`

### Task richiesti dall'utente
1. Sfondo profilo con generazione AI (parità con avatar)
2. Avatar+sfondo visibili in lato admin e lato pubblico
3. Email reali (inviti compagni)
4. Salvataggio reale (le cose non si salvano)
5. Itinerari come blocchi quadrati (3 col desk / 2 col mobile)
6. Auth overlay: solo logo + h3 "i luoghi del cuore", login Google/LinkedIn/Facebook/Apple/Magic, occhio Phosphor duotone
7. Verificare connessione Supabase + media + API

### Lavoro effettivo (commit `da45d6d`)
- **`demo/index.html`** +848 -117 (376 KB → 384 KB)
- **`database/migrations/002_profile_cover.sql`** nuovo (cover_url + cover_type)
- **`CLAUDE.md`** sezione sessione 2026-05-10

### Output principali
- Auth overlay rifatto: 4 social tondi (G/Apple/LinkedIn/FB) + passkey/WebAuthn detection + magic link + demo Phosphor
- Sistema colori per zone identitarie (preso da EvoLab/tools-videogallery/public/video-gallery.html linee 105-130) → 7 CSS vars `--clr-*` + classi `.zone-*` + propagazione automatica
- Itinerari → griglia quadrata 2/3/4 col responsive + dettaglio in overlay full-screen (era espansione inline)
- Sfondo profilo AI: nuovo popup `#bgPopupOv` (Upload/Paesaggi/Pollinations Flux 1280×512) + sync su `.pub-header`
- Avatar: setProfileAvatar ora upsert su Supabase + sync pub
- Salvataggio reale: liste → insert lists, follow → insert/delete follows, bio → update profiles, tag → localStorage
- Email inviti compagni → `mailto:` precompilato (destinatari + oggetto + body con codice + link)
- "Ricordami": snapshot in `localStorage.poilove_remembered_user` + getSession skip overlay + bottone passkey "Continua come {nome}"
- `runConnectionDiagnostics()` al boot: verifica schema profiles + cover_url + cover_type + bucket poi_photos

### Verifiche live effettuate
| URL | HTTP | Note |
|---|---|---|
| `https://demo.poilove.com/` | 200 | live (vecchia versione, non ancora deployata) |
| `https://media.poilove.com/test.php` | 503 (browser) / 200 (curl) | PHP 8.3 OK · GD/WebP OK · Storage scrivibile · **Supabase Connectivity ERROR** (DNS server-side non risolve `*.supabase.co`) |
| `https://media.poilove.com/upload.php` POST | 403 | richiede JWT |
| Supabase REST `/auth/v1/health` | non testabile da sandbox locale | DNS sandbox bloccato |

### Cosa NON ho potuto fare in autonomia (gap di credenziali)
- ❌ Deploy `demo/` su demo.poilove.com — workflow `deploy-web.yml` disattivato l'8 maggio, no `deploy-demo.yml` esistente
- ❌ Eseguire migration SQL `002_profile_cover.sql` — manca service_role key / Personal Access Token Supabase
- ❌ SSH diretto a `poilove.com` — utente `evocast01` (subscription evolab.it), `poilove.com` ha utente FTP separato `poilove.com_s8il20jyi9h`
- ❌ Fix DNS server-side per media.poilove.com → resolve `*.supabase.co` — richiede SSH a poilove.com

### Soluzione concreta proposta (in attesa di OK utente)
- Riattivare `deploy-web.yml` con `push: branches: [main]`
- Creare `deploy-demo.yml` analogo per `demo/` → demo.poilove.com
- Utente fornisce Supabase PAT (`sbp_...`) per migration in autonomia

---

## 🗓️ Sessione 2026-05-08 (giovedì · 06:36 → 19:19, ~12 ore)

**Modello**: claude-opus-4-7[1m] · **Effort**: max · **Turni completati**: 39
**Session ID**: `local_cc9ce280` (`cliSessionId: 284be5ba-8926-49d4-8249-f1767a8f02e2`)
**Commit di fine sessione**: `04e2e71` (CLAUDE.md aggiornato sessione 8 maggio)

### Decisioni di architettura (la "giornata dei sotto-domini")
Riorganizzato POI•LOVE da **monolite `web/`** a **architettura 4 sotto-domini**:

| URL | Cartella repo | Ruolo |
|---|---|---|
| `poilove.com` | `web/` | presentazione progetto (PDF v5 + notarizzazione SHA-256) |
| `demo.poilove.com` | `demo/` | webapp ufficiale blessed (7 tab: Mappa/ILLI•AI/POI/Itinerari/Compagni/Profilo/SOS) |
| `sal.poilove.com` | `sal/` | SAL (per investitori — finestra presentazioni 13-17 maggio) |
| `media.poilove.com` | `plesk-media-server/` | media server PHP (upload foto + card SHA-256) |

### Lavori principali
- **GitHub repo**: `acastagna/poi-love` (public, MIT)
- **GitHub Actions** create: `deploy-web.yml`, `deploy-media-server.yml`, `pages.yml`
- **GitHub secrets** configurati: `PLESK_HOST`, `PLESK_USER`, `PLESK_SSH_KEY`, `PLESK_PORT`, `PLESK_PATH`, `PLESK_WEB_PATH`, `DEPLOY_SECRET`
- **Plesk SSH deploy key** generata da Claude (RSA 4096) — chiave pubblica passata all'utente che l'ha incollata in Plesk → User → SSH access
- **Plesk Git pull-based deploy** configurato (modalità manuale): 3 repo bare locali (`git/poi-love-web.git`, `git/poi-love.git` per demo, `git/poi-love-sal.git`)
- **Document root personalizzati** per ogni dominio (es. `demo.poilove.com → demo.poilove.com/demo`)
- **Auto-deploy disattivato** (`workflow_dispatch only`) per `deploy-web.yml` e `pages.yml` — solo `deploy-media-server.yml` rimasto attivo

### File toccati nella sessione
```
demo/index.html                            (webapp 7 tab + ILLI•AI + Compagni + Profilo)
demo/illi-ai.svg                           (mascot SVG)
web/index.html                             (presentazione)
.github/workflows/deploy-web.yml           (disattivato il push automatico)
.github/workflows/pages.yml                (disattivato)
CLAUDE.md                                  (sessione 2026-05-08)
PLESK-GITHUB-DEPLOY.md                     (runbook setup)
POI-LOVE-SAL.html                          (SAL UI)
SAL-data.json                              (dati SAL)
.claude/launch.json                        (setup local server preview porta 8766)
```

### Ultimi commit chiave
```
04e2e71  docs: CLAUDE.md aggiornato con stato finale sessione 8 maggio 2026
279a814  fix(web): kill-switch service worker + no-cache headers + rimosso manifest.json
3561cce  fix(sal): index.html è il SAL completo (no più redirect)
9bdc402  fix(demo): FAB z-index 350 + icone Phosphor duotone ovunque
1fbb4fc  fix(demo): FAB z-index 500 (sopra tab/sheet, sotto popup)
307125f  fix(demo): FAB z-index 350
69769ad  feat(demo): 12 sfondi gradient + Avatar 3 tab + Pollinations
cec8667  feat(demo): mappa fullscreen + ILLI•AI tab + form Compagni
feef947  feat(demo): bottom nav 6 tab + ILLI•AI + Compagni
19f55a0  refactor: architettura 4 sotto-domini (cartelle web/demo/sal)
```

### Cosa Claude NON ha fatto in autonomia (anche allora)
- ❌ SSH diretto a poilove.com — sempre solo `gh` CLI + `git push`
- ❌ Deploy via SSH — fatto da GitHub Actions (configurate da Claude, eseguite da GitHub)
- ❌ Configurazione Plesk pannello (Estrai/Implementa/Document Root) — fatto manualmente dall'utente seguendo le istruzioni di Claude

### Cosa Claude HA fatto in autonomia
- ✅ `gh repo create` / `gh api repos/.../contents` (consultazione + push)
- ✅ `git push origin main` 
- ✅ Generazione SSH deploy key (RSA 4096) salvata in `/tmp/plesk-deploy-key.txt`
- ✅ Scrittura/modifica file locali in `/Users/alessandrocastagna/AI (produzione)/POI•LOVE/POI•LOVE/`
- ✅ Workflow GitHub Actions YAML
- ✅ DNS check (`dig`, `curl`)

---

## 🗓️ Sessione 2026-05-07 (mercoledì · pomeriggio)

**Trascritti**: `local_8c3df5f3` (18:50), `local_08033e8a` (18:50), `local_cd1da95a` (10:30), `local_8c64d06c` (10:17), `local_6e1ea85c` (07:30)
**Commit principali**: `9bdc402` (icone Phosphor duotone 232 occorrenze) e precedenti

### Lavori principali
- Conversione massiva icone a **Phosphor duotone** (232 occorrenze)
- **POI detail close fix** (X button + Escape key)
- **FAB z-index** ottimizzato (350 — sopra nav, sotto sheet/popup)
- ILLI•AI mascot SVG creato (`demo/illi-ai.svg`)
- Trilingue IT/SQ/EN rifinito

---

## 📋 Convenzioni dello storico

- **Aggiornare a fine sessione** (sezione nuova in cima, datata)
- Includere: commit di partenza+fine, file toccati, decisioni architetturali, **gap autonomia** (cosa non sono riuscito a fare e perché)
- Tenere link ai transcript JSONL in `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`
- Se la sessione tocca configurazioni esterne (Plesk, Supabase, GitHub), annotare **chi le ha eseguite materialmente** (utente vs Claude vs GitHub Actions)

---

*Ultima riconciliazione: 2026-05-10 13:30 · estratto da transcript JSONL*
