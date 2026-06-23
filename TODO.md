# TODO — POI•LOVE
> Aggiornato: 21/06/2026

## 🔴 Bloccanti (fanno saltare il lancio)

- [ ] **config.js sul server** — chiave Groq per ILLI•AI (`/var/www/vhosts/poilove.com/httpdocs/config.js`)
- [ ] **Terms of Service** — creare `web/terms.html` → live su `poilove.com/terms`
- [ ] **Privacy Policy** — creare `web/privacy.html` → live su `poilove.com/privacy`
      *(richieste da Facebook OAuth, App Store, Play Store, GDPR)*
- [ ] **Bucket `poi_photos`** su Supabase Storage — mancante, le foto non si caricano
- [x] **LinkedIn redirect URI** — verificato 23/06: allow-list Supabase già corretta (`poilove.com/**`) ✅

## 🟡 OAuth provider

- [x] Google — attivo ✅
- [x] X — attivato 21/06 + **fix 23/06**: il codice usava provider `twitter` (spento), ora `x` ✅
- [x] LinkedIn (OIDC) — attivato 21/06 ✅ (redirect allow-list verificata via Management API)
- [ ] Facebook — bottone "presto" in UI; serve Terms & Privacy + App Review Meta
- [ ] Apple Sign In — bottone "presto" in UI; serve Service ID + $99/anno

## 🟡 Architettura / infra

- [ ] Compressione WebP upload ✅ (pushata 21/06, manca Plesk pull)
- [ ] Cloudflare R2 per immagini — quando si supera 10k utenti
- [ ] Service role key Supabase in `~/.supabase_poilove.env` — per autonomia Claude su DB

## 🟢 Feature in sviluppo

- [ ] Rotte storiche — visualizzazione, creazione, landing `/route/slug`
- [ ] App Expo (React Native) — push 17 file TypeScript, test su device fisico
- [ ] Migrazioni SQL versionate in Git (schema attuale non tracciato)

## 🔴 Bug da fixare (trovati dal code reviewer 21/06)

- [ ] **Groq API key esposta** in sorgente HTML (riga 8493) — chiunque può leggerla e abusarla
- [x] **Link condivisione POI rotti** — fixato 21/06 ✅
- [x] **Marker Leaflet duplicati** — fixato 21/06 ✅
- [x] **GPS watcher leak** in `startLocShare` — fixato 21/06 ✅
- [ ] **Love count non atomico** — race condition con utenti concorrenti in `toggleLove` (riga 6543)
- [x] **`toggleLoveDB` corrotto** — fixato 21/06 ✅
- [x] **`prompt()` rotto su iOS PWA** — fixato 23/06: focus sul campo email invece del prompt nativo ✅
- [ ] **Query deep-link senza `.limit()`** — scarica tutta la tabella pois (riga 4393)
- [ ] **Avatar addEventListener leak** — listener duplicati ad ogni generazione AI (riga 5747)

## 🔵 Futuro (non ora)

- [ ] demo.poilove.com → app ufficiale diretta (rinominare dominio al lancio)
- [ ] GoTrue self-hosted per Auth a scala alta
- [ ] ProductHunt launch (solo con app mobile pronta)
- [ ] Candidatura Claude for OSS (5000 stelle GitHub)
