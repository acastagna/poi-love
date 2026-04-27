# Setup deploy webhook poilove.com → Plesk
**Tempo stimato: 15 minuti · da fare una sola volta**

---

## Passo 1 — Crea le cartelle su Plesk

Via **Plesk File Manager** (o FTP) sotto il dominio `poilove.com`:

```
httpdocs/
  demo/        ← crea questa cartella
  sal/         ← crea questa cartella
  deploy.php   ← carica il file deploy.php
```

---

## Passo 2 — Carica deploy.php

Carica il file `deploy.php` (allegato) in `httpdocs/` di poilove.com.

Non mettere deploy.php dentro `demo/` — deve stare nella root.

---

## Passo 3 — Imposta la variabile d'ambiente su Plesk

Genera un segreto random (copia e salva questo valore):

```
openssl rand -hex 32
```

Oppure usa qualsiasi stringa lunga e casuale, es:
```
a7f3e9c2b8d1f4e6a0c3b5d2e8f1a4c7b9d2e5f8a1c4b7d0e3f6a9c2b5d8e1
```

Poi vai su **Plesk → Websites & Domains → poilove.com → Apache & nginx Settings**
→ Additional Apache directives (httpdocs):

```apache
SetEnv DEPLOY_SECRET il_tuo_segreto_qui
```

---

## Passo 4 — Aggiungi il segreto su GitHub

**GitHub → acastagna/poi-love → Settings → Secrets and variables → Actions → New repository secret:**

- Name: `DEPLOY_SECRET`
- Value: (stesso segreto del passo 3)

---

## Passo 5 — Configura webhook su GitHub

**GitHub → acastagna/poi-love → Settings → Webhooks → Add webhook:**

| Campo          | Valore |
|----------------|--------|
| Payload URL    | `https://poilove.com/deploy.php` |
| Content type   | `application/json` |
| Secret         | (stesso segreto dei passi 3 e 4) |
| Which events   | `Just the push event` |
| Active         | ✓ |

Clicca **Add webhook**.

---

## Verifica immediata

1. Apri nel browser: `https://poilove.com/deploy.php?check=1`
   → Deve rispondere JSON con la lista dei file e il loro stato

2. Fai un push su GitHub (anche solo modifica un carattere in index.html)
   → GitHub manda il webhook → deploy.php scarica i file
   → Controlla `https://poilove.com/demo/` — deve mostrare la demo aggiornata

3. In Plesk File Manager vedi `httpdocs/deploy.log` — ogni deploy scrive una riga

---

## Cosa succede ad ogni push

```
git push (o push via Claude)
    ↓
GitHub Actions: aggiorna GitHub Pages (web/ → github.io/poi-love/)
    ↓
GitHub Webhook: chiama https://poilove.com/deploy.php
    ↓
deploy.php: scarica i 4 file da GitHub API
    ↓
Salva in demo/ e sal/ su poilove.com
    ↓
Due URL aggiornati in < 10 secondi:
  · https://poilove.com/demo/
  · https://acastagna.github.io/poi-love/
```

---

## Note di sicurezza

- La firma HMAC-SHA256 garantisce che solo GitHub possa triggerare il deploy
- Il `DEPLOY_SECRET` non appare mai nel codice — è una variabile d'ambiente Plesk
- `deploy.log` è protetto dall'accesso esterno via .htaccess
- Per un check manuale forzato: `curl -X POST https://poilove.com/deploy.php` → risponde 403 (firma mancante)
