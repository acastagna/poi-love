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

### In sospeso / non completato
- **Plesk pull demo.poilove.com** — NON fatto, tutti i commit 21/06 non sono live
- LinkedIn redirect URI da aggiungere nell'app LinkedIn Developer Console
- Groq key esposta nel sorgente — da fixare prima del lancio (Edge Function Supabase)
- Bug rimanenti da code review (vedi TODO.md)

---

## Sessione precedente (11/05/2026)
- 16 commit su origin/main (HEAD 3bc28c0)
- UX overhaul: photo picker, popup OSM, nav picker, profilo pubblico, map search, ILLI•AI, doppio tap mappa
- Fix geolocalizzazione (GPS reale, non Tirana hardcoded)
- Luoghi Personali (Casa/Lavoro) in localStorage
- Fix sistema Love (DB reale, non solo CSS)
- Compressione WebP automatica upload foto
