# TODO — POI•LOVE
> Aggiornato: 24/06/2026

## Alta priorità — Bloccanti lancio

- [ ] **config.js sul server** — chiave Groq per ILLI•AI (`/var/www/vhosts/poilove.com/httpdocs/config.js`)
- [ ] **Terms of Service** — creare `web/terms.html` → live su `poilove.com/terms`
- [ ] **Privacy Policy** — creare `web/privacy.html` → live su `poilove.com/privacy`
      *(richieste da Facebook OAuth, App Store, Play Store, GDPR)*
- [ ] **Follow SELECT pubblica** — rischio scraping grafo sociale: rivedere RLS `follows` prima del 17/08

## Alta priorità — Prossimi moduli

- [ ] **Presence live compagnie**: layer realtime Supabase per stato online membri
- [ ] **Frontend rotte utente V2**: flusso creazione via AI (tabella `user_routes` pronta, UI da costruire)
- [ ] **Meccanismi tier paganti**: implementare uno a uno i perks promessi a Sostenitore e Mecenate (AI rate-limit per tier, punti x2 Mecenate, verifica profilo, POI in evidenza, adotta rotta, QR business)
- [ ] **project.poilove.com aggiornato**: aggiornare la presentazione marketing con le novità (gamification, i18n, compagnie, itinerari)

## Media priorità

- [ ] **i18n — stringhe variante minori**: varianti POI "non trovato" con emoji, ambiente avatar ILLI•AI, tooltip "rotta ufficiale" (ancora in IT)
- [x] **Foto POI: funzionanti** (verificato con test reale 24/06): il bucket `poi_photos` esiste con permessi corretti (insert authenticated, read public); upload + lettura pubblica testati OK. La nota precedente "bucket mancante" era ERRATA. Il server primario `media.poilove.com` è rotto (403, DNS lato Plesk non risolve supabase.co) ma il piano B Supabase lo copre automaticamente. Opzionale, non bloccante: riparare media.poilove.com per la compressione WebP server-side (richiede accesso SSH al server).
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

- [x] Fix z-index popup: stacking dinamico via MutationObserver, ultimo overlay sempre sopra; `_uiModal` su contatore separato — 24/06
- [x] Fix handle: funzione unica `_sanitizeHandle`, bug reset handle in `savePOIToDB` corretto — 24/06
- [x] i18n ~220 chiavi nuove IT/SQ/EN: Tier+Referral (48), Compagnie+Follow (87), Itinerari+Liste (58), POI+Mappa+Profilo+Varie (32) — 24/06
- [x] Frontend itinerari agganciato a Supabase: `saveNewTrip`, `syncTripsFromDB`, `_persistTripStops` — 24/06
- [x] Migrazione 007: `trip_stops.note` — 24/06
- [x] Migrazione 008: RPC transazionale `replace_trip_stops` (BLOCKER race condition drag risolto) — 24/06
- [x] Fix: sostituito `source.unsplash.com` (deprecato) con `loremflickr` — 24/06
- [x] Follow persistente (migrazione 009): tabella `follows` creata, `togglePublicFollow` ora funziona — 24/06
- [x] Rotte utente (migrazione 010): tabella `user_routes` creata, owner-based — 24/06
- [x] CLAUDE.md aggiornato con tutte le tabelle reali + RPC — 24/06
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
