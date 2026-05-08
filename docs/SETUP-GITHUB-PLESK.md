# POI•LOVE — Guida setup GitHub + Plesk
## Sequenza operativa completa per andare online

---

## STEP 1 — Crea il repository su GitHub

1. Vai su **github.com** → login con il tuo account
2. Clicca **New repository**
3. Compila così:
   - **Repository name:** `poi-love`
   - **Description:** `Community map of beloved places · Mappa comunitaria dei luoghi amati · Hartë e vendeve të dashura`
   - **Visibility:** ✅ **Public** (obbligatorio per Anthropic for Startups + discoverability)
   - **Add README:** ❌ NO (lo carichiamo noi)
   - **Add .gitignore:** ✅ sì → scegli `Node`
   - **License:** ❌ NO (la carichiamo noi)
4. Clicca **Create repository**

---

## STEP 2 — Carica i file nel repository

Dalla cartella `github-repo/` che hai in locale:

```bash
# Inizializza git nella cartella github-repo/
cd /path/to/github-repo
git init
git branch -M main

# Aggiungi il remote (sostituisci TUOUSERNAME con il tuo handle GitHub)
git remote add origin https://github.com/TUOUSERNAME/poi-love.git

# Aggiungi tutti i file e fai il primo commit
git add .
git commit -m "feat: initial commit — Cultural Bridge OS framework, schema Supabase, prototipo v3"

# Push
git push -u origin main
```

---

## STEP 3 — Configura i Topics (fondamentale per Anthropic)

Nel repository appena creato, clicca sulla **ruota dentata** accanto a "About" (in alto a destra nella pagina del repo).

Aggiungi questi topics (copia-incolla uno alla volta):
```
community-map
geolocation
open-source
cultural-heritage
albania
tirana
supabase
expo
react-native
google-maps
poi
cultural-bridge
italy
```

Aggiungi il **Website**: `https://poilove.com`

---

## STEP 4 — Abilita GitHub Pages

1. Nel repo → **Settings** → **Pages** (menu laterale sinistro)
2. **Source:** `GitHub Actions`
3. GitHub rileverà automaticamente il workflow in `.github/workflows/pages.yml`
4. Al prossimo push su `main`, il sito sarà online su:
   `https://TUOUSERNAME.github.io/poi-love/`

Metti questo URL nel README e su poilove.com come "Demo Live".

---

## STEP 5 — Configura Supabase

1. Vai su **supabase.com** → New Project
   - **Organization:** crea "POI-LOVE" oppure usa quella esistente
   - **Name:** `poi-love`
   - **Database Password:** genera e salva in modo sicuro
   - **Region:** scegli `EU West` (Francoforte o Dublino — più vicino all'Albania)
2. Aspetta che il progetto venga creato (~2 minuti)
3. Vai su **SQL Editor** → **New query**
4. Copia tutto il contenuto di `database/schema.sql` e incollalo
5. Clicca **Run** — controlla che non ci siano errori

Poi vai in **Settings** → **API** e salva:
- `URL` (es: `https://xyzxyz.supabase.co`)
- `anon public key`
- `service_role key` (⚠️ non condividere mai questa chiave)

---

## STEP 6 — Struttura Plesk per i media

Sul tuo server Plesk dedicato, crea questa struttura di cartelle nella root del dominio (o in un sottodominio dedicato, es. `media.poilove.com`):

```
/media.poilove.com/
├── poi/
│   └── {poi-uuid}/
│       ├── photo_1.webp
│       ├── photo_2.webp
│       └── photo_3.webp
├── avatars/
│   └── {user-uuid}/
│       └── avatar.webp
└── temp/
    └── (upload temporanei, puliti ogni ora via cron)
```

**Configurazione PHP/API upload su Plesk:**

Crea un file `upload.php` nella root di `media.poilove.com` con:
- Autenticazione via header `X-API-Key` (chiave segreta condivisa con l'app)
- Validazione tipo file: accetta solo `image/jpeg`, `image/png`, `image/webp`
- Limite dimensione: 10MB per upload, compressione lato client prima dell'invio
- Risposta JSON con URL completo del file salvato

**Permessi cartelle Plesk:**
- `poi/` → 755 (scrittura solo via PHP)
- `temp/` → 777 (scrittura aperta, cleanup automatico)

**Nginx/Apache header CORS** (da aggiungere nel pannello Plesk → Apache & Nginx Settings):
```
Access-Control-Allow-Origin: https://poilove.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: X-API-Key, Content-Type
```

---

## STEP 7 — Application Anthropic for Startups

URL: **https://www.anthropic.com/startups**

Cosa ti serve per l'application:
- URL del repository GitHub: `https://github.com/TUOUSERNAME/poi-love`
- Descrizione uso Claude: "AI pipeline per categorizzazione automatica dei POI, suggerimento descrizioni, analisi sentiment LOVE, future audioguide multilingue (IT/SQ/EN). Claude è integrato come motore di comprensione semantica del territorio."
- Stage: Early / MVP
- Settore: Travel & Cultural Heritage / Community Platforms
- Mercato iniziale: Albania (Tirana, giugno 2026), espansione Balcani

Punti da enfatizzare nell'application:
1. Open source con licenza MIT — moltiplicatore di impatto
2. Prima istanza in Albania — mercato emergente underserved
3. Framework "Cultural Bridge OS" riutilizzabile per altre geografie
4. Uso etico AI: amplificazione community locale, non sostituzione

---

## CHECKLIST FINALE prima del lancio

- [ ] Repository GitHub pubblico con tutti i file
- [ ] Topics configurati (min. 8)
- [ ] GitHub Pages attivo con demo prototipo v3
- [ ] Supabase: schema applicato, RLS verificata
- [ ] Supabase: Auth configurata (email + Google OAuth)
- [ ] Plesk: cartelle media create, permessi corretti, CORS configurato
- [ ] Plesk: script upload.php funzionante e testato
- [ ] poilove.com aggiornato con link repo + demo
- [ ] Application Anthropic for Startups inviata
- [ ] 30-50 POI seed a Tirana inseriti prima del lancio pubblico
