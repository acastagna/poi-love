# SAL — Stato Avanzamento Lavori · POI•LOVE

## Sessione 21/06/2026

### Fatto
- ✅ X (Twitter) OAuth attivato su Supabase (Auth → Providers → X / Twitter OAuth 2.0)
- ✅ LinkedIn (OIDC) OAuth attivato su Supabase
- ✅ Code review completo: trovati 6 BLOCKER + 8 MAJOR (vedi TODO.md sezione bug)
- ✅ TODO.md aggiornato con lista bug prioritizzata
- Decisione: passare direttamente a poilove.com ufficiale, eliminare demo quando pronti

### In sospeso / non completato
- Plesk pull demo.poilove.com — NON fatto, tutti i commit sessione 21/06 non sono live
- LinkedIn redirect URI da aggiungere nell'app LinkedIn Developer Console
- Fix bug da code review — rimandati alla prossima sessione
- Groq key esposta nel sorgente — priorità alta, da fixare prima del lancio

---

## Sessione precedente (11/05/2026)
- 16 commit su origin/main (HEAD 3bc28c0)
- UX overhaul: photo picker, popup OSM, nav picker, profilo pubblico, map search, ILLI•AI, doppio tap mappa
- Fix geolocalizzazione (GPS reale, non Tirana hardcoded)
- Luoghi Personali (Casa/Lavoro) in localStorage
- Fix sistema Love (DB reale, non solo CSS)
- Compressione WebP automatica upload foto
