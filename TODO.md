# TODO — POI•LOVE
> Aggiornato: 24/06/2026

## 🚧 Fase 2 — Persistenza Supabase (prossimo blocco)

- [ ] **Compagnie**: migrare `poi_compagnie` (localStorage) → tabella `companions` su Supabase + aggancio frontend
- [ ] **Itinerari**: migrare `poi_trips` (localStorage) → tabella `trips` su Supabase + aggancio frontend
- [ ] **Follow / connessioni**: tabella `follows` su Supabase + aggancio frontend
- [ ] **Rotte utente**: migrare `poi_user_routes` (localStorage) → tabella `user_routes` su Supabase + aggancio frontend
- Nota: `lists.companion_id` si popolera solo quando esiste `companions` (guardia gia nel codice)

## 🚧 Fase 1 — UI proprietaria + modificabilità (in corso, dal 24/06)
- [x] Sistema modali proprietarie `uiPrompt`/`uiConfirm` (grafica POI•LOVE, fade+slide, focus auto, Enter/Esc, variante danger rossa) ✅ 24/06
- [x] Sostituiti TUTTI i 13 dialoghi nativi (`prompt`/`confirm`) con le modali nostre, verificato live a 0 ✅ 24/06
- [x] Popup lista a 2 modi: VISTA (sola lettura) + MODIFICA col pennino. In modifica: nome + descrizione + visibilita 3 stati + selettori chip "quale compagnia" e "quale itinerario" (la lista puo entrare in un itinerario). Tutto in grafica nostra, niente `<select>` nativi ✅ 24/06
- [x] Persistenza Supabase delle liste: bug `is_public` vs `visibility` corretto, `saveListDetail`/`deleteListDetail` agganciati al DB, XSS fixato, liste hardcoded rimosse, migrazione 004 applicata ✅ 24/06
- [x] Rotte: UFFICIALI (Via Egnatia, Terre Illiriche) con badge "Ufficiale" (seal-check) e bloccate; rotte UTENTE col pennino → rinomina via modale proprietaria. Render dinamico da `_HISTORIC_ROUTES` + `poi_user_routes` ✅ 24/06
- [x] Tutte le icone Phosphor, zero emoji (motore `emoToIcons`, bandiere→globo, ~34 icone convertite) ✅ 24/06
- Regola ferrea: MAI interfacce native del dispositivo, tutto in grafica POI•LOVE (vedi `SPECS.md`)

## 🔴 Bloccanti (fanno saltare il lancio)

- [ ] **config.js sul server** — chiave Groq per ILLI•AI (`/var/www/vhosts/poilove.com/httpdocs/config.js`)
- [ ] **Terms of Service** — creare `web/terms.html` → live su `poilove.com/terms`
- [ ] **Privacy Policy** — creare `web/privacy.html` → live su `poilove.com/privacy`
      *(richieste da Facebook OAuth, App Store, Play Store, GDPR)*
- [ ] **Bucket `poi_photos`** su Supabase Storage — mancante, le foto non si caricano
- [x] **LinkedIn redirect URI** — verificato 23/06: allow-list Supabase gia corretta (`poilove.com/**`) ✅

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

- [ ] **Groq API key esposta** in sorgente HTML (riga 8493) — chiunque puo leggerla e abusarla
- [x] **Link condivisione POI rotti** — fixato 21/06 ✅
- [x] **Marker Leaflet duplicati** — fixato 21/06 ✅
- [x] **GPS watcher leak** in `startLocShare` — fixato 21/06 ✅
- [ ] **Love count non atomico** — race condition con utenti concorrenti in `toggleLove` (riga 6543)
- [x] **`toggleLoveDB` corrotto** — fixato 21/06 ✅
- [x] **`prompt()` rotto su iOS PWA** — fixato 23/06: focus sul campo email invece del prompt nativo ✅
- [ ] **Query deep-link senza `.limit()`** — scarica tutta la tabella pois (riga 4393)
- [ ] **Avatar addEventListener leak** — listener duplicati ad ogni generazione AI (riga 5747)

## 🔵 Futuro (non ora)

- [ ] GoTrue self-hosted per Auth a scala alta
- [ ] ProductHunt launch (solo con app mobile pronta)
- [ ] Candidatura Claude for OSS (5000 stelle GitHub)

## Completati (ultimi 30 giorni)

- [x] Bug `is_public` vs `visibility` su tabella `lists` — corretto in `createList`/`loadMyLists`/`renderItinLists` ✅ 24/06
- [x] `saveListDetail` e `deleteListDetail` agganciati a Supabase con guardia `owner_id` ✅ 24/06
- [x] Fix XSS: escape in nomi lista e `_mapPopupCtx.name` negli innerHTML ✅ 24/06
- [x] Liste hardcoded rimosse ("Lista libera", "Tirana Top", "Segreti") ✅ 24/06
- [x] Migrazione 004: `lists.companion_id` e `lists.itinerary_id` ✅ 24/06
- [x] CLAUDE.md aggiornato: schema `lists` corretto (`visibility`, non `is_public`) ✅ 24/06
- [x] Gamification backend end-to-end (migrazioni 001-003, RLS blindate, trigger, RPC) ✅ 24/06
- [x] Persistenza liste Supabase completa ✅ 24/06
