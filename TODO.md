# TODO — POI•LOVE
> Aggiornato: 21/06/2026

## 🔴 Bloccanti (fanno saltare il lancio)

- [ ] **config.js sul server** — chiave Groq per ILLI•AI (`/var/www/vhosts/poilove.com/httpdocs/config.js`)
- [ ] **Terms of Service** — creare `web/terms.html` → live su `poilove.com/terms`
- [ ] **Privacy Policy** — creare `web/privacy.html` → live su `poilove.com/privacy`
      *(richieste da Facebook OAuth, App Store, Play Store, GDPR)*
- [ ] **Bucket `poi_photos`** su Supabase Storage — mancante, le foto non si caricano
- [ ] **LinkedIn redirect URI** — aggiungere `https://poilove.com` nell'app LinkedIn Developer Console

## 🟡 OAuth provider

- [x] Google — attivo ✅
- [x] X (Twitter) — attivato 21/06 ✅
- [x] LinkedIn (OIDC) — attivato 21/06 ✅
- [ ] Facebook — bloccato: serve Terms & Privacy pubblica su poilove.com
- [ ] Apple Sign In — rimandato a inizio luglio (fondi in arrivo)

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
- [ ] **`prompt()` rotto su iOS PWA** — `signInWithPasskey` usa alert bloccante (riga 3212)
- [ ] **Query deep-link senza `.limit()`** — scarica tutta la tabella pois (riga 4393)
- [ ] **Avatar addEventListener leak** — listener duplicati ad ogni generazione AI (riga 5747)

## 🔵 Futuro (non ora)

- [ ] demo.poilove.com → app ufficiale diretta (rinominare dominio al lancio)
- [ ] GoTrue self-hosted per Auth a scala alta
- [ ] ProductHunt launch (solo con app mobile pronta)
- [ ] Candidatura Claude for OSS (5000 stelle GitHub)
