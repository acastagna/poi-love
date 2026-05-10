# 📜 STORICO LAVORI — POI•LOVE

> Registro cronologico delle sessioni Claude.
> **Aggiornare a fine sessione**, sezione nuova in cima.
> Date in formato europeo `dd/mm/aaaa`.
> Fonte transcript: `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`

---

## 🗓️ 10/05/2026 — Auth completo + cuori + logo SVG + multilingue + chip lingua + INCIDENT 740 file

### ⚠️ INCIDENT — 740 file cancellati in produzione

**Cosa è successo**: riattivando i workflow GitHub Actions di deploy (`deploy-web.yml`, nuovo `deploy-demo.yml`), il run `25627558418` ha eseguito `rsync -avz --delete demo/ user@host:${PLESK_DEMO_PATH}/` con il secret `PLESK_DEMO_PATH` non ancora settato (stringa vuota). GitHub ha risolto la stringa come "" → rsync ha sincronizzato `demo/` (5 file) verso **`/`** del server con `--delete`. Risultato: **740 file cancellati** su `/var/www/vhosts/poilove.com/`.

**Distribuzione cancellazioni**:
- httpdocs (poilove.com root): 117 file
- demo.poilove.com: 91
- sal.poilove.com: 178
- media.poilove.com: 16
- git/ (repo bare Plesk): 126
- logs/: 144
- .ssh/: 5 (incluso authorized_keys → SSH key revocata di conseguenza)
- .composer, .nodenv, .phpenv, .trash, .bash_history: ~50

**4 sotto-domini down per ~3 ore** in piena finestra pre-presentazione SAL (13-17 Maggio).

**Recovery**: l'utente ha ripristinato il backup Plesk del 09/05/2026 mattina. I siti sono tornati al contenuto del commit `04e2e71` (08/05/2026).

**Run di riferimento**:
- `25627558401` Deploy → poilove.com (root) · success · 4 file innocui (rsync senza --delete)
- `25627558418` Deploy → demo.poilove.com · failure · **740 file cancellati**
- `25627614938`, `25627614939`, `25627650997` · failure successivi · SSH key revocata da fail2ban

### 🛡️ Lessons learned + REGOLE HARD aggiunte a CLAUDE.md

Aggiunto blocco **🔒 REGOLE HARD** in CLAUDE.md (vedi sezione dedicata):
1. **MAI `--delete` in rsync** in alcun workflow/script
2. **MAI riattivare workflow disattivato** senza dry-run + conferma scritta
3. **MAI modificare `.github/workflows/`** senza ack esplicito
4. **MAI `gh secret set`, `gh workflow run`, `gh secret delete`** senza ack
5. **MAI `git push --force`** senza ack scritto
6. **MAI scrittura SSH** su `/var/www/vhosts/poilove.com/` (lettura/diagnostica OK)
7. Pattern **guardia path obbligatoria** nei workflow YAML (controllo che PLESK_*_PATH inizi con `/var/www/vhosts/poilove.com/`)
8. Date sempre in formato europeo `dd/mm/aaaa`

### 🔄 Rollback GitHub origin/main a 04e2e71 (08/05)

Salvato il lavoro di oggi in branch backup `wip/2026-05-10-task7-auth` (commit `4f38c83`), poi force push a `04e2e71` per ripartire pulito (allineato col backup Plesk dell'utente).

### ✅ Commit ricostruiti uno alla volta su main (HEAD: 47fb29b)

| # | SHA | Messaggio | File | Live |
|---|---|---|---|---|
| 1 | `2185737` | docs: incident report + REGOLE HARD per Claude | CLAUDE.md (+52 -0) | n/a |
| 2 | `ccf721b` | feat(demo+sal+web): auth restyle + 2 cuori animati + logo SVG ufficiali | demo/index.html (+1213 -167), sal/index.html (-2), web/img/, demo/img/, sal/img/ (5 SVG ognuna) | ✅ demo.poilove.com (414 KB) |
| 3 | `d3daf48` | feat(demo): traduzioni IT/SQ/EN complete + auto-detect dispositivo | demo/index.html (+146 -116) | ✅ |
| 4 | `1df6ff5` | feat(demo): chip lingua glassmorphism nell'auth overlay | demo/index.html (+48 -0) | ✅ |
| 5 | `47fb29b` | chore(demo): inverti ordine chip lingua → EN · SQ · IT | demo/index.html (+6 -6) | ✅ |

### 🎨 Cosa contengono i commit

**Auth overlay completamente ridisegnato** (`ccf721b`):
- Logo SVG **ufficiale** (`logo-completo.svg` 1088×190 vettoriale puro, in `web/img/`+`demo/img/`+`sal/img/`)
- Tagline `<h3>i luoghi del cuore</h3>`
- 🍎 **ID Apple** primary nero (largo)
- 👆 **Accedi con Biometria** primary trasparente (passkey/WebAuthn detect)
  - Se c'è email memorizzata → testo "Accedi come {handle}"
- Riga 4 social al 25%: **Google · Facebook · LinkedIn · X** (ordine fisso)
- Magic link via email
- "Esplora demo" con icona Phosphor `ph-eye` duotone
- **2 cuori giganti animati** nello sfondo (z-index:0):
  - h1 rosso 420×420 ciclo 26s
  - h2 rosa 520×520 ciclo 32s, delay -9s
  - Percorrono tutta la schermata, easing morbido `cubic-bezier(.45,.05,.55,.95)`
  - Reduced-motion media query rispettata
- Path immagini relativi (`img/...`) — niente più dipendenza da `poilove.com/img/...` (che era 404)

**Sistema multilingue completo IT/SQ/EN** (`d3daf48`):
- ~70 chiavi nuove × 3 lingue = ~210 traduzioni
- `applyLang()` esteso a 3 attributi:
  - `data-t` = textContent
  - `data-tt` = title + aria-label (tooltip)
  - `data-tp` = placeholder
- **Auto-detect lingua dispositivo**:
  1. `localStorage.poilove_lang` (preferenza utente memorizzata)
  2. `navigator.language` (default sistema)
  3. Fallback IT
- Helper `t(key, fallback)` per uso JS dinamico
- Sostituiti **tutti** i toast/prompt italiani hardcoded con `t('chiave')`
- `_providerErrorToast()` helper unico per gli errori OAuth tradotto
- Aree tradotte: auth overlay, POI list actions, Itinerari overlay, Profile background popup, Avatar popup, toast comuni, follow

**Chip lingua glassmorphism** (`1df6ff5`):
- 3 chip pillola sotto "Esplora demo": **🇬🇧 EN · 🇦🇱 SQ · 🇮🇹 IT** (ordine `47fb29b`)
- Container con `backdrop-filter: blur(14px) saturate(1.2)` (effetto vetro liquido)
- Chip attivo: gradient `#D42B2B → #7C3AED` al 30% alpha + ring bianco interno + ombra rossa esterna
- Bandiera con `drop-shadow` per profondità + `saturate(1.15)`
- Animazione `cubic-bezier(.34,1.56,.64,1)` snappy con overshoot
- `applyLang()` aggiorna automaticamente la classe `.active` sul chip `[data-lang=l]`
- Click chip = cambio lingua immediato (testi, tooltip, placeholder e chip si aggiornano in tempo reale)

**Cose **NON ancora live** (rollbackate dal disastro)** — restano nel branch `wip/2026-05-10-task7-auth`:
- Lista POI Miei/Loved/Vicini cliccabile + bottoni Naviga/Mappa/Condividi/Visibilità/Suggerisci Google/Modifica/Elimina
- Chiusura overlay semplificata (ESC universale + tap-out backdrop)
- Sistema colori per zone identitarie (--clr-map/illi/poi/itin/comp/prof/sos)
- Itinerari griglia quadrata 2/3/4 col + dettaglio in overlay
- Sfondo profilo AI (Pollinations 1280×512)
- Salvataggio reale Supabase (avatar/cover/bio/lists/follows)
- Email inviti compagni via mailto
- Upload foto via media.poilove.com (con fallback Supabase Storage)
- Diagnostica connessione al boot
- Migration SQL `002_profile_cover.sql` (cover_url + cover_type)

**Da riprendere dal branch `wip/2026-05-10-task7-auth`** una funzione alla volta, dopo verifica.

### 🔌 Stato infrastruttura a fine sessione

| URL | HTTP | Size | Note |
|---|---|---|---|
| https://poilove.com/ | 200 | 613 KB | ✅ presentazione 08/05 (NON aggiornato oggi — manca pull web/) |
| https://demo.poilove.com/ | 200 | **414 KB** | ✅ aggiornato a HEAD `47fb29b` (cuori + logo + traduzioni + chip EN/SQ/IT) |
| https://sal.poilove.com/ | 200 | 100 KB | ✅ SAL 08/05 (NON aggiornato oggi — manca pull sal/) |
| https://media.poilove.com/test.php | 503\* | OK | PHP+GD+WebP+EXIF+Storage OK; **DNS server-side non risolve `*.supabase.co`** (problema pre-esistente) |

\*503 applicativo, non server down.

### ⚠️ Cose ANCORA da fare (riprendere domani)

| Priorità | Cosa | Tempo | Note |
|---|---|---|---|
| 🔴 ALTA | **Plesk pull `web/` e `sal/`** | 2 min | per allineare poilove.com root + SAL alle ultime cose (logo SVG nuovo, sal/img/ aggiunto) |
| 🔴 ALTA | **Test Google OAuth live** | 2 min | bottone G nell'auth overlay — già configurato 26/04, va solo testato |
| 🟡 MEDIA | **Setup X (Twitter) OAuth** | 10-15 min | X Developer Account (gratis) → Client ID/Secret → Supabase |
| 🟡 MEDIA | **Setup LinkedIn OIDC** | 10 min | LinkedIn Developer (gratis) → "Sign In with LinkedIn using OpenID Connect" |
| 🟡 MEDIA | **Setup Facebook** | 15-25 min | Meta for Developers (gratis) → privacy policy URL + App Review |
| 🟢 BASSA | **Setup Apple Sign In** | 15 min + $99/anno | RIMANDATO a giugno 2026 (lancio prodotto Tirana) |
| 🟡 MEDIA | **Migration SQL `002_profile_cover.sql`** | 1 min | Supabase SQL Editor (per sfondo profilo AI quando lo riportiamo da branch wip) |
| 🟡 MEDIA | **Riportare feature da wip/2026-05-10-task7-auth** | 30-45 min | una alla volta, con preview + verify |
| 🟢 BASSA | **Fix DNS server-side media.poilove.com** | richiede SSH server | aggiungere `8.8.8.8` in /etc/resolv.conf di poilove.com_*** subscription |
| 🟢 BASSA | **Rigenerare SSH key Plesk + secret PLESK_SSH_KEY** | 5 min | per ripristinare auto-deploy GitHub Actions in futuro (resta opzionale) |

### 🔧 Cosa l'utente NON deve toccare ancora (regole hard)

- **NON eseguire** `gh workflow run` su `deploy-*.yml`
- **NON modificare** secrets PLESK_* finché non rigeneriamo SSH key
- I workflow `deploy-web.yml` e `deploy-media-server.yml` sono ancora `workflow_dispatch only` (sicuri, niente push automatico)
- Il workflow `deploy-demo.yml` esiste in `wip/2026-05-10-task7-auth` ma **NON in main** (è stato rollbackato)

### 📦 Branch backup attivo

```
origin/wip/2026-05-10-task7-auth  →  4f38c83
```

Contiene tutto il lavoro ulteriore di oggi (Task 7 + workflows + STORICO-LAVORI prima versione). Quando riprendiamo, faremo cherry-pick selettivo dei commit "buoni" (skip dei workflow rischiosi).

---

## 🗓️ 08/05/2026 — Tutto LIVE in produzione (sessione precedente)

**Modello**: claude-opus-4-7[1m] · **Effort**: max · **Turni completati**: 39 (~12 ore)
**Session ID**: `local_cc9ce280` (cliSessionId `284be5ba-8926-49d4-8249-f1767a8f02e2`)
**Commit di fine sessione**: `04e2e71`

### Decisioni di architettura

Riorganizzato POI•LOVE da **monolite `web/`** a **architettura 4 sotto-domini**:

| URL | Cartella repo | Ruolo |
|---|---|---|
| poilove.com | `web/` | presentazione progetto (PDF v5 + notarizzazione SHA-256) |
| demo.poilove.com | `demo/` | ⭐ webapp ufficiale blessed (7 tab: Mappa/ILLI•AI/POI/Itinerari/Compagni/Profilo/SOS) |
| sal.poilove.com | `sal/` | SAL — Stato Avanzamento Lavori (per investitori, finestra 13-17 Maggio) |
| media.poilove.com | `plesk-media-server/` | media server PHP (foto upload + card SHA-256) |

### Lavori principali

- GitHub repo `acastagna/poi-love` (public, MIT)
- GitHub Actions create: `deploy-web.yml`, `deploy-media-server.yml`, `pages.yml`
- GitHub secrets configurati: `PLESK_HOST`, `PLESK_USER`, `PLESK_SSH_KEY`, `PLESK_PORT`, `PLESK_PATH`, `PLESK_WEB_PATH`, `DEPLOY_SECRET`
- Plesk SSH deploy key generata + incollata manualmente in Plesk dall'utente
- Plesk Git pull-based deploy configurato (3 repo bare locali)
- Document root personalizzati per ogni dominio
- Auto-deploy GitHub Actions disattivato (`workflow_dispatch only`) per `deploy-web.yml` e `pages.yml` — solo `deploy-media-server.yml` rimasto attivo

### Cosa Claude HA fatto in autonomia (sessione 08/05)

- ✅ `gh repo create` / `gh api repos/.../contents`
- ✅ `git push origin main`
- ✅ Generazione SSH deploy key (RSA 4096) salvata in `/tmp/plesk-deploy-key.txt`
- ✅ Modifica file in repo locale
- ✅ Workflow GitHub Actions YAML
- ✅ DNS check (`dig`, `curl`)

### Cosa Claude NON ha fatto in autonomia (sessione 08/05)

- ❌ SSH diretto a poilove.com (mai avuto credenziali utente `poilove.com_s8il20jyi9h`)
- ❌ Deploy via SSH (fatto da GitHub Actions configurate ma eseguite da GitHub)
- ❌ Configurazione pannello Plesk (Estrai/Implementa/Document Root) — fatta manualmente dall'utente

### Ultimi commit chiave (08/05)

```
04e2e71  docs: CLAUDE.md aggiornato con stato finale sessione 8 maggio 2026
279a814  fix(web): kill-switch SW + no-cache headers + rimosso manifest.json
3561cce  fix(sal): index.html è il SAL completo (no più redirect)
9bdc402  fix(demo): FAB z-index 350 + icone Phosphor duotone (232 occorrenze)
69769ad  feat(demo): 12 sfondi gradient + Avatar 3 tab + Pollinations
cec8667  feat(demo): mappa fullscreen + ILLI•AI tab + form Compagni
feef947  feat(demo): bottom nav 6 tab + ILLI•AI mascot + Compagni
19f55a0  refactor: architettura 4 sotto-domini
```

---

## 🗓️ 07/05/2026 — Phosphor duotone + UI fix (sessione precedente)

**Trascritti**: `local_8c3df5f3` (18:50), `local_08033e8a` (18:50), `local_cd1da95a` (10:30), `local_8c64d06c` (10:17), `local_6e1ea85c` (07:30)
**Commit principali**: `9bdc402`, `307125f`, `1fbb4fc`, `f04ad3b`, `a5e615a`

### Lavori
- Conversione massiva icone a **Phosphor duotone** (232 occorrenze)
- POI detail close fix (X button + Escape)
- FAB z-index ottimizzato (350 — sopra nav, sotto sheet/popup)
- ILLI•AI mascot SVG creato (`demo/illi-ai.svg`)
- Trilingue IT/SQ/EN rifinito

---

## 📋 Convenzioni dello storico

- **Aggiornare a fine ogni sessione** — sezione nuova in cima, datata `dd/mm/aaaa`
- Includere sempre: SHA commit di partenza+fine, file toccati, decisioni architetturali, **gap di autonomia** (cosa Claude NON è riuscito a fare e perché)
- Tenere link a transcript JSONL in `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`
- Se la sessione tocca configurazioni esterne (Plesk, Supabase, GitHub), annotare **chi le ha eseguite materialmente** (utente vs Claude vs GitHub Actions)
- Annotare se ci sono stati **incidenti** in sezione dedicata in alto, con cause + lessons learned
- Date in formato europeo `dd/mm/aaaa` (mai `mm-dd` o testo "8 maggio")
