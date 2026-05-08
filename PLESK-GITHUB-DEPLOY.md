# 🚀 POI•LOVE — Setup deploy GitHub ↔ Plesk

> Questa guida è scritta per chi NON ha familiarità con GitHub.
> Tempo stimato totale: 25 minuti per la prima configurazione.

---

## 🧠 Concetto in una riga

```
LOCALE  →[git push]→  GITHUB  →[git pull manuale via SSH]→  PLESK
```

1. **Tu e Claude** lavorate in locale
2. **Quando una versione è pronta** (= tu hai approvato la demo), Claude fa `git push` → finisce su GitHub
3. **Quando vuoi mandarla LIVE**, **TU** entri in Plesk e clicchi "Pull updates" → Plesk scarica il codice da GitHub via SSH
4. Ogni sotto-dominio prende solo la sua sotto-cartella del repo

---

## 🗂 Mappatura sotto-domini ↔ cartelle del repo

| URL | Cartella del repo | Cosa serve |
|---|---|---|
| `poilove.com` | `web/` | **Presentazione** del progetto (PDF + notarizzazione) |
| `poilove.com/dev/` | `web/dev/` | versione in sviluppo (futura) |
| `poilove.com/v2/` | `web/v2/` | versione 2 sperimentale (futura) |
| `poilove.com/preview/` | `web/preview/` | preview WIP (futura) |
| `poilove.com/<qualunque>/` | `web/<qualunque>/` | ogni nuovo branch sperimentale |
| **`demo.poilove.com`** | `demo/` | ⭐ **VERSIONE UFFICIALE webapp** (blessed) |
| `sal.poilove.com` | `sal/` | **SAL — Stato Avanzamento Lavori** (per investitori/partner) |
| `media.poilove.com` | `plesk-media-server/` | Media server PHP (già configurato, niente da fare) |

### 🔄 Workflow di promozione versioni

Le versioni in sviluppo vivono sotto `web/<nome>/` → si vedono live su `poilove.com/<nome>/`.
Quando una versione è approvata e diventa **ufficiale**:

```bash
# promozione: la copia di una WIP diventa la versione ufficiale
rm -rf demo/*
cp -r web/wip/* demo/
git add demo/
git commit -m "promote: web/wip → demo (v.X)"
git push
# poi: Plesk → demo.poilove.com → Pull updates
```

Questo modello tiene `demo.poilove.com` **stabile** e usa `poilove.com/...` per esperimenti.

---

## 1️⃣ Crea i 2 sotto-domini su Plesk

> Devi farlo TU, una volta sola, dal pannello Plesk.

1. Login al pannello **Plesk** (di solito `https://plesk.tuoserver.com:8443`)
2. Vai su **Domains** → `poilove.com`
3. Clicca **"Add Subdomain"**
4. Inserisci:
   - Subdomain name: `demo`
   - Document root: lascia il default → `demo.poilove.com/httpdocs`
5. **Crea il certificato SSL** (Let's Encrypt) per quel sotto-dominio:
   - Apri `demo.poilove.com` → SSL/TLS Certificates → "Install" → "Let's Encrypt" → seleziona `demo.poilove.com` + `www` se vuoi → Get it free
6. **Ripeti** lo stesso per `sal`:
   - Subdomain name: `sal`
   - Document root: `sal.poilove.com/httpdocs`
   - SSL Let's Encrypt anche qui

**A fine di questo step, su Plesk hai 4 domini visibili:**
- `poilove.com` (esistente)
- `demo.poilove.com` ← NUOVO
- `sal.poilove.com` ← NUOVO
- `media.poilove.com` (esistente)

---

## 2️⃣ Configura DNS (record A)

Sul tuo provider DNS (chi gestisce poilove.com, di solito è dove hai comprato il dominio):

```
demo.poilove.com    A    46.4.70.47
sal.poilove.com     A    46.4.70.47
```

> L'IP è `46.4.70.47` (lo stesso del media server).
> I record propagano in 5-30 minuti. Verifica dopo qualche minuto con:
>
> `dig demo.poilove.com` (deve restituire 46.4.70.47)

---

## 3️⃣ Collega ciascun sotto-dominio al repo GitHub

> **Devi fare questo 3 volte** (uno per `poilove.com`, uno per `demo.poilove.com`, uno per `sal.poilove.com`).

### Per `demo.poilove.com` (esempio — gli altri funzionano uguale):

1. Plesk → **Domains** → clicca **`demo.poilove.com`**
2. Cerca l'icona **"Git"** (di solito è sulla destra, oppure sotto "Files")
3. Clicca **"Add Repository"**
4. Riempi così:
   - **Repository URL**: `git@github.com:acastagna/poi-love.git`
   - **Server path**: `httpdocs/` (lascia il default)
   - **Deployment mode**: **"Manual"** (NON automatic — vogliamo cliccare noi quando deployare)
   - **Branch**: `main`
   - **Path** (cartella del repo da pubblicare): `demo` ← **IMPORTANTE: questo cambia per ogni sotto-dominio!**
5. **Plesk ti mostra una "Public SSH key"** → copiala TUTTA (clicca il bottone "Copy")

### 4️⃣ Aggiungi la chiave SSH a GitHub come Deploy Key

1. Apri il repo: https://github.com/acastagna/poi-love
2. Clicca **"Settings"** (icona ingranaggio in alto a destra del repo)
3. Sidebar sinistra → **"Deploy keys"**
4. Clicca **"Add deploy key"**
5. Riempi:
   - **Title**: `Plesk demo.poilove.com` (per ricordare cos'è)
   - **Key**: incolla la chiave SSH che hai copiato da Plesk
   - **Allow write access**: ❌ NON spuntare (read-only è giusto, Plesk legge ma non scrive)
6. Clicca **"Add key"**

### 5️⃣ Test: primo pull manuale

1. Torna su Plesk → `demo.poilove.com` → Git
2. Clicca **"Pull updates"** (o "Deploy" — dipende dalla versione Plesk)
3. Plesk fa `git clone` del repo, prende la cartella `webapp/`, la mette in `httpdocs/`
4. Apri https://demo.poilove.com → devi vedere la webapp ✓

---

### 🔁 Stessa cosa per `sal.poilove.com`:

| Campo | Valore |
|---|---|
| Repository URL | `git@github.com:acastagna/poi-love.git` |
| Server path | `httpdocs/` |
| Deployment mode | **Manual** |
| Branch | `main` |
| Path | `sal` ← (non `webapp`!) |
| Deploy key title su GitHub | `Plesk sal.poilove.com` |

### 🔁 Stessa cosa per `poilove.com` (ma più tardi, quando metteremo la presentazione):

| Campo | Valore |
|---|---|
| Repository URL | `git@github.com:acastagna/poi-love.git` |
| Server path | `httpdocs/` |
| Deployment mode | **Manual** |
| Branch | `main` |
| Path | `web` |
| Deploy key title su GitHub | `Plesk poilove.com` |

> ⚠️ Per `poilove.com` esiste GIÀ il deploy automatico via GitHub Actions (`deploy-web.yml`).
> Quando lo passi a Plesk Git pull-based, **disattiva il workflow vecchio** o lascialo come backup.

---

## 🔄 Workflow operativo da qui in avanti

### Quando vuoi deployare una nuova versione:

1. **Tu approvi in locale** (vedi la demo, ti convince)
2. **Claude fa**:
   ```bash
   git add webapp/ sal/ web/
   git commit -m "feat: SAL v2.4 + webapp finestra presentazioni"
   git push origin main
   ```
3. **Tu vai su Plesk**:
   - `demo.poilove.com` → Git → **Pull updates**
   - `sal.poilove.com` → Git → **Pull updates**
   - `poilove.com` → Git → **Pull updates** (se hai cambiato anche la presentazione)
4. **Verifichi** che i siti rispondano correttamente

### Se vuoi auto-pull (opzionale, per dopo):

Plesk Git Extension supporta anche il **webhook**: GitHub avvisa Plesk quando c'è un push, e Plesk fa pull automatico. Per attivarlo:
- Plesk Git → "Webhook URL" → copia
- GitHub → Settings → Webhooks → Add webhook → incolla URL → push events
- D'ora in poi ogni `git push` triggera il deploy automatico

**Per ora**: lasciamo MANUAL così **tu hai il controllo**.

---

## 📞 In caso di problemi

| Sintomo | Causa probabile | Cosa fare |
|---|---|---|
| Plesk dice "Permission denied (publickey)" | Deploy key non aggiunta su GitHub | Verifica step 4 |
| `dig demo.poilove.com` non risponde | DNS non ancora propagato | Aspetta 30 min |
| Pull funziona ma sito vuoto | Path sbagliato (es. `demo` invece di `web`) | Plesk Git → Edit → cambia "Path" |
| Sito carica ma stili rotti | `.htaccess` mancante | Verifica che `.htaccess` sia nella cartella sorgente |

---

## ✅ Checklist completa (prima del deploy)

- [ ] Sotto-domini `demo` e `sal` creati su Plesk
- [ ] DNS A record per `demo.poilove.com` e `sal.poilove.com` propagati
- [ ] SSL Let's Encrypt installato sui sotto-domini
- [ ] Repo Git collegato in Plesk per ogni sotto-dominio (con il `Path` giusto)
- [ ] Deploy key aggiunta su GitHub per ogni sotto-dominio
- [ ] Primo `Pull updates` testato per ogni sotto-dominio
- [ ] Verifica: ogni dominio risponde HTTP 200 e mostra il contenuto giusto

---

*Questo runbook fa parte del progetto POI•LOVE — Cultural Bridge OS · MIT License.*
