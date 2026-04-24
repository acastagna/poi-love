<div align="center">

<img src="https://poilove.com/img/logo-completo.svg" alt="POI•LOVE" height="80">

# POI•LOVE

**Mappa comunitaria dei luoghi amati · Hartë e vendeve të dashura · Community map of beloved places**

[![License: MIT](https://img.shields.io/badge/License-MIT-D42B2B.svg)](LICENSE)
[![Framework: Cultural Bridge OS](https://img.shields.io/badge/Framework-Cultural%20Bridge%20OS-285EA7)](docs/architecture.md)
[![Stack: Supabase + Google Maps](https://img.shields.io/badge/Stack-Supabase%20%2B%20Google%20Maps-3ECF8E)](database/schema.sql)
[![Platform: iOS · Android · Web](https://img.shields.io/badge/Platform-iOS%20%C2%B7%20Android%20%C2%B7%20Web-EAE4D8?labelColor=333)](app/)
[![Status: MVP in sviluppo](https://img.shields.io/badge/Status-MVP%20in%20sviluppo-yellow)]()

🇮🇹 [Italiano](#italiano) · 🇦🇱 [Shqip](#shqip) · 🇬🇧 [English](#english)

---

**[🗺️ Demo Live →](https://poi-love.github.io/poi-love/)** &nbsp;|&nbsp; **[📋 Roadmap →](#roadmap)** &nbsp;|&nbsp; **[🤝 Contribuisci →](CONTRIBUTING.md)**

</div>

---

## Italiano

POI•LOVE è un'app open source per mappare i luoghi che ami davvero — non i ristoranti con 4,2 stelle su Google, ma il bar dove ti siedono accanto senza chiederti niente, la piazza silenziosa alle 7 di mattina, il muro che racconta cento anni di storia.

Costruita sul framework **Cultural Bridge OS**, connette persone attraverso il territorio, valorizza le geografie dimenticate dalle mappe ufficiali e restituisce voce alle comunità locali.

### Come funziona

1. **Apri la mappa** — vedi i POI condivisi dalla community nella tua zona
2. **Inserisci un POI in < 90 secondi** — posizione GPS, 1-3 foto, 200 caratteri, 1 categoria
3. **Dai LOVE** ai luoghi che ti colpiscono — il tuo like è reputazione reale per chi l'ha condiviso
4. **Crea liste** — pubbliche o private, condivisibili via link
5. **Scopri le rotte culturali** — Via Egnatia, Rotte della Serenissima, Colonie Greche, Tracciati Illirici

### Tech Stack

| Componente | Tecnologia |
|------------|-----------|
| Database + Auth | [Supabase](https://supabase.com) (PostgreSQL + RLS) |
| Mappe | Google Maps Platform (SDK + Places + Geocoding) |
| App Mobile | Expo / React Native (iOS + Android) |
| Storage Media | Server Plesk dedicato (API proprietaria) |
| Web | HTML5 / GitHub Pages |
| AI Pipeline | Claude + Gemini |

### Prima istanza: Albania · Tirana

Il lancio è previsto per **giugno 2026 a Tirana**. L'Albania è il contesto ideale: territorio ad alta densità storica (Illiri, Greci, Romani, Ottomani, Veneziani), geografie sottorappresentate sulle piattaforme commerciali, comunità locale con forte identità territoriale. POI•LOVE serve esattamente dove Google Maps si ferma.

---

## Shqip

POI•LOVE është një aplikacion me burim të hapur për të hartografuar vendet që vërtet i do — jo restorantet me 4.2 yje në Google, por kafeneja ku ulen pranë teje pa të pyetur asgjë, sheshi i qetë në orën 7 të mëngjesit, muri që tregon njëqind vjet histori.

Ndërtuar mbi kornizën **Cultural Bridge OS**, lidh njerëzit nëpërmjet territorit dhe u jep zë komuniteteve lokale.

### Si funksionon

1. **Hap hartën** — shiko POI-të e ndara nga komuniteti në zonën tënde
2. **Shto një POI në < 90 sekonda** — vendndodhja GPS, 1-3 foto, 200 karaktere, 1 kategori
3. **Jep LOVE** — pëlqimi yt është reputacion real për atë që e ka ndarë
4. **Krijo lista** — publike ose private, të ndashme me link
5. **Zbulo rrugët kulturore** — Via Egnatia, Rrugët e Serenissimes, Koloni Greke, Gjurmë Ilire

### Nisja e parë: Shqipëri · Tiranë

Nisja parashikohet për **qershor 2026 në Tiranë**. Shqipëria është konteksti ideal: territor me densitet të lartë historik, gjeografi të nënpërfaqësuara në platformat komerciale, komunitet lokal me identitet territorial të fortë.

---

## English

POI•LOVE is an open-source app for mapping the places you truly love — not the restaurants with 4.2 stars on Google, but the café where they sit next to you without asking anything, the quiet square at 7 in the morning, the wall that tells a hundred years of history.

Built on the **Cultural Bridge OS** framework, it connects people through their territory, gives voice to communities, and restores meaning to geographies ignored by official maps.

### How it works

1. **Open the map** — see community-shared POIs in your area
2. **Add a POI in < 90 seconds** — GPS location, 1-3 photos, 200 characters, 1 category
3. **Give LOVE** — your like is real reputation for the person who shared it
4. **Create lists** — public or private, shareable via link
5. **Discover cultural routes** — Via Egnatia, Serenissima Routes, Greek Colonies, Illyrian Paths

### First instance: Albania · Tirana

Launch is planned for **June 2026 in Tirana**. Albania is the ideal context: high historical density (Illyrian, Greek, Roman, Ottoman, Venetian layers), geographies underrepresented on commercial platforms, local community with strong territorial identity. POI•LOVE serves exactly where Google Maps stops.

### Why open source?

Maps of loved places only work if the community builds them. Open source means any city, any country can fork this and make it their own — with their language, their cultural routes, their categories. The infrastructure is the gift. The places are yours.

---

## Roadmap

| Milestone | Target | Stato |
|-----------|--------|-------|
| Prototipo interattivo web | ✅ Completato | [Demo](https://poi-love.github.io/poi-love/) |
| Schema database Supabase | 🔄 In corso | [schema.sql](database/schema.sql) |
| MVP App iOS + Android | 🎯 Giugno 2026 | — |
| Lancio pubblico Tirana | 🎯 Giugno 2026 | — |
| POI•VOICE (audioguide AI) | 2027 Q1 | — |
| Il Libro dei Luoghi | 2027 Q3 | — |
| Sistema pagamenti | 2028+ | — |

---

## Struttura del repository

```
poi-love/
├── app/                  # Codice Expo/React Native (iOS + Android)
├── web/                  # Prototipo HTML interattivo (GitHub Pages)
├── database/
│   └── schema.sql        # Schema Supabase completo con RLS
├── docs/
│   ├── architecture.md   # Architettura Cultural Bridge OS
│   ├── api-plesk.md      # Endpoint upload media server Plesk
│   └── contributing.md   # Guida per i contributori
├── assets/
│   └── screenshots/      # Screenshot app per store + README
└── .github/
    ├── workflows/        # GitHub Actions (Pages deploy)
    └── ISSUE_TEMPLATE/   # Template bug report + feature request
```

---

## Contribuire

Leggi [CONTRIBUTING.md](CONTRIBUTING.md) per le linee guida. In sintesi: apri una issue prima di aprire una PR, usa branch separati per ogni feature, rispetta la struttura del database e il codice di condotta.

---

## Licenza

MIT — [Alessandro Castagna](https://altrostile.net) · [321.al](https://321.al) · Tirana, Albania

---

<div align="center">

**Fatto con ❤️ tra Italia e Albania**

*POI•LOVE è parte del framework [Cultural Bridge OS](docs/architecture.md)*

</div>
