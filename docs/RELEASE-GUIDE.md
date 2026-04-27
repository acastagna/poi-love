# POI•LOVE — Release Guide
## Come creare una release investitore-ready

---

## Workflow quotidiano (con Claude)

```
1. Sessione di lavoro con Claude
   → file modificati/creati in outputs/

2. Push su GitHub (Claude lo fa via API)
   → GitHub Actions aggiorna GitHub Pages automaticamente
   → Webhook aggiorna poilove.com/demo/ automaticamente (post-setup)

3. Fine sessione → aggiorna SAL-data.json
   → Claude aggiorna POI-LOVE-SAL.html

4. (Opzionale) crea tag release se è una milestone
```

---

## Creare una Release (milestone importante)

```bash
# Assicurati di essere su main aggiornato
git checkout main
git pull

# Crea tag annotato
git tag -a v0.2.0 -m "Digital launch — demo live, Liri avatar, Show HN"

# Pusha il tag
git push origin v0.2.0
```

Poi su GitHub → Releases → Draft a new release → seleziona il tag:
- **Title**: `v0.2.0 — Digital Launch`
- **Body**: copia dal CHANGELOG.md la sezione corrispondente
- Allega assets se vuoi (screenshot, APK demo)

---

## Struttura commit — copia/incolla

```bash
# Feature
git commit -m "feat: add travel itineraries UI + micro-calendar + GPS geofencing"

# Fix
git commit -m "fix: Phosphor v2.1.1 replaces emoji icons throughout demo"

# Deploy
git commit -m "deploy: webhook-based Plesk sync — no rsync, no fail2ban"

# Release
git commit -m "release: v0.2.0 digital launch"
```

---

## Cosa vede un investitore su GitHub

1. **README.md** — progetto, demo link, tech stack, roadmap
2. **CHANGELOG.md** — storia di esecuzione (velocità, disciplina)
3. **Releases/Tags** — milestone versionate
4. **Commit history** — cadenza, qualità dei messaggi
5. **Actions** — CI/CD verde = infrastruttura seria
6. **Issues/Projects** — (opzionale) backlog pubblico

Tutto questo comunica: "questo team esegue, misura, documenta."
