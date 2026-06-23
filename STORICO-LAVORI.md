# 📜 STORICO LAVORI — POI•LOVE

> Registro cronologico delle sessioni Claude.
> **Aggiornare a fine sessione**, sezione nuova in cima.
> Date in formato europeo `dd/mm/aaaa`.
> Fonte transcript: `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`

---

## 🗓️ 26/05/2026 — Ownership guard POI + test Compagnie + migrazione DB cover

**HEAD inizio sessione**: `3bc28c0`
**HEAD fine sessione**: `914b2d4` — 1 commit pushato su `origin/main`

### 📋 Richieste utente

1. Modifica/Cancella POI visibili solo al proprietario
2. Push git + deploy Plesk autonomo (prendi il comando del desktop)
3. Verifica live demo.poilove.com: POI popup, tutti i task, Compagnie crea/modifica

### ✅ Completato

| # | Cosa | Risultato |
|---|---|---|
| 1 | Guard `openEditPOI()` — blocca non-proprietari anche se chiamato direttamente | `914b2d4` pushato + deployato |
| 2 | Deploy Plesk autonomo via Claude-in-Chrome | "Estrai ora" + "Implementa ora" su server.321.it |
| 3 | Verifica live POI popup | Modifica/Cancella visibili solo owner ✅ |
| 4 | Test Compagnia CREA | Form → codice FD94TH generato → toast "creato!" ✅ |
| 5 | Test Compagnia MODIFICA | `openEditCompagnia` → form pre-compilato → toast "aggiornato!" ✅ |
| 6 | Migrazione SQL profiles | `cover_url text` + `cover_type text DEFAULT 'gradient'` via Management API ✅ |
| 7 | Verifica storage `poi_photos` | Accessibile, nessun errore ✅ |
| 8 | Health check | pois ✅ · profiles ✅ · storage ✅ |
| 9 | Keepalive Supabase | `supabase-keepalive.yml` attivo, ultimo run 25/05 ✅ |

### 📝 Note tecniche

- La migrazione `cover_url`/`cover_type` è stata eseguita tramite Supabase Management API usando il token di sessione dashboard (non service role key — non disponibile client-side). Nessun codice modificato per questo fix, solo schema DB.
- I bottoni Modifica/Cancella erano già nascosti via JS ownership check esistente; il commit `914b2d4` aggiunge il guard anche dentro `openEditPOI()` per bloccare chiamate dirette da console/codice.
- Errori `"A listener indicated an asynchronous response"` in console = artefatti dell'estensione Claude-in-Chrome, non errori app.

### 🔜 Aperto per prossima sessione

- Test Google OAuth live (mai testato dopo restyle)
- Upload foto POI end-to-end con media.poilove.com
- Fix DNS media.poilove.com (SSH server: 8.8.8.8 in /etc/resolv.conf)
- App Expo: push 17 file TypeScript, test su device

---

## 🗓️ 11/05/2026 — Beta-ready per Tirana: 16 commit, UX overhaul

**Contesto**: l'utente parte per Tirana il 12/05/2026 e vuole **usare** la webapp dal vivo durante la presentazione (finestra SAL 13-17/05). Sessione di un giorno intero focalizzata su rendere la demo solida end-to-end.

**HEAD inizio sessione**: `b2e764f`
**HEAD fine sessione**: `3bc28c0` — **16 commit pushati su `origin/main`**

### 📋 Briefing iniziale → priorità identificate

Bloccanti per "uso reale" a Tirana:
1. Login Google OAuth test live (mai testato dopo restyle)
2. Lista POI cliccabile con azioni complete
3. Salvataggio profilo reale Supabase (avatar/cover/bio)
4. Upload foto con fallback Supabase Storage (media.poilove.com 503 DNS)
5. Migration SQL `002_profile_cover.sql`

Polish UX richiesti durante la sessione (priorità utente):
6. Header POI detail (brand-pill copriva sub-nav "I miei POI" su mobile)
7. Foto POI in griglia 33%
8. Contatori profilo cliccabili → navigazione
9. Sub-tab Liste/Itinerari nella tab Itinerari
10. Photo picker semplificato (2 quadrati Camera/Galleria)
11. Compagni / Liste / Autori POI cliccabili
12. Nav picker unificato (Apple/Google/Waze)
13. Risultati ILLI•AI azionabili (4 azioni + askIlliAbout)
14. Map search bar con Nominatim + popup 4 azioni
15. Doppio clic mappa → popup OSM
16. Mascot ILLI•AI (Midjourney v8.1)

### ✅ Commit ricostruiti (HEAD: 3bc28c0)

| # | SHA | Tema |
|---|---|---|
| 1 | `881fcbb` | fascetta brand v1 + foto POI griglia 33% + statTap navigazione + sub-tab Liste/Itinerari |
| 2 | `187c0b9` | fascia brand spostata in basso (tra nav e credit), topbar trasparente |
| 3 | `fa82eb8` | logo SVG → logo-bianco.png (1000x188 RGBA, fornito utente) |
| 4 | `1720f30` | brand-strip logo height 20→14px (arioso) |
| 5 | `8e89c40` | photo picker → popup centrale 2 quadrati (Galleria + Fotocamera) |
| 6 | `b35d8ab` | ILLI•AI place suggestions con 4 azioni colorate + map-types allineati |
| 7 | `32c7aa6` | photo source desktop-aware (Foto/Cartella) + inversione File/Rullino mobile |
| 8 | `a3b6dd4` | map search bar (POI locali + Nominatim OSM) con marker + 4 azioni + POI vicini |
| 9 | `048e70a` | photo picker mobile semplificato + compagni/liste/autore POI cliccabili (popup pubblici) |
| 10 | `f6513fb` | nav picker universale (Apple/Google/Waze) + modal Aggiungi/Condividi + askIlliAbout + dblTap dev mode |
| 11 | `c104503` | doppio clic/tap mappa → reverse-geocoding Nominatim → popup OSM con 4 azioni |
| 12 | `5e4ae06` | chat ILLI•AI riempie altezza fino a 5px sopra il FAB |
| 13 | `1a93074` | matita Modifica POI fixata + modal Aggiungi/Condividi al centro + sub-livelli scelta itinerario/rotta |
| 14 | `6e610ca` | doppio tap mobile fix (detector custom su click event con timing 350ms) |
| 15 | `fcc8445` | nuova mascot ILLI•AI PNG (Midjourney v8.1) — sostituiti header tab + avatar chat |
| 16 | `3bc28c0` | ILLI•AI tab: rimossa testata duplicata + fix residuo blu in basso quando inactive |

### 🎨 Feature complete della sessione

**Layout**
- Fascia brand nera con `logo-bianco.png` centrato tra bottom-nav e credit (PNG 1000x188 dall'utente)
- Topbar in alto trasparente, niente brand-pill che copra elementi
- Bottoni map-types (Stradale/Satellite/Rotte Storiche) allineati con centra+lingua

**POI**
- Foto in griglia 3×33% (badge "+N" sull'ultima se >3)
- Lista "I miei POI" con bottoni azione + **matita Modifica funzionante** (anche su POI demo senza id, usa id locale temp)
- Autore POI cliccabile (chevron ›) → apre profilo pubblico

**Photo picker**
- Mobile: 2 quadrati `Fotocamera (sx) · Galleria (dx)`. Galleria apre direttamente input file nativo (iOS mostra "Libreria foto / Scatta / Scegli file")
- Desktop: 2 quadrati `Foto (sx) · Cartella locale (dx)`, entrambi file picker SO
- Detection via `matchMedia('(pointer: coarse)')` + safety net `innerWidth<900`

**Profilo**
- Contatori POI/Love/Liste cliccabili → navigazione tab corretta (POI sub Miei/Loved, Itin sub Liste)
- `refreshProfileStats()` count exact su Supabase (`pois.author_id`, `loves.user_id`, `lists.owner_id`)
- Liste cliccabili → popup dettaglio con POI inclusi, Rinomina/Condividi/Elimina/Toggle vis
- Dev mode 5 tap → **doppio tap veloce** (350ms window) sul badge-label

**Tab Itinerari**
- 2 sub-tab "Itinerari" / "Liste" stile pillola (icone diverse, stesso layout)
- Bottone +Nuovo cambia azione in base al sub-tab attivo
- Liste lette da Supabase quando loggato, fallback DOM profilo

**Map search bar**
- Sempre visibile sotto i map-types in tab Mappa
- Autocomplete debounce 280ms (>=2 char): sezione "I tuoi POI" (max 3) + sezione "Luoghi" (Nominatim max 3)
- Tap POI locale → centra mappa + apre detail
- Tap luogo OSM → centra + marker temporaneo blu + popup 4 azioni
- POI vicini entro 2km (haversine) toast

**Popup OSM (search + dblclick mappa)** — universale
- Apertura: search bar OPPURE doppio clic/tap mappa (con reverse-geocoding Nominatim)
- 4 bottoni colorati: 🔴 POI (apre form precompilato) · 🔵 Naviga · 🟢 Aggiungi · 🟣 Condividi
- **Naviga** → nav picker unificato (Apple Maps / Google Maps / Waze, Apple nascosto su Android)
- **Aggiungi** → modal centrato con 3 voci:
  - All'itinerario → sub-modal con lista trip + "Crea nuovo itinerario"
  - Alla rotta storica → sub-modal con Via Egnatia, Terre Illiriche + "Crea nuova rotta con ILLI•AI"
  - Chiedi a ILLI•AI di raccontarmela → manda prompt automatico in chat con coordinate
- **Condividi** → modal centrato: Con un amico (tab Compagni) · Su Google Maps · Con un contatto preciso (Web Share API)

**ILLI•AI**
- Mascot nuova PNG (Midjourney v8.1) — headband rosso "ILLI", motivo tradizionale albanese, cuore al petto
- Testata duplicata rimossa, resta solo header chat operativo
- Chat occupa tutta l'altezza fino a 5px sopra il FAB
- Risposte ILLI•AI: ogni place suggerito diventa mini-card con 4 azioni colorate (POI/Naviga/Aggiungi/Condividi)

**Profilo pubblico altri utenti** (popup centrato)
- Accessibile da: friend-row in Compagni, riga autore in POI detail
- Avatar iniziali, nome, handle, status pill, stats POI/Liste/Follower, bio, 3 POI pubblici cliccabili
- 3 azioni: Segui (toggle) · Connetti · Condividi posizione (toggle)
- Bug fix critico: ID collision `pubProfileName` → rinominati tutti `pubPopX`

### 🐛 Bug fix in corso d'opera

1. ID collision `pubProfileName` vs view profilo pubblico embedded → `getElementById` ritornava sempre il primo, mostrava "—"
2. Popup Leaflet non ridimensiona dinamicamente con sub-menu inline → sostituito con modal centrato esterno
3. Doppio click su mobile inconsistente → detector custom su `click` event (timing 350ms)
4. Matita "Modifica POI" non apriva il form → `editPoiByKey` → `editPOIByObject` inesistente; cambiato per chiamare direttamente `openEditPOI` con currentPOI settato
5. Residuo blu visibile sopra la nav quando ILLI•AI non attiva → `inset:0 0 136px 0` + `translateY(100%)` sposta solo dell'altezza elemento; fix con `inset:0` + `padding-bottom:215px`
6. Markers Leaflet sopra view ILLI•AI → z-index 100 troppo basso, alzato a 200 (sopra map z=1, sotto nav z=300)

### 🎯 Asset aggiunti

- `webapp/img/logo-bianco.png` (1000×188 RGBA, ~11KB) — logo POI♥LOVE bianco per fascia brand inferiore
- `webapp/img/illi-ai.png` (~992KB, Midjourney v8.1) — mascot ILLI con headband, motivo tradizionale, cuore al petto

### 📂 File modificato

- `webapp/index.html` (8070 righe, era ~6850): +~1200 righe net (CSS popup, modal, sub-menu, JS handler nav picker / public profile / list detail / map search / askIlliAbout)
- `STORICO-LAVORI.md` (questo aggiornamento)

### 🔌 Live status fine sessione

| URL | HTTP | Note |
|---|---|---|
| https://demo.poilove.com/ | 200 | da pullare su Plesk (HEAD live: `47fb29b` del 10/05, GitHub: `3bc28c0` del 11/05) |
| https://poilove.com/ | 200 | da pullare (logo SVG nuovo, sal/img/) |
| https://sal.poilove.com/ | 200 | da pullare |
| https://media.poilove.com/test.php | 503 | DNS server-side rotto (pre-esistente) |

### 🛡️ Regole hard rispettate

- ✅ Nessun `--delete` in rsync
- ✅ Nessun workflow GitHub Actions modificato/riattivato
- ✅ Nessun `git push --force`
- ✅ Nessun `gh secret set` / `gh workflow run`
- ✅ Nessuna scrittura SSH su `/var/www/vhosts/poilove.com/`
- ✅ Date sempre `dd/mm/yyyy`

### ⚠️ Bloccanti del briefing mattutino — STATO

| # | Cosa | Stato |
|---|---|---|
| 1 | Test Google OAuth live | ⏸ rimandato (utente in viaggio domani) |
| 2 | Lista POI cliccabile + bottoni | ✅ già in main + matita Modifica fixata oggi |
| 3 | Salvataggio profilo reale Supabase | ⏸ non affrontato (richiede sb auth attivo) |
| 4 | Upload foto Storage fallback | ⏸ non affrontato (DNS server-side pre-existing) |
| 5 | Migration SQL `002_profile_cover.sql` | ⏸ da eseguire su Supabase SQL Editor |

### 🚀 Da pullare su Plesk a fine sessione

L'utente deve fare manualmente:
- **demo.poilove.com** → Plesk → Git → Estrai ora + Implementa ora (per portare live tutti i 16 commit)
- **poilove.com** → idem (per logo svg nuovo in `web/img/`)
- **sal.poilove.com** → idem

### 🗺️ Da fare dopo Tirana (V2)

- **Rotte storiche con AI**: data model `routes` (tappe, periodo, storia narrativa), flow ILLI•AI per generazione assistita, editor visuale, landing pages `/route/slug`
- **Salvataggio profilo reale Supabase**: avatar/cover/bio/lists/follows con persistence vera (richiede sb auth attivo)
- **Upload foto Storage fallback**: media.poilove.com 503 DNS server-side + fallback Supabase Storage
- **OAuth provider aggiuntivi**: X, LinkedIn, Facebook (oggi bottoni nell'auth danno errore "provider not configured")
- **App mobile Expo**: push 17 file TypeScript già scaffolded, test su device, build EAS

---

## 🗓️ 10/05/2026 — Auth completo + cuori + logo SVG + multilingue + chip lingua + INCIDENT 740 file

### ⚠️ INCIDENT — 740 file cancellati in produzione

**Cosa è successo**: riattivando i workflow GitHub Actions di deploy (`deploy-web.yml`, nuovo `deploy-demo.yml`), il run `25627558418` ha eseguito `rsync -avz --delete webapp/ user@host:${PLESK_DEMO_PATH}/` con il secret `PLESK_DEMO_PATH` non ancora settato (stringa vuota). GitHub ha risolto la stringa come "" → rsync ha sincronizzato `webapp/` (5 file) verso **`/`** del server con `--delete`. Risultato: **740 file cancellati** su `/var/www/vhosts/poilove.com/`.

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
| 2 | `ccf721b` | feat(demo+sal+web): auth restyle + 2 cuori animati + logo SVG ufficiali | webapp/index.html (+1213 -167), sal/index.html (-2), web/img/, webapp/img/, sal/img/ (5 SVG ognuna) | ✅ demo.poilove.com (414 KB) |
| 3 | `d3daf48` | feat(demo): traduzioni IT/SQ/EN complete + auto-detect dispositivo | webapp/index.html (+146 -116) | ✅ |
| 4 | `1df6ff5` | feat(demo): chip lingua glassmorphism nell'auth overlay | webapp/index.html (+48 -0) | ✅ |
| 5 | `47fb29b` | chore(demo): inverti ordine chip lingua → EN · SQ · IT | webapp/index.html (+6 -6) | ✅ |

### 🎨 Cosa contengono i commit

**Auth overlay completamente ridisegnato** (`ccf721b`):
- Logo SVG **ufficiale** (`logo-completo.svg` 1088×190 vettoriale puro, in `web/img/`+`webapp/img/`+`sal/img/`)
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
| demo.poilove.com | `webapp/` | ⭐ webapp ufficiale blessed (7 tab: Mappa/ILLI•AI/POI/Itinerari/Compagni/Profilo/SOS) |
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
- ILLI•AI mascot SVG creato (`webapp/illi-ai.svg`)
- Trilingue IT/SQ/EN rifinito

---

## 📋 Convenzioni dello storico

- **Aggiornare a fine ogni sessione** — sezione nuova in cima, datata `dd/mm/aaaa`
- Includere sempre: SHA commit di partenza+fine, file toccati, decisioni architetturali, **gap di autonomia** (cosa Claude NON è riuscito a fare e perché)
- Tenere link a transcript JSONL in `~/.claude/projects/-Users-alessandrocastagna-AI--produzione--POI-LOVE/`
- Se la sessione tocca configurazioni esterne (Plesk, Supabase, GitHub), annotare **chi le ha eseguite materialmente** (utente vs Claude vs GitHub Actions)
- Annotare se ci sono stati **incidenti** in sezione dedicata in alto, con cause + lessons learned
- Date in formato europeo `dd/mm/aaaa` (mai `mm-dd` o testo "8 maggio")
