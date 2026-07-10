# TIMELINE · POI•LOVE
> Roadmap totale dal redesign al lancio e oltre. Aggiornato: 10/07/2026 (webapp v3.14 live).
> Stile: niente trattini lunghi (em dash).

## 🎯 Milestone fisse
| Data | Evento | Stato |
|---|---|---|
| **14 / 17 luglio 2026** (mar → ven) | Finestra presentazioni, Tirana | 🟡 in rifinitura, webapp v3.14 live e usabile |
| **17 agosto 2026 (lun)** | LANCIO PUBBLICO, Tirana (data Kairos 74/100) | 🔴 in preparazione |

---

## ✅ Fatto (aggiornamento 10/07/2026 — webapp v3.14 live)
Il grosso delle Fasi 1-3 è realizzato e online su poilove.com. In sintesi, ciò che ora funziona ed è verificato dal vivo:
- **Creazione POI ripensata**: mirino/lente sulla mappa, timer 60s, foto opzionali, nome/descrizione con AI+dettatura, categoria a 3 livelli.
- **Tassonomia categorie reale**: categorie pubbliche gestite dall'admin + **fino a 3 categorie per POI** (intreccio) + **categoria personalizzata** (una per utente, diventa pubblica con 20 persone diverse o su approvazione admin immediata).
- **Itinerari**: creazione con date reali, mappa vera bloccata, calendario col periodo, tappe modificabili (nome/regione/data/foto/note), gesti swipe (archivia/elimina/condividi/pubblico/proponi ufficiale), copertine con foto reali.
- **Rotte storiche**: editor tappe admin ricco (trascina, AI ordina, foto, duplica); dalla scheda POI si può **proporre un POI come tappa** e l'admin lo aggiunge a una rotta.
- **Compagnie**: bacheca vocale walkie-talkie (audio + trascrizione), immagini, deviazioni, notifiche.
- **Admin desktop** (admin.poilove.com): moderazione, categorie, tag, rotte, itinerari, POI proposti, chiaro/scuro, trilingue.
- **Consensi GDPR + notifiche + geofence foreground**; **ILLI** ancorata a luoghi reali (Overpass/OSM + DB).
- **Pulizia del finto**: tolti i menu rotte finti, i tag-tappa finti, il "Consiglia a Google Maps" (impossibile via API) sostituito dalla **segnalazione reale a OpenStreetMap** (gratis); la **visibilità** ora si salva davvero. Code-review completa (22 agenti), 14 fix applicati.
- **Restano verso il 14/07**: collaudo end-to-end su telefono reale (mic, geofence, creazione dal vivo), seed di POI reali di Tirana con codice di rivendicazione, gamification a punti/badge, 3 QR fisici, AI a tiering, Terms of Service + Privacy.

---

## Fase 0 · ORA (fine giugno) · Fondamenta reali
- [x] project.poilove.com live, demo eliminato ovunque, i18n albanese-first
- [x] Bucket foto Supabase + media server verificato sano
- [x] Postmortem qualità (8 blocker, 14 major) + visione prodotto in `SPECS.md`
- [ ] Pulizia totale del finto: utenti @test.com, POI hardcoded, statistiche random, immagini AI automatiche, pulsanti "prossimamente", modalità demo
- [ ] Love-count atomico (RPC), `prompt()` sostituiti con editing inline
- [ ] AI di qualità (Claude Sonnet / GPT-4o) al posto di Groq, limite 3/giorno
- [ ] Seed di POI reali di Tirana, con codice di rivendicazione

## Fase 1 · inizio luglio · Cuore del prodotto
- [ ] Creazione POI ripensata: menu "+", mirino/lente, tap breve, timer 60s con coppa verde
- [ ] Schermata POI: nome e descrizione con 3 vie (Suggerisci AI, Detta, Scrivo io), AI contestuale, foto opzionali
- [ ] Sistema codice-POI: trasferimento, regalo, cessione di un POI
- [ ] Luoghi Personali intelligenti (scorciatoie + ricerca + scelta multipla)
- [ ] Liste con ricerca, profilo con filtri per tag e categoria

## Fase 2 · 10 / 12 luglio · Pre-presentazione
- [ ] Test end-to-end su device reale, dress rehearsal, bug fix

## 🎤 14 / 17 luglio · PRESENTAZIONI a Tirana (mar → ven)

## Fase 3 · fine luglio · Business e gamification
- [ ] 3 QR fisici: universale (crescita), del locale (vendita), POIVOICE (audio)
- [ ] Gamification: punti (per luogo e viaggiatore), badge a livelli regolabili
- [ ] Admin desktop (admin.poilove.com): moderazione, AI, contenuti, analytics
- [ ] Rotte storiche con pagina propria (ufficiali + utenti)

## Fase 4 · agosto · Rifinitura pre-lancio
- [ ] Terms of Service + Privacy Policy
- [ ] Hardening, performance, test finali
- [ ] App mobile (Expo): inizio sviluppo serio

## 🚀 17 agosto 2026 · LANCIO PUBBLICO Tirana

## Fase 5 · post-lancio (da settembre)
- [ ] App mobile sugli store (App Store, Play Store)
- [ ] POIVOICE: audio-guide AI dei luoghi
- [ ] Crescita: sponsor, QR nei locali, gamification stagionale e per zona
- [ ] Scala: AI in tiering, storage su Cloudflare R2 oltre i 10k utenti

---

## Storico
- 27 apr / 6 mag · webapp HTML + infrastruttura (4 sotto-domini)
- 13 / 17 mag · prima finestra presentazioni
- 21 / 22 giu · code review, OAuth X+LinkedIn, migrazione live a poilove.com
- 23 giu · project.poilove.com live, demo eliminato, postmortem, bucket foto, visione prodotto completa
- 24 / 30 giu · gamification, compagnie, itinerari, admin desktop, tassonomia POI, ILLI ancorata ai luoghi reali, sicurezza AI
- 01 / 07 lug · lente-strumento mappa, condivisione POI, bacheca vocale compagnie, consensi GDPR + notifiche + geofence, deploy split 1 MB
- 10 lug · giornata piena (v3.02 → v3.14): itinerari (date, swipe, copertine reali), editor tappe admin, 3 categorie + categoria personalizzata reale, proponi POI come tappa di rotta, visibilità reale, OpenStreetMap al posto del finto Google, code-review 22 agenti + 14 fix
