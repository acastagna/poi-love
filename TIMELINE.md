# TIMELINE · POI•LOVE
> Roadmap totale dal redesign al lancio e oltre. Aggiornato: 23/06/2026.
> Stile: niente trattini lunghi (em dash).

## 🎯 Milestone fisse
| Data | Evento | Stato |
|---|---|---|
| **13 / 17 luglio 2026** | Finestra presentazioni, Tirana | 🔴 in preparazione |
| **17 agosto 2026 (lun)** | LANCIO PUBBLICO, Tirana (data Kairos 74/100) | 🔴 in preparazione |

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

## 🎤 13 / 17 luglio · PRESENTAZIONI a Tirana

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
