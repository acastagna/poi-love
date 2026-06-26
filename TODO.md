# TODO — POI•LOVE
> Aggiornato: 26/06/2026 · prossima ripresa: **28/06/2026**

## Alta priorità — Bloccanti lancio

- [x] **config.js sul server** — presente (verificato 26/06). ILLI ora passa per la Edge Function proxy `illi-chat`: chiave OpenAI come segreto server-side, non piu esposta nel client
- [x] **Terms of Service** — live su `poilove.com/terms` (26/06)
- [x] **Privacy Policy** — live su `poilove.com/privacy` (26/06)
      *(bozze conformi legge AL 124/2024 + GDPR, generate col caso Agi-Kons come checklist; RESTA da far validare da un consulente legale prima del lancio pubblico)*

## Alta priorità — Prossimi moduli

### 🔜 Ripresa 28/06 — verso la presentazione 1/07 (da SPECS)
- [ ] **POI dentro le liste**: il dettaglio lista (`openListDetail`) non carica ancora i `list_pois`. Far vedere e gestire i POI dentro ogni lista (aggiungi/rimuovi/riordino). Primo passo dopo il nuovo sub-tab Liste
- [ ] **Schermata POI (SPECS, la più importante)**: "suggerisci nome" che pesca i locali reali vicini; togliere le immagini AI dal POI; categorie personalizzabili e opzionali; timer 60s (coppa verde / frase gentile arancione)
- [ ] **Menu "+"** come elenco di azioni (Sono qui crea POI / Segna un luogo / Tappa / Compagnia), non il mirino diretto
- [ ] **Filtri tag e categoria nel profilo**: tocco un tag o una categoria, vedo solo i POI con quello
- [ ] **Condivisione proprietaria**: un foglio POI•LOVE unico e curato, mai `navigator.share` (violazione SPECS, oggi usato in ~8 punti)
- [ ] **Validazione legale Privacy/Terms** con un consulente prima del lancio (le bozze sono live)
- [ ] **Google Places: cache** (tabella Supabase 7-30 giorni) per tenere bassi i costi a scala

### Blocco "Lente-strumento + UX input" (richiesto 25/06 notte, design fissato — vedi memoria `lente_mappa_strumento`)
- [x] **A. Lente-strumento sulla mappa (long-press 300ms)** — COMPLETA (25/06, live `3c3121e`): magnifier reale bianco/nero ad alto contrasto, cerchio 320px, apertura esatta sul punto toccato (mouse+touch, mappa ferma), 2 trascinamenti live, titolo+indirizzo+coordinate live, 4 comandi + LED "Salva il POI" lampeggiante, mutua esclusione popup (mai due aperti), tap-fuori chiude, clamp ai bordi, FAB sempre sopra, i18n IT/SQ/EN. Code-review superato (2 BLOCKER + 5 MAJOR risolti)
- [x] **B. Bottoni dentro i campi** — COMPLETA (25/06): Suggerisci AI / Detta / Scrivo io dentro nome e descrizione POI
- [x] **C. Fix dettatura** — COMPLETA (25/06): dettatura iOS-friendly con stop pulito
- [ ] **D. Voci TTS iperrealistiche** via servizio esterno (Google Cloud TTS o simile): scelto dal founder, serve chiave + billing, deroga alla regola no-TTS-esterno
- [ ] **E. Tastiera assistita**: basi pronte a scorrimento (Piazza, Via, Contrada, Largo, Vicolo...) + riga numeri sempre visibile stile Waze

- [ ] **Presence live compagnie**: layer realtime Supabase per stato online membri
- [ ] **Frontend rotte utente V2**: flusso creazione via AI (tabella `user_routes` pronta, UI da costruire)
- [ ] **Meccanismi tier paganti**: implementare uno a uno i perks promessi a Sostenitore e Mecenate (AI rate-limit per tier, punti x2 Mecenate, verifica profilo, POI in evidenza, adotta rotta, QR business)
- [ ] **project.poilove.com aggiornato**: aggiornare la presentazione marketing con le novità (gamification, i18n, compagnie, itinerari)

## Media priorità

- [ ] **Tier paganti: meccanismi backend**: i perks ora promessi nelle card vanno resi reali uno a uno (rate-limit ILLI per tier, punti x2, POI/itinerario in evidenza, audiolibri navigando, admin compagnia in evidenza). Vale per i 3 tier (Professionista/Sostenitore/Mecenate)
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

- [x] **Falla follow (RLS) chiusa** (migrazione 011): `follows_select` ristretta a chi è coinvolto (follower o seguito), basta scraping del grafo sociale; applicata e verificata su Supabase (25/06)
- [x] **Tre modi su nome e descrizione POI** (Suggerisci AI / Detta / Scrivo io), con dettatura generica iOS-friendly e suggerimento nome via AI; i18n IT/SQ/EN (25/06)
- [x] **Microfono dettatura nella chat ILLI•AI**: speech-to-text che scrive nell'area di testo, a destra dell'invio (iOS-friendly); il vecchio mic in alto era un toggle voce, ora è un altoparlante; i18n IT/SQ/EN (25/06)
- [x] **Bottone verde "Svuota cache" in SOS**: svuota Cache Storage + service worker + sessionStorage e ricarica fresco (cache-bust), senza sloggare (25/06)
- [x] **Debiti chiusi**: diagnostica DB al boot dietro flag debug (non espone più lo schema in console), `setBgTab` parametro rinominato (25/06)
- [x] **Generazione AI avatar/sfondi riattivata** via Flux (Pollinations): gratis, separata da OpenAI, verificata dal vivo (25/06)
- [x] **GPS mirino**: avvisa con la causa reale (permesso/timeout/non disponibile) invece di saltare a Tirana in silenzio; + cache posizione (25/06)
- [x] **Paesaggi + photo picker**: loremflickr (rotto sotto carico) sostituito con Flux; attribution falsa "Flickr CC" corretta (25/06)
- [x] **Icona livelli**: colore scuro per livello (prima chiaro su chiaro, invisibile) (25/06)
- [x] **Long-press anti-copia**: niente selezione/copia globale, input e textarea esclusi (25/06)
- [x] **Cache HTML risolta**: header no-cache via .htaccess (mod_expires era inattivo sul server); backup .htaccess salvato (25/06)
- [x] **Tier ristrutturati**: nuovo Professionista (perks forti ex-Mecenate), Mecenate potenziato (audiolibri navigando, segnala rotte, itinerario/5 POI/compagnia in evidenza); i18n IT/SQ/EN completo (25/06)
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
