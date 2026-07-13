# ORCHESTRAZIONE. Paesi di lavoro nel profilo
Ecosistema 321 / EvoLab. Redatto il 13/07/2026. Destinatario: Claude Code (esecuzione al ritorno dalle presentazioni 14-17/07).
Base: direttiva del founder del 13/07 + ricognizione completa del codice fatta lo stesso giorno (6 agenti, ~50 punti, righe verificate una a una sul sorgente vivo).

**La regola in una frase: l'utente vede tutto il mondo, ma le proposte e le ricerche del sistema per lui avvengono solo nei paesi scelti nel profilo.**

Origine del problema: oggi tutto parte dal GPS fisico (il "cade su Zugliano"). Il founder lavora sull'Albania ma il sistema non ha modo di saperlo.

---

## Decisioni di progetto (fissate)

- **Campo**: `profiles.work_countries text[]` (codici ISO-2 minuscoli). `null` o vuoto = tutto il mondo = comportamento identico a oggi (zero regressioni per chi non tocca nulla).
- **Il "vicino a me" fisico resta fisico**: GPS, reverse geocoding, lente sul punto toccato, pallino "Tu sei qui" NON vengono mai filtrati.
- **La città nominata esplicitamente dall'utente vince sempre** (l'utente vede tutto il mondo): il filtro vale per le proposte SPONTANEE del sistema.
- **Centri di ripiego per paese** (`COUNTRY_CENTERS`, ISO → lat/lng/zoom/label): quando il GPS è fuori dai paesi scelti, le proposte partono dal centro del primo paese del profilo (es. al → Tirana 41.3275,19.8189; it → Roma 41.9028,12.4964).
- **Onestà di ILLI**: quando la ricerca viene spostata sul centro di ripiego, ILLI lo DICE ("il tuo GPS è in Italia, ti propongo a Tirana come da tuo profilo"), mai fingere che siano posti "qui intorno".
- **Cache Google/Foursquare**: il filtro paese si applica SEMPRE a valle della cache (chiavi invariate, payload non filtrato in cache, filtro solo sulla risposta), altrimenti ogni combinazione di paesi rifà le chiamate e sfonda il tetto mensile (mig 055).

## DA DECIDERE col founder (prima di implementare, non ipotizzare)

1. **Elenco paesi nella UI**: lista curata di partenza (al, it, gr, xk, mk, me, hr...) + "Altro paese" con ricerca, oppure direttamente tutti? *(consiglio: lista curata Balcani+Italia + campo aggiungi)*
2. **Profilo pubblico**: la riga "contribuisco su: [paesi]" si mostra anche agli altri? Utile per la community (cercare contributori per paese), non blocca la v1.
3. **Città esplicita fuori dai paesi**: confermare che vince l'utente (consigliato SÌ, è già la regola scelta sopra).

---

## FASE 0 — Fondamenta (tutto il resto dipende da qui)

| # | Cosa | Dove | Dettaglio |
|---|------|------|-----------|
| 0.1 | Migrazione `086_profile_work_countries.sql` | `supabase/migrations/` | `alter table public.profiles add column if not exists work_countries text[];` + commento. Nessuna RLS nuova (campo proprio, update già coperto). Applicare via Management API come le precedenti. |
| 0.2 | Caricamento profilo | `webapp/index.html` `syncProfileFromAuth()` r.5053, select r.5075 | Aggiungere `work_countries` alla select → `window._workCountries` (array ISO-2 minuscoli, null/[] = mondo). Helper globale `_workCC()` → `'al,it'` pronto per `countrycodes=`. Scrivere cache `localStorage` per la vista iniziale pre-login. |
| 0.3 | Infrastruttura centri | accanto a `CENTER` r.6725 | `COUNTRY_CENTERS` (ISO → [lat,lng,zoom,label]), `profileCenter()` (primo paese del profilo, fallback CENTER), `gpsInWorkCountries()`. |
| 0.4 | Paese del GPS | `_refreshGpsCity()` r.6735-6742 | Salvare `window._gpsCountryCode = (a.country_code||'').toLowerCase()`: punto unico di verità "sono dentro o fuori", senza chiamate extra. Richiamarla anche se `_gpsCity` è già nota ma `_gpsCountryCode` manca. |

## FASE 1 — UI profilo (i pulsanti del founder)

| # | Cosa | Dove | Dettaglio |
|---|------|------|-----------|
| 1.1 | Riga "Vedo tutto il mondo, contribuisco su:" | dopo la pub-toggle-card, r.2942 (prima del commento r.2943) | Nuova `.profile-sec` id `workCountriesRow`: etichetta + pulsanti paese + "Tutto il mondo". Se "Tutto il mondo" attivo, i pulsanti paese SPARISCONO (direttiva). Riusare lo stile dei bottoni paese già esistenti di ILLI. |
| 1.2 | Salvataggio | gemella di `saveProfileCover`/`editProfileBio` (scritture verificate: r.5094 e ensure-profile) | `saveWorkCountries(arr)`: update su profiles (`arr` vuoto → null), toast, aggiorna `window._workCountries` + cache localStorage, effetto immediato senza reload. |
| 1.3 | Tre lingue | oggetto `T`: it r.6361, sq r.6462, en r.6563 | Chiavi nuove (`prof_work_countries`, `prof_work_all`, `prof_work_add`, `prof_work_saved`, testi di esordio riposizionamento ILLI). Ordine SQ → IT → EN, regola di ferro. |

## FASE 2 — ILLI (il cuore)

| # | Cosa | Dove | Dettaglio |
|---|------|------|-----------|
| 2.1 | **Ripiego origine (PUNTO PRINCIPALE)** | `sendPoiAIMsg()` r.15658, `_origin` r.15686, chiamata `_fetchRealPlaces` r.15701 | Se NON c'è città nominata e `_gpsCountryCode` ∉ work_countries: `_origin = profileCenter()`, `_askedLabel` = label del centro, memorizzare in `_lastAskedOrigin/_lastAskedLabel` (r.15211-15216) così i follow-up restano nel paese. |
| 2.2 | Fallback interno | `_fetchRealPlaces()` r.15375-15417, fallback r.15378 | Stesso ripiego (la funzione è chiamabile senza originOverride) + `opts.countries`. Con l'origine giusta le 4 sorgenti a raggio restano nel paese da sole. |
| 2.3 | Città nominata | `_geocodeAskedPlace()` r.15303-15340 | Con `_illiCountry` vuoto (Auto): `countrycodes=_workCC()` (Nominatim accetta lista) come BIAS con secondo tentativo mondiale; viewbox Italia-Balcani (r.15315) solo se il profilo include it/al o è vuoto. La città esplicita vince (mondo intero). |
| 2.4 | Gazetteer | `_CITY_GAZ` r.15222-15251, `_IT_CITIES` r.15253, `_matchCityGaz` r.15272-15286 | Filtrare per work_countries (multi-paese); saltarlo se il profilo non include né it né al. |
| 2.5 | Selettore paese ILLI esistente | `_illiCountry` init r.15254, `setIlliCountry` r.15255-15263, barra `#poiaiCountry` r.3287-3294 | Collegarlo al profilo: "Auto" = i paesi del profilo (non "nessun filtro"); i bottoni diventano data-driven dai paesi del profilo; la scelta manuale resta come override momentaneo della chat. |
| 2.6 | Prompt di sistema | `_buildPoiAISystemPrompt()` r.15619-15652 (locationCtx r.15623) | Riga di ambito: "L'utente lavora in questi paesi: X, Y. Le proposte spontanee restano lì; se il GPS è altrove, la ricerca è stata spostata su <centro> e diglielo con garbo." Copre anche le risposte senza grounding. |
| 2.7 | Blocco grounding | `_buildGroundingBlock()` r.15494-15538 | Parametro `repositionedTo`: quando l'origine è il ripiego, ILLI esordisce spiegandolo. |
| 2.8 | Overpass confine (opzionale ma consigliato) | `searchRealPlaces()` r.14968-15001, query r.14976-14979 | Prefisso `area["ISO3166-1"~"AL\|IT"][admin_level=2]->.cc;` + `(area.cc)` su node/way, SOLO se work_countries non vuoto: ai confini (es. AL-GR) i risultati restano nei paesi scelti. |
| 2.9 | Difesa server-side (consigliata) | `supabase/functions/illi-chat/index.ts`: select profili r.211-215, dispatch ~r.250 | Aggiungere work_countries alla select e appendere un messaggio system server-side "Ambito operativo: proponi solo luoghi in <paesi>" che il client non può togliere. Ricordare il deploy edge via Management API. |
| 2.10 | Nessuna modifica | `_poilovePlaces` r.14931-14951, `_localPoiPlaces` r.14916-14927 | Il bbox segue l'origine già riposizionata. Colonna country su pois NON serve in v1. |

## FASE 3 — Ricerche e geocoding (generalizzare l'Albania-first)

| # | Cosa | Dove | Dettaglio |
|---|------|------|-----------|
| 3.1 | Ricerca mappa | `runMapSearch()` r.9357: fetch r.9389/9391/9393, else hardcoded r.9378 | `'al'` → `_workCC()` (r.9389, 9393); se vuoto tenere solo la mondiale (9391); viewbox albanese solo se 'al' nel profilo; ordinamento "prima i paesi del profilo"; l'else r.9378 → `profileCenter()`. La doppia query (profilo + mondo) resta: l'utente vede tutto il mondo. |
| 3.2 | Indirizzo luogo personale | `searchPlAddr()` r.5980, fetch r.5987 | `+ '&countrycodes='+_workCC()` se non vuoto. Valutare lang dinamica (oggi 'it' fisso). |
| 3.3 | Indirizzo POI (form crea) | `onLocAddrInput()` r.11851-11864: bias r.11856-11857, sort r.11864 | Bias = gpsPos se dentro il profilo, altrimenti `profileCenter()`; sort generalizzato da 'al' a `work_countries.includes(country_code)`. |
| 3.4 | Ricerca itinerario | `onItinSearch()` r.14799-14806 (bias r.14804, fetch r.14805) | Come 3.3 + `countrycodes=_workCC()`. |
| 3.5 | Ricerca tappa | `runStopSearch()` r.15906-15943: default r.15913, fetch r.15926-15927 | Default hardcoded Tirana → `profileCenter()`; r.15926 `'al'` → `_workCC()` (vuoto = solo mondiale); merge "prima profilo poi mondo" invariato. |
| 3.6 | Suggerimenti "intendevi..." | `_AL_PLACES` r.9317-9319, `_didYouMean` r.9320-9335 | Gate: attivi solo se 'al' nel profilo (o profilo vuoto). Gazetteer per-paese in una FASE B. |
| 3.7 | Google/Foursquare | `_googleDiscover` ~r.15162, `_fsqPlaces` ~r.15183 + `supabase/functions/place-enrich/index.ts` | Parametro `countries` nel body (whitelist `[A-Z]{2}`, max 8). Edge: discover → fieldmask + `addressComponents`, filtro paese A VALLE della cache (chiavi `dkey`/`fkey` INVARIATE, payload cache non filtrato); fsq → campo `location`, stessa regola. `_googleNearbyPlaces` (lente) NON lo riceve: è fisico. Deploy edge via Management API. |
| 3.8 | Funzione deprecata | `_onStopNameInput_deprecated` r.15990-15999 | Rimuovere o allineare per coerenza. |

## FASE 4 — Viste iniziali e ripieghi

| # | Cosa | Dove | Dettaglio |
|---|------|------|-----------|
| 4.1 | Vista iniziale mappa | `initMap()` r.6744, setView r.6745 | `profileCenter()` al posto di `CENTER`, letto dalla cache localStorage (initMap gira pre-login); in mancanza resta CENTER (Tirana). |
| 4.2 | Ricentraggio GPS | callback getCurrentPosition r.6810-6827, setView r.6816 | **È la riga del "cade su Zugliano"**: ricentrare solo se `gpsInWorkCountries()` (e `!_deepLinkActive`). Il pallino "Tu sei qui" (r.6818-6824) si crea COMUNQUE. |
| 4.3 | Lente dal FAB | `openLensFromFab()` r.7236-7241 (const c r.7238) | Catena: gpsPos se dentro profilo → centro mappa se dentro → `profileCenter()`. Il tap manuale sulla mappa resta fisico. |
| 4.4 | Precarica lente | setTimeout 2200ms r.8046-8064 (const c r.8056) | Stessa catena di 4.3. |
| 4.5 | Mini-mappa picker | `showMiniMapPicker()` r.8109-8116 | Partenza su `profileCenter()` se GPS fuori profilo; l'utente trascina dove vuole. |
| 4.6 | Mini-mappa itinerario | r.14323 (`setView([41.3275,19.8189],12)` verificato) | → `profileCenter()`: l'itinerario vuoto di chi lavora in Italia si apre sull'Italia. |

## FASE 5 — Admin

| # | Cosa | Dove | Dettaglio |
|---|------|------|-----------|
| 5.1 | Bootstrap | `admin/panel.html` (dove già legge profiles) | Caricare work_countries dell'admin loggato. |
| 5.2 | Autocomplete tappe | `_stopAcSearch()` r.2550: Photon r.2554, Nominatim r.2566 | Nominatim: `countrycodes=`; Photon non lo supporta → filtro/sort client su `properties.countrycode`. |
| 5.3 | Editor POI | autocomplete r.3596, sort r.3599 | `countrycodes=` dai paesi dell'UTENTE ASSEGNATO al POI se presente (`assigned_user_id` letto a r.3655), altrimenti dell'admin; sort generalizzato. |
| 5.4 | Nessuna modifica | `_setCoordsFromExif` r.3628/3632; `admin/js/poi-frontend.js` r.139 | Reverse fisici da coordinate. |

## PUNTI VERIFICATI ED ESCLUSI DI PROPOSITO (documentarlo nei commenti del codice)

Il "vicino a me" fisico e i reverse NON si filtrano MAI: `centerMap()` r.7575-7597, sub-tab Vicini `renderPoiTab 'near'` r.9058-9068 + `renderMapSearchNearby` r.9624-9633, lente `_lensLoadPois` r.7133-7191, `_enrichPlace` r.15113-15129 (lookup puntuale), place-enrich mode `nearby`/`enrich`, `broadcastMyLocation` (def. r.6042), i 9 punti di reverse geocoding (dettaglio POI r.5358, `usePlGPS` r.5968, `contributeToOSM` r.7602, ecc.).

## Collaudo finale (tutto dal vivo, come sempre)

1. Profilo `[al]` + GPS in Italia: ILLI propone a Tirana E LO DICE; ricerca mappa "bar" → risultati albanesi prima; form indirizzo → sort Albania; itinerario nuovo si apre su Tirana; la mappa NON scippa la vista verso Zugliano al fix GPS.
2. "Vicino a me" con GPS a Zugliano → resta Zugliano (fisico), pallino blu presente.
3. "Portami a Parigi" detto a ILLI → Parigi (la città esplicita vince).
4. Profilo `[al,it]`: entrambi i paesi nei risultati, priorità corretta.
5. Profilo "Tutto il mondo" (null): comportamento IDENTICO a oggi, zero regressioni (test di non-regressione su ricerca mappa, ILLI, crea POI).
6. Cambio paesi dal profilo → effetto immediato senza reload; pulsanti spariti con "Tutto il mondo".
7. Le 3 lingue complete (SQ/IT/EN) su tutte le stringhe nuove.
8. Admin: autocomplete tappe ed editor POI rispettano i paesi.

## Regole di consegna (non negoziabili)

- `APP_VERSION` bump (+0.01) a ogni deploy; deploy SEMPRE via `scripts/deploy_split.js` (index.html + app.js, limite WAF 1MB).
- Edge (`illi-chat`, `place-enrich`) rideployate via Management API preservando verify_jwt.
- Migrazione committata in `supabase/migrations/` e applicata via Management API.
- Verifica live di ogni fase prima di passare alla successiva; commit atomici; SAL.md e TODO.md aggiornati a fine giro; tag checkpoint.

*Stima onesta: mezza giornata (FASI 0-4) + un paio d'ore per FASE 5 e collaudo completo.*
