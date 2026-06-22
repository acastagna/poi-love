# SAL — Stato Avanzamento Lavori · POI•LOVE

## Sessione 21/06/2026

### Fatto
- ✅ X (Twitter) OAuth attivato su Supabase
- ✅ LinkedIn (OIDC) OAuth attivato su Supabase
- ✅ Code review completo: trovati 6 BLOCKER + 8 MAJOR (vedi TODO.md sezione bug)
- ✅ Fix: marker Leaflet duplicati ad ogni login OAuth
- ✅ Fix: deep-link `name` → `name:title` (link condivisione POI erano rotti)
- ✅ Fix: query deep-link aggiunto `.limit(500)`
- ✅ Fix: `toggleLoveDB` — `sb.rpc()` usato erroneamente come valore, ora legge count reale dal DB
- ✅ Fix: GPS watcher leak in `startLocShare` — `locShareWatchId` salvato e pulito
- ✅ Feature: bottone "Sono qui — crea POI" nel FAB menu (GPS → form precompilato)
- ✅ Feature: AI descrizione POI migliorata con coordinate, categorie, prompt unicità
- ✅ Bottone AI rinominato "Suggerisci"
- Decisione: passare direttamente a poilove.com ufficiale, eliminare demo quando pronti

### Sessione 22/06/2026 — migrazione live

- ✅ project.poilove.com creato su Plesk con pagina marketing
- ✅ Webapp spostata da demo.poilove.com → poilove.com (live)
- ✅ Groq key rimossa dal sorgente HTML — spostata in config.js server-only (gitignore)
- ✅ Supabase: Site URL → poilove.com, Redirect URLs aggiornati via Management API
- ✅ demo.poilove.com → redirect automatico a poilove.com
- ✅ URL hardcoded aggiornati da demo.poilove.com a poilove.com nel codice
- ✅ Ricerca mappa migliorata: luoghi + vie separate, icone per tipo, correzione spelling AI
- ✅ Deploy autonomo abilitato via rsync file singolo

### In sospeso
- config.js sul server (chiave Groq) — ILLI•AI non funziona senza
- LinkedIn redirect URI → aggiungere poilove.com nell'app LinkedIn Developer Console
- Facebook OAuth — dopo Terms & Privacy
- Bug rimanenti da code review (vedi TODO.md)

---

## Sessione precedente (11/05/2026)
- 16 commit su origin/main (HEAD 3bc28c0)
- UX overhaul: photo picker, popup OSM, nav picker, profilo pubblico, map search, ILLI•AI, doppio tap mappa
- Fix geolocalizzazione (GPS reale, non Tirana hardcoded)
- Luoghi Personali (Casa/Lavoro) in localStorage
- Fix sistema Love (DB reale, non solo CSS)
- Compressione WebP automatica upload foto
