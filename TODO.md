# TODO — POI•LOVE
> Aggiornato: 24/06/2026

## Alta priorità — Persistenza Supabase (prossimo blocco)

- [ ] **Frontend itinerari**: aggancio TRIPS/trip_stops (localStorage) → tabelle `trips` + `trip_stops` Supabase — pezzo complesso, prossimo
- [ ] **Follow / connessioni**: tabella `follows` su Supabase + aggancio frontend
- [ ] **Rotte utente**: migrare `poi_user_routes` (localStorage) → tabella `user_routes` su Supabase + aggancio frontend
- [ ] **Presence live compagnie**: layer realtime Supabase per stato online membri

## Alta priorità — Bloccanti lancio

- [ ] **config.js sul server** — chiave Groq per ILLI•AI (`/var/www/vhosts/poilove.com/httpdocs/config.js`)
- [ ] **Terms of Service** — creare `web/terms.html` → live su `poilove.com/terms`
- [ ] **Privacy Policy** — creare `web/privacy.html` → live su `poilove.com/privacy`
      *(richieste da Facebook OAuth, App Store, Play Store, GDPR)*

## Media priorità

- [ ] **Meccanismi tier paganti**: implementare uno a uno i perks promessi a Sostenitore e Mecenate (AI potenziata, verifica profilo, POI in evidenza, punti x2, adotta rotta, QR business)
- [ ] **Bucket `poi_photos`** su Supabase Storage — mancante, le foto non si caricano
- [ ] **Love count atomico** — race condition con utenti concorrenti in `toggleLove` (riga 6543)
- [ ] **Query deep-link senza `.limit()`** — scarica tutta la tabella pois (riga 4393)
- [ ] **Avatar addEventListener leak** — listener duplicati ad ogni generazione AI (riga 5747)
- [ ] **Dead code**: ripulire `stopCoords`, `_photoPrompt`, `openUserRowProfile`

## OAuth provider

- [x] Google — attivo
- [x] X — attivato 21/06 + fix 23/06: il codice usava provider `twitter` (spento), ora `x`
- [x] LinkedIn (OIDC) — attivato 21/06 (redirect allow-list verificata via Management API)
- [ ] Facebook — bottone "presto" in UI; serve Terms & Privacy + App Review Meta
- [ ] Apple Sign In — bottone "presto" in UI; serve Service ID + $99/anno

## Architettura / infra

- [ ] Compressione WebP upload — pushata 21/06, manca Plesk pull
- [ ] Cloudflare R2 per immagini — quando si supera 10k utenti
- [ ] Service role key Supabase in `~/.supabase_poilove.env` — per autonomia Claude su DB

## Feature backlog

- [ ] Rotte storiche — visualizzazione, creazione, landing `/route/slug`
- [ ] App Expo (React Native) — push 17 file TypeScript, test su device fisico
- [ ] Migrazioni SQL versionate in Git (schema attuale non tracciato)
- [ ] GoTrue self-hosted per Auth a scala alta
- [ ] ProductHunt launch (solo con app mobile pronta)
- [ ] Candidatura Claude for OSS (5000 stelle GitHub)

## Completati (ultimi 30 giorni)

- [x] Backend compagnie migrazione 005: `companions` + `companion_members`, RLS SECURITY DEFINER, RPC `join_companion` — 24/06
- [x] Frontend compagnie FASE A: create/edit/delete su Supabase, `syncCompagnieFromDB` al login — 24/06
- [x] Frontend compagnie FASE B: inviti email + join via `?join=CODE` — 24/06
- [x] 3° stato lista "compagnia": `lists.companion_id` persiste — 24/06
- [x] Valore reale tier paganti: perks concreti Sostenitore/Mecenate in card popup livelli — 24/06
- [x] Backend itinerari migrazione 006: `trips` + `trip_stops`, RLS, FK, trigger `set_updated_at` — 24/06
- [x] Bug `is_public` vs `visibility` su tabella `lists` — corretto in `createList`/`loadMyLists`/`renderItinLists` — 24/06
- [x] `saveListDetail` e `deleteListDetail` agganciati a Supabase con guardia `owner_id` — 24/06
- [x] Fix XSS: escape in nomi lista e `_mapPopupCtx.name` negli innerHTML — 24/06
- [x] Liste hardcoded rimosse ("Lista libera", "Tirana Top", "Segreti") — 24/06
- [x] Migrazione 004: `lists.companion_id` e `lists.itinerary_id` — 24/06
- [x] CLAUDE.md aggiornato: schema `lists` corretto (`visibility`, non `is_public`) — 24/06
- [x] Gamification backend end-to-end (migrazioni 001-003, RLS blindate, trigger, RPC) — 24/06
- [x] Persistenza liste Supabase completa — 24/06
- [x] LinkedIn redirect URI — verificato 23/06: allow-list Supabase gia' corretta (`poilove.com/**`)
